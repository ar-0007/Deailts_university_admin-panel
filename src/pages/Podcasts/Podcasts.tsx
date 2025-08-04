import React, { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  PlayIcon,
  PauseIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  HeartIcon,
  XMarkIcon,
  ClockIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import podcastService, { type Podcast, type CreatePodcastData } from '../../services/podcastService';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Podcasts: React.FC = () => {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [playingPodcast, setPlayingPodcast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPodcast, setEditingPodcast] = useState<Podcast | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, thumbnail: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [likedPodcasts, setLikedPodcasts] = useState<Set<string>>(new Set());
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Form state for new/edit podcast
  const [podcastForm, setPodcastForm] = useState<CreatePodcastData>({
    title: '',
    description: '',
    status: 'draft',
    scheduled_at: ''
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

  // Handle video play/pause
  const togglePlay = async (podcast: Podcast) => {
    const videoElement = videoRefs.current[podcast.podcast_id];
    if (!videoElement) return;

    if (playingPodcast === podcast.podcast_id) {
      videoElement.pause();
      setPlayingPodcast(null);
    } else {
      // Pause other videos
      Object.values(videoRefs.current).forEach(video => {
        if (video && !video.paused) {
          video.pause();
        }
      });
      
      // Simply play the video without tracking views
      videoElement.play();
      setPlayingPodcast(podcast.podcast_id);
    }
  };

  // Handle like toggle
  const toggleLike = async (podcastId: string) => {
    try {
      const result = await podcastService.toggleLike(podcastId);
      
      // Update local state
      setPodcasts(prev => prev.map(p => 
        p.podcast_id === podcastId 
          ? { ...p, likes_count: result.likes_count }
          : p
      ));
      
      // Update liked state
      setLikedPodcasts(prev => {
        const newSet = new Set(prev);
        if (result.liked) {
          newSet.add(podcastId);
        } else {
          newSet.delete(podcastId);
        }
        return newSet;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to toggle like');
    }
  };

  // Handle podcast creation
  const handleCreatePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!podcastForm.title.trim()) {
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
      console.log('📝 Frontend form data:', podcastForm);
      console.log('📝 Video file:', videoFile);
      console.log('📝 Thumbnail file:', thumbnailFile);
      
      const createdPodcast = await podcastService.createPodcast(
        podcastForm,
        videoFile,
        thumbnailFile,
        (progress) => {
          setUploadProgress(prev => ({ ...prev, video: progress.video || 0, thumbnail: progress.thumbnail || 0 }));
        }
      );

      if (createdPodcast) {
        setPodcasts(prev => [createdPodcast, ...prev]);
        setShowAddModal(false);
        resetForm();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create podcast');
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  // Handle podcast update
  const handleUpdatePodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPodcast) return;
    
    setIsUpdating(true);
    setError('');

    try {
      const updatedPodcast = await podcastService.updatePodcast(
        editingPodcast.podcast_id,
        podcastForm
      );

      setPodcasts(prev => prev.map(p => 
        p.podcast_id === editingPodcast.podcast_id ? updatedPodcast : p
      ));
      setShowEditModal(false);
      setEditingPodcast(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update podcast');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle podcast deletion
  const handleDeletePodcast = async (podcastId: string) => {
    if (!confirm('Are you sure you want to delete this podcast?')) return;

    try {
      await podcastService.deletePodcast(podcastId);
      setPodcasts(prev => prev.filter(podcast => podcast.podcast_id !== podcastId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete podcast');
    }
  };

  // Open edit modal
  const openEditModal = (podcast: Podcast) => {
    setEditingPodcast(podcast);
    setPodcastForm({
      title: podcast.title,
      description: podcast.description || '',
      status: podcast.status === 'archived' ? 'draft' : podcast.status,
      scheduled_at: podcast.scheduled_at || ''
    });
    setShowEditModal(true);
  };

  // Reset form
  const resetForm = () => {
    setPodcastForm({
      title: '',
      description: '',
      status: 'draft',
      scheduled_at: ''
    });
    setVideoFile(null);
    setThumbnailFile(null);
    setUploadProgress({ video: 0, thumbnail: 0 });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Format view count
  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = 
      podcast.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (podcast.description && podcast.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || podcast.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStats = () => {
    return {
      total: podcasts.length,
      published: podcasts.filter(p => p.status === 'published').length,
      totalPlays: podcasts.reduce((sum, p) => sum + (p.plays_count || 0), 0),
      totalLikes: podcasts.reduce((sum, p) => sum + (p.likes_count || 0), 0),
      avgDuration: podcasts.length > 0 ? Math.round(podcasts.reduce((sum, p) => sum + (p.duration || 0), 0) / podcasts.length / 60) : 0
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Video Feed</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            YouTube-like video content management
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Upload Video
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(stats.totalPlays)}</p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCount(stats.totalLikes)}</p>
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

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search videos..."
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
          </div>
        </div>
      </div>

      {/* YouTube-like Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPodcasts.map((podcast) => (
          <div key={podcast.podcast_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200 group">
            {/* Video Thumbnail/Player */}
            <div className="relative aspect-video bg-gray-900 overflow-hidden">
              {/* Thumbnail */}
              {podcast.thumbnail_url && playingPodcast !== podcast.podcast_id && (
                <img
                  src={podcast.thumbnail_url}
                  alt={podcast.title}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Video Player */}
              <video
                ref={(el) => {
                  if (el) {
                    videoRefs.current[podcast.podcast_id] = el;
                  }
                }}
                src={podcast.video_url}
                className={`w-full h-full object-cover ${
                  playingPodcast === podcast.podcast_id ? 'block' : 'hidden'
                }`}
                controls={playingPodcast === podcast.podcast_id}
                onEnded={() => setPlayingPodcast(null)}
                onPause={() => setPlayingPodcast(null)}
              />
              
              {/* Play Button Overlay */}
              {playingPodcast !== podcast.podcast_id && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-200">
                  <button
                    onClick={() => togglePlay(podcast)}
                    className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full transition-all duration-200 transform hover:scale-110"
                  >
                    <PlayIcon className="w-8 h-8 text-gray-900 ml-1" />
                  </button>
                </div>
              )}
              
              {/* Duration Badge */}
              {podcast.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(podcast.duration)}
                </div>
              )}

              {/* Scheduled Time Badge */}
              {podcast.status === 'scheduled' && podcast.scheduled_at && (
                <div className="absolute bottom-2 left-2 bg-blue-600 bg-opacity-90 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <ClockIcon className="w-3 h-3" />
                  {new Date(podcast.scheduled_at).toLocaleDateString()} {new Date(podcast.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-2 left-2">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  podcast.status === 'published' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : podcast.status === 'scheduled'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : podcast.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {podcast.status.charAt(0).toUpperCase() + podcast.status.slice(1)}
                </span>
              </div>
            </div>
            
            {/* Video Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2 mb-2">
                {podcast.title}
              </h3>
              
              {podcast.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                  {podcast.description}
                </p>
              )}
              
              {/* Views and Likes */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-3 h-3" />
                    <span>{formatCount(podcast.plays_count || 0)} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <HeartIcon className="w-3 h-3" />
                    <span>{formatCount(podcast.likes_count || 0)} likes</span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleLike(podcast.podcast_id)}
                    className={`p-1.5 rounded-full transition-colors ${
                      likedPodcasts.has(podcast.podcast_id)
                        ? 'text-red-600 hover:text-red-700'
                        : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    {likedPodcasts.has(podcast.podcast_id) ? (
                      <HeartSolidIcon className="w-4 h-4" />
                    ) : (
                      <HeartIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(podcast)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-full"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePodcast(podcast.podcast_id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPodcasts.length === 0 && (
        <div className="text-center py-12">
          <MicrophoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No videos found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Get started by uploading your first video.'}
          </p>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Upload New Video</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
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
                  Video Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={podcastForm.title}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video title"
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
                  value={podcastForm.description}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video description"
                />
              </div>

              {/* Video Upload */}
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video File *
                </label>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <p className="text-sm text-gray-600 mt-1">Uploading video... {uploadProgress.video}%</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thumbnail
                </label>
                <input
                  id="thumbnail"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={podcastForm.status}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Schedule Date/Time - Only show when status is 'scheduled' */}
              {podcastForm.status === 'scheduled' && (
                <div>
                  <label htmlFor="scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Date & Time *
                  </label>
                  <input
                    id="scheduled_at"
                    type="datetime-local"
                    value={podcastForm.scheduled_at}
                    onChange={(e) => {
                      // Ensure the datetime format includes seconds
                      const datetimeValue = e.target.value;
                      const formattedValue = datetimeValue ? `${datetimeValue}:00` : '';
                      setPodcastForm(prev => ({ ...prev, scheduled_at: formattedValue }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={podcastForm.status === 'scheduled'}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The video will be automatically published at the scheduled time
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
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
                      <span>Uploading...</span>
                    </div>
                  ) : isCreating ? (
                    'Creating...'
                  ) : (
                    'Upload Video'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && editingPodcast && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Video</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPodcast(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePodcast} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Title *
                </label>
                <input
                  id="edit-title"
                  type="text"
                  value={podcastForm.title}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  rows={4}
                  value={podcastForm.description}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter video description"
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  id="edit-status"
                  value={podcastForm.status}
                  onChange={(e) => setPodcastForm(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Schedule Date/Time - Only show when status is 'scheduled' */}
              {podcastForm.status === 'scheduled' && (
                <div>
                  <label htmlFor="edit-scheduled_at" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schedule Date & Time *
                  </label>
                  <input
                    id="edit-scheduled_at"
                    type="datetime-local"
                    value={podcastForm.scheduled_at}
                    onChange={(e) => {
                      // Ensure the datetime format includes seconds
                      const datetimeValue = e.target.value;
                      const formattedValue = datetimeValue ? `${datetimeValue}:00` : '';
                      setPodcastForm(prev => ({ ...prev, scheduled_at: formattedValue }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={podcastForm.status === 'scheduled'}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    The video will be automatically published at the scheduled time
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPodcast(null);
                    resetForm();
                  }}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdating}
                  className={`${isUpdating ? 'opacity-50 cursor-not-allowed' : ''} min-w-[120px]`}
                >
                  {isUpdating ? 'Updating...' : 'Update Video'}
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