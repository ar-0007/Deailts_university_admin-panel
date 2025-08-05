// src/services/guestBookingService.ts
import api from './api';

export interface GuestBooking {
  guest_booking_id: string;
  instructor_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_date: string;
  preferred_time: string;
  message?: string;
  preferred_topics: string[];
  session_price: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  payment_method?: string;
  transaction_id?: string;
  meeting_link?: string;
  booking_status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  updated_at: string;
  instructor?: {
    instructor_id: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_image_url?: string;
    hourly_rate: number;
  };
}

export interface UpdateBookingStatusData {
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string;
}

export interface UpdatePaymentStatusData {
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  transactionId?: string;
}

class GuestBookingService {
  private baseURL = '/guest-bookings';

  async getAllBookings(params?: {
    instructorId?: string;
    paymentStatus?: string;
    bookingStatus?: string;
  }): Promise<GuestBooking[]> {
    try {
      const response = await api.get(this.baseURL, { params });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching guest bookings:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch guest bookings');
    }
  }

  async getBookingById(id: string): Promise<GuestBooking> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching guest booking:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch guest booking');
    }
  }

  async updateBookingStatus(id: string, statusData: UpdateBookingStatusData): Promise<GuestBooking> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/status`, statusData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update booking status');
    }
  }

  async updatePaymentStatus(id: string, paymentData: UpdatePaymentStatusData): Promise<GuestBooking> {
    try {
      const response = await api.put(`${this.baseURL}/${id}/payment`, paymentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update payment status');
    }
  }

  async deleteBooking(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting guest booking:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete guest booking');
    }
  }

  // Helper methods for filtering
  async getPendingBookings(): Promise<GuestBooking[]> {
    return this.getAllBookings({ bookingStatus: 'PENDING' });
  }

  async getPaidBookings(): Promise<GuestBooking[]> {
    return this.getAllBookings({ paymentStatus: 'PAID' });
  }

  async getBookingsByInstructor(instructorId: string): Promise<GuestBooking[]> {
    return this.getAllBookings({ instructorId });
  }

  // Statistics methods
  async getBookingStats(): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    totalRevenue: number;
  }> {
    try {
      const allBookings = await this.getAllBookings();
      
      const stats = {
        total: allBookings.length,
        pending: allBookings.filter(b => b.booking_status === 'PENDING').length,
        confirmed: allBookings.filter(b => b.booking_status === 'CONFIRMED').length,
        completed: allBookings.filter(b => b.booking_status === 'COMPLETED').length,
        cancelled: allBookings.filter(b => b.booking_status === 'CANCELLED').length,
        totalRevenue: allBookings
          .filter(b => b.payment_status === 'PAID')
          .reduce((sum, b) => sum + Number(b.session_price), 0)
      };

      return stats;
    } catch (error: any) {
      console.error('Error fetching booking stats:', error);
      throw new Error('Failed to fetch booking statistics');
    }
  }
}

export default new GuestBookingService(); 