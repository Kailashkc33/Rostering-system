const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
      hourlyWage: 25.0,
    },
  });

  // Create a staff user for testing
  const staffPassword = await bcrypt.hash('staff123', 10);
  
  const staff = await prisma.user.upsert({
    where: { email: 'staff@test.com' },
    update: {},
    create: {
      email: 'staff@test.com',
      name: 'Staff User',
      password: staffPassword,
      role: 'STAFF',
      hourlyWage: 18.0,
    },
  });

  console.log('✅ Seed data created successfully!');
  console.log('👤 Admin login: admin@test.com / admin123');
  console.log('👤 Staff login: staff@test.com / staff123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });