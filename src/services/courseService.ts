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
    description?: string;
  };
}
export interface CreateCourseData {
  categoryId: string | number | readonly string[] | undefined;
  title: string;
  description?: string;
  price?: number;
  category_id?: string; // Use category_id instead of categoryId
  duration_hours?: number;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  is_published?: boolean;
}

export interface Category {
  category_id: string;
  name: string;
  description?: string;
  slug: string;
  is_active: boolean;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimetype: string;
}

class CourseService {
  async getAllCourses(isPublished?: boolean): Promise<Course[]> {
    try {
      const params = isPublished !== undefined ? { isPublished: isPublished.toString() } : {};
      const response = await api.get('/courses', { params });
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

  async createCourse(
    courseData: CreateCourseData, 
    thumbnailFile?: File | null, 
    introVideoFile?: File | null
  ): Promise<Course | null> {
    try {
      const formData = new FormData();
      
      // Add course data
      formData.append('title', courseData.title);
      if (courseData.description) formData.append('description', courseData.description);
      if (courseData.price !== undefined) formData.append('price', courseData.price.toString());
      if (courseData.category_id) formData.append('category_id', courseData.category_id);
      if (courseData.duration_hours !== undefined) formData.append('duration_hours', courseData.duration_hours.toString());
      if (courseData.level) formData.append('level', courseData.level);
      if (courseData.is_published !== undefined) formData.append('is_published', courseData.is_published.toString());
      
      // Add files
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (introVideoFile) formData.append('intro_video', introVideoFile);

      const response = await api.post('/courses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating course:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create course');
    }
  }

  async updateCourse(
    courseId: string,
    courseData: Partial<CreateCourseData>,
    thumbnailFile?: File | null,
    introVideoFile?: File | null
  ): Promise<Course | null> {
    try {
      const formData = new FormData();
      
      // Add course data
      if (courseData.title) formData.append('title', courseData.title);
      if (courseData.description) formData.append('description', courseData.description);
      if (courseData.price !== undefined) formData.append('price', courseData.price.toString());
      if (courseData.category_id) formData.append('category_id', courseData.category_id);
      if (courseData.duration_hours !== undefined) formData.append('duration_hours', courseData.duration_hours.toString());
      if (courseData.level) formData.append('level', courseData.level);
      if (courseData.is_published !== undefined) formData.append('is_published', courseData.is_published.toString());
      
      // Add files
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      if (introVideoFile) formData.append('intro_video', introVideoFile);

      const response = await api.put(`/courses/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
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

  async getCategories(): Promise<Category[]> {
    try {
      const response = await api.get('/courses/categories');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  async createCategory(categoryData: {
    name: string;
    description?: string;
    slug: string;
    isActive?: boolean;
  }): Promise<Category | null> {
    try {
      const response = await api.post('/courses/categories', categoryData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating category:', error);
      return null;
    }
  }

  // Legacy upload methods for backward compatibility
  async uploadImage(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      
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
      console.error('Error uploading image:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload image');
    }
  }

  async uploadVideo(file: File, onProgress?: (progress: number) => void): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await api.post('/uploads/video', formData, {
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
      console.error('Error uploading video:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to upload video');
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
}

export default new CourseService();

