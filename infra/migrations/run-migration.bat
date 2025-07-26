@echo off
REM Read environment variables from .env file in parent directory
for /f "tokens=1,2 delims==" %%a in ('type "%~dp0..\.env" ^| findstr /v "^#" ^| findstr /v "^$"') do (
    set %%a=%%b
)

REM Set Flyway environment variables from .env values
set FLYWAY_USER=%CH_USER%
set FLYWAY_PASSWORD=%CH_PASSWORD%

REM Run Flyway migration
mvn flyway:migrate -P local 