// src/services/quizService.ts
import api from './api';

export interface Quiz {
  quiz_id: string;
  chapter_id: string;
  title: string;
  description?: string;
  questions_data: any; // JSONB data containing quiz questions
  created_at: string;
  updated_at: string;
  chapters?: {
    chapter_id: string;
    title: string;
    courses?: {
      course_id: string;
      title: string;
    };
  };
}

export interface CreateQuizData {
  title: string;
  description?: string;
  chapter_id: string;
  questions_data: any;
}

class QuizService {
  private baseURL = '/quizzes';

  async getAllQuizzes(): Promise<Quiz[]> {
    try {
      const response = await api.get(this.baseURL);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching quizzes:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch quizzes');
    }
  }

  async getQuizById(id: string): Promise<Quiz> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching quiz:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch quiz');
    }
  }

  async createQuiz(quizData: CreateQuizData): Promise<Quiz> {
    try {
      const response = await api.post(this.baseURL, quizData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating quiz:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create quiz');
    }
  }

  async updateQuiz(id: string, quizData: Partial<CreateQuizData>): Promise<Quiz> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, quizData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating quiz:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update quiz');
    }
  }

  async deleteQuiz(id: string): Promise<boolean> {
    try {
      console.log('QuizService: Attempting to delete quiz with ID:', id);
      console.log('QuizService: Making DELETE request to:', `${this.baseURL}/${id}`);
      
      const response = await api.delete(`${this.baseURL}/${id}`);
      console.log('QuizService: Delete response:', response.data);
      
      return true;
    } catch (error: any) {
      console.error('QuizService: Error deleting quiz:', error);
      console.error('QuizService: Error response:', error.response?.data);
      console.error('QuizService: Error status:', error.response?.status);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete quiz');
    }
  }

  // Get quizzes by chapter
  async getQuizzesByChapter(chapterId: string): Promise<Quiz[]> {
    try {
      const response = await api.get(`${this.baseURL}/chapter/${chapterId}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching quizzes by chapter:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch quizzes');
    }
  }
}

const quizService = new QuizService();
export default quizService;