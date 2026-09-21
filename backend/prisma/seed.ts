import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 [Prisma Seed] Đang khởi tạo dữ liệu mặc định cho DalatAgri...\n');

  // 1. Cấu hình email Super Admin
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'nguyenlequoclam@gmail.com';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123456';
  const adminFullName = 'Nguyễn Lê Quốc Lâm (Admin)';
  const adminPhone = '0901234567';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 2. Sử dụng upsert: Nếu tài khoản đã có thì giữ nguyên mật khẩu cũ của họ và nâng quyền ADMIN
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  let adminUser;
  if (existingUser) {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: UserRole.ADMIN,
        approvalStatus: 'APPROVED',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    console.log(`\n✅ Đã nâng cấp tài khoản hiện có "${adminEmail}" thành ADMIN (giữ nguyên mật khẩu cũ của bạn).`);
  } else {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        phone: adminPhone,
        fullName: adminFullName,
        passwordHash: passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
        approvalStatus: 'APPROVED',
        emailVerified: true,
      },
    });
    console.log(`\n✅ Đã tạo mới tài khoản ADMIN "${adminEmail}" với mật khẩu mặc định: ${adminPassword}`);
  }

  console.log('========================================================');
  console.log(`📧 Email       : ${adminUser.email}`);
  console.log(`👤 Họ và tên   : ${adminUser.fullName}`);
  console.log(`🛡️ Vai trò     : ${adminUser.role}`);
  console.log(`✨ Trạng thái  : ${adminUser.approvalStatus}`);
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi chạy Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
