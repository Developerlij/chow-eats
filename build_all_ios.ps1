# PowerShell script to guide and build all 6 mobile applications for iOS Production

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Chow iOS Production Cloud Builder (EAS Build)" -ForegroundColor Green
Write-Host "This script will trigger iOS production builds sequentially." -ForegroundColor Green
Write-Host "Make sure you have your Apple Developer credentials ready." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

$apps = @(
    @{ Name = "Customer App"; Path = "." },
    @{ Name = "Admin Mobile"; Path = "admin-mobile" },
    @{ Name = "Driver Mobile"; Path = "driver-mobile" },
    @{ Name = "Operator Mobile"; Path = "operator-mobile" },
    @{ Name = "Vendor Mobile"; Path = "vendor-mobile" },
    @{ Name = "Lite Mobile"; Path = "lite-mobile" }
)

foreach ($app in $apps) {
    Write-Host ""
    Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Ready to build: $($app.Name)" -ForegroundColor Yellow
    Write-Host "Directory: $($app.Path)" -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
    
    $choice = Read-Host "Would you like to build $($app.Name) now? (y/n)"
    if ($choice -eq 'y') {
        Push-Location $app.Path
        Write-Host "Triggering EAS build for $($app.Name)..." -ForegroundColor Cyan
        eas build --platform ios --profile production
        Pop-Location
    } else {
        Write-Host "Skipped $($app.Name)." -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "All selected builds triggered!" -ForegroundColor Green
