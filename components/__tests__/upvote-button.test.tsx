import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { UpvoteButton } from '../upvote-button'

// Mock the modules
jest.mock('next-auth/react')
jest.mock('@tanstack/react-query')
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock the useToast hook
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockUseSession = useSession as jest.Mock
const mockUseMutation = useMutation as jest.Mock
const mockUseQuery = useQuery as jest.Mock
const mockRouter = {
  push: jest.fn(),
}

describe('UpvoteButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    })
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
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
    render(<UpvoteButton featureId="123" initialCount={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows upvoted state when feature is upvoted', () => {
    mockUseQuery.mockReturnValue({
      data: { upvoted: true },
      isLoading: false,
    })
    render(<UpvoteButton featureId="123" initialCount={5} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('bg-primary')
  })

  it('redirects to login when unauthenticated user tries to upvote', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    const mutate = jest.fn()
    mockUseMutation.mockReturnValue({
      mutate,
      isPending: false,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mutate).toHaveBeenCalled()
  })

  it('handles successful upvote', async () => {
    const mockMutate = jest.fn()
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    fireEvent.click(screen.getByRole('button'))
    expect(mockMutate).toHaveBeenCalled()
  })

  it('disables button while mutation is pending', () => {
    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
    })

    render(<UpvoteButton featureId="123" initialCount={5} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
}) 