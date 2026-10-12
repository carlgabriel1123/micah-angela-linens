<#
  Share the site through a temporary Cloudflare quick tunnel (no account, no Vercel).

  Start (prints the public link):
    powershell -ExecutionPolicy Bypass -File share.ps1
  Stop sharing:
    powershell -ExecutionPolicy Bypass -File share.ps1 -Stop

  The link works while this computer is on, awake and online. Every start
  makes a new link, so send the new one if you restart it.
#>
param([switch]$Stop, [int]$Port = 8150)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$state = Join-Path $root '.share'
$pidFile = Join-Path $state 'pids.txt'
$cloudflared = Join-Path (Split-Path -Parent $root) 'cloudflared.exe'

function Stop-Share {
  if (Test-Path $pidFile) {
    Get-Content $pidFile | ForEach-Object {
      if ($_ -match '^\d+$') { Stop-Process -Id ([int]$_) -Force -ErrorAction SilentlyContinue }
    }
    Remove-Item $pidFile -Force
  }
}

if ($Stop) {
  Stop-Share
  Write-Host 'Sharing stopped. The old link no longer works.'
  return
}

if (-not (Test-Path $cloudflared)) {
  Write-Host "cloudflared.exe not found at $cloudflared"
  exit 1
}

Stop-Share
New-Item -ItemType Directory -Force $state | Out-Null
$log = Join-Path $state 'tunnel.log'
Remove-Item $log -ErrorAction SilentlyContinue

$server = Start-Process python -ArgumentList @("`"$root\serve.py`"", $Port) -WorkingDirectory $root -WindowStyle Hidden -PassThru `
  -RedirectStandardOutput (Join-Path $state 'server.log') -RedirectStandardError (Join-Path $state 'server-requests.log')
$tunnel = Start-Process $cloudflared -ArgumentList @('tunnel', '--no-autoupdate', '--url', "http://127.0.0.1:$Port") -WindowStyle Hidden -PassThru `
  -RedirectStandardOutput (Join-Path $state 'tunnel-out.log') -RedirectStandardError $log
"$($server.Id)`n$($tunnel.Id)" | Set-Content $pidFile

$url = $null
for ($i = 0; $i -lt 40 -and -not $url; $i++) {
  Start-Sleep -Milliseconds 750
  if (Test-Path $log) {
    $hit = Select-String -Path $log -Pattern 'https://[a-z0-9-]+\.trycloudflare\.com' | Select-Object -First 1
    if ($hit) { $url = $hit.Matches[0].Value }
  }
}

if ($url) {
  Set-Content (Join-Path $state 'link.txt') $url
  Write-Host "Share this link: $url"
} else {
  Write-Host "No link yet. Check $log"
}
