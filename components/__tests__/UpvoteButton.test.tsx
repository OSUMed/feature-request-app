import { render, screen, fireEvent } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { UpvoteButton } from '../upvote-button'
import { mockRouter } from '../../jest.setup'

// Mock the modules
const mockUseSession = useSession as jest.Mock
const mockUseQuery = useQuery as jest.Mock
const mockUseMutation = useMutation as jest.Mock
const mockUseQueryClient = useQueryClient as jest.Mock
const mockUseToast = useToast as jest.Mock

describe('UpvoteButton', () => {
  const mockToast = jest.fn()
  const mockInvalidateQueries = jest.fn()

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Setup default mock implementations
    mockUseToast.mockReturnValue({ toast: mockToast })
    mockUseQueryClient.mockReturnValue({ invalidateQueries: mockInvalidateQueries })
    mockUseQuery.mockReturnValue({
      data: { upvoted: false },
      isLoading: false,
    })
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    })
  })

  it('renders with initial count', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows upvoted state when user has upvoted', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseQuery.mockReturnValue({
      data: { upvoted: true },
      isLoading: false,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    
    const button = screen.getByRole('button')
    // Check for the presence of bg-primary class which indicates the upvoted state
    expect(button).toHaveClass('bg-primary')
  })

  it('handles upvote when user is authenticated', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    const mockMutate = jest.fn()
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockMutate).toHaveBeenCalled()
  })

  it('redirects to login when unauthenticated user tries to upvote', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const mockMutate = jest.fn().mockImplementation(() => {
      mockRouter.push('/login')
    })

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockMutate).toHaveBeenCalled()
    expect(mockRouter.push).toHaveBeenCalledWith('/login')
  })

  it('disables button while upvote is in progress', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
}) 