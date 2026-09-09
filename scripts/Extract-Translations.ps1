$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'translations.ps1') -Action Extract
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
