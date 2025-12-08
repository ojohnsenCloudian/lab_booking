# Lab Booking System

A web application that allows users to book lab time from available slots and get granted access to lab resources. Built with Next.js 15, PostgreSQL, Docker, and modern web technologies.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker** (version 20.10 or later)
- **Docker Compose** (version 2.0 or later)

### Verifying Installation

To verify that Docker and Docker Compose are installed correctly, run:

```bash
docker --version
docker-compose --version
```

Both commands should output version information. If not, please install Docker Desktop or Docker Engine with Docker Compose.

## Quick Start

Follow these steps to get the application running:

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd lab_booking
```

### Step 2: Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit the `.env` file and update the following variables:

- `NEXTAUTH_SECRET`: Generate a secure random string (minimum 32 characters). You can generate one using:
  ```bash
  openssl rand -base64 32
  ```
- `NEXTAUTH_URL`: Set to `http://localhost:3000` for local development
- `POSTGRES_PASSWORD`: Change the default password for production use
- `DATABASE_URL`: Update if you changed the PostgreSQL credentials

### Step 3: Start the Application

Start all services using Docker Compose:

```bash
docker-compose up
```

Or run in detached mode (background):

```bash
docker-compose up -d
```

The first time you run this command, Docker will:
1. Build the Next.js application
2. Pull the PostgreSQL image
3. Start the database service
4. Run database migrations (creates all tables)
5. Seed the database with initial data (resources, booking types, templates)
6. Start the application server
7. **You'll be redirected to `/initial-setup` to create the first admin user**

This process may take a few minutes on the first run.

**Important**: The admin user is **not** created automatically. You must complete the initial setup process at `/initial-setup` after the application starts.

### Step 4: Access the Application

Once the services are running, you can access the application at:

- **Application**: http://localhost:3000
- **Database**: localhost:5432 (if you need direct database access)

When you first access the application, you'll be automatically redirected based on the setup status:

- **No admin exists**: Redirected to `/initial-setup` page
- **Admin exists**: Redirected to `/login` page

### Step 5: Initial Setup

**First-Time Setup:**

On first startup, the application will detect that no admin user exists and automatically redirect you to the initial setup page.

**Create the First Admin User:**

1. You'll be automatically redirected to http://localhost:3000/initial-setup
   - If not redirected, navigate to this URL manually
2. Enter the admin email address (e.g., `admin@yourcompany.com`)
3. Enter a secure password (minimum 8 characters)
4. Confirm the password by entering it again
5. Click "Create Admin User"

**What Happens Next:**

- The admin user is created in the database
- You'll see a success message
- You'll be automatically redirected to the login page (`/login`)
- Log in with the credentials you just created
- You'll have full admin access to manage the system

**Important Notes**: 
- ✅ The initial setup page (`/initial-setup`) is **only accessible when no admin user exists**
- ✅ If an admin already exists, attempting to access `/initial-setup` will redirect you to the login page
- ✅ After creating the admin, you can create additional users through Admin → Users
- ✅ There is **no public registration** - all users must be created by an admin
- ✅ For development/testing: To reset and see the setup page again, delete all users from the database and restart

## Detailed Setup Steps

### Database Migrations

Database migrations run automatically when you start the application with `docker-compose up`. The migrations create all necessary tables and relationships.

If you need to run migrations manually:

```bash
docker-compose exec app npx prisma migrate deploy
```

### Seeding the Database

The database is automatically seeded on first startup with:
- Sample lab resources
- Sample booking types
- Default connection templates

**Note**: The admin user is NOT created automatically via seed script. You must use the `/initial-setup` page to create the first admin user.

To seed manually:

```bash
docker-compose exec app npm run db:seed
```

### Stopping the Application

To stop all services:

```bash
docker-compose down
```

To stop and remove volumes (this will delete the database):

```bash
docker-compose down -v
```

**Warning**: Removing volumes will delete all data!

## Docker Commands Reference

### Starting Services

```bash
# Start all services in foreground
docker-compose up

# Start all services in background (detached mode)
docker-compose up -d

# Start specific services only
docker-compose up postgres app
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v

# Stop without removing containers
docker-compose stop
```

### Viewing Logs

```bash
# View logs from all services
docker-compose logs

# View logs from specific service
docker-compose logs app
docker-compose logs postgres

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart app
```

### Executing Commands

```bash
# Run commands in the app container
docker-compose exec app <command>

# Examples:
docker-compose exec app npm run db:migrate
docker-compose exec app npx prisma studio
docker-compose exec app sh
```

### Rebuilding the Application

If you make changes to the code or dependencies:

```bash
# Rebuild and restart
docker-compose up --build

# Rebuild specific service
docker-compose build app
docker-compose up -d app
```

## Access Information

### Application URLs

- **Web Application**: http://localhost:3000
- **API Endpoints**: http://localhost:3000/api/*

### Database Connection

- **Host**: localhost (from host machine) or `postgres` (from app container)
- **Port**: 5432
- **Database**: lab_booking
- **Username**: labbooking (default)
- **Password**: labbooking123 (default - change in production!)

### Prisma Studio

To access Prisma Studio (database GUI):

```bash
docker-compose exec app npx prisma studio
```

Then open http://localhost:5555 in your browser.

## Troubleshooting

### Port Already in Use

If port 3000 or 5432 is already in use:

