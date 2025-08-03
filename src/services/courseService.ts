import api from './api';

export interface Course {
  course_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  intro_video_url?: string;
  price: number;
  category_id?: string;
  duration_hours: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  is_published: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    slug: string;
  };
}

export interface CreateCourseData {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  price?: number;
  categoryId?: string;
  durationHours?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  isPublished?: boolean;
}

export interface Category {
  category_id: string;
  name: string;
  description?: string;
  slug: string;
  is_active: boolean;
}

// Upload functions
export const uploadImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await api.post('/uploads/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data;
};

export const uploadVideo = async (file: File): Promise<{ url: string; publicId: string }> => {
  const formData = new FormData();
  formData.append('video', file);
  
  const response = await api.post('/uploads/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data.data;
};

export const createCourse = async (courseData: CreateCourseData): Promise<Course> => {
  const response = await api.post('/courses', courseData);
  return response.data.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get('/courses/categories');
  return response.data.data;
};

export interface UpdateCourseData extends Partial<CreateCourseData> {
  course_id: string;
}

class CourseService {
  async getAllCourses(): Promise<Course[]> {
    try {
      const response = await api.get('/courses');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      return null;
    }
  }

  async createCourse(courseData: CreateCourseData): Promise<Course | null> {
    try {
      const response = await api.post('/courses', courseData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating course:', error);
      return null;
    }
  }

  async updateCourse(courseData: UpdateCourseData): Promise<Course | null> {
    try {
      const response = await api.put(`/courses/${courseData.course_id}`, courseData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating course:', error);
      return null;
    }
  }

  async deleteCourse(courseId: string): Promise<boolean> {
    try {
      await api.delete(`/courses/${courseId}`);
      return true;
    } catch (error) {
      console.error('Error deleting course:', error);
      return false;
    }
  }

  async getCourseStats(): Promise<{
    total: number;
    published: number;
    totalStudents: number;
    revenue: number;
  }> {
    try {
      const response = await api.get('/courses/stats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching course stats:', error);
      return {
        total: 0,
        published: 0,
        totalStudents: 0,
        revenue: 0
      };
    }
  }

  // Upload methods
  async uploadImage(file: File): Promise<{ url: string; publicId: string }> {
    return uploadImage(file);
  }

  async uploadVideo(file: File): Promise<{ url: string; publicId: string }> {
    return uploadVideo(file);
  }

  async getCategories(): Promise<Category[]> {
    return getCategories();
  }
}

export default new CourseService();

