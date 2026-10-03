export interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  createdAt?: string
  updatedAt?: string
}

export interface AuthPayload {
  user: User
  token: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}
