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
import instructorService, { type Instructor } from '../../services/instructorService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Courses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add state for course statistics
  const [courseStats, setCourseStats] = useState({
    total: 0,
    published: 0,
    totalStudents: 0,
    revenue: 0
  });
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
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState({ thumbnail: 0, video: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  
  // Category management state
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  
  // Video series/grouping state
  const [videoSeries, setVideoSeries] = useState<string>('');
  const [videoPart, setVideoPart] = useState<number>(1);
  const [existingVideoSeries, setExistingVideoSeries] = useState<string[]>([]);
  const [showNewSeriesInput, setShowNewSeriesInput] = useState(false);
  
  // Series grouping state
  const [groupBySeries, setGroupBySeries] = useState(true);
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  // Form state for new course
  const [newCourse, setNewCourse] = useState<CreateCourseData>({
    title: '',
    description: '',
    price: 0,
    duration_hours: 0,
    level: 'BEGINNER',
    is_published: false,
    category_id: '',
    instructor_id: '' // Add instructor ID field
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

  // Fetch instructors from API
  const fetchInstructors = async () => {
    try {
      const instructorsData = await instructorService.getAllInstructors();
      setInstructors(instructorsData);
    } catch (err) {
      console.error('Failed to fetch instructors:', err);
    }
  };

  // Fetch existing video series from API
  const fetchExistingVideoSeries = async () => {
    try {
      const data = await courseService.getExistingVideoSeries();
      setExistingVideoSeries(data || []);
    } catch (error) {
      console.error('Error fetching video series:', error);
      setExistingVideoSeries([]); // Set empty array on error
    }
  };

  // Get the next part number for a selected series
  const getNextPartNumber = (seriesName: string) => {
    if (!seriesName) return 1;
    
    const coursesInSeries = courses.filter(course => course.video_series === seriesName);
    if (coursesInSeries.length === 0) return 1;
    
    const maxPart = Math.max(...coursesInSeries.map(course => course.video_part || 1));
    return maxPart + 1;
  };

  // Add function to fetch course statistics
  const fetchCourseStats = async () => {
    try {
      const stats = await courseService.getCourseStats();
      setCourseStats(stats);
    } catch (err) {
      console.error('Failed to fetch course stats:', err);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchInstructors();
    fetchExistingVideoSeries();
    fetchCourseStats(); // Add this line
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

  // Group courses by series
  const groupedCourses = React.useMemo(() => {
    if (!groupBySeries) {
      return { 'All Courses': filteredCourses };
    }

    const grouped: { [key: string]: Course[] } = {};
    const ungrouped: Course[] = [];

    filteredCourses.forEach(course => {
      if (course.video_series && course.video_series.trim()) {
        const seriesName = course.video_series.trim();
        if (!grouped[seriesName]) {
          grouped[seriesName] = [];
        }
        grouped[seriesName].push(course);
      } else {
        ungrouped.push(course);
      }
    });

    // Sort courses within each series by video_part
    Object.keys(grouped).forEach(seriesName => {
      grouped[seriesName].sort((a, b) => (a.video_part || 1) - (b.video_part || 1));
    });

    // Add ungrouped courses
    if (ungrouped.length > 0) {
      grouped['Individual Courses'] = ungrouped;
    }

    return grouped;
  }, [filteredCourses, groupBySeries]);

  // Toggle series expansion
  const toggleSeriesExpansion = (seriesName: string) => {
    const newExpanded = new Set(expandedSeries);
    if (newExpanded.has(seriesName)) {
      newExpanded.delete(seriesName);
    } else {
      newExpanded.add(seriesName);
    }
    setExpandedSeries(newExpanded);
  };

  // Initialize expanded series when grouping changes
  React.useEffect(() => {
    if (groupBySeries) {
      setExpandedSeries(new Set(Object.keys(groupedCourses)));
    }
  }, [groupBySeries]); // Removed groupedCourses from dependencies to prevent infinite loop

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    
    // Set loading state immediately
    setIsCreating(true);
    setError('');
    
    // Validate required fields
    if (!newCourse.title.trim()) {
      setError('Course title is required');
      setIsCreating(false);
      return;
    }
    
    if (!videoFile) {
      setError('Course video is required');
      setIsCreating(false);
      return;
    }

    if (!newCourse.category_id) {
      setError('Please select a category');
      setIsCreating(false);
      return;
    }

    if (!newCourse.instructor_id) {
      setError('Please select an instructor');
      setIsCreating(false);
      return;
    }

    try {
      // Create course with files directly
      const courseDataWithSeries = {
        ...newCourse,
        video_series: videoSeries,
        video_part: videoPart
      };
      
      const createdCourse = await courseService.createCourse(
        courseDataWithSeries,
        thumbnailFile,
        videoFile,
        documentFiles
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
          category_id: '',
          instructor_id: ''
        });
        setThumbnailFile(null);
        setVideoFile(null);
        setDocumentFiles([]);
        setVideoSeries('');
        setVideoPart(1);
        setShowNewSeriesInput(false);
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

  // Category management functions
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setIsCreatingCategory(true);
    try {
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const newCategory = await courseService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim(),
        slug: slug,
        isActive: true
      });

      if (newCategory) {
        setCategories(prev => [...prev, newCategory]);
        setNewCourse(prev => ({ ...prev, category_id: newCategory.category_id }));
        setNewCategoryName('');
        setNewCategoryDescription('');
        setShowAddCategory(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This will affect all courses in this category.`)) return;

    try {
      // First, check if any courses are using this category
      const coursesInCategory = courses.filter(course => course.category_id === categoryId);
      if (coursesInCategory.length > 0) {
        setError(`Cannot delete category "${categoryName}" because ${coursesInCategory.length} course(s) are using it. Please reassign or delete those courses first.`);
        return;
      }

      // Delete the category
      const success = await courseService.deleteCategory(categoryId);
      if (success) {
        setCategories(prev => prev.filter(cat => cat.category_id !== categoryId));
        // If the deleted category was selected, clear the selection
        if (newCourse.category_id === categoryId) {
          setNewCourse(prev => ({ ...prev, category_id: '' }));
        }
      } else {
        setError('Failed to delete category');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{courseStats.total}</p>
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
                {courseStats.totalStudents}
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
                {courseStats.published}
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
                ${courseStats.revenue.toLocaleString()}
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
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            
            <button
              onClick={() => setGroupBySeries(!groupBySeries)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                groupBySeries
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {groupBySeries ? 'Ungroup Series' : 'Group by Series'}
            </button>
          </div>
        </div>
      </Card>

      {/* Courses Display */}
      {groupBySeries ? (
        <div className="space-y-6">
          {Object.entries(groupedCourses).map(([seriesName, seriesCourses]) => (
            <Card key={seriesName} variant="default" padding="lg">
              <div 
                className="flex items-center justify-between cursor-pointer mb-4"
                onClick={() => toggleSeriesExpansion(seriesName)}
              >
                <div className="flex items-center gap-3">
                  <div className={`transform transition-transform ${
                    expandedSeries.has(seriesName) ? 'rotate-90' : ''
                  }`}>
                    <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {seriesName}
                  </h2>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {seriesCourses.length} course{seriesCourses.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {expandedSeries.has(seriesName) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {seriesCourses.map((course, index) => (
                    <Card key={course.course_id} variant="default" className={`hover:shadow-lg transition-shadow animate-slide-in-right delay-${index}`}>
                      <div className="p-6">
                        {course.video_part && (
                          <div className="mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs rounded-full">
                              Part {course.video_part}
                            </span>
                          </div>
                        )}
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
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Instructor:</span>
                            <span className="ml-1 font-medium text-gray-900 dark:text-white">
                              {course.instructor ? `${course.instructor.first_name} ${course.instructor.last_name}` : 'N/A'}
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
              )}
            </Card>
          ))}
        </div>
      ) : (
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
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Instructor:</span>
                    <span className="ml-1 font-medium text-gray-900 dark:text-white">
                      {course.instructor ? `${course.instructor.first_name} ${course.instructor.last_name}` : 'N/A'}
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
      )}

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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in relative">
            {/* Loading overlay */}
            {isCreating && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10 rounded-xl">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 flex flex-col items-center">
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600 dark:text-gray-400">Creating course...</p>
                </div>
              </div>
            )}
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
              {/* Disable all inputs when creating */}
              <fieldset disabled={isCreating} className="space-y-4">
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
                <div className="mt-1">
                  <select
                    id="category"
                    className="block w-full input"
                    value={newCourse.category_id || ''}
                    onChange={(e) => setNewCourse({ ...newCourse, category_id: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category.category_id} value={category.category_id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Category Actions */}
                <div className="mt-2 flex items-center space-x-3">
                  {/* Delete button for selected category */}
                  {newCourse.category_id && (
                    <button
                      type="button"
                      onClick={() => {
                        const selectedCategory = categories.find(cat => cat.category_id === newCourse.category_id);
                        if (selectedCategory) {
                          handleDeleteCategory(selectedCategory.category_id, selectedCategory.name);
                        }
                      }}
                      className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center"
                      title="Delete this category"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Category
                    </button>
                  )}
                  
                  {/* Add Category Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {showAddCategory ? 'Cancel' : 'Add New Category'}
                  </button>
                </div>

                {/* Add Category Form */}
                {showAddCategory && (
                  <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Create New Category</h4>
                    <div className="space-y-3">
                      <div>
                        <label htmlFor="newCategoryName" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Category Name *</label>
                        <input
                          type="text"
                          id="newCategoryName"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter category name"
                          disabled={isCreatingCategory}
                        />
                      </div>
                      <div>
                        <label htmlFor="newCategoryDescription" className="block text-xs font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
                        <textarea
                          id="newCategoryDescription"
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                          placeholder="Enter category description"
                          rows={2}
                          disabled={isCreatingCategory}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddCategory(false);
                            setNewCategoryName('');
                            setNewCategoryDescription('');
                          }}
                          className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          disabled={isCreatingCategory}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim()}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {isCreatingCategory ? (
                            <>
                              <LoadingSpinner size="sm" />
                              <span className="ml-1">Creating...</span>
                            </>
                          ) : (
                            'Create Category'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructor</label>
                <select
                  id="instructor"
                  className="mt-1 block w-full input"
                  value={newCourse.instructor_id}
                  onChange={(e) => setNewCourse({ ...newCourse, instructor_id: e.target.value })}
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.instructor_id} value={instructor.instructor_id}>
                      {instructor.first_name} {instructor.last_name} - {instructor.specialties.join(', ')}
                    </option>
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
              {/* Video Series/Grouping Section */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="videoSeries" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Video Series (Optional)</label>
                  <div className="mt-1">
                    {!showNewSeriesInput ? (
                      <div className="space-y-2">
                        <select
                          id="videoSeries"
                          className="block w-full input"
                          value={videoSeries}
                          onChange={(e) => {
                            const selectedSeries = e.target.value;
                            setVideoSeries(selectedSeries);
                            if (selectedSeries) {
                              setVideoPart(getNextPartNumber(selectedSeries));
                            } else {
                              setVideoPart(1);
                            }
                          }}
                        >
                          <option value="">Select existing series or create new</option>
                          {existingVideoSeries.map(series => (
                            <option key={series} value={series}>{series}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setShowNewSeriesInput(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create New Series
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          id="newVideoSeries"
                          className="block w-full input"
                          value={videoSeries}
                          onChange={(e) => setVideoSeries(e.target.value)}
                          placeholder="Enter new series name"
                        />
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowNewSeriesInput(false);
                              setVideoSeries('');
                            }}
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowNewSeriesInput(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Use This Series
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Group related videos together. Users will get access to all parts when they purchase any part of the series.
                  </p>
                </div>
                
                {videoSeries && (
                  <div>
                    <label htmlFor="videoPart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Part Number</label>
                    <input
                      type="number"
                      id="videoPart"
                      className="mt-1 block w-full input"
                      value={videoPart}
                      onChange={(e) => setVideoPart(parseInt(e.target.value) || 1)}
                      min="1"
                      placeholder="1"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      This is part {videoPart} of the "{videoSeries}" series.
                    </p>
                  </div>
                )}
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

              <div>
                <label htmlFor="documents" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course Documents</label>
                <input
                  type="file"
                  id="documents"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  onChange={(e) => setDocumentFiles(e.target.files ? Array.from(e.target.files) : [])}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Upload PDF, Word documents, or text files. You can select multiple files.
                </p>
                {documentFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {documentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setDocumentFiles(documentFiles.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
              </fieldset>
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
                  <span className="text-gray-500 dark:text-gray-400">Instructor:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">
                    {selectedCourse.instructor ? `${selectedCourse.instructor.first_name} ${selectedCourse.instructor.last_name}` : 'N/A'}
                  </span>
                  {/* Debug info */}
                  <div className="text-xs text-gray-400">
                  </div>
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
              
              {/* Course Documents Section */}
              {selectedCourse.course_documents && selectedCourse.course_documents.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Course Documents</h4>
                  <div className="space-y-2">
                    {selectedCourse.course_documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {doc.filename}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {doc.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                              Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <label htmlFor="edit-instructor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Instructor</label>
                <select
                  id="edit-instructor"
                  className="mt-1 block w-full input"
                  value={editedCourse.instructor_id || ''}
                  onChange={(e) => setEditedCourse({ ...editedCourse, instructor_id: e.target.value })}
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor.instructor_id} value={instructor.instructor_id}>
                      {instructor.first_name} {instructor.last_name} - {instructor.specialties.join(', ')}
                    </option>
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
