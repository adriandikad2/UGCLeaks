/**
 * Authentication utilities for user sign in/up
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'editor' | 'owner';
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: User;
}

/**
 * Sign up a new user
 */
export async function signup(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  return response.json();
}

/**
 * Sign in a user
 */
export async function signin(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signin failed');
  }

  const data = await response.json();
  
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
  
  return data;
}

/**
 * Sign out the current user
 */
export async function signout(): Promise<void> {
  const token = getToken();
  
  if (token) {
    try {
      await fetch(`${API_BASE_URL}/auth/signout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error during signout:', error);
    }
  }
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

/**
 * Get the current user
 */
export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Get the authentication token
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return localStorage.getItem('token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Check if user has required access level
 */
export function hasAccess(requiredRole: string = 'editor'): boolean {
  const user = getUser();
  if (!user) return false;
  
  const roles = ['user', 'editor', 'owner'];
  const userRoleIndex = roles.indexOf(user.role);
  const requiredRoleIndex = roles.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Get current user role
 */
export function getUserRole(): string | null {
  const user = getUser();
  return user?.role || null;
}
