import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  // FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  UsersIcon,
  ClockIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import courseService, { type Course, type CreateCourseData, type Category } from '../../services/courseService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ thumbnail: 0, video: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // Form state for new course
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    title: '',
    description: '',
    price: 0,
    durationHours: 0,
    level: 'BEGINNER',
    isPublished: false,
    categoryId: '',
    thumbnailUrl: '',
    introVideoUrl: ''
  });

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const categoriesData = await courseService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, []);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'published' ? course.is_published : !course.is_published);
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newCourse.title.trim()) {
      setError('Course title is required');
      return;
    }
    
    if (!videoFile) {
      setError('Course video is required');
      return;
    }

    setIsCreating(true);
    setIsUploading(true);
    setUploadStatus('uploading');
    setError('');

    try {
      let thumbnailUrl = '';
      let videoUrl = '';

      // Upload thumbnail if selected
      if (thumbnailFile) {
        setUploadProgress(prev => ({ ...prev, thumbnail: 0 }));
        const thumbnailResult = await courseService.uploadImage(thumbnailFile);
        setUploadProgress(prev => ({ ...prev, thumbnail: 100 }));
        thumbnailUrl = thumbnailResult.url;
      }

      // Upload video (required)
      setUploadProgress(prev => ({ ...prev, video: 0 }));
      const videoResult = await courseService.uploadVideo(videoFile);
      setUploadProgress(prev => ({ ...prev, video: 100 }));
      videoUrl = videoResult.url;

      // Create course with uploaded media URLs
      const courseData = {
        ...newCourse,
        thumbnailUrl,
        introVideoUrl: videoUrl
      };

      const createdCourse = await courseService.createCourse(courseData);
      if (createdCourse) {
        setCourses(prev => [createdCourse, ...prev]);
        setShowAddModal(false);
        setNewCourse({
          title: '',
          description: '',
          price: 0,
          durationHours: 0,
          level: 'BEGINNER',
          isPublished: false,
          categoryId: '',
          thumbnailUrl: '',
          introVideoUrl: ''
        });
        setThumbnailFile(null);
        setVideoFile(null);
        setUploadProgress({ thumbnail: 0, video: 0 });
        setUploadStatus('success');
      } else {
        setError('Failed to create course');
        setUploadStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
      setUploadStatus('error');
    } finally {
      setIsCreating(false);
      setIsUploading(false);
      setTimeout(() => setUploadStatus('idle'), 2000);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      const success = await courseService.deleteCourse(courseId);
      if (success) {
        setCourses(prev => prev.filter(course => course.course_id !== courseId));
      } else {
        setError('Failed to delete course');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete course');
    }
  };

  const getStatusBadge = (status: boolean) => {
    const statusStyles = status
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
        {status ? 'Published' : 'Draft'}
      </span>
    );
  };

  const getLevelBadge = (level: string) => {
    const levelStyles = {
      BEGINNER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      INTERMEDIATE: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ADVANCED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${levelStyles[level as keyof typeof levelStyles]}`}>
        {level.charAt(0).toUpperCase() + level.slice(1).toLowerCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your course catalog and content
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0"
          icon={<PlusIcon className="w-5 h-5" />}
        >
          Add Course
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 animate-scale-in">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <UsersIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                0
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.filter(c => c.is_published).length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                $0
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="input"
            >
              <option value="all">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => (
          <Card key={course.course_id} variant="default" className={`hover:shadow-lg transition-shadow animate-slide-in-right delay-${index}`}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {course.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {getStatusBadge(course.is_published)}
                {getLevelBadge(course.level)}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Price:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    ${course.price}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {course.duration_hours}h
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {course.categories?.name || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteCourse(course.course_id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card variant="default" padding="xl">
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all' || filterLevel !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first course.'}
            </p>
            <div className="mt-6">
              <Button
                onClick={() => setShowAddModal(true)}
                icon={<PlusIcon className="w-5 h-5" />}
              >
                Add Course
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Course</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter course title"
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
                  value={newCourse.description}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                  className="input min-h-[100px] resize-y"
                  placeholder="Enter course description"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={newCourse.categoryId}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, categoryId: e.target.value }))}
                  className="input"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ($) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="durationHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    id="durationHours"
                    type="number"
                    min="0"
                    value={newCourse.durationHours}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, durationHours: parseInt(e.target.value) || 0 }))}
                    className="input"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Level and Instructor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level *
                  </label>
                  <select
                    id="level"
                    value={newCourse.level}
                    onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value as any }))}
                    className="input"
                    required
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Thumbnail
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
              </div>

              {/* Video Upload */}
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course Intro Video *
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

              {/* Published Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={newCourse.isPublished}
                  onChange={(e) => setNewCourse(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Publish course immediately
                </label>
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
                    'Create Course'
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

export default Courses;
