@echo off
set ADB_PATH="C:\Users\LocalAdmin\AppData\Local\Android\android-sdk\platform-tools\adb.exe"
echo Setting up ADB reverse port forwarding...
%ADB_PATH% reverse tcp:8081 tcp:8081
if %ERRORLEVEL% EQU 0 (
    echo Successfully forwarded port 8081!
) else (
    echo Error: Failed to set up port forwarding. Make sure your device is connected via USB and USB Debugging is enabled.
)
pause
