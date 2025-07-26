# Read environment variables from .env file in parent directory
$envPath = "..\.env"
if (Test-Path $envPath) {
    Get-Content $envPath | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # Remove quotes if present
            $value = $value -replace '^["'']|["'']$', ''
            Set-Variable -Name $key -Value $value -Scope Global
        }
    }
}

# Set Flyway environment variables from .env values
$env:FLYWAY_USER = $CH_USER
$env:FLYWAY_PASSWORD = $CH_PASSWORD

# Run Flyway migration
mvn flyway:migrate -P local

# Clean up environment variables
Remove-Item Env:FLYWAY_USER -ErrorAction SilentlyContinue
Remove-Item Env:FLYWAY_PASSWORD -ErrorAction SilentlyContinue 