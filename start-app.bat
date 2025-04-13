@echo off
echo Starting Miami Real Estate Analytics application...

REM Start the server in a new window
start cmd /k "cd server && npm run dev"

REM Wait a moment to let the server initialize
timeout /t 3 /nobreak >nul

REM Start the client in another window
start cmd /k "cd client && npm start"

echo.
echo Server started at: http://localhost:3001/api
echo Client started at: http://localhost:3000
echo. 