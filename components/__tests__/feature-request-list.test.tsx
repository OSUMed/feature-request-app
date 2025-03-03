import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useQuery } from '@tanstack/react-query'
import { FeatureRequestList } from '../feature-request-list'

// Mock the modules
jest.mock('@tanstack/react-query')
jest.mock('@/components/upvote-button', () => ({
  UpvoteButton: ({ featureId, initialCount }: { featureId: string; initialCount: number }) => (
    <button>Upvotes: {initialCount}</button>
  ),
}))

const mockUseQuery = useQuery as jest.Mock

describe('FeatureRequestList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      isLoading: true,
      data: null,
    })

    render(<FeatureRequestList />)
    // Check for skeleton components
    const skeletons = screen.getAllByTestId('skeleton-card')
    expect(skeletons).toHaveLength(3)
  })

  it('shows error state', () => {
    mockUseQuery.mockReturnValue({
      isError: true,
      error: new Error('Failed to fetch'),
      data: null,
    })

    render(<FeatureRequestList />)
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })

  it('renders feature requests', () => {
    const mockFeatures = [
      {
        id: '1',
        title: 'Test Feature 1',
        description: 'Description 1',
        status: 'pending',
        createdAt: new Date().toISOString(),
        user: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        _count: {
          upvotes: 5,
        },
      },
      {
        id: '2',
        title: 'Test Feature 2',
        description: 'Description 2',
        status: 'planned',
        createdAt: new Date().toISOString(),
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        _count: {
          upvotes: 3,
        },
      },
    ]

    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: mockFeatures,
    })

    render(<FeatureRequestList />)

    expect(screen.getByText('Test Feature 1')).toBeInTheDocument()
    expect(screen.getByText('Description 1')).toBeInTheDocument()
    expect(screen.getByText('Test Feature 2')).toBeInTheDocument()
    expect(screen.getByText('Description 2')).toBeInTheDocument()
    expect(screen.getByText('Upvotes: 5')).toBeInTheDocument()
    expect(screen.getByText('Upvotes: 3')).toBeInTheDocument()
  })

  it('shows empty state when no features', () => {
    mockUseQuery.mockReturnValue({
      isLoading: false,
      data: [],
    })

    render(<FeatureRequestList />)
    expect(screen.getByText(/no feature requests/i)).toBeInTheDocument()
  })
}) 