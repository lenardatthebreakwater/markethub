const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@markethub.local' },
    update: {},
    create: {
      email: 'admin@markethub.local',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create vendor user with complete profile
  const vendorPassword = await bcrypt.hash('vendor123456', 10);
  const vendor = await prisma.user.upsert({
    where: { email: 'vendor@markethub.local' },
    update: {},
    create: {
      email: 'vendor@markethub.local',
      password: vendorPassword,
      name: 'Juan dela Cruz',
      role: 'VENDOR',
      vendorProfile: {
        create: {
          businessName: 'Dela Cruz Fresh Produce',
          businessType: 'Vegetables & Fruits',
          ownerName: 'Juan dela Cruz',
          contactNumber: '09171234567',
          alternateContactNumber: '09281234567',
          address: '123 Rizal Street',
          barangay: 'Barangay Isok I',
          municipality: 'Boac',
          province: 'Marinduque',
          zipCode: '4900',
          businessPermitNumber: 'BP-2024-00123',
          tinNumber: '123-456-789-000',
          status: 'APPROVED',
          approvalDate: new Date(),
        },
      },
    },
  });
  console.log('✅ Vendor user created:', vendor.email);

  console.log('\n✨ Database seed completed successfully!');
  console.log('\nDemo Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:');
  console.log('  Email: admin@markethub.local');
  console.log('  Password: admin123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Vendor:');
  console.log('  Email: vendor@markethub.local');
  console.log('  Password: vendor123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });