import asyncio, json, os, uuid
from alphamatrix.api.jobrunner import JobRunner, Job
from alphamatrix.api.deps import get_clickhouse_client
from alphamatrix.api.config import load_config
from datetime import datetime

async def handle(reader, writer, runner: JobRunner):
    data = await reader.readline()
    try:
        msg = json.loads(data.decode())
        kind = msg["kind"]  # "backfill" | "incremental"
        params = msg["params"]
        run_id = uuid.uuid4()
        job = Job(run_id=run_id, kind=kind, params=params)
        await runner.submit(job)
        writer.write((json.dumps({"run_id": str(run_id), "status": "queued"}) + "\n").encode())
    except Exception as e:
        writer.write((json.dumps({"error": str(e)}) + "\n").encode())
    await writer.drain()
    writer.close()

async def main():
    cfg = load_config()
    if not cfg["uds_rpc_path"]:
        print("UDS path not set; exiting")
        return

    try:
        os.unlink(cfg["uds_rpc_path"])
    except FileNotFoundError:
        pass

    runner = JobRunner(ch_factory=get_clickhouse_client, concurrency=cfg["worker_concurrency"])
    await runner.start()
    server = await asyncio.start_unix_server(lambda r,w: handle(r,w,runner), path=cfg["uds_rpc_path"])
    async with server:
        await server.serve_forever()

if __name__ == "__main__":
    asyncio.run(main())
