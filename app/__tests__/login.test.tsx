import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import LoginPage from '../login/page'
import { mockRouter, mockSearchParams } from '../../jest.setup'

// Mock the modules
jest.mock('next-auth/react')
jest.mock('next/navigation')
jest.mock('@/components/ui/use-toast')

describe('LoginPage', () => {
  const mockSignIn = signIn as jest.Mock
  const mockUseToast = useToast as jest.Mock
  
  const mockToast = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchParams.get.mockReturnValue('/')
    mockUseToast.mockReturnValue({ toast: mockToast })
  })

  it('renders login form', () => {
    render(<LoginPage />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<LoginPage />)
    
    const submitButton = screen.getByRole('button', { name: /log in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('handles successful login', async () => {
    mockSignIn.mockResolvedValueOnce({ error: null })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        email: 'test@example.com',
        password: 'password123',
        redirect: false,
      })
      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })

  it('handles login error', async () => {
    mockSignIn.mockResolvedValueOnce({ error: 'Invalid credentials' })
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Invalid email or password',
        variant: 'destructive',
      })
    })
  })

  it('handles unexpected error during login', async () => {
    mockSignIn.mockRejectedValueOnce(new Error('Network error'))
    
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    })
  })

  it('disables submit button while loading', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /log in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Mock signIn to be a slow promise that we never resolve
    mockSignIn.mockImplementation(() => new Promise(() => {}))
    
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent('Logging in...')
    })
  })
}) 