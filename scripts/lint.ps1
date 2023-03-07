$originalDirectory = $pwd
Set-Location "$PSScriptRoot/.."
$exitCodes = 0

function Update-Results {
  param ($Name)
  $exitCodes += $LastExitCode
  if ($LastExitCode -gt 0) {
    Write-Host "`n$Name failed ($LastExitCode)" -ForegroundColor Red
  }
  else {
    Write-Host "`n$Name passed" -ForegroundColor Green
  }
}

Write-Host "`nRunning formatting..."
autopep8 $(git ls-files '**.py*') --in-place
add-trailing-comma $(git ls-files '**.py*') --py36-plus

Write-Host "`nRunning Ruff..."
ruff check . --fix
Update-Results('Ruff')

Write-Host "`nRunning Pyright..."
$Env:PYRIGHT_PYTHON_FORCE_VERSION = 'latest'
npx --yes 'pyright@latest' backend/ --warnings
Update-Results('Pyright')

if ($exitCodes -gt 0) {
  Write-Host "`nLinting failed ($exitCodes)" -ForegroundColor Red
}
else {
  Write-Host "`nLinting passed" -ForegroundColor Green
}

Set-Location $originalDirectory
