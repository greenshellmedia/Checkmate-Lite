# Lite translations

English (`en-GB`) is the source and fallback language. Spanish, French, German, Brazilian Portuguese, Italian, Dutch, Polish, Ukrainian and Russian are generated at build time with Azure Translator. The public site never receives the Azure key and makes no translation API calls.

## First-time setup

Use PowerShell from the repository root:

```powershell
$env:AZURE_TRANSLATOR_KEY = 'Key 1 or Key 2 from the Azure resource'
$env:AZURE_TRANSLATOR_REGION = 'the resource Location, for example uksouth'
# Optional. Copy the Endpoint from the same resource's Keys and Endpoint page:
$env:AZURE_TRANSLATOR_ENDPOINT = 'https://your-resource.cognitiveservices.azure.com/'
./scripts/translations.ps1 Extract
./scripts/translations.ps1 DryRun
./scripts/translations.ps1 Generate
./scripts/translations.ps1 ValidateStructure
./scripts/translations.ps1 BuildPages
```

The equivalent focused entry points are `Extract-Translations.ps1`, `Generate-Translations.ps1`, `Validate-Translations.ps1` and `Build-LocalizedPages.ps1` in the same folder.

`Generate` is incremental. It translates only new strings and English strings whose source hash changed. Catalogues and `translation-manifest.json` are checkpointed after every batch, so rerunning the command resumes safely. HTTP 429 and transient server failures use bounded exponential backoff, up to nine attempts.

## Everyday commands

```powershell
./scripts/translations.ps1 Extract
./scripts/translations.ps1 Prune
./scripts/translations.ps1 Validate
./scripts/translations.ps1 Test
```

Run extraction after changing customer-facing HTML or JavaScript. Review the English source catalogue, then generate and commit updated target catalogues and static locale pages. `ValidateStructure` is deliberately strict and fails when a locale is incomplete, contains stale keys or changes a placeholder.

The browser saves the selected language in `localStorage` under `cmp:locale`. Otherwise it uses the static page locale, then the browser preference, then `en-GB`. The source catalogue remains the fallback if a runtime entry is unavailable.

## Translator limits and troubleshooting

- Reduce `TRANSLATION_BATCH_SIZE` (default 50, maximum 100) if the Azure resource rejects a batch.
- Reduce `AZURE_TRANSLATOR_BATCH_CHARACTERS` (default 12,000, maximum 45,000) if a batch is too large.
- Increase `TRANSLATION_PACE_MS` (default 250) if the resource is regularly throttled.
- Keep placeholders such as `{0}`, `${name}` and `{{value}}` unchanged. Validation checks them.
- Empty Azure results are skipped without blocking the rest of the batch. They remain pending and can be retried on a later run.
- If a command is interrupted, run `Generate` again. Completed batches are already recorded.
- If the key is rejected, rotate it in Azure, update the local environment variable or CI secret, and rerun. Never place keys in source files, catalogue files, browser JavaScript or workflow YAML.
- HTTP 401 means Azure received the request but rejected its authentication. Copy the key, Location and optional endpoint from the same resource. The Location must match exactly. PowerShell environment variables apply only to the current terminal, so set them again after opening a new one. The generator trims accidental surrounding whitespace and prints only whether each setting is present, never its value.
- The standard global endpoint is `https://api.cognitive.microsofttranslator.com`. A resource-specific endpoint normally looks like `https://your-resource.cognitiveservices.azure.com/`. The generator adds the correct translation path for either form, and also accepts a complete translation endpoint.
- A connection timeout means Azure never returned an HTTP response. Check VPN/firewall access to port 443 and confirm `AZURE_TRANSLATOR_ENDPOINT`. The PowerShell runner enables Node's environment-proxy support, so existing `HTTPS_PROXY` and `NO_PROXY` settings are respected on current Node releases.

Static pages use locale prefixes such as `/fr/pricing/`, plus canonical and `hreflang` links. Run the page build before deployment so search engines and users without JavaScript receive translated copy.

`BuildPages` repairs protected brand terms, translates only visible copy and approved metadata, then regenerates all locale pages and the multilingual sitemap. URLs, hostnames, paths, scripts and HTML markup are never passed through catalogue replacement. The build finishes by validating every canonical, reciprocal `hreflang` cluster, internal file reference and sitemap entry.
