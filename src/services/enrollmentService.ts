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

export interface GuestCoursePurchase {
  purchase_id: string;
  course_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  course_price: number;
  access_code: string;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
    description: string;
    instructor?: {
      first_name: string;
      last_name: string;
    };
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

  // Guest Course Purchase Methods
  async getAllGuestCoursePurchases(): Promise<GuestCoursePurchase[]> {
    try {
      const response = await api.get('/guest-course-purchases');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching guest course purchases:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch guest course purchases');
    }
  }

  async getGuestCoursePurchaseById(id: string): Promise<GuestCoursePurchase> {
    try {
      const response = await api.get(`/guest-course-purchases/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching guest course purchase:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch guest course purchase');
    }
  }

  async updateGuestCoursePurchaseStatus(
    id: string, 
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
    paymentMethod?: string,
    transactionId?: string
  ): Promise<GuestCoursePurchase> {
    try {
      const response = await api.put(`/guest-course-purchases/${id}/payment`, {
        paymentStatus,
        paymentMethod,
        transactionId
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating guest course purchase status:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update guest course purchase status');
    }
  }

  async sendGuestPurchaseCredentials(id: string): Promise<void> {
    try {
      const response = await api.post(`/guest-course-purchases/${id}/send-credentials`);
      return response.data;
    } catch (error: any) {
      console.error('Error sending guest purchase credentials:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to send guest purchase credentials');
    }
  }
}

const enrollmentService = new EnrollmentService();
export default enrollmentService;

