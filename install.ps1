# ============================================================
#  DSH plugin config one-click installer
#  Run in a NORMAL PowerShell window (not inside the AI sandbox).
#
#  Usage:
#    1) Right-click this file -> Run with PowerShell
#    2) powershell -ExecutionPolicy Bypass -File .\install.ps1
#    3) Copy the whole file content into PowerShell and press Enter
#
#  Prerequisites: Node.js, pnpm (npm i -g pnpm), git, and the dsh CLI on PATH.
#  After it finishes: restart dsh web, then hard-refresh the browser (Ctrl+Shift+R).
#
#  This installer reproduces the same plugin set as the author's DSH profile:
#    - npm packages: better-sidebar, agent-teams, modlens, modsearch, archify,
#      dsh-web-ui-all
#    - GitHub tarballs / git: dsh-at-file, dsh-custom-tool, dsh-notification,
#      dsh-genui, dsh_workflow
#    - cloned/bundled local plugins: dsh-turn-rewind, dsh-memory-evolve,
#      dsh-super-injector, dsh-auto-approve, maid-atelier skin
#    - DSH-Plugins-Marketplace
#    - presets: anchored-standard, router-standard
#    - extras: jacobian (global CLI), claude-paper (paper-study skill)
# ============================================================

$ErrorActionPreference = "Continue"

# ---------- 0. locate the dsh command ----------
$dshCmd = $null
$candidates = @(
  (Get-Command dsh -ErrorAction SilentlyContinue).Source,
  (Get-Command dsh.cmd -ErrorAction SilentlyContinue).Source,
  (Join-Path $env:APPDATA "npm\dsh.cmd")
)
foreach ($c in $candidates) {
  if ($c -and (Test-Path $c)) { $dshCmd = $c; break }
}
if (-not $dshCmd) {
  Write-Host "[ERROR] dsh command not found. Install DeepSeek Harness first and make sure dsh is on PATH." -ForegroundColor Red
  exit 1
}
Write-Host "Using dsh: $dshCmd" -ForegroundColor DarkGray

# ---------- 1. proxy detection (use local Clash etc. if present) ----------
$proxy = "http://127.0.0.1:7890"
$hasProxy = (Test-NetConnection 127.0.0.1 -Port 7890 -InformationLevel Quiet -WarningAction SilentlyContinue)
if ($hasProxy) {
  $env:HTTPS_PROXY = $proxy; $env:HTTP_PROXY = $proxy; $env:ALL_PROXY = $proxy
  Write-Host "Local proxy 127.0.0.1:7890 detected, enabled (used for GitHub downloads)." -ForegroundColor Green
} else {
  Write-Host "No local proxy detected; downloading directly (if GitHub times out, start your proxy tool first)." -ForegroundColor Yellow
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }
$cache = Join-Path $root ".cache"
New-Item -ItemType Directory -Force -Path $cache | Out-Null

# ---------- 2. install helper ----------
function Add-Plugin([string]$spec) {
  Write-Host ""
  Write-Host ("=== Installing: " + $spec + " ===") -ForegroundColor Cyan
  & $dshCmd plugin --profile web add $spec
  if ($LASTEXITCODE -eq 0) {
    Write-Host ("[OK] " + $spec) -ForegroundColor Green
  } else {
    Write-Host ("[FAIL] " + $spec + " (exit " + $LASTEXITCODE + "), continuing..." ) -ForegroundColor Red
  }
}

function Add-LocalPlugin([string]$folder) {
  if (-not (Test-Path (Join-Path $folder "package.json"))) {
    Write-Host ("[SKIP] plugin source not found: " + $folder) -ForegroundColor Yellow
    return
  }
  Add-Plugin ("link:" + $folder)
}

function Ensure-GitClone([string]$url, [string]$dest) {
  if (Test-Path (Join-Path $dest "package.json")) {
    Write-Host "[SKIP] already cloned: $dest" -ForegroundColor DarkGray
    return $true
  }
  Write-Host "Cloning $url ..." -ForegroundColor Cyan
  git clone --depth 1 $url $dest 2>&1 | Out-Host
  return (Test-Path (Join-Path $dest "package.json"))
}

