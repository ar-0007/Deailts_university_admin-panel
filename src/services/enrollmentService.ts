// src/services/enrollmentService.ts
import api from './api';

export interface Enrollment {
  enrollment_id: string;
  user_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  rejection_reason?: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  course: {
    title: string;
    price: number;
    level: string;
  };
}

export interface CreateEnrollmentData {
  user_id: string;
  course_id: string;
}

class EnrollmentService {
  private baseURL = '/enrollments';

  async getAllEnrollments(status?: string): Promise<Enrollment[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(this.baseURL, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching enrollments:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch enrollments');
    }
  }

  async getEnrollmentById(id: string): Promise<Enrollment> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch enrollment');
    }
  }

  async createEnrollment(enrollmentData: CreateEnrollmentData): Promise<Enrollment> {
    try {
      const response = await api.post(this.baseURL, enrollmentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create enrollment');
    }
  }

  async approveEnrollment(id: string): Promise<Enrollment> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/approve`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error approving enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to approve enrollment');
    }
  }

  async rejectEnrollment(id: string, reason?: string): Promise<Enrollment> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/reject`, {
        rejection_reason: reason
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error rejecting enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to reject enrollment');
    }
  }

  async completeEnrollment(id: string): Promise<Enrollment> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/complete`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error completing enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to complete enrollment');
    }
  }

  async deleteEnrollment(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting enrollment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete enrollment');
    }
  }

  async getEnrollmentsByUser(userId: string): Promise<Enrollment[]> {
    try {
      const response = await api.get(`${this.baseURL}/user/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user enrollments:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch user enrollments');
    }
  }

  async getEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
    try {
      const response = await api.get(`${this.baseURL}/course/${courseId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching course enrollments:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch course enrollments');
    }
  }
}

const enrollmentService = new EnrollmentService();
export default enrollmentService;

