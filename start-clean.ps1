# PowerShell script to clean Next.js cache and start the development server
Write-Host "Cleaning Next.js cache and starting development server..." -ForegroundColor Cyan

# Function to check if a port is in use
function Test-PortInUse {
    param ($port)
    $connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | 
                    Where-Object { $_.LocalPort -eq $port }
    return $null -ne $connections
}

# Function to stop processes using a specific port
function Stop-ProcessUsingPort {
    param ($port)
    
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "Stopping process $($process.ProcessName) (ID: $($process.Id)) using port $port" -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force
                Start-Sleep -Seconds 1
            }
        }
        return $true
    }
    return $false
}

# Check and stop processes on port 3000
if (Test-PortInUse 3000) {
    Write-Host "Port 3000 is in use. Attempting to stop the process..." -ForegroundColor Yellow
    if (Stop-ProcessUsingPort 3000) {
        Write-Host "Successfully stopped process using port 3000" -ForegroundColor Green
    } else {
        Write-Host "Could not identify or stop the process using port 3000" -ForegroundColor Red
        Write-Host "You may need to manually stop the process" -ForegroundColor Red
    }
}

# Clean Next.js cache
Write-Host "Removing .next directory..." -ForegroundColor Yellow
if (Test-Path -Path ".next") {
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
    Write-Host ".next directory removed" -ForegroundColor Green
} else {
    Write-Host ".next directory does not exist" -ForegroundColor Green
}

# Clean node_modules/.cache
Write-Host "Cleaning node_modules/.cache..." -ForegroundColor Yellow
if (Test-Path -Path "node_modules/.cache") {
    Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
    Write-Host "node_modules/.cache cleaned" -ForegroundColor Green
} else {
    Write-Host "node_modules/.cache does not exist" -ForegroundColor Green
}

# Start Next.js development server
Write-Host "Starting Next.js development server..." -ForegroundColor Cyan
npm run dev 