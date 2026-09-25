# Xpedition Local ComfyUI Runner
# Starts local ComfyUI instance on 127.0.0.1:8188 with CPU mode (or GPU if available)
$UserHome = $env:USERPROFILE
$PythonExe = if ($env:COMFYUI_PYTHON) { $env:COMFYUI_PYTHON } else { "$UserHome\.comfyui\python\python.exe" }
$ComfyMain = if ($env:COMFYUI_MAIN) { $env:COMFYUI_MAIN } else { "$UserHome\.comfyui\ComfyUI\main.py" }

if (-not (Test-Path $PythonExe)) {
    Write-Error "ComfyUI Python runtime not found at $PythonExe"
    exit 1
}

Write-Host "Starting ComfyUI on http://127.0.0.1:8188 (CPU mode)..."
& $PythonExe $ComfyMain --cpu --listen 127.0.0.1 --port 8188
