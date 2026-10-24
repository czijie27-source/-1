# Windows PowerShell：.\scripts\render.ps1 [-Preview]
param([switch]$Preview)
Set-Location (Join-Path $PSScriptRoot "..")
if (-not (Test-Path "public/audio/narration.wav") -or -not (Test-Path "public/audio/music.wav")) {
  python scripts/prepare_audio.py
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
if ($Preview) { node scripts/render.mjs --preview } else { node scripts/render.mjs }