1. Change the ports in `docker-compose.yml`:
   ```yaml
   ports:
     - "3001:3000"  # Change 3000 to 3001
   ```

2. Or stop the service using the port:
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill <PID>
   ```

### Database Connection Errors

If you see database connection errors:

1. Ensure PostgreSQL container is healthy:
   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

3. Wait for database to be ready before starting app:
   ```bash
   docker-compose up postgres
   # Wait for "database system is ready" message
   docker-compose up app
   ```

### Application Won't Start

1. Check application logs:
   ```bash
   docker-compose logs app
   ```

2. Rebuild the application:
   ```bash
   docker-compose build --no-cache app
   docker-compose up app
   ```

3. Verify environment variables:
   ```bash
   docker-compose exec app env | grep -E "DATABASE_URL|NEXTAUTH"
   ```

### Migration Errors

If migrations fail:

1. Reset the database (WARNING: deletes all data including admin user):
   ```bash
   docker-compose down -v
   docker-compose up -d postgres
   docker-compose exec app npx prisma migrate deploy
   ```
   **Note**: After resetting, you'll need to go through the initial setup process again at `/initial-setup`

2. Check migration status:
   ```bash
   docker-compose exec app npx prisma migrate status
   ```

### Initial Setup Issues

If you're having trouble with the initial setup:

1. **Can't access `/initial-setup` page:**
   - Check if an admin user already exists: `docker-compose exec app npx prisma studio`
   - If admin exists, use the login page instead
   - To reset: Delete all users from the database and restart

2. **Setup page shows error:**
   - Check application logs: `docker-compose logs app`
   - Verify database is running: `docker-compose ps`
   - Ensure migrations completed: `docker-compose exec app npx prisma migrate status`

3. **Want to reset admin user:**
   ```bash
   # Connect to database
   docker-compose exec postgres psql -U labbooking -d lab_booking
   
   # Delete all users (WARNING: This deletes all users!)
   DELETE FROM users;
   
   # Exit psql
   \q
   
   # Restart application - you'll be redirected to /initial-setup
   docker-compose restart app
   ```

### Container Won't Stop

If containers won't stop gracefully:

```bash
# Force stop
docker-compose kill

# Remove containers
docker-compose rm -f
```

## Development vs Production

### Development Mode

For local development, you can run the application without Docker:

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`

3. Start PostgreSQL (or use Docker for just the database):
   ```bash
   docker-compose up -d postgres
   ```

4. Run migrations:
   ```bash
   npm run db:migrate
   ```

5. Seed the database (optional, creates sample data):
   ```bash
   npm run db:seed
   ```

6. Start development server:
   ```bash
   npm run dev
   ```

7. **Complete initial setup**: Navigate to http://localhost:3000/initial-setup to create the first admin user (if no admin exists)

### Production Deployment

For production deployment:

1. **Update Environment Variables**:
   - Use strong, unique passwords
   - Set `NEXTAUTH_SECRET` to a secure random value
   - Set `NEXTAUTH_URL` to your production domain
   - Set `NODE_ENV=production`

2. **Security Considerations**:
   - Change all default passwords
   - Use environment variables for secrets (never commit `.env`)
   - Enable HTTPS (use reverse proxy like Nginx)
   - Set up proper firewall rules
   - Regularly update dependencies

3. **Database Backups**:
   ```bash
   # Backup database
   docker-compose exec postgres pg_dump -U labbooking lab_booking > backup.sql

   # Restore database
   docker-compose exec -T postgres psql -U labbooking lab_booking < backup.sql
   ```

4. **Monitoring**:
   - Set up log aggregation
   - Monitor container health
   - Set up database backups
   - Monitor disk space for volumes

## User Management

### Admin User Setup

The admin user **must** be created through the initial setup page (`/initial-setup`) on first installation. This is a one-time setup process that occurs automatically when you first start the application.

**Initial Setup Flow:**

```
1. Start Application (docker-compose up)
   ↓
2. Database migrations run automatically
   ↓
3. Database seeding runs (creates sample data)
   ↓
4. Application checks for admin user
   ↓
5. No admin found → Redirect to /initial-setup
   ↓
6. Create admin user via setup form
   ↓
7. Admin created → Redirect to /login
   ↓
8. Log in with admin credentials
   ↓
9. Access admin dashboard
```

**Setup Page Protection:**

- ✅ **Accessible**: Only when no admin user exists in the database
- ❌ **Blocked**: If an admin user already exists (redirects to `/login`)
- 🔒 **Secure**: Prevents multiple admin creation attempts
- 🔄 **Automatic**: Redirects happen automatically based on admin status

**After Initial Setup:**

Once the admin user is created, the initial setup page becomes inaccessible. All future user management happens through:

- **Admin Panel** → **Users** section
- Admin can create, edit, and delete users
- Admin can assign roles (USER or ADMIN)

### Creating Users

**Important**: There is no public registration page. All users must be created by an admin:

1. Log in as an admin user
2. Navigate to Admin → Users
3. Click "Add User" to create a new user account
4. Set the user's email, password, and role (USER or ADMIN)

### User Roles

- **ADMIN**: Can manage all resources, booking types, templates, users, and view all bookings
- **USER**: Can create bookings, view their own bookings, and access their assigned lab resources

## Email Configuration

**Note**: This application does not send any emails. All notifications and information are displayed within the application interface.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## Support

For issues or questions, please check the troubleshooting section above or contact the development team.

