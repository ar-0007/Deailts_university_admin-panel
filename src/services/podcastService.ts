// src/services/podcastService.ts
import api from './api';

export interface Podcast {
  podcast_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number; // in seconds
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  published_at?: string;
  scheduled_at?: string;
  created_at: string;
  updated_at: string;
  // Keep only the basic fields that the backend actually provides
  plays_count?: number;
  likes_count?: number;
}

export interface CreatePodcastData {
  title: string;
  description?: string;
  status?: 'draft' | 'published' | 'scheduled';
  scheduled_at?: string;
}

export interface UploadResponse {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimetype: string;
}

export interface UploadProgress {
  video?: number;
  thumbnail?: number;
}

class PodcastService {
  private baseURL = '/podcasts';

  async getAllPodcasts(status?: string): Promise<Podcast[]> {
    try {
      const params = status ? { status } : {};
      const response = await api.get(this.baseURL, { params });
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching podcasts:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch podcasts');
    }
  }

  async getPodcastById(id: string): Promise<Podcast> {
    try {
      const response = await api.get(`${this.baseURL}/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error fetching podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to fetch podcast');
    }
  }

  async createPodcast(
    podcastData: CreatePodcastData,
    videoFile: File,
    thumbnailFile?: File | null,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Podcast> {
    try {
      
      const formData = new FormData();
      formData.append('title', podcastData.title);
      if (podcastData.description) formData.append('description', podcastData.description);
      formData.append('status', podcastData.status || 'draft');
      if (podcastData.scheduled_at) formData.append('scheduled_at', podcastData.scheduled_at);
      formData.append('video', videoFile);
      
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const response = await api.post(`${this.baseURL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ video: progress, thumbnail: progress });
          }
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create podcast');
    }
  }

  async createPodcastWithUrls(podcastData: CreatePodcastData & {
    video_url: string;
    thumbnail_url?: string;
    duration?: number;
  }): Promise<Podcast> {
    try {
      const response = await api.post(this.baseURL, podcastData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error creating podcast with URLs:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to create podcast');
    }
  }

  async updatePodcast(
    id: string,
    podcastData: Partial<CreatePodcastData>,
    videoFile?: File | null,
    thumbnailFile?: File | null,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Podcast> {
    try {
      const formData = new FormData();
      
      if (podcastData.title) formData.append('title', podcastData.title);
      if (podcastData.description) formData.append('description', podcastData.description);
      if (podcastData.status) formData.append('status', podcastData.status);
      if (podcastData.scheduled_at) formData.append('scheduled_at', podcastData.scheduled_at);
      if (videoFile) formData.append('video', videoFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);

      const response = await api.put(`${this.baseURL}/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress({ video: progress, thumbnail: progress });
          }
        },
      });
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update podcast');
    }
  }

  async updatePodcastWithUrls(
    id: string,
    podcastData: Partial<CreatePodcastData & {
      video_url?: string;
      thumbnail_url?: string;
      duration?: number;
    }>
  ): Promise<Podcast> {
    try {
      const response = await api.put(`${this.baseURL}/${id}`, podcastData);
      return response.data.data;
    } catch (error: any) {
      console.error('Error updating podcast with URLs:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to update podcast');
    }
  }

  async deletePodcast(id: string): Promise<boolean> {
    try {
      await api.delete(`${this.baseURL}/${id}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to delete podcast');
    }
  }

  async publishPodcast(id: string): Promise<Podcast> {
    try {
      const response = await api.patch(`${this.baseURL}/${id}/publish`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error publishing podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to publish podcast');
    }
  }

  async archivePodcast(id: string): Promise<Podcast> {
    try {
      const response = await api.patch(`${this.baseURL}/${id}/archive`);
      return response.data.data;
    } catch (error: any) {
      console.error('Error archiving podcast:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to archive podcast');
    }
  }

  // Legacy upload methods for backward compatibility
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

  // Get published podcasts only
  async getPublishedPodcasts(): Promise<Podcast[]> {
    return this.getAllPodcasts('published');
  }

  // Get draft podcasts only
  async getDraftPodcasts(): Promise<Podcast[]> {
    return this.getAllPodcasts('draft');
  }

  // Get archived podcasts only
  async getArchivedPodcasts(): Promise<Podcast[]> {
    return this.getAllPodcasts('archived');
  }

  // Remove these analytics methods since backend doesn't support them:
  // - incrementViews
  // - toggleLike  
  // - incrementPlays
  // - getPodcastAnalytics
}

const podcastService = new PodcastService();
export default podcastService;

