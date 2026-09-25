@echo off
title Decked Out - Manual Lore Sync
cd /d "%~dp0"
echo ========================================================
echo   🌌 DECKED OUT — MANUAL LORE SYNC
echo ========================================================
echo Syncing C:\Users\ellul\Documents\decked-out\lore to website...
echo.
node scripts/sync-lore.js
echo.
echo Sync completed.
pause
