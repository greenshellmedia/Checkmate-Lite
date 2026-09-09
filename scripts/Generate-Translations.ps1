param([switch]$DryRun, [switch]$PruneOnly)
$ErrorActionPreference = 'Stop'
$Action = if ($DryRun) { 'DryRun' } elseif ($PruneOnly) { 'Prune' } else { 'Generate' }
& (Join-Path $PSScriptRoot 'translations.ps1') -Action $Action
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
