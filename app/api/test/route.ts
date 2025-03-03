import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Enable detailed logging
});

export async function GET() {
  try {
    // Add null check for DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }
    console.log("Attempting DB connection to:", dbUrl.replace(/:\/\/.*@/, '://[REDACTED]@'));

    // Fetch database details
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        version() AS postgres_version, 
        current_database() AS database_name, 
        inet_server_addr() AS server_ip,
        inet_server_port() AS server_port
    `;

    console.log("✅ Connected to Database Server:", dbInfo);

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      databaseInfo: dbInfo 
    }, { status: 200 });
    
  } catch (error) {
    console.error('❌ Database connection error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
