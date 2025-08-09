import api from './api';
import axios from 'axios';
import type { DashboardStats } from '../types';

export interface DashboardData {
  stats: DashboardStats;
  recentEnrollments: any[];
  upcomingMentorshipSessions: any[];
  revenueOverview: { month: string; revenue: number }[];
}

class DashboardService {
  async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats; message: string }> {
    try {
      const response = await api.get('/dashboard/stats');
      // Backend returns {success: true, data: stats, message: '...'}
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch dashboard stats');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      // Don't return default zeros - let the error propagate so we can see what's wrong
      throw error;
    }
  }

  async getRecentEnrollments(limit: number = 5): Promise<{ success: boolean; data: any[]; message: string }> {
    try {
      const response = await api.get(`/dashboard/recent-enrollments?limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        message: 'Recent enrollments fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching recent enrollments:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch recent enrollments'
      };
    }
  }

  async getRecentAssignments(limit: number = 5): Promise<{ success: boolean; data: any[]; message: string }> {
    try {
      const response = await api.get(`/assignments`);
      // Sort by created_at and limit the results
      const assignments = response.data.data || [];
      const recentAssignments = assignments
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      
      return {
        success: true,
        data: recentAssignments,
        message: 'Recent assignments fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching recent assignments:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch recent assignments'
      };
    }
  }

  async getUpcomingMentorshipSessions(limit: number = 5): Promise<{ success: boolean; data: any[]; message: string }> {
    try {
      // Make request without authentication for public endpoint
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/public/mentorship/upcoming-sessions?limit=${limit}`);
      return {
        success: true,
        data: response.data.data || [],
        message: 'Upcoming mentorship sessions fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching upcoming mentorship sessions:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch upcoming mentorship sessions'
      };
    }
  }

  async getRevenueOverview(months: number = 6): Promise<{ success: boolean; data: { month: string; revenue: number }[]; message: string }> {
    try {
      const response = await api.get(`/dashboard/revenue-overview?months=${months}`);
      return {
        success: true,
        data: response.data.data || [],
        message: 'Revenue overview fetched successfully'
      };
    } catch (error: any) {
      console.error('Error fetching revenue overview:', error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Failed to fetch revenue overview'
      };
    }
  }
}

export default new DashboardService();