#!/bin/bash

set -e

echo "🚀 Lab Booking System - Automated Installation"
echo "=============================================="
echo ""

# Detect Raspberry Pi
if [ -f /proc/cpuinfo ] && grep -q "Raspberry Pi" /proc/cpuinfo; then
    IS_RASPBERRY_PI=true
    echo "🍓 Raspberry Pi detected!"
    
    # Check architecture
    ARCH=$(uname -m)
    if [ "$ARCH" != "aarch64" ] && [ "$ARCH" != "arm64" ]; then
        echo "⚠️  Warning: Expected ARM64 architecture but detected $ARCH"
    else
        echo "✅ ARM64 architecture confirmed"
    fi
    echo ""
else
    IS_RASPBERRY_PI=false
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed."
    if [ "$IS_RASPBERRY_PI" = true ]; then
        echo ""
        echo "To install Docker on Raspberry Pi, run:"
        echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "  sudo sh get-docker.sh"
        echo "  sudo usermod -aG docker \$USER"
        echo ""
        echo "Then log out and back in, and run this script again."
    else
        echo "Please install Docker first."
    fi
    exit 1
fi

# Check if Docker Compose is installed (v2 or v1)
DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
    echo "✅ Docker Compose v2 detected"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
    echo "✅ Docker Compose v1 detected"
else
    echo "❌ Docker Compose is not installed."
    if [ "$IS_RASPBERRY_PI" = true ]; then
        echo ""
        echo "Docker Compose should be included with Docker. If not, install it with:"
        echo "  sudo apt-get update"
        echo "  sudo apt-get install docker-compose-plugin"
    else
        echo "Please install Docker Compose first."
    fi
    exit 1
fi

echo "✅ Docker and Docker Compose are installed"

# Check Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running."
    if [ "$IS_RASPBERRY_PI" = true ]; then
        echo "Start Docker with: sudo systemctl start docker"
    else
        echo "Please start Docker first."
    fi
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate a secure NEXTAUTH_SECRET if openssl is available
    if command -v openssl &> /dev/null; then
        SECRET=$(openssl rand -base64 32)
        # Escape special characters for sed
        ESCAPED_SECRET=$(echo "$SECRET" | sed 's/[[\.*^$()+?{|]/\\&/g')
        
        # Update NEXTAUTH_SECRET in .env
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/your-secret-key-here-change-in-production/$ESCAPED_SECRET/" .env
        else
            # Linux
            sed -i "s/your-secret-key-here-change-in-production/$ESCAPED_SECRET/" .env
        fi
        echo "✅ Generated secure NEXTAUTH_SECRET"
    else
        echo "⚠️  openssl not found. Please manually update NEXTAUTH_SECRET in .env file"
    fi
    
    # Detect server IP for Raspberry Pi
    if [ "$IS_RASPBERRY_PI" = true ]; then
        # Try to get IP address
        if command -v hostname &> /dev/null; then
            PI_IP=$(hostname -I | awk '{print $1}')
            if [ -n "$PI_IP" ]; then
                echo ""
                echo "📋 Detected Raspberry Pi IP: $PI_IP"
                echo "   Updating NEXTAUTH_URL to http://$PI_IP:3000"
                if [[ "$OSTYPE" == "darwin"* ]]; then
                    sed -i '' "s|http://localhost:3000|http://$PI_IP:3000|" .env
                else
                    sed -i "s|http://localhost:3000|http://$PI_IP:3000|" .env
                fi
            fi
        fi
    fi
    
    echo ""
    echo "📋 Please review and update .env file with your settings:"
    echo "   - NEXTAUTH_URL: Set to your server's URL (e.g., http://your-server-ip:3000)"
    echo "   - NEXTAUTH_SECRET: Already generated (or update manually)"
    echo ""
    read -p "Press Enter to continue after reviewing .env file..."
else
    echo "✅ .env file already exists"
fi

echo ""
if [ "$IS_RASPBERRY_PI" = true ]; then
    echo "🐳 Building Docker images for ARM64 (Raspberry Pi 5)..."
    echo "   This may take 10-15 minutes on Raspberry Pi..."
    echo "   Please be patient..."
else
    echo "🐳 Building Docker images..."
fi
$DOCKER_COMPOSE_CMD build

echo ""
echo "🚀 Starting containers..."
$DOCKER_COMPOSE_CMD up -d

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Wait for PostgreSQL to be healthy
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if $DOCKER_COMPOSE_CMD exec -T postgres pg_isready -U lab_booking > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting for PostgreSQL... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ PostgreSQL failed to start. Check logs with: $DOCKER_COMPOSE_CMD logs postgres"
    exit 1
fi

echo ""
echo "📦 Generating Prisma Client..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma generate

echo ""
echo "🗄️  Running database migrations..."
$DOCKER_COMPOSE_CMD exec -T app npx prisma migrate deploy

echo ""
echo "✅ Installation complete!"
echo ""

if [ "$IS_RASPBERRY_PI" = true ]; then
    PI_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "localhost")
    echo "🌐 Application is available at:"
    echo "   - Local: http://localhost:3000"
    echo "   - Network: http://$PI_IP:3000"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Open http://$PI_IP:3000 in your browser (from any device on your network)"
    echo "   2. Complete the initial setup to create your first admin user"
    echo ""
else
    echo "🌐 Application is available at: http://localhost:3000"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Complete the initial setup to create your first admin user"
    echo ""
fi

echo "📊 Useful commands:"
echo "   - View logs: $DOCKER_COMPOSE_CMD logs -f app"
echo "   - Stop: $DOCKER_COMPOSE_CMD down"
echo "   - Restart: $DOCKER_COMPOSE_CMD restart"
echo "   - View status: $DOCKER_COMPOSE_CMD ps"
echo ""

