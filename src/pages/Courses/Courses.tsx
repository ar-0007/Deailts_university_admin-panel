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
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [editedCourse, setEditedCourse] = useState<Course | null>(null);
  const [showVideo, setShowVideo] = useState(false);
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
    duration_hours: 0,
    level: 'BEGINNER',
    is_published: false,
    categoryId: '' // Changed from category_id to categoryId to match CreateCourseData type
  });

  // Fetch courses from API
  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Add query parameter to get all courses (published and unpublished)
      const coursesData = await courseService.getAllCourses(false); // false = get all courses
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

  const handleViewCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowViewModal(true);
    setShowVideo(false); // Reset video state when opening view modal
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setEditedCourse({ ...course }); // Create a copy for editing
    setShowEditModal(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedCourse) return;

    try {
      setLoading(true);
      setError("");
      const updatedCourse = await courseService.updateCourse(
        editedCourse.course_id,
        {
          title: editedCourse.title,
          description: editedCourse.description,
          price: editedCourse.price,
          category_id: editedCourse.category_id,
          duration_hours: editedCourse.duration_hours,
          level: editedCourse.level,
          is_published: editedCourse.is_published
        }
      );
      if (updatedCourse) {
        setCourses(prev => prev.map(course => course.course_id === updatedCourse.course_id ? updatedCourse : course));
        setShowEditModal(false);
        setSelectedCourse(null);
        setEditedCourse(null);
      } else {
        setError("Failed to update course.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update course.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || (filterStatus === 'published' ? course.is_published : !course.is_published);
    const matchesLevel = filterLevel === 'all' || course.level === filterLevel;
    
    return matchesSearch && matchesStatus && matchesLevel;
  });

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    
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
    setError('');

    try {
      // Create course with files directly
      const createdCourse = await courseService.createCourse(
        newCourse,
        thumbnailFile,
        videoFile
      );
      
      if (createdCourse) {
        setCourses(prev => [createdCourse, ...prev]);
        setShowAddModal(false);
        setNewCourse({
          title: '',
          description: '',
          price: 0,
          duration_hours: 0,
          level: 'BEGINNER',
          is_published: false,
          categoryId: '' // Changed from category_id to categoryId to match CreateCourseData type
        });
        setThumbnailFile(null);
        setVideoFile(null);
        setUploadProgress({ thumbnail: 0, video: 0 });
        setUploadStatus('success');
        await fetchCourses();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
      setUploadStatus('error');
    } finally {
      setIsCreating(false);
      setIsUploading(false);
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
                  <button 
                    onClick={() => handleViewCourse(course)}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <EyeIcon className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditCourse(course)}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  >
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
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  id="title"
                  className="mt-1 block w-full input"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full input"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                  <input
                    type="number"
                    id="price"
                    className="mt-1 block w-full input"
                    value={newCourse.price}
                    onChange={(e) => setNewCourse({ ...newCourse, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="durationHours" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (Hours)</label>
                  <input
                    type="number"
                    id="durationHours"
                    className="mt-1 block w-full input"
                    value={newCourse.duration_hours || ''}
                    onChange={(e) => setNewCourse({ ...newCourse, duration_hours: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  id="category"
                  className="mt-1 block w-full input"
                  value={newCourse.categoryId}
                  onChange={(e) => setNewCourse({ ...newCourse, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <select
                  id="level"
                  className="mt-1 block w-full input"
                  value={newCourse.level}
                  onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })}
                  required
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</label>
                <input
                  type="file"
                  id="thumbnail"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Intro Video</label>
                <input
                  type="file"
                  id="video"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                  required
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newCourse.is_published}
                  onChange={(e) => setNewCourse({ ...newCourse, is_published: e.target.checked })}
                />
                <label htmlFor="published" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Published</label>
              </div>
              
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${(uploadProgress.thumbnail + uploadProgress.video) / 2}%` }}
                  ></div>
                </div>
              )}
              {uploadStatus === 'success' && <p className="text-green-500 text-sm">Upload successful!</p>}
              {uploadStatus === 'error' && <p className="text-red-500 text-sm">Upload failed. Please try again.</p>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUploading}>
                  {isCreating ? <LoadingSpinner size="sm" /> : 'Add Course'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Course Modal */}
      {showViewModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Course Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedCourse.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCourse.description}</p>
              </div>
              {selectedCourse.intro_video_url && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative" style={{ paddingTop: '56.25%' }}> {/* 16:9 Aspect Ratio */}
                  {!showVideo ? (
                    <div 
                      className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black bg-opacity-75"
                      onClick={() => setShowVideo(true)}
                    >
                      {selectedCourse.thumbnail_url && (
                        <img 
                          src={selectedCourse.thumbnail_url} 
                          alt="Video Thumbnail" 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute flex items-center justify-center w-16 h-16 rounded-full bg-red-600 bg-opacity-80">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <video controls autoPlay src={selectedCourse.intro_video_url} className="absolute inset-0 w-full h-full object-cover"></video>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Price:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">${selectedCourse.price}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedCourse.duration_hours}h</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Level:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedCourse.level}</span>
                </div>
                
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Category:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedCourse.categories?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Published:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedCourse.is_published ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created At:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{new Date(selectedCourse.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditModal && editedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Course</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateCourse} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  className="mt-1 block w-full input"
                  value={editedCourse.title}
                  onChange={(e) => setEditedCourse({ ...editedCourse, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="edit-description"
                  rows={3}
                  className="mt-1 block w-full input"
                  value={editedCourse.description || ''}
                  onChange={(e) => setEditedCourse({ ...editedCourse, description: e.target.value })}
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                  <input
                    type="number"
                    id="edit-price"
                    className="mt-1 block w-full input"
                    value={editedCourse.price}
                    onChange={(e) => setEditedCourse({ ...editedCourse, price: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Duration (Hours)</label>
                  <input
                    type="number"
                    id="edit-duration"
                    className="mt-1 block w-full input"
                    value={editedCourse.duration_hours}
                    onChange={(e) => setEditedCourse({ ...editedCourse, duration_hours: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                <select
                  id="edit-category"
                  className="mt-1 block w-full input"
                  value={editedCourse.category_id || ''}
                  onChange={(e) => setEditedCourse({ ...editedCourse, category_id: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.category_id} value={category.category_id}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-level" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <select
                  id="edit-level"
                  className="mt-1 block w-full input"
                  value={editedCourse.level}
                  onChange={(e) => setEditedCourse({ ...editedCourse, level: e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' })}
                  required
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit-published"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={editedCourse.is_published}
                  onChange={(e) => setEditedCourse({ ...editedCourse, is_published: e.target.checked })}
                />
                <label htmlFor="edit-published" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Published</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
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
