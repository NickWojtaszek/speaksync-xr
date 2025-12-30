@echo off
echo Fixing git issues...

REM Delete the problematic 'nul' file if it exists
if exist nul (
    echo Deleting invalid 'nul' file...
    del /F nul 2>NUL
)

REM Add all files except nul
echo Adding files to git...
git add .

REM Commit
echo Committing...
git commit -m "Initial commit - Production ready"

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin main

echo.
echo Done! Check above for any errors.
pause
