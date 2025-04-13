# start-app.ps1
# Miami Real Estate Application Startup Script

$ErrorActionPreference = "Stop"

# Function to write status messages with color
function Write-Status {
    param (
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to check if a service is running
function Test-ServiceRunning {
    param (
        [string]$ServiceName
    )
    
    try {
        $service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
        return ($service -and $service.Status -eq 'Running')
    } catch {
        return $false
    }
}

# Check and start PostgreSQL service
function Ensure-PostgreSQLRunning {
    Write-Status "Checking PostgreSQL service..." "Cyan"
    
    # Check for common PostgreSQL service names
    $pgServices = @(
        "postgresql", 
        "postgresql-x64-14", 
        "postgresql-x64-13", 
        "postgresql-x64-12", 
        "postgresql*"
    )
    
    $running = $false
    $serviceName = $null
    
    foreach ($svc in $pgServices) {
        $services = Get-Service -Name $svc -ErrorAction SilentlyContinue
        if ($services) {
            foreach ($service in $services) {
                $serviceName = $service.Name
                if ($service.Status -eq 'Running') {
                    Write-Status "PostgreSQL service ($serviceName) is already running" "Green"
                    $running = $true
                    break
                } else {
                    try {
                        Write-Status "Starting PostgreSQL service ($serviceName)..." "Yellow"
                        Start-Service $serviceName
                        Start-Sleep -Seconds 2  # Give it a moment to start
                        
                        if ((Get-Service $serviceName).Status -eq 'Running') {
                            Write-Status "PostgreSQL service started successfully" "Green"
                            $running = $true
                            break
                        } else {
                            Write-Status "Failed to start PostgreSQL service" "Red"
                        }
                    } catch {
                        Write-Status "Error starting PostgreSQL service: $_" "Red"
                    }
                }
            }
        }
        if ($running) { break }
    }
    
    if (-not $running) {
        Write-Status "WARNING: Could not find or start PostgreSQL service. Database features may not work!" "Yellow"
        Write-Status "The application will continue but database-dependent features will be unavailable." "Yellow"
        Write-Status "" "White"
        Write-Status "SOLUTION OPTIONS:" "Cyan"
        Write-Status "1. Install PostgreSQL if not installed: https://www.postgresql.org/download/windows/" "White"
        Write-Status "2. If PostgreSQL is installed, start it manually:" "White"
        Write-Status "   Start-Service postgresql*" "White"
        Write-Status "3. Check if PostgreSQL is running on a different port or server and update:" "White"
        Write-Status "   server/src/utils/db.js with the correct connection settings" "White"
        Write-Status "" "White"
        
        # Wait for user acknowledgment before continuing
        Read-Host "Press Enter to continue anyway..."
    }
    
    return $running
}

# Kill any existing Node.js processes
function Stop-ExistingNodeProcesses {
    Write-Status "Stopping any existing Node.js processes..." "Cyan"
    try {
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        if ($processes) {
            Stop-Process -Name "node" -Force
            Write-Status "Terminated existing Node.js processes" "Green"
            Start-Sleep -Seconds 2
        } else {
            Write-Status "No Node.js processes found" "Green"
        }
    } catch {
        Write-Status "Error stopping Node.js processes: $_" "Red"
    }
}

# Find project root directory
function Find-ProjectRoot {
    $currentDir = Get-Location
    Write-Status "Current directory: $currentDir" "Cyan"
    
    # Check if we're in the project root
    if ((Test-Path "server") -and (Test-Path "client")) {
        Write-Status "Project root detected at current location" "Green"
        return $currentDir
    }
    
    # Check if we're in server or client subdirectory
    if ((Test-Path "../server") -and (Test-Path "../client")) {
        $parentDir = (Get-Item $currentDir).Parent.FullName
        Write-Status "Project root detected at parent directory: $parentDir" "Green"
        return $parentDir
    }
    
    # Could not determine project root
    Write-Status "Could not determine project root directory" "Red"
    Write-Status "Please run this script from the project root or a subdirectory" "Yellow"
    exit 1
}

# Start the application
function Start-Application {
    Write-Status "Starting Miami Real Estate application..." "Cyan"
    
    try {
        # Find project root
        $projectRoot = Find-ProjectRoot
        Set-Location $projectRoot
        
        # Start server
        Write-Status "Starting server..." "Green"
        $serverProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd server && npm run dev" -WindowStyle Normal -PassThru
        Start-Sleep -Seconds 3
        
        # Check if server process is still running (failed start would terminate)
        if ($serverProcess.HasExited) {
            Write-Status "ERROR: Server failed to start properly. Exit code: $($serverProcess.ExitCode)" "Red"
            Write-Status "Check the server logs for more details." "Yellow"
            exit 1
        }
        
        # Start client
        Write-Status "Starting client..." "Green"
        $clientProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd client && npm start" -WindowStyle Normal -PassThru
        
        Write-Status "Application started successfully" "Green"
        Write-Status "Server: http://localhost:3001/api" "Cyan"
        Write-Status "Client: http://localhost:3000" "Cyan"
        Write-Status "" "White"
        Write-Status "Press Ctrl+C to stop the application" "Yellow"
        
        # Keep script running until user presses Ctrl+C
        while ($true) {
            Start-Sleep -Seconds 5
            
            # Check if processes are still running
            if ($serverProcess.HasExited -and $clientProcess.HasExited) {
                Write-Status "Both server and client have stopped." "Yellow"
                break
            }
        }
    } catch {
        Write-Status "Error starting application: $_" "Red"
        exit 1
    }
}

# Main execution
Write-Status "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=" "Blue"
Write-Status "     MIAMI REAL ESTATE APPLICATION        " "Blue"
Write-Status "=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=" "Blue"
Write-Status ""

# Ensure PostgreSQL is running
$pgRunning = Ensure-PostgreSQLRunning
Write-Status "PostgreSQL running: $pgRunning"

# Stop any existing Node.js processes
Stop-ExistingNodeProcesses

# Start the application
Start-Application
