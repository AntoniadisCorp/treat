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
  $homeResponse = Invoke-WebRequest -Uri "$BaseUrl/" -Method GET -UseBasicParsing -ErrorAction Stop
  Write-Step "GET / => $($homeResponse.StatusCode)"

  if ($homeResponse.Content -notmatch 'Treat Ops') {
    $failed = $true
    Write-Step 'Landing content check failed: expected "Treat Ops" marker.'
  }
} catch {
  $failed = $true
  Write-Step "GET / failed: $($_.Exception.Message)"
}

try {
  $post = Invoke-WebRequest -Uri "$BaseUrl/post/1" -Method GET -UseBasicParsing -ErrorAction Stop
  Write-Step "GET /post/1 => $($post.StatusCode)"
} catch {
  $failed = $true
  Write-Step "GET /post/1 failed: $($_.Exception.Message)"
}

$jobState = (Get-Job -Id $job.Id).State
Write-Step "Server job state: $jobState"

$serverOutput = Receive-Job -Id $job.Id -Keep -ErrorAction SilentlyContinue
if ($serverOutput) {
  Write-Step 'Server output (first 30 lines):'
  $serverOutput | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
}

Stop-Job -Id $job.Id -ErrorAction SilentlyContinue
Remove-Job -Id $job.Id -Force -ErrorAction SilentlyContinue

if ($jobState -ne 'Running') {
  $failed = $true
  Write-Step 'Server is not running after startup window.'
}

if ($failed) {
  Write-Step 'Landing smoke test failed.'
  exit 1
}

Write-Step 'Landing smoke test passed.'
