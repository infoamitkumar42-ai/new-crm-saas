@echo off
echo ===================================================
echo   🚀 LEADFLOW SYSTEM UDPATER TO SUPABASE
echo ===================================================
echo.
echo [STEP 1] Logging into Supabase...
echo (A browser window will open. Please click 'Confirm' to login)
echo.
call npx supabase login
echo.
echo ---------------------------------------------------
echo [STEP 2] Deploying Logic Updates...
echo (Updating 30-min Delay & Priority Logic)
echo.
call npx supabase functions deploy meta-webhook-v24 --no-verify-jwt
echo.
echo ===================================================
echo   ✅ UPDATE COMPLETE!
echo   You can close this window now.
echo ===================================================
pause
