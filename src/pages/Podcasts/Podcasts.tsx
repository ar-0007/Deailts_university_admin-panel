import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  ClockIcon,
  SpeakerWaveIcon,
  HeartIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import podcastService, { type Podcast, type CreatePodcastData } from '../../services/podcastService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Podcasts: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [playingPodcast, setPlayingPodcast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, thumbnail: 0 });
  const [isUploading, setIsUploading] = useState(false);

  // Form state for new podcast
  const [newPodcast, setNewPodcast] = useState<CreatePodcastData>({
    title: '',
    description: '',
    status: 'draft'
  });

  // Fetch podcasts from API
  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      const podcastsData = await podcastService.getAllPodcasts();
      setPodcasts(podcastsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch podcasts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPodcasts();
  }, []);

  // Handle podcast creation
  const handleCreatePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newPodcast.title.trim()) {
      setError('Podcast title is required');
      return;
    }
    
    if (!videoFile) {
      setError('Podcast video is required');
      return;
    }

    setIsCreating(true);
    setIsUploading(true);
    setError('');

    try {
      // Create podcast with uploaded media URLs
      const createdPodcast = await podcastService.createPodcast(
        newPodcast,
        videoFile,
        thumbnailFile,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, video: progress.video || 0, thumbnail: progress.thumbnail || 0 }));
        }
      );

      if (createdPodcast) {
        setPodcasts(prev => [createdPodcast, ...prev]);
        setShowAddModal(false);
        setNewPodcast({
          title: '',
          description: '',
          status: 'draft'
        });
        setVideoFile(null);
        setThumbnailFile(null);
        setUploadProgress({ video: 0, thumbnail: 0 });
      } else {
        setError('Failed to create podcast');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create podcast');
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  const handleDeletePodcast = async (podcastId: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      const success = await podcastService.deletePodcast(podcastId);
      if (success) {
        setPodcasts(prev => prev.filter(podcast => podcast.podcast_id !== podcastId));
      } else {
        setError('Failed to delete podcast');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete podcast');
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      archived: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const categoryStyles = {
      Technical: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      Business: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      Interview: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      Tips: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryStyles[category as keyof typeof categoryStyles] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
        {category}
      </span>
    );
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = 
      podcast.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || podcast.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || podcast.category === filterCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStats = () => {
    return {
      total: podcasts.length,
      published: podcasts.filter(p => p.status === 'published').length,
      totalPlays: podcasts.reduce((sum, p) => sum + p.plays_count, 0),
      totalLikes: podcasts.reduce((sum, p) => sum + p.likes_count, 0),
      avgDuration: Math.round(podcasts.reduce((sum, p) => sum + p.duration, 0) / podcasts.length / 60)
    };
  };

  const stats = getStats();
  const categories = ['Technical', 'Business', 'Interview', 'Tips'];

  const togglePlay = (podcastId: string) => {
    if (playingPodcast === podcastId) {
      setPlayingPodcast(null);
    } else {
      setPlayingPodcast(podcastId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Podcasts</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your podcast episodes and audio content
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Upload Podcast
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <MicrophoneIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Episodes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <SpeakerWaveIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <PlayIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Plays</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPlays.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <HeartIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalLikes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgDuration}m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search podcasts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Podcasts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPodcasts.map((podcast) => (
          <div key={podcast.podcast_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {podcast.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {podcast.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(podcast.status)}
                {getCategoryBadge(podcast.category)}
              </div>

              {/* Audio Player */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => togglePlay(podcast.podcast_id)}
                    className="flex items-center justify-center w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                  >
                    {playingPodcast === podcast.podcast_id ? (
                      <PauseIcon className="w-6 h-6" />
                    ) : (
                      <PlayIcon className="w-6 h-6 ml-1" />
                    )}
                  </button>
                  
                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {formatDuration(podcast.duration)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                    <PlayIcon className="w-4 h-4 mr-1" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {podcast.plays_count.toLocaleString()}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Plays</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                    <HeartIcon className="w-4 h-4 mr-1" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {podcast.likes_count}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center text-gray-500 dark:text-gray-400 mb-1">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {new Date(podcast.published_at).toLocaleDateString()}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Published</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
                
                {podcast.status === 'published' && (
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Live
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPodcasts.length === 0 && (
        <div className="text-center py-12">
          <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No podcasts found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by uploading your first podcast episode.'}
          </p>
        </div>
      )}

      {/* Add Podcast Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Podcast</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePodcast} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Podcast Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={newPodcast.title}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter podcast title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={newPodcast.description}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  placeholder="Enter podcast description"
                />
              </div>

              {/* Video Upload */}
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Podcast Video *
                </label>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="input"
                  required
                />
                {uploadProgress.video > 0 && uploadProgress.video < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.video}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading video...</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Max file size: 500MB. Supported formats: MP4, MOV, AVI, MKV, WebM</p>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Podcast Thumbnail
                </label>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="input"
                />
                {uploadProgress.thumbnail > 0 && uploadProgress.thumbnail < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress.thumbnail}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading thumbnail...</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB. Supported formats: JPG, PNG</p>
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={newPodcast.status}
                  onChange={(e) => setNewPodcast(prev => ({ ...prev, status: e.target.value as any }))}
                  className="input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || isUploading || !videoFile}
                  className={`${isCreating || isUploading || !videoFile ? 'opacity-50 cursor-not-allowed' : ''} min-w-[140px]`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {uploadProgress.video > 0 ? `${Math.round(uploadProgress.video)}%` : 'Uploading...'}
                      </span>
                    </div>
                  ) : isCreating ? (
                    'Creating...'
                  ) : (
                    'Create Podcast'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Podcasts;

