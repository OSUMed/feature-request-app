import { createFeatureRequest, getFeatureRequests } from '../core'

// Mock the prisma module
jest.mock('@/lib/prisma')

// Import the mocked module
const prisma = jest.requireMock('@/lib/prisma').default

describe('Feature request core logic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createFeatureRequest', () => {
    it('creates a new feature request when authenticated', async () => {
      const mockSession = {
        user: { 
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        },
      }

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

      const result = await createFeatureRequest(mockSession, newFeature)

      expect(result.status).toBe(201)
      expect(result.data).toEqual(mockCreatedFeature)
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
      const result = await createFeatureRequest(null, {
        title: 'New Feature',
        description: 'New Description',
      })

      expect(result.status).toBe(401)
      expect(result.data).toEqual({ error: 'You must be logged in to submit a feature request' })
      expect(prisma.featureRequest.create).not.toHaveBeenCalled()
    })

    it('returns 400 for invalid input', async () => {
      const mockSession = {
        user: { 
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        },
      }

      const result = await createFeatureRequest(mockSession, {
        title: '', // Invalid - empty title
        description: 'Description',
      })

      expect(result.status).toBe(400)
      expect(result.data).toHaveProperty('error')
      expect(prisma.featureRequest.create).not.toHaveBeenCalled()
    })
  })

  describe('getFeatureRequests', () => {
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

      const result = await getFeatureRequests()

      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockFeatures)
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

    it('returns 500 when database query fails', async () => {
      ;(prisma.featureRequest.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const result = await getFeatureRequests()

      expect(result.status).toBe(500)
      expect(result.data).toEqual({ error: 'Failed to fetch feature requests' })
    })
  })
}) 