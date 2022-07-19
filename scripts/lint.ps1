$originalDirectory = $pwd
cd "$PSScriptRoot\.."
Write-Host $Script:MyInvocation.MyCommand.Path
$exitCodes = 0

Write-Host "`nRunning Pyright..."
pyright --warnings backend
$exitCodes += $LastExitCode
if ($LastExitCode -gt 0) {
  Write-Host "`Pyright failed ($LastExitCode)" -ForegroundColor Red
} else {
  Write-Host "`Pyright passed" -ForegroundColor Green
}

Write-Host "`nRunning Pylint..."
pylint --output-format=colorized $(git ls-files 'backend/*.py')
$exitCodes += $LastExitCode
if ($LastExitCode -gt 0) {
  Write-Host "`Pylint failed ($LastExitCode)" -ForegroundColor Red
} else {
  Write-Host "`Pylint passed" -ForegroundColor Green
}

Write-Host "`nRunning Flake8..."
flake8 backend
$exitCodes += $LastExitCode
if ($LastExitCode -gt 0) {
  Write-Host "`Flake8 failed ($LastExitCode)" -ForegroundColor Red
} else {
  Write-Host "`Flake8 passed" -ForegroundColor Green
}

Write-Host "`nRunning Bandit..."
bandit -f custom --silent --recursive backend
# $exitCodes += $LastExitCode # Returns 1 on low
if ($LastExitCode -gt 0) {
  Write-Host "`Bandit warning ($LastExitCode)" -ForegroundColor Yellow
} else {
  Write-Host "`Bandit passed" -ForegroundColor Green
}


if ($exitCodes -gt 0) {
  Write-Host "`nLinting failed ($exitCodes)" -ForegroundColor Red
} else {
  Write-Host "`nLinting passed" -ForegroundColor Green
}

cd $originalDirectory
