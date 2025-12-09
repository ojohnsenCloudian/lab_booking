# Lab Booking System - Automated Installation Script for Windows/PowerShell

Write-Host "🚀 Lab Booking System - Automated Installation" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker compose version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env file exists
if (-Not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    
    # Generate a secure NEXTAUTH_SECRET
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    $secret = [Convert]::ToBase64String($bytes)
    
    # Update NEXTAUTH_SECRET in .env
    (Get-Content .env) -replace 'your-secret-key-here-change-in-production', $secret | Set-Content .env
    Write-Host "✅ Generated secure NEXTAUTH_SECRET" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "📋 Please review and update .env file with your settings:" -ForegroundColor Yellow
    Write-Host "   - NEXTAUTH_URL: Set to your server's URL (e.g., http://localhost:3000)" -ForegroundColor Yellow
    Write-Host "   - NEXTAUTH_SECRET: Already generated" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to continue after reviewing .env file"
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🐳 Building Docker images..." -ForegroundColor Cyan
docker compose build

Write-Host ""
Write-Host "🚀 Starting containers..." -ForegroundColor Cyan
docker compose up -d

Write-Host ""
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Wait for PostgreSQL to be healthy
$maxRetries = 30
$retryCount = 0
$ready = $false

while ($retryCount -lt $maxRetries) {
    try {
        docker compose exec -T postgres pg_isready -U lab_booking 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        # Continue waiting
    }
    $retryCount++
    Write-Host "   Waiting for PostgreSQL... ($retryCount/$maxRetries)" -ForegroundColor Yellow
    Start-Sleep -Seconds 2
}

if (-Not $ready) {
    Write-Host "❌ PostgreSQL failed to start. Check logs with: docker compose logs postgres" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Cyan
docker compose exec -T app npx prisma generate

Write-Host ""
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
docker compose exec -T app npx prisma migrate deploy

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Application is available at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host "   2. Complete the initial setup to create your first admin user" -ForegroundColor White
Write-Host ""
Write-Host "📊 Useful commands:" -ForegroundColor Yellow
Write-Host "   - View logs: docker compose logs -f app" -ForegroundColor White
Write-Host "   - Stop: docker compose down" -ForegroundColor White
Write-Host "   - Restart: docker compose restart" -ForegroundColor White
Write-Host ""

