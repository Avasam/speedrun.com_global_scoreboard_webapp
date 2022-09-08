# Alias python3 to python on Windows
If ($IsWindows) {
  $python = (Get-Command python).Source
  $python3 = "$((Get-Item $python).Directory.FullName)/python3.exe"
  New-Item -ItemType SymbolicLink -Path $python3 -Target $python -ErrorAction SilentlyContinue
}

python3 -m pip install wheel pip setuptools --upgrade
python3 -m pip install -r "$PSScriptRoot/requirements.txt"
