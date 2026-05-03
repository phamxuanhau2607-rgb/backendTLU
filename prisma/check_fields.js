require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const dmmf = prisma._baseDmmf;
  const userModel = dmmf.datamodel.models.find(m => m.name === 'User');
  const field = userModel.fields.find(f => f.name === 'isOnline');
  console.log('isOnline in DMMF:', field ? 'FOUND' : 'NOT FOUND');
  if (field) {
    console.log('Field details:', JSON.stringify(field, null, 2));
  }
}

main().catch(console.error).finally(() => {
  pool.end();
  process.exit(0);
});
