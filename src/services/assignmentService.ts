// src/services/assignmentService.ts
import api from './api';

export interface Assignment {
  submissions_count: number;
  graded_count: number;
  assignment_id: string;
  course_id?: string;
  chapter_id?: string;
  title: string;
  description?: string;
  assignment_file_url?: string;
  max_score: number;
  due_date?: string;
  is_published: boolean; // Add this field
  created_at: string;
  updated_at: string;
  courses?: {
    title: string;
    description?: string;
  };
  chapters?: {
    title: string;
    description?: string;
  };
}

export interface CreateAssignmentData {
  title: string;
  description?: string;
  course_id?: string;
  chapter_id?: string;
  max_score?: number;
  due_date?: string;
  is_published?: boolean; // Add this field
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

  async getAllAssignments(courseId?: string, chapterId?: string): Promise<Assignment[]> {
    try {
      const params: any = {};
      if (courseId) params.course_id = courseId;
      if (chapterId) params.chapter_id = chapterId;
      
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
      const response = await api.post(this.baseURL, assignmentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create assignment');
    }
  }

  async createAssignmentWithUpload(
    assignmentData: CreateAssignmentData,
    assignmentFile?: File | null,
    onProgress?: (progress: number) => void
  ): Promise<Assignment> {
    try {
      const formData = new FormData();
      
      // Add assignment data
      formData.append('title', assignmentData.title);
      if (assignmentData.description) formData.append('description', assignmentData.description);
      if (assignmentData.course_id) formData.append('course_id', assignmentData.course_id);
      if (assignmentData.chapter_id) formData.append('chapter_id', assignmentData.chapter_id);
      if (assignmentData.max_score !== undefined) formData.append('max_score', assignmentData.max_score.toString());
      if (assignmentData.due_date) formData.append('due_date', assignmentData.due_date);
      
      // Add file
      if (assignmentFile) formData.append('assignment_file', assignmentFile);

      const response = await api.post(`${this.baseURL}/upload`, formData, {
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
      console.error('Error creating assignment with upload:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create assignment');
    }
  }

  async updateAssignment(id: string, assignmentData: Partial<CreateAssignmentData>): Promise<Assignment> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, assignmentData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update assignment');
    }
  }

  async updateAssignmentWithUpload(
    id: string,
    assignmentData: Partial<CreateAssignmentData>,
    assignmentFile?: File | null,
    onProgress?: (progress: number) => void
  ): Promise<Assignment> {
    try {
      const formData = new FormData();
      
      // Add assignment data
      if (assignmentData.title) formData.append('title', assignmentData.title);
      if (assignmentData.description) formData.append('description', assignmentData.description);
      if (assignmentData.max_score !== undefined) formData.append('max_score', assignmentData.max_score.toString());
      if (assignmentData.due_date) formData.append('due_date', assignmentData.due_date);
      
      // Add file
      if (assignmentFile) formData.append('assignment_file', assignmentFile);

      const response = await api.put(`${this.baseURL}/${id}/upload`, formData, {
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
      console.error('Error updating assignment with upload:', error);
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

  // Legacy upload method for backward compatibility
  async uploadFile(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append("image", file); // Use 'image' for document uploads via general upload endpoint

      const response = await api.post("/uploads/image", formData, {
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

  // Get assignments by course
  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    return this.getAllAssignments(courseId);
  }

  // Get assignments by chapter
  async getAssignmentsByChapter(chapterId: string): Promise<Assignment[]> {
    return this.getAllAssignments(undefined, chapterId);
  }

  // Get all submissions (admin only)
  async getAllSubmissions(): Promise<any[]> {
    try {
      const response = await api.get('/submissions?admin=true');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching all submissions:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch submissions');
    }
  }
}

const assignmentService = new AssignmentService();
export default assignmentService;

