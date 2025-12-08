import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Only create admin if no admin exists (initial setup page handles admin creation)
  const adminCount = await prisma.user.count({
    where: { role: 'ADMIN' },
  });

  if (adminCount === 0) {
    // Create admin user only if none exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });
    console.log('Created admin user:', admin.email);
    console.log('Note: Use /initial-setup page for initial admin setup in production');
  } else {
    console.log('Admin user already exists, skipping admin creation');
  }

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: userPassword,
      role: 'USER',
    },
  });
  console.log('Created regular user:', user.email);

  // Create lab resources
  const resource1 = await prisma.labResource.upsert({
    where: { id: 'resource-1' },
    update: {},
    create: {
      id: 'resource-1',
      name: 'Lab Server 1',
      description: 'Primary development lab server',
      isActive: true,
    },
  });

  const resource2 = await prisma.labResource.upsert({
    where: { id: 'resource-2' },
    update: {},
    create: {
      id: 'resource-2',
      name: 'Lab Server 2',
      description: 'Secondary development lab server',
      isActive: true,
    },
  });

  const resource3 = await prisma.labResource.upsert({
    where: { id: 'resource-3' },
    update: {},
    create: {
      id: 'resource-3',
      name: 'Testing Lab Server',
      description: 'Dedicated testing environment',
      isActive: true,
    },
  });

  console.log('Created lab resources');

  // Create booking types
  const devType = await prisma.bookingType.upsert({
    where: { id: 'booking-type-dev' },
    update: {},
    create: {
      id: 'booking-type-dev',
      name: 'Development Lab',
      description: 'Development environment access',
      isActive: true,
    },
  });

  const testType = await prisma.bookingType.upsert({
    where: { id: 'booking-type-test' },
    update: {},
    create: {
      id: 'booking-type-test',
      name: 'Testing Lab',
      description: 'Testing environment access',
      isActive: true,
    },
  });

  console.log('Created booking types');

  // Map resources to booking types
  await prisma.bookingTypeResource.upsert({
    where: {
      bookingTypeId_labResourceId: {
        bookingTypeId: devType.id,
        labResourceId: resource1.id,
      },
    },
    update: {},
    create: {
      bookingTypeId: devType.id,
      labResourceId: resource1.id,
    },
  });

  await prisma.bookingTypeResource.upsert({
    where: {
      bookingTypeId_labResourceId: {
        bookingTypeId: devType.id,
        labResourceId: resource2.id,
      },
    },
    update: {},
    create: {
      bookingTypeId: devType.id,
      labResourceId: resource2.id,
    },
  });

  await prisma.bookingTypeResource.upsert({
    where: {
      bookingTypeId_labResourceId: {
        bookingTypeId: testType.id,
        labResourceId: resource3.id,
      },
    },
    update: {},
    create: {
      bookingTypeId: testType.id,
      labResourceId: resource3.id,
    },
  });

  console.log('Mapped resources to booking types');

  // Create connection templates
  const sshTemplate = await prisma.connectionTemplate.upsert({
    where: { id: 'template-ssh' },
    update: {},
    create: {
      id: 'template-ssh',
      name: 'SSH Access',
      type: 'SSH',
      bookingTypeId: devType.id,
      isActive: true,
      fields: {
        host: { type: 'string', label: 'Host', required: true },
        port: { type: 'number', label: 'Port', default: 22 },
        username: { type: 'string', label: 'Username', required: true },
        password: { type: 'string', label: 'Password', required: true },
      },
    },
  });

  const webTemplate = await prisma.connectionTemplate.upsert({
    where: { id: 'template-web' },
    update: {},
    create: {
      id: 'template-web',
      name: 'Web Access',
      type: 'WEB_URL',
      bookingTypeId: testType.id,
      isActive: true,
      fields: {
        url: { type: 'string', label: 'URL', required: true },
        username: { type: 'string', label: 'Username', required: true },
        password: { type: 'string', label: 'Password', required: true },
      },
    },
  });

  console.log('Created connection templates');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

