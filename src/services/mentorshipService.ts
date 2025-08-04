// src/services/mentorshipService.ts
import api from './api';

export interface MentorshipRequest {
  created_at: string | number | Date;
  request_id: string;
  user_id: string;
  message: string;
  preferred_topics: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  zoom_link?: string;
  rejection_reason?: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface MentorshipSlot {
  slot_id: string;
  mentor_id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  price: number;
  mentor: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface CreateMentorshipRequestData {
  message: string;
  preferred_topics: string[];
}

export interface ScheduleSessionData {
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  zoom_link?: string;
}

class MentorshipService {
  private baseURL = '/mentorship';

  async getAllRequests(status?: string): Promise<MentorshipRequest[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(`${this.baseURL}/requests`, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching mentorship requests:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch mentorship requests');
    }
  }

  async getRequestById(id: string): Promise<MentorshipRequest> {
    try {
      const response = await api.get(`${this.baseURL}/requests/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch mentorship request');
    }
  }

  async createRequest(requestData: CreateMentorshipRequestData): Promise<MentorshipRequest> {
    try {
      const response = await api.post(`${this.baseURL}/requests`, requestData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create mentorship request');
    }
  }

  async approveRequest(id: string, scheduleData: ScheduleSessionData): Promise<MentorshipRequest> {
    try {
      const response = await api.put(`${this.baseURL}/requests/${id}/approve`, scheduleData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error approving mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to approve mentorship request');
    }
  }

  async rejectRequest(id: string, reason?: string): Promise<MentorshipRequest> {
    try {
      const response = await api.put(`${this.baseURL}/requests/${id}/reject`, {
        rejection_reason: reason
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error rejecting mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to reject mentorship request');
    }
  }

  async completeRequest(id: string): Promise<MentorshipRequest> {
    try {
      const response = await api.put(`${this.baseURL}/requests/${id}/complete`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error completing mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to complete mentorship request');
    }
  }

  async deleteRequest(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/requests/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting mentorship request:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete mentorship request');
    }
  }

  // Slot management methods
  async getAllSlots(): Promise<MentorshipSlot[]> {
    try {
      const response = await api.get(`${this.baseURL}/slots`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching mentorship slots:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch mentorship slots');
    }
  }

  async createSlot(slotData: Omit<MentorshipSlot, 'slot_id' | 'mentor'>): Promise<MentorshipSlot> {
    try {
      const response = await api.post(`${this.baseURL}/slots`, slotData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating mentorship slot:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create mentorship slot');
    }
  }

  async updateSlot(id: string, slotData: Partial<MentorshipSlot>): Promise<MentorshipSlot> {
    try {
      const response = await api.put(`${this.baseURL}/slots/${id}`, slotData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating mentorship slot:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update mentorship slot');
    }
  }

  async deleteSlot(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/slots/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting mentorship slot:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete mentorship slot');
    }
  }

  async getRequestsByUser(userId: string): Promise<MentorshipRequest[]> {
    try {
      const response = await api.get(`${this.baseURL}/requests/user/${userId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching user mentorship requests:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch user mentorship requests');
    }
  }
}

const mentorshipService = new MentorshipService();
export default mentorshipService;

