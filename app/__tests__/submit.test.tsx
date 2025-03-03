import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import SubmitFeaturePage from '../submit/page'
import { mockRouter } from '../../jest.setup'

// Mock the modules
jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('@/components/ui/use-toast')
jest.mock('@tanstack/react-query')

describe('SubmitFeaturePage', () => {
  const mockUseSession = useSession as jest.Mock
  const mockUseToast = useToast as jest.Mock
  const mockUseMutation = useMutation as jest.Mock
  const mockUseQueryClient = useQueryClient as jest.Mock
  
  const mockToast = jest.fn()
  const mockMutate = jest.fn()
  const mockInvalidateQueries = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockUseToast.mockReturnValue({ toast: mockToast })
    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })
    mockUseQueryClient.mockReturnValue({
      invalidateQueries: mockInvalidateQueries,
    })
  })

  it('redirects to login if user is not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
    })

    render(<SubmitFeaturePage />)
    
    expect(mockRouter.push).toHaveBeenCalledWith('/login?callbackUrl=/submit')
  })

  it('renders submission form when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    render(<SubmitFeaturePage />)
    
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })

    render(<SubmitFeaturePage />)
    
    const submitButton = screen.getByRole('button', { name: /submit feature request/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
    })
  })

  it('handles successful submission', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseMutation.mockImplementation((config) => ({
      mutate: (_values: unknown) => config.onSuccess(),
      isPending: false,
    }))

    render(<SubmitFeaturePage />)
    
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    fireEvent.change(titleInput, { target: { value: 'Test Feature' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Your feature request has been submitted.',
      })
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['features'] })
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })

  it('handles submission error', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseMutation.mockImplementation((config) => ({
      mutate: () => config.onError(new Error('Failed to submit')),
      isPending: false,
    }))

    render(<SubmitFeaturePage />)
    
    const titleInput = screen.getByLabelText(/title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const submitButton = screen.getByRole('button', { name: /submit/i })

    fireEvent.change(titleInput, { target: { value: 'Test Feature' } })
    fireEvent.change(descriptionInput, { target: { value: 'Test Description' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to submit',
        variant: 'destructive',
      })
    })
  })

  it('disables submit button while loading', () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: '1' } },
      status: 'authenticated',
    })

    mockUseMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<SubmitFeaturePage />)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(submitButton).toBeDisabled()
  })
}) 