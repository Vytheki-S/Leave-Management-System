param(
    [int]$Port = 8080,
    [switch]$KeepExistingListener
)

$ErrorActionPreference = 'Stop'

$goBin = 'C:\Program Files\Go\bin'
if (-not (Get-Command go -ErrorAction SilentlyContinue) -and (Test-Path $goBin)) {
    $env:Path = "$goBin;$env:Path"
}

$listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

if ($listeners) {
    foreach ($pidValue in $listeners) {
        $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "Port $Port currently used by PID $pidValue ($($proc.ProcessName))."
        } else {
            Write-Host "Port $Port currently used by PID $pidValue."
        }

        if (-not $KeepExistingListener) {
            Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped PID $pidValue to free port $Port."
        }
    }

    if ($KeepExistingListener) {
        Write-Host "Keeping existing listener(s); backend start skipped."
        exit 0
    }
}

Set-Location $PSScriptRoot
Write-Host "Starting backend on port $Port from $PSScriptRoot"
$env:PORT = "$Port"
go run ./cmd/server/main.go
