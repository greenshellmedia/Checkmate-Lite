param(
  [ValidateSet('Extract','Prune','DryRun','Generate','Validate','ValidateStructure','BuildPages','Test')]
  [string]$Action = 'Validate'
)
$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot
try {
  if (-not $env:NODE_USE_ENV_PROXY) { $env:NODE_USE_ENV_PROXY = '1' }
  switch ($Action) {
    'Extract' { node scripts/extract-translations.mjs }
    'Prune' { node scripts/generate-translations.mjs --prune --prune-only }
    'DryRun' { node scripts/generate-translations.mjs --dry-run }
    'Generate' { node scripts/generate-translations.mjs --prune }
    'Validate' { node scripts/validate-translations.mjs }
    'ValidateStructure' { node scripts/validate-translations.mjs --strict }
    'BuildPages' {
      node scripts/repair-protected-translations.mjs
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
      node scripts/build-localized-pages.mjs
      if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
      node scripts/validate-seo-localization.mjs
    }
    'Test' { node --test localization/tests/*.test.mjs }
  }
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }
