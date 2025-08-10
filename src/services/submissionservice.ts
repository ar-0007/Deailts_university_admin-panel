import api from './api';

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Assignment {
  assignment_id: string;
  title: string;
  description?: string;
}

export interface Submission {
  submission_id: string;
  user_id: string;
  assignment_id: string;
  submission_text?: string;
  cloudinary_url?: string;
  submitted_at: string;
  status: 'submitted' | 'graded' | 'late';
  grade?: number;
  feedback?: string;
  user: User;
  assignment: Assignment;
}

export interface GradeSubmissionData {
  grade: number;
  feedback?: string;
}

class SubmissionService {
  // Get all submissions (admin only)
  async getAllSubmissions(): Promise<Submission[]> {
    try {
      const response = await api.get('/submissions?admin=true');
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching all submissions:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch submissions');
    }
  }

  // Get submission by ID
  async getSubmissionById(submissionId: string): Promise<Submission> {
    try {
      const response = await api.get(`/submissions/${submissionId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching submission:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch submission');
    }
  }

  // Grade a submission
  async gradeSubmission(submissionId: string, gradeData: GradeSubmissionData): Promise<Submission> {
    try {
      const response = await api.put(`/submissions/${submissionId}/grade`, {
        grade: gradeData.grade,
        feedback: gradeData.feedback
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error grading submission:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to grade submission');
    }
  }

  // Update submission status
  async updateSubmissionStatus(submissionId: string, status: string): Promise<Submission> {
    try {
      const response = await api.put(`/submissions/${submissionId}/status`, {
        status
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating submission status:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update submission status');
    }
  }
}

const submissionService = new SubmissionService();
export default submissionService;