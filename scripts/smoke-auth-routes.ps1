param(
  [string]$BaseUrl = 'http://localhost:4201',
  [int]$StartupWaitSeconds = 4
)

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host "[smoke] $Message"
}

Write-Step "Starting server with: bun run server.ts"
$job = Start-Job -ScriptBlock {
  Set-Location 'D:\Windows\Documents\Programming\Projects\BunJS\treat'
  bun run server.ts
}

Start-Sleep -Seconds $StartupWaitSeconds

$failed = $false

try {
  $auth = Invoke-WebRequest -Uri "$BaseUrl/api/auth" -Method GET -UseBasicParsing -ErrorAction Stop
  Write-Step "GET /api/auth => $($auth.StatusCode)"
  Write-Step "Body: $($auth.Content)"
} catch {
  $failed = $true
  Write-Step "GET /api/auth failed: $($_.Exception.Message)"
}

try {
  $unknown = Invoke-WebRequest -Uri "$BaseUrl/api/does-not-exist" -Method GET -UseBasicParsing -ErrorAction Stop
  Write-Step "GET /api/does-not-exist => $($unknown.StatusCode)"
  Write-Step "Body: $($unknown.Content)"
} catch {
  $resp = $_.Exception.Response
  if ($resp -and $resp.StatusCode) {
    Write-Step "GET /api/does-not-exist => $([int]$resp.StatusCode)"
  } else {
    $failed = $true
    Write-Step "GET /api/does-not-exist failed: $($_.Exception.Message)"
  }
}

$jobState = (Get-Job -Id $job.Id).State
Write-Step "Server job state: $jobState"

$serverOutput = Receive-Job -Id $job.Id -Keep -ErrorAction SilentlyContinue
if ($serverOutput) {
  Write-Step 'Server output (first 40 lines):'
  $serverOutput | Select-Object -First 40 | ForEach-Object { Write-Host $_ }
}

Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue

if ($jobState -ne 'Running') {
  $failed = $true
  Write-Step 'Server is not running after startup window.'
}

if ($failed) {
  Write-Step 'Smoke test failed.'
  exit 1
}

Write-Step 'Smoke test passed.'
