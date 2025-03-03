import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

export async function GET() {
  try {
    // Try a simple query to test the connection
    const testConnection = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    
    // Also test a simple model query
    const userCount = await prisma.user.count();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      data: {
        rawQuery: testConnection,
        userCount,
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]{1,}@/, ':****@'), // Hide password
        nodeEnv: process.env.NODE_ENV,
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Database connection failed',
      error: error instanceof Error ? {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      } : 'Unknown error',
      config: {
        nodeEnv: process.env.NODE_ENV,
        hasDbUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
      }
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
