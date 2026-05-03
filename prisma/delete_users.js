const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Đang xoá 3 user SV02, GV01, GV02...");

  try {
    const result = await prisma.user.deleteMany({
      where: {
        id: {
          in: ['SV02', 'GV01', 'GV02']
        }
      }
    });

    console.log(`✅ Đã xoá thành công ${result.count} users!`);
  } catch (error) {
    console.error("Lỗi khi xoá users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
