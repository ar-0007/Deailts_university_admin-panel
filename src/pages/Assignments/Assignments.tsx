import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import assignmentService, { type Assignment, type CreateAssignmentData } from '../../services/assignmentService';
import courseService, { type Course } from '../../services/courseService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Submission {
  submission_id: string;
  assignment_id: string;
  user_id: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  assignment: {
    title: string;
    max_score: number;
  };
}

const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assignments' | 'submissions'>('assignments');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form state for new assignment
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    course_id: '',
    max_score: 100,
    due_date: ''
  });

  // Fetch assignments from API
  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const assignmentsData = await assignmentService.getAllAssignments();
      setAssignments(assignmentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for dropdown
  const fetchCourses = async () => {
    try {
      const coursesData = await courseService.getAllCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchCourses();
  }, []);

  // Handle assignment creation
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newAssignment.title.trim()) {
      setError('Assignment title is required');
      return;
    }
    
    if (!newAssignment.course_id) {
      setError('Course selection is required');
      return;
    }

    setIsCreating(true);
    setIsUploading(true);
    setError('');

    try {
      let assignment_file_url = '';

      // Upload assignment file if selected
      if (assignmentFile) {
        setUploadProgress(0);
        const fileResult = await assignmentService.uploadFile(assignmentFile, (progress) => {
          setUploadProgress(progress);
        });
        assignment_file_url = fileResult.url;
      }

      // Create assignment with uploaded file URL
      const assignmentData = {
        ...newAssignment,
        assignment_file_url
      };

      const createdAssignment = await assignmentService.createAssignment(assignmentData);
      if (createdAssignment) {
        setAssignments(prev => [createdAssignment, ...prev]);
        setShowAddModal(false);
        setNewAssignment({
          title: '',
          description: '',
          course_id: '',
          max_score: 100,
          due_date: ''
        });
        setAssignmentFile(null);
        setUploadProgress(0);
      } else {
        setError('Failed to create assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setIsCreating(false);
      setIsUploading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      const success = await assignmentService.deleteAssignment(assignmentId);
      if (success) {
        setAssignments(prev => prev.filter(assignment => assignment.assignment_id !== assignmentId));
      } else {
        setError('Failed to delete assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete assignment');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      closed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      graded: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      late: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = 
      submission.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getAssignmentStats = () => {
    return {
      total: assignments.length,
      published: assignments.filter(a => a.status === 'published').length,
      draft: assignments.filter(a => a.status === 'draft').length,
      totalSubmissions: assignments.reduce((sum, a) => sum + a.submissions_count, 0),
      pendingGrading: assignments.reduce((sum, a) => sum + (a.submissions_count - a.graded_count), 0)
    };
  };

  const getSubmissionStats = () => {
    return {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      graded: submissions.filter(s => s.status === 'graded').length,
      late: submissions.filter(s => s.status === 'late').length,
      averageScore: submissions
        .filter(s => s.score !== undefined)
        .reduce((sum, s, _, arr) => sum + (s.score! / arr.length), 0)
    };
  };

  const assignmentStats = getAssignmentStats();
  const submissionStats = getSubmissionStats();

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage course assignments and student submissions
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Assignment
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignmentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Published</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignmentStats.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Submissions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignmentStats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Grading</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignmentStats.pendingGrading}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <UserIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {submissionStats.averageScore ? Math.round(submissionStats.averageScore) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'submissions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Submissions ({submissions.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={activeTab === 'assignments' ? "Search assignments..." : "Search submissions..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              {activeTab === 'assignments' ? (
                <>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </>
              ) : (
                <>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="late">Late</option>
                </>
              )}
            </select>
          </div>

          {/* Content */}
          {activeTab === 'assignments' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.assignment_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {assignment.course.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {assignment.description}
                      </p>
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(assignment.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Max Score:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assignment.max_score} points
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submissions:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assignment.submissions_count}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Graded:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assignment.graded_count}/{assignment.submissions_count}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
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
                    {assignment.submissions_count > assignment.graded_count && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        {assignment.submissions_count - assignment.graded_count} pending
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assignment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredSubmissions.map((submission) => (
                    <tr key={submission.submission_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {submission.user.first_name.charAt(0)}{submission.user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {submission.user.first_name} {submission.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {submission.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {submission.assignment.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Max: {submission.assignment.max_score} points
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {new Date(submission.submitted_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(submission.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {submission.score !== undefined ? (
                          <span className={`${submission.score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                            {submission.score}/{submission.assignment.max_score}
                          </span>
                        ) : (
                          <span className="text-gray-400">Not graded</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors">
                            <EyeIcon className="w-3 h-3 mr-1" />
                            Review
                          </button>
                          {submission.status === 'submitted' && (
                            <button className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors">
                              Grade
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty States */}
          {activeTab === 'assignments' && filteredAssignments.length === 0 && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by creating your first assignment.'}
              </p>
            </div>
          )}

          {activeTab === 'submissions' && filteredSubmissions.length === 0 && (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No students have submitted assignments yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Assignment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Enter assignment title"
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
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  placeholder="Enter assignment description"
                />
              </div>

              {/* Course Selection */}
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Course *
                </label>
                <select
                  id="course"
                  value={newAssignment.course_id}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, course_id: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.course_id} value={course.course_id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Score and Due Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="maxScore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Score *
                  </label>
                  <input
                    id="maxScore"
                    type="number"
                    min="1"
                    value={newAssignment.max_score}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, max_score: parseInt(e.target.value) || 100 }))}
                    className="input"
                    placeholder="100"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    id="dueDate"
                    type="datetime-local"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>

              {/* Assignment File Upload */}
              <div>
                <label htmlFor="assignmentFile" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assignment File (Image or PDF)
                </label>
                <input
                  id="assignmentFile"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                  className="input"
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Uploading file...</p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">Max file size: 10MB. Supported formats: JPG, PNG, PDF</p>
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
                  disabled={isCreating || isUploading}
                  className={`${isCreating || isUploading ? 'opacity-50 cursor-not-allowed' : ''} min-w-[140px]`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : 'Uploading...'}
                      </span>
                    </div>
                  ) : isCreating ? (
                    'Creating...'
                  ) : (
                    'Create Assignment'
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

export default Assignments;

