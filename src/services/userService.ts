import api from './api';
import type { User } from '../types';

export interface UserFilters {
  search?: string;
  status?: 'all' | 'active' | 'blocked' | 'pending';
  role?: 'all' | 'STUDENT' | 'ADMIN'; // Removed MENTOR
  page?: number;
  limit?: number;
}

export interface UserResponse {
  success: boolean;
  data: {
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: string;
}

export interface CreateUserData {
  firstName: string;
  lastName: string;
  email: string;
  // Remove password field - backend generates temporary password
  role: 'STUDENT' | 'ADMIN';
}

export interface UpdateUserData {
  firstName?: string;  // Changed from first_name
  lastName?: string;   // Changed from last_name
  email?: string;
  role?: 'STUDENT' | 'ADMIN';
}

export const userService = {
  // Get all users with filtering
  async getUsers(filters: UserFilters = {}): Promise<UserResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') {
      // Convert frontend status to backend is_active filter
      if (filters.status === 'active') {
        params.append('is_active', 'true');
      } else if (filters.status === 'blocked') {
        params.append('is_active', 'false');
      }
      // Note: 'pending' status doesn't exist in backend, so we skip it
    }
    if (filters.role && filters.role !== 'all') params.append('role', filters.role);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await api.get(`/users?${params.toString()}`);
    
    // Transform backend data to include status field
    if (response.data.success && response.data.data) {
      response.data.data = response.data.data.map((user: any) => ({
        ...user,
        status: user.is_active ? 'active' : 'blocked' // Transform is_active to status
      }));
    }
    
    return response.data;
  },

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Get user by ID
  async getUserById(id: string) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(userData: CreateUserData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(id: string, userData: UpdateUserData) {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Update user status - fix the API call
  async updateUserStatus(id: string, status: 'active' | 'blocked' | 'pending') {
    // Convert frontend status to backend isActive boolean
    const isActive = status === 'active';
    const response = await api.put(`/users/${id}/status`, { isActive });
    return response.data;
  },

  // Delete user
  async deleteUser(id: string) {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Get user statistics
  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  }
};

