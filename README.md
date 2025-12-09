# Lab Booking System

A full-stack Next.js application for managing lab resource bookings with exclusive time slots, flexible booking durations, and comprehensive admin controls.

**Optimized for Raspberry Pi 5 deployment** 🍓

## Features

### Admin Features
- Create and manage lab resources (SSH, Web App URLs, RDP, VPN credentials)
- Create and manage Lab Types with resource assignments
- Configure max booking duration per Lab Type
- Create and manage user accounts
- View all bookings with ability to cancel any booking
- Create bookings on behalf of users
- Modify existing bookings
- View booking passwords and connection info (even after booking ends)
- Reset booking passwords

### User Features
- Calendar view showing available slots (Day/Week/Month views)
- Book Lab Types with flexible start/end times
- Auto-generated booking passwords displayed after creation
- Add optional notes when creating bookings
- View connection info for booked resources (only visible when booking is active)
- Cancel bookings
- View booking history

### Business Rules
- Exclusive bookings: Only one active booking per Lab Type at any time
- 2-hour gap: Minimum 2 hours between any bookings (for maintenance)
- 3-day cooldown: Users must wait 3 days between bookings (global)
- Minimum duration: 1 hour required for all bookings
- Max duration: Configurable per Lab Type
- Booking password: Auto-generated secure code, required to access booking details
- Connection visibility: Connection details only visible when startTime <= currentTime < endTime

## Tech Stack

- **Framework**: Next.js 14+ with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js (auth.js)
- **UI Components**: Shadcn UI with Tailwind CSS
- **Deployment**: Docker with docker-compose (optimized for Raspberry Pi 5 ARM64)

## Getting Started

### Prerequisites

- Node.js 20+ (for local development)
- PostgreSQL database (for local development)
- Docker and Docker Compose (for containerized deployment)

