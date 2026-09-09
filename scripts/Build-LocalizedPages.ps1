$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'translations.ps1') -Action BuildPages
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
