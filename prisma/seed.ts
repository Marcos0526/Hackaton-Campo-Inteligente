import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding data...")
  // Implementation of 9 test profiles will follow.
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