### Local Development Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `NEXTAUTH_SECRET`: A random secret for NextAuth
   - `NEXTAUTH_URL`: Your application URL (e.g., http://localhost:3000)

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Initial Setup

On first launch, you'll be redirected to `/initial-setup` to create the first admin user. After that, admins can create additional users through the admin interface.

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- **For Raspberry Pi 5**: Docker must support ARM64 architecture

### Installing Docker on Raspberry Pi 5

If Docker is not installed on your Raspberry Pi 5:

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (to run without sudo)
sudo usermod -aG docker $USER

# Log out and back in, then verify installation
docker --version
docker compose version
```

### Automated Installation (Recommended)

**Linux/macOS/Raspberry Pi:**
```bash
./install.sh
```

**Windows (PowerShell):**
```powershell
.\install.ps1
```

The installation script will:
- ✅ Detect Raspberry Pi and configure accordingly
- ✅ Check Docker and Docker Compose installation
- ✅ Create `.env` file from `.env.example`
- ✅ Generate a secure `NEXTAUTH_SECRET` automatically
- ✅ Auto-detect Raspberry Pi IP address and update `NEXTAUTH_URL`
- ✅ Build Docker images (ARM64 optimized)
- ✅ Start containers
- ✅ Wait for PostgreSQL to be ready
- ✅ Generate Prisma Client
- ✅ Run database migrations

After installation, open `http://localhost:3000` (or `http://<raspberry-pi-ip>:3000` from network) to complete the initial setup.

### Manual Installation

If you prefer to install manually:

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd lab_booking
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file** and set the following variables:
   ```env
   DATABASE_URL="postgresql://lab_booking:lab_booking_password@postgres:5432/lab_booking?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   NODE_ENV="production"
   ```
   
   **Important**: Change `NEXTAUTH_SECRET` to a secure random string in production. You can generate one with:
   ```bash
   openssl rand -base64 32
   ```

4. **Update docker-compose.yml** (if needed):
   - Modify the `NEXTAUTH_URL` to match your server's domain/IP
   - Update database credentials if desired
   - Adjust port mappings if ports 3000 or 5432 are already in use

5. **Build and start the containers**:
   ```bash
   docker-compose up -d --build
   ```
   
   Or with Docker Compose v2:
   ```bash
   docker compose up -d --build
   ```

6. **Run database migrations**:
   ```bash
   docker-compose exec app npx prisma generate
   docker-compose exec app npx prisma migrate deploy
   ```

7. **Access the application**:
   - Application: `http://localhost:3000` (or your server IP)
   - PostgreSQL: `localhost:5432` (or your server IP:5432)

### Initial Setup

On first launch, navigate to `http://localhost:3000` and you'll be redirected to `/initial-setup` to create the first admin user. This step is required before you can use the application.

### Managing the Application

**View logs**:
```bash
docker-compose logs -f app
```

**View database logs**:
```bash
docker-compose logs -f postgres
```

**Stop the application**:
```bash
docker-compose down
```

**Stop and remove volumes** (⚠️ This will delete all data):
```bash
docker-compose down -v
```

**Restart the application**:
```bash
docker-compose restart
```

**Rebuild after code changes**:
```bash
docker-compose up -d --build
```

### Environment Variables

The following environment variables can be set in `.env` or directly in `docker-compose.yml`:

- `DATABASE_URL`: PostgreSQL connection string (default: uses postgres service)
- `NEXTAUTH_SECRET`: Secret key for NextAuth session encryption (⚠️ **REQUIRED** - change in production)
- `NEXTAUTH_URL`: Public URL of your application (e.g., `http://your-server-ip:3000`)
- `NODE_ENV`: Set to `production` for production deployments

### Raspberry Pi 5 Specific Notes

The Dockerfile and docker-compose.yml are optimized for ARM64 architecture (Raspberry Pi 5):

- Uses `--platform=linux/arm64` for all services
- PostgreSQL image uses ARM64 compatible version (postgres:16-alpine)
- Next.js build optimized for ARM64
- Installation script automatically detects Raspberry Pi and configures settings

**System Requirements for Raspberry Pi 5:**
- Docker and Docker Compose installed
- Sufficient disk space: **at least 5GB free** (for images and data)
- Sufficient RAM: **at least 2GB** (4GB+ recommended)
- Stable internet connection for initial image downloads

**Performance Notes:**
- First build may take 10-15 minutes on Raspberry Pi 5
- Subsequent builds are faster due to layer caching
- Application startup takes ~30-60 seconds
- Database operations may be slower than on x86 systems

**Network Access:**
- The installation script will detect your Raspberry Pi's IP address
- Update `NEXTAUTH_URL` in `.env` to use your Pi's IP for network access
- Access from other devices: `http://<raspberry-pi-ip>:3000`

**Troubleshooting on Raspberry Pi:**
- If build fails, ensure you have enough disk space: `df -h`
- Check available memory: `free -h`
- Increase swap if needed (recommended: 2GB swap)
- Monitor resource usage during build: `htop` or `top`

### Troubleshooting

**Port already in use**:
- Edit `docker-compose.yml` and change port mappings:
  ```yaml
  ports:
    - "3001:3000"  # Use port 3001 instead of 3000
  ```

**Database connection errors**:
- Ensure PostgreSQL container is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify DATABASE_URL matches docker-compose.yml credentials

**Application won't start**:
- Check application logs: `docker-compose logs app`
- Verify all environment variables are set correctly
- Ensure migrations have been run: `docker-compose exec app npx prisma migrate deploy`
- If you see Prisma client errors, regenerate: `docker-compose exec app npx prisma generate`

**Permission errors**:
- On Linux/Raspberry Pi, you may need to run with sudo or add your user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  # Then log out and back in
  ```

**Raspberry Pi specific issues**:
- If containers fail to start, check architecture: `uname -m` (should be `aarch64`)
- Verify Docker platform: `docker version` (should show ARM64)
- Check disk space: `df -h` (need at least 5GB free)
- Monitor memory during build: `free -h`

## Project Structure

```
/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── admin/             # Admin pages
│   │   ├── dashboard/         # User dashboard pages
│   │   ├── api/               # API routes
│   │   └── login/             # Login page
│   ├── components/
│   │   ├── ui/                # Shadcn UI components
│   │   └── admin/             # Admin-specific components
│   └── lib/
│       ├── auth.ts            # NextAuth configuration
│       ├── prisma.ts          # Prisma client
│       ├── booking-rules.ts   # Booking validation logic
│       └── utils.ts           # Utility functions
├── Dockerfile
├── docker-compose.yml
├── install.sh                 # Automated installation script
└── install.ps1                # Windows installation script
```

## API Routes

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

### Admin
- `GET/POST /api/admin/resources` - Manage lab resources
- `GET/PATCH/DELETE /api/admin/resources/[id]` - Resource operations
- `GET/POST /api/admin/lab-types` - Manage lab types
- `GET/PATCH/DELETE /api/admin/lab-types/[id]` - Lab type operations
- `GET/POST /api/admin/users` - Manage users
- `PATCH/DELETE /api/admin/users/[id]` - User operations
- `GET /api/admin/audit-logs` - View audit logs

### Bookings
- `GET/POST /api/bookings` - List and create bookings
- `GET/PATCH/DELETE /api/bookings/[id]` - Booking operations
- `POST /api/bookings/[id]/verify` - Verify booking password
- `POST /api/bookings/[id]/reset-password` - Reset booking password (admin)
- `GET /api/bookings/availability` - Get available time slots
- `GET /api/bookings/export` - Export bookings to CSV (admin)
- `GET /api/connection-info/[bookingId]` - Get connection details

## License

Private - Internal use only
