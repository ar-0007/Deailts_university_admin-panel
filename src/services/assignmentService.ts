// src/services/assignmentService.ts
import api from './api';

export interface Assignment {
  assignment_id: string;
  course_id: string;
  title: string;
  description: string;
  assignment_file_url?: string;
  max_score: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
  courses?: {
    title: string;
  };
}

export interface CreateAssignmentData {
  title: string;
  description: string;
  course_id: string;
  max_score: number;
  due_date: string;
  assignment_file_url?: string;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimetype: string;
}

class AssignmentService {
  private baseURL = '/assignments';

  async getAllAssignments(courseId?: string): Promise<Assignment[]> {
    try {
      const params = courseId ? { course_id: courseId } : {};
      const response = await api.get(this.baseURL, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch assignments');
    }
  }

  async getAssignmentById(id: string): Promise<Assignment> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch assignment');
    }
  }

  async createAssignment(assignmentData: CreateAssignmentData): Promise<Assignment> {
    try {
      const formData = new FormData();
      formData.append('title', assignmentData.title);
      formData.append('description', assignmentData.description);
      formData.append('course_id', assignmentData.course_id);
      formData.append('max_score', assignmentData.max_score.toString());
      
      if (assignmentData.due_date) {
        formData.append('due_date', assignmentData.due_date);
      }

      const response = await api.post(this.baseURL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create assignment');
    }
  }

  async updateAssignment(id: string, assignmentData: Partial<CreateAssignmentData>): Promise<Assignment> {
    try {
      const formData = new FormData();
      
      if (assignmentData.title) formData.append('title', assignmentData.title);
      if (assignmentData.description) formData.append('description', assignmentData.description);
      if (assignmentData.max_score) formData.append('max_score', assignmentData.max_score.toString());
      if (assignmentData.due_date) formData.append('due_date', assignmentData.due_date);

      const response = await api.put(`${this.baseURL}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update assignment');
    }
  }

  async deleteAssignment(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete assignment');
    }
  }

  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file); // Using 'image' field name for the upload endpoint

      const response = await api.post('/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload file');
    }
  }
}

const assignmentService = new AssignmentService();
export default assignmentService;

