import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'finishthisidea_token';
const USER_KEY = 'finishthisidea_user';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  tier?: string;
  role?: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, credentials);
      const { token, user } = response.data;
      
      this.setToken(token);
      this.setUser(user);
      
      // Set default auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { token, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, userData);
      const { token, user } = response.data;
      
      this.setToken(token);
      this.setUser(user);
      
      // Set default auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { token, user };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if available
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (error) {
      // Ignore errors from logout endpoint
    } finally {
      this.removeToken();
      this.removeUser();
      delete axios.defaults.headers.common['Authorization'];
    }
  }

  async refreshToken(): Promise<string> {
    try {
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {}, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      
      const { token } = response.data;
      this.setToken(token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async verifyToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await axios.get(`${API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      return response.data.valid === true;
    } catch (error) {
      return false;
    }
  }

  async updateProfile(updates: {
    displayName?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    try {
      const response = await axios.put(`${API_URL}/api/auth/profile`, updates, {
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
        },
      });
      
      const updatedUser = response.data.user;
      this.setUser(updatedUser);
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Initialize auth state on app load
  initializeAuth(): void {
    const token = this.getToken();
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
}

export const authService = new AuthService();

// Initialize auth on import
authService.initializeAuth();