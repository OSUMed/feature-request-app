import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { GET, POST } from '../route'
import prisma from '@/lib/prisma'

// Mock the modules
jest.mock('next-auth/next')
jest.mock('@/lib/prisma')

// Mock NextRequest
const mockNextRequest = (method: string, body?: any) => {
  return new NextRequest(new Request('http://localhost:3000/api/features', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  }))
}

describe('Feature API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/features', () => {
    it('returns feature requests', async () => {
      const mockFeatures = [
        { 
          id: '1', 
          title: 'Feature 1', 
          description: 'Description 1',
          user: { name: 'Test User', email: 'test@example.com' },
          _count: { upvotes: 5 }
        },
        { 
          id: '2', 
          title: 'Feature 2', 
          description: 'Description 2',
          user: { name: 'Test User 2', email: 'test2@example.com' },
          _count: { upvotes: 3 }
        },
      ]

      ;(prisma.featureRequest.findMany as jest.Mock).mockResolvedValue(mockFeatures)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockFeatures)
      expect(prisma.featureRequest.findMany).toHaveBeenCalledWith({
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
            },
          },
        },
        orderBy: {
          upvotes: {
            _count: 'desc',
          },
        },
      })
    })
  })

  describe('POST /api/features', () => {
    it('creates a new feature request when authenticated', async () => {
      const mockSession = {
        user: { 
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        },
      }
      ;(getServerSession as jest.Mock).mockResolvedValue(mockSession)

      const newFeature = {
        title: 'New Feature',
        description: 'New Description',
      }

      const mockCreatedFeature = {
        id: '3',
        ...newFeature,
        userId: 'user123',
        user: { name: 'Test User', email: 'test@example.com' },
        _count: { upvotes: 0 }
      }

      ;(prisma.featureRequest.create as jest.Mock).mockResolvedValue(mockCreatedFeature)

      const request = mockNextRequest('POST', newFeature)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCreatedFeature)
      expect(prisma.featureRequest.create).toHaveBeenCalledWith({
        data: {
          ...newFeature,
          userId: mockSession.user.id,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              upvotes: true,
            },
          },
        },
      })
    })

    it('returns 401 when not authenticated', async () => {
      ;(getServerSession as jest.Mock).mockResolvedValue(null)

      const request = mockNextRequest('POST', {
        title: 'New Feature',
        description: 'New Description',
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })
  })
})