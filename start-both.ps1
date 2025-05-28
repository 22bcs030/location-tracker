# PowerShell script to start both frontend and backend in a single window
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

# Function to capture and display output from a job
function Show-JobOutput {
    param (
        [Parameter(Mandatory=$true)]
        [string]$JobName,
        
        [Parameter(Mandatory=$true)]
        [System.Management.Automation.Job]$Job,
        
        [Parameter(Mandatory=$true)]
        [System.ConsoleColor]$Color
    )
    
    $newOutput = Receive-Job -Job $Job
    if ($newOutput) {
        foreach ($line in $newOutput) {
            Write-Host "[$JobName] $line" -ForegroundColor $Color
        }
    }
}

# Start backend as a job
Write-Host "Starting backend server as a background job..." -ForegroundColor Cyan
$backendJob = Start-Job -ScriptBlock {
    Set-Location -Path "$using:PSScriptRoot\backend"
    & npm start
}

Write-Host "Backend server starting at http://localhost:5001" -ForegroundColor Green
Write-Host "Please wait while the backend initializes..." -ForegroundColor Cyan

# Give the backend time to start
Start-Sleep -Seconds 5

# Start frontend as a job
Write-Host "Starting frontend server as a background job..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location -Path "$using:PSScriptRoot"
    & npm run dev
}

Write-Host "Frontend server starting at http://localhost:3000" -ForegroundColor Green
Write-Host "Both services are now running in the background." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop both servers." -ForegroundColor Yellow

# Monitor and display job output
try {
    while ($true) {
        # Show backend output
        Show-JobOutput -JobName "BACKEND" -Job $backendJob -Color "Cyan"
        
        # Show frontend output
        Show-JobOutput -JobName "FRONTEND" -Job $frontendJob -Color "Green"
        
        # Check if either job has stopped
        if ($backendJob.State -eq "Completed" -or $backendJob.State -eq "Failed" -or $backendJob.State -eq "Stopped") {
            Write-Host "Backend job has stopped with state: $($backendJob.State)" -ForegroundColor Red
            break
        }
        
        if ($frontendJob.State -eq "Completed" -or $frontendJob.State -eq "Failed" -or $frontendJob.State -eq "Stopped") {
            Write-Host "Frontend job has stopped with state: $($frontendJob.State)" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 1
    }
}
finally {
    # Clean up jobs when script is interrupted
    Write-Host "Stopping services..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "Services stopped." -ForegroundColor Green
} 