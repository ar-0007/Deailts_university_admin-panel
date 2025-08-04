import api from './api';

export interface Instructor {
  instructor_id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  bio?: string;
  profile_image_url?: string;
  specialties: string[];
  experience_years: number;
  education?: string;
  certifications: string[];
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstructorResponse {
  success: boolean;
  data: Instructor[];
  message: string;
}

export interface SingleInstructorResponse {
  success: boolean;
  data: Instructor;
  message: string;
}

const instructorService = {
  getAllInstructors: async (): Promise<Instructor[]> => {
    try {
      const response = await api.get<InstructorResponse>('/instructors');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching instructors:', error);
      throw error;
    }
  },

  getInstructorById: async (instructorId: string): Promise<Instructor> => {
    try {
      const response = await api.get<SingleInstructorResponse>(`/instructors/${instructorId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching instructor:', error);
      throw error;
    }
  },

  createInstructor: async (instructorData: Partial<Instructor>): Promise<Instructor> => {
    try {
      const response = await api.post<SingleInstructorResponse>('/instructors', instructorData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating instructor:', error);
      throw error;
    }
  },

  updateInstructor: async (instructorId: string, instructorData: Partial<Instructor>): Promise<Instructor> => {
    try {
      const response = await api.put<SingleInstructorResponse>(`/instructors/${instructorId}`, instructorData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  },

  deleteInstructor: async (instructorId: string): Promise<void> => {
    try {
      await api.delete(`/instructors/${instructorId}`);
    } catch (error) {
      console.error('Error deleting instructor:', error);
      throw error;
    }
  },

  getInstructorsBySpecialty: async (specialty: string): Promise<Instructor[]> => {
    try {
      const response = await api.get<InstructorResponse>(`/instructors/specialty/${specialty}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching instructors by specialty:', error);
      throw error;
    }
  }
};

export default instructorService; 