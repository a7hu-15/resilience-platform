const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'local@test.com' },
    update: { id: 'local-test-user-id' },
    create: {
      id: 'local-test-user-id',
      email: 'local@test.com',
      passwordHash: 'fake-hash'
    }
  });
  console.log('User created');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