function Ensure-PatchEntry([string]$entryText) {
  $patch = Join-Path $env:USERPROFILE ".dsh\profiles\web\cordis.patch.yml"
  if (-not (Test-Path $patch)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $patch) | Out-Null
    Set-Content -Path $patch -Value "" -Encoding UTF8
  }
  $nameLine = ($entryText -split "`n" | Where-Object { $_ -match "^\s*name:\s*" } | Select-Object -First 1)
  if ($nameLine -and (Select-String -Path $patch -Pattern ([regex]::Escape($nameLine.Trim())) -Quiet)) {
    Write-Host "[SKIP] patch entry already registered: $($nameLine.Trim())" -ForegroundColor DarkGray
    return
  }
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::AppendAllText($patch, "`n" + $entryText.TrimEnd() + "`n", $utf8NoBom)
  Write-Host "[OK] patch entry registered: $($nameLine.Trim())" -ForegroundColor Green
}

# ---------- 3. npm packages ----------
Write-Host "`n########## Group 1: npm packages ##########" -ForegroundColor Magenta
Add-Plugin "dsh-better-sidebar"
Add-Plugin "@nanmicoder/dsh-agent-teams"
Add-Plugin "@liustack/modlens@latest"
Add-Plugin "@liustack/modsearch@latest"
Add-Plugin "@tt-a1i/archify-dsh@0.1.0"
Add-Plugin "@linxin666/dsh-web-ui-all@0.1.10"

# ---------- 4. GitHub tarballs ----------
Write-Host "`n########## Group 2: GitHub tarball plugins ##########" -ForegroundColor Magenta
Add-Plugin "https://github.com/omdsh-dev/dsh-at-file/archive/refs/tags/v0.4.0.tar.gz"
Add-Plugin "https://github.com/omdsh-dev/dsh-custom-tool/archive/refs/heads/main.tar.gz"
Add-Plugin "https://github.com/omdsh-dev/dsh-notification/archive/refs/heads/main.tar.gz"

# ---------- 5. git plugins ----------
Write-Host "`n########## Group 3: git plugins ##########" -ForegroundColor Magenta
Add-Plugin "git+https://github.com/omdsh-dev/dsh-genui.git"
Add-Plugin "github:dsh-external/dsh_workflow#main"

# ---------- 6. local-link / bundled plugins ----------
Write-Host "`n########## Group 4: local-link / bundled plugins ##########" -ForegroundColor Magenta

# dsh-turn-rewind (public upstream, has built lib/)
$turn = Join-Path $cache "dsh-turn-rewind"
if (Ensure-GitClone "https://github.com/Anionex/dsh-turn-rewind.git" $turn) {
  Add-LocalPlugin $turn
} else {
  Write-Host "[SKIP] dsh-turn-rewind clone failed" -ForegroundColor Yellow
}

# dsh-memory-evolve (public upstream, has built lib/)
$mem = Join-Path $cache "dsh-memory-evolve"
if (Ensure-GitClone "https://github.com/csyangwen/dsh-memory-evolve.git" $mem) {
  Add-LocalPlugin $mem
  Ensure-PatchEntry @"
- insert:
    - id: dsh-memory-evolve
      name: dsh-memory-evolve
      config:
        reviewEnabled: true
        reviewInterval: 10
"@
} else {
  Write-Host "[SKIP] dsh-memory-evolve clone failed" -ForegroundColor Yellow
}

# dsh-super-injector (published release tarball, includes built lib/)
Add-Plugin "https://github.com/yjh051108/dsh-super-injector/releases/download/v0.3.3/dsh-external-dsh-super-injector-0.3.3.tgz"

# dsh-auto-approve (bundled in this repo)
$auto = Join-Path $root "plugins\dsh-auto-approve"
Add-LocalPlugin $auto

# maid-atelier skin (bundled in this repo)
$maid = Join-Path $root "plugins\dsh-client-ui-skin-maid-atelier"
Add-LocalPlugin $maid

