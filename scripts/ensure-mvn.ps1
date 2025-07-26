# nsure-Maven.ps1  – run as admin once per machine - useful script to ensure Maven is installed
param([string]$Required = "3.9.10")

# 1) quick probe
$mvn = Get-Command mvn -ErrorAction SilentlyContinue
if ($mvn) {
    $current = (& mvn -v | Select-String "Apache Maven").Line.Split()[2]
    if ($current -ge $Required) { Write-Host "Maven $current OK"; exit }
    Write-Host "Maven $current < $Required – upgrading…"
} else { Write-Host "Maven not found – installing…" }

# 2) bootstrap Chocolatey if missing
if (-not (Get-Command choco -EA SilentlyContinue)) {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex
}

# 3) install / upgrade Maven
choco install maven --version $Required -y
