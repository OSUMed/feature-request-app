const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminEmail = 'admin@example.com'
  
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (!existingAdmin) {
    const hashedPassword = await hash('admin123', 10) // You should change this password
    
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
      },
    })
    
    console.log('Admin user created successfully')
  } else {
    console.log('Admin user already exists')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 