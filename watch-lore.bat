@echo off
title Decked Out - Lore Auto-Updater
cd /d "%~dp0"
echo ========================================================
echo   🌌 DECKED OUT — AUTO LORE SYNC ^& WATCHER
echo ========================================================
echo Watching C:\Users\ellul\Documents\decked-out\lore for changes...
echo Any edits in Obsidian or text files will auto-update the site!
echo.
node scripts/watch-lore.js
pause