# Ensure dsh-auto-approve sits before @deepseek-ai/dsh-web-app in bundles
$profilePkg = Join-Path $env:USERPROFILE ".dsh\profiles\web\package.json"
if (Test-Path $profilePkg) {
  try {
    $pkg = Get-Content $profilePkg -Raw | ConvertFrom-Json
    $bundles = @($pkg.dsh.profile.bundles)
    if ($bundles -contains "dsh-auto-approve") {
      $bundles = @($bundles | Where-Object { $_ -ne "dsh-auto-approve" })
      $idx = [Array]::IndexOf($bundles, "@deepseek-ai/dsh-web-app")
      if ($idx -lt 0) { $idx = 1 }
      $bundles = @($bundles[0..($idx-1)]) + @("dsh-auto-approve") + @($bundles[$idx..($bundles.Count-1)])
      $pkg.dsh.profile.bundles = $bundles
      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [System.IO.File]::WriteAllText($profilePkg, ($pkg | ConvertTo-Json -Depth 20), $utf8NoBom)
      Write-Host "[OK] dsh-auto-approve moved before @deepseek-ai/dsh-web-app in bundles" -ForegroundColor Green
    }
  } catch {
    Write-Host "[WARN] could not reorder dsh-auto-approve bundle: $($_.Exception.Message)" -ForegroundColor Yellow
  }
}

# ---------- 7. DSH-Plugins-Marketplace ----------
Write-Host "`n########## Group 5: DSH-Plugins-Marketplace ##########" -ForegroundColor Magenta
$mk = Join-Path $cache "DSH-Plugins-Marketplace"
if (Ensure-GitClone "https://github.com/bradeGithub/DSH-Plugins-Marketplace.git" $mk) {
  & (Join-Path $mk "install.ps1")
} else {
  Write-Host "[SKIP] DSH-Plugins-Marketplace clone failed" -ForegroundColor Yellow
}

# ---------- 8. presets ----------
Write-Host "`n########## Group 6: agent presets ##########" -ForegroundColor Magenta
$presetBase = Join-Path $env:USERPROFILE ".dsh\.agent-presets"
New-Item -ItemType Directory -Force -Path $presetBase | Out-Null

$anchoredSrc = Join-Path $root "presets\anchored-standard"
$anchoredDst = Join-Path $presetBase "anchored-standard"
if (Test-Path (Join-Path $anchoredSrc "preset.yml")) {
  if (Test-Path $anchoredDst) {
    Write-Host "[SKIP] anchored-standard preset already exists: $anchoredDst" -ForegroundColor Yellow
  } else {
    Copy-Item -Recurse $anchoredSrc $anchoredDst
    Write-Host "[OK] anchored-standard preset installed" -ForegroundColor Green
  }
} else {
  Write-Host "[SKIP] anchored-standard preset source not found" -ForegroundColor Yellow
}

$routerSrc = Join-Path $root "presets\router-standard"
$routerDst = Join-Path $presetBase "router-standard"
if (Test-Path (Join-Path $routerSrc "preset.yml")) {
  if (Test-Path $routerDst) {
    Write-Host "[SKIP] router-standard preset already exists: $routerDst" -ForegroundColor Yellow
  } else {
    Copy-Item -Recurse $routerSrc $routerDst
    Write-Host "[OK] router-standard preset installed" -ForegroundColor Green
  }
} else {
  Write-Host "[SKIP] router-standard preset source not found" -ForegroundColor Yellow
}

# ---------- 9. extras (same as author environment) ----------
Write-Host "`n########## Group 7: extras ##########" -ForegroundColor Magenta
Write-Host "=== Installing jacobian (global CLI) ===" -ForegroundColor Cyan
npm install -g jacobian
if ($LASTEXITCODE -eq 0) { Write-Host "[OK] jacobian" -ForegroundColor Green } else { Write-Host "[FAIL] jacobian" -ForegroundColor Red }

Write-Host "=== Installing claude-paper (paper-study skill, deepseek-harness target) ===" -ForegroundColor Cyan
npx --yes @zlzliqing/claude-paper@latest install --target deepseek-harness
if ($LASTEXITCODE -eq 0) { Write-Host "[OK] claude-paper" -ForegroundColor Green } else { Write-Host "[FAIL] claude-paper" -ForegroundColor Red }

# ---------- 10. done ----------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "All plugin install steps finished."
Write-Host "Next: restart dsh web, then hard-refresh the browser (Ctrl+Shift+R)."
Write-Host "Verify: dsh plugin --profile web list"
Write-Host "        dsh --profile web --dump-config"
Write-Host "============================================================" -ForegroundColor Green
