import '@testing-library/jest-dom'

// Mock Next.js router
const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
}

const mockSearchParams = {
  get: jest.fn(() => '/'),
}

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
  })),
}))

// Mock toast
jest.mock('@/components/ui/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
  })),
}))

// Export mocks for direct access in tests
export { mockRouter, mockSearchParams }

// Suppress console errors during tests
global.console.error = jest.fn()

// Mock fetch globally
global.fetch = jest.fn()

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
}) 