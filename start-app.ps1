# PowerShell script to start both frontend and backend
Write-Host "Starting the delivery tracking application..." -ForegroundColor Cyan

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

# Check and stop processes on ports 3000 and 5001
if (Test-PortInUse 3000) {
    Write-Host "Port 3000 is in use. Attempting to stop the process..." -ForegroundColor Yellow
    if (Stop-ProcessUsingPort 3000) {
        Write-Host "Successfully stopped process using port 3000" -ForegroundColor Green
    } else {
        Write-Host "Could not identify or stop the process using port 3000" -ForegroundColor Red
        Write-Host "You may need to manually stop the process" -ForegroundColor Red
    }
}

if (Test-PortInUse 5001) {
    Write-Host "Port 5001 is in use. Attempting to stop the process..." -ForegroundColor Yellow
    if (Stop-ProcessUsingPort 5001) {
        Write-Host "Successfully stopped process using port 5001" -ForegroundColor Green
    } else {
        # Try an alternative approach by finding node processes
        $nodeProcesses = Get-Process | Where-Object {$_.ProcessName -eq "node"}
        if ($nodeProcesses) {
            Write-Host "Found Node.js processes that might be using port 5001. Stopping them..." -ForegroundColor Yellow
            foreach ($process in $nodeProcesses) {
                Write-Host "Stopping Node.js process (ID: $($process.Id))" -ForegroundColor Yellow
                Stop-Process -Id $process.Id -Force
            }
            Write-Host "Node.js processes stopped" -ForegroundColor Green
            Start-Sleep -Seconds 2
        } else {
            Write-Host "Could not identify or stop the process using port 5001" -ForegroundColor Red
            Write-Host "You may need to manually stop the process" -ForegroundColor Red
        }
    }
}

# Start the backend server in a new PowerShell window
Write-Host "Starting backend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path $PSScriptRoot\backend; npm start"

Write-Host "Backend server starting at http://localhost:5001" -ForegroundColor Green
Write-Host "Please wait while the server initializes..." -ForegroundColor Cyan

# Wait a moment to let the backend start
Start-Sleep -Seconds 5

# Start the frontend in a new PowerShell window
Write-Host "Starting frontend server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location -Path $PSScriptRoot; npm run dev"

Write-Host "Frontend development server starting at http://localhost:3000" -ForegroundColor Green
Write-Host "Both services are now starting. You can access the application at http://localhost:3000" -ForegroundColor Cyan

# Run a quick backend health check
Write-Host "Running a quick health check..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5001/health" -Method Get -ErrorAction SilentlyContinue
    if ($response.status -eq "OK") {
        Write-Host "Backend health check: OK" -ForegroundColor Green
    } else {
        Write-Host "Backend health check: Failed" -ForegroundColor Red
    }
} catch {
    Write-Host "Backend health check: Failed to connect" -ForegroundColor Red
}

Write-Host "`nSetup complete! Here's how to use the application:" -ForegroundColor Cyan
Write-Host "1. Access the application at: http://localhost:3000" -ForegroundColor White
Write-Host "2. Log in with a test account or register a new one" -ForegroundColor White
Write-Host "3. For API testing, run: node test-integration.js" -ForegroundColor White
Write-Host "4. For basic connectivity test, run: node simple-test.js" -ForegroundColor White 