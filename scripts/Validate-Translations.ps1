param([switch]$RequireComplete)
$ErrorActionPreference = 'Stop'
$Action = if ($RequireComplete) { 'ValidateStructure' } else { 'Validate' }
& (Join-Path $PSScriptRoot 'translations.ps1') -Action $Action
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
