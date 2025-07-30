import yfinance as yf
import pandas as pd
from clickhouse_connect import get_client
from datetime import datetime
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

# Load .env from infra if available
infra_env_path = Path(__file__).parent.parent / 'infra' / '.env'
if DOTENV_AVAILABLE and infra_env_path.exists():
    load_dotenv(dotenv_path=infra_env_path)

# Prefer ClickHouse config from .env, fallback to environment
CLICKHOUSE_HOST = os.getenv('CLICKHOUSE_HOST', 'localhost')
CLICKHOUSE_PORT = int(os.getenv('CLICKHOUSE_PORT', 8123))
CLICKHOUSE_USER = os.getenv('CLICKHOUSE_USER') or os.getenv('CH_USER', 'default')
CLICKHOUSE_PASSWORD = os.getenv('CLICKHOUSE_PASSWORD') or os.getenv('CH_PASSWORD', '')
CLICKHOUSE_DB = os.getenv('CLICKHOUSE_DB', 'alpha')
CLICKHOUSE_TABLE = 'equity_prices'

# Example: List of tickers to fetch
tickers = ['AAPL', 'MSFT', 'GOOG']
exchange = 'NASDAQ'  # Example, could be dynamic

# Date range for historical data
start_date = '2020-01-01'
end_date = datetime.today().strftime('%Y-%m-%d')

# Connect to ClickHouse
def get_clickhouse_client():
    return get_client(
        host=CLICKHOUSE_HOST,
        port=CLICKHOUSE_PORT,
        username=CLICKHOUSE_USER,
        password=CLICKHOUSE_PASSWORD,
        database=CLICKHOUSE_DB
    )

def fetch_yahoo_ohlcv(ticker, start, end):
    data = yf.download(ticker, start=start, end=end, auto_adjust=False)
    if data.empty:
        return pd.DataFrame()
    data.reset_index(inplace=True)
    data['symbol'] = ticker
    data['exchange'] = exchange
    data.rename(columns={
        'Date': 'timestamp',
        'Open': 'open',
        'High': 'high',
        'Low': 'low',
        'Close': 'close',
        'Adj Close': 'adjusted_close',
        'Volume': 'volume',
    }, inplace=True)
    data['created_at'] = datetime.now()
    return data[['symbol', 'exchange', 'timestamp', 'open', 'high', 'low', 'close', 'volume', 'adjusted_close', 'created_at']]

def insert_to_clickhouse(df, client):
    if df.empty:
        print('No data to insert.')
        return
    client.insert_df(
        CLICKHOUSE_TABLE,
        df,
        database=CLICKHOUSE_DB
    )
    print(f'Inserted {len(df)} rows into {CLICKHOUSE_DB}.{CLICKHOUSE_TABLE}')

def main():
    client = get_clickhouse_client()
    for ticker in tickers:
        print(f'Fetching {ticker}...')
        df = fetch_yahoo_ohlcv(ticker, start_date, end_date)
        insert_to_clickhouse(df, client)

if __name__ == '__main__':
    main()