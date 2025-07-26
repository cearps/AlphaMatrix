# AlphaMatrix Database Quick Start Guide

Get your AlphaMatrix database up and running in under 5 minutes!

## 🚀 Quick Setup

### Windows

```powershell
# Run as Administrator
git clone https://github.com/alphamatrix/alphamatrix.git
cd alphamatrix
.\scripts\setup-windows.ps1
```

### macOS/Linux

```bash
git clone https://github.com/alphamatrix/alphamatrix.git
cd alphamatrix
chmod +x scripts/setup-unix.sh
./scripts/setup-unix.sh
```

## ✅ What Gets Installed

- **Java 17** - For Maven and Flyway
- **Maven 3.9+** - For database migrations
- **Docker** - For ClickHouse database
- **ClickHouse Database** - Started automatically
- **Database Migrations** - Run automatically

## 🔐 Interactive Credential Setup

**The setup scripts will automatically prompt you for database credentials:**

- **Username** - Enter your desired database username
- **Password** - Enter a strong, secure password
- **Password Confirmation** - Confirm your password

The scripts will create the `.env` file with your credentials automatically.

**Security Features:**

- ✅ Password input is hidden (not displayed on screen)
- ✅ Password confirmation to prevent typos
- ✅ Validation to ensure credentials are not empty
- ✅ Credentials are stored securely in `.env` file

## 🔧 Manual Steps (if needed)

If the automated setup doesn't work, you can:

1. **Install dependencies manually** - See [SETUP.md](SETUP.md)
2. **Start database manually:**
   ```bash
   cd infra
   docker-compose up -d
   ```
3. **Run migrations manually:**
   ```bash
   cd infra/migrations
   # Windows
   .\run-migration.ps1
   # macOS/Linux
   ./run-migration.sh
   ```

## 🧪 Verify Installation

Test that everything is working:

```bash
# Check database connection
curl "http://localhost:8123/ping"

# Check migration status
cd infra/migrations
mvn flyway:info -P local

# Test database query
# Windows (PowerShell):
Invoke-WebRequest -Uri "http://localhost:8123/?user=your_username_here&password=your_secure_password_here" -Method POST -Body "SELECT * FROM alpha.test_table"

# macOS/Linux:
curl "http://localhost:8123/?user=your_username_here&password=your_secure_password_here" \
  --data-binary "SELECT * FROM alpha.test_table"

# Note: Replace with your actual credentials from the .env file
```

Expected output: `1	example`

## 🎯 Next Steps

1. **Read the full documentation** - [SETUP.md](SETUP.md)
2. **Explore the project structure** - [README.md](README.md)
3. **Start developing** - The database is ready for your application

## 🆘 Need Help?

- **Setup issues** - Check [SETUP.md](SETUP.md#troubleshooting)
- **Database problems** - Check Docker logs: `docker-compose logs`
- **Migration issues** - Check Maven output for error details

---

**Database is ready! 🚀**
