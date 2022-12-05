# Alias python3 to python on Windows
If ($IsWindows) {
  $python = (Get-Command python).Source
  $python3 = "$((Get-Item $python).Directory.FullName)/python3.exe"
  New-Item -ItemType SymbolicLink -Path $python3 -Target $python -ErrorAction SilentlyContinue
}

# Ensures installation tools are up to date. This also aliases pip to pip3 on MacOS.
python3 -m pip install wheel pip setuptools --upgrade
pip install -r "$PSScriptRoot/requirements.txt" --upgrade
npm i --global pyright@latest
