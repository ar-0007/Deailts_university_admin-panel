import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  // XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  // CalendarIcon,
  // UserIcon,
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
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedAssignment, setEditedAssignment] = useState<Assignment | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Add is_published to the form state
  const [newAssignment, setNewAssignment] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    course_id: '',
    max_score: 100,
    due_date: '',
    is_published: true
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

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowViewModal(true);
  };
  const handleEditAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditedAssignment({ ...assignment }); // Create a copy for editing
    setShowEditModal(true);
  };

  const handleUpdateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedAssignment) return;

    try {
      setLoading(true);
      setError("");
      const updatedAssignment = await assignmentService.updateAssignment(editedAssignment.assignment_id, editedAssignment);
      if (updatedAssignment) {
        setAssignments(prev => prev.map(assignment => assignment.assignment_id === updatedAssignment.assignment_id ? updatedAssignment : assignment));
        setShowEditModal(false);
        setSelectedAssignment(null);
        setEditedAssignment(null);
      } else {
        setError("Failed to update assignment.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to update assignment.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!newAssignment.title.trim()) {
      setError("Assignment title is required");
      return;
    }

    if (!newAssignment.course_id) {
      setError("Course selection is required");
      return;
    }

    setIsCreating(true);
    setIsUploading(true);
    setError("");

    try {
      let assignment_file_url = "";

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
        assignment_file_url,
      };

      const createdAssignment = await assignmentService.createAssignment(assignmentData);
      if (createdAssignment) {
        setAssignments((prev) => [createdAssignment, ...prev]);
        setShowAddModal(false);
        setNewAssignment({
          title: "",
          description: "",
          course_id: "",
          max_score: 100,
          due_date: "",
        });
        setAssignmentFile(null);
        setUploadProgress(0);
      } else {
        setError("Failed to create assignment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create assignment");
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

  // Update the getStatusBadge function to use is_published
  const getStatusBadge = (isPublished: boolean) => {
    const statusStyles = isPublished
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}>
        {isPublished ? 'Published' : 'Draft'}
      </span>
    );
  };

  // Update the filtering logic to include status filtering
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'published' ? assignment.is_published : !assignment.is_published);

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
      withDueDate: assignments.filter(a => a.due_date).length,
      withFiles: assignments.filter(a => a.assignment_file_url).length,
      totalMaxScore: assignments.reduce((sum, a) => sum + (a.max_score || 0), 0)
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Assignments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{assignments.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Due Date</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.filter(a => a.due_date).length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DocumentTextIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">With Files</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.filter(a => a.assignment_file_url).length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Points</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {assignments.reduce((sum, a) => sum + (a.max_score || 0), 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>



      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
            >
              Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'submissions'
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
              className="input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
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
                      Title :   {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Course : {assignment.courses?.title || 'No course'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                       Description : {assignment.description}
                      </p>
                    </div>
                    {getStatusBadge(assignment.is_published)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
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
                        {assignment.submissions_count || 0}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Graded:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {assignment.graded_count || 0}/{assignment.submissions_count || 0}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewAssignment(assignment)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditAssignment(assignment)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment.assignment_id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredSubmissions.map((submission) => (
                <div key={submission.submission_id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {submission.assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Submitted by: {submission.user.first_name} {submission.user.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        Email: {submission.user.email}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      submission.status === 'graded' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : submission.status === 'late'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {submission.status || 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted At:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {new Date(submission.submitted_at).toLocaleDateString()} {new Date(submission.submitted_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Score:</span>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {submission.score !== undefined ? `${submission.score}/${submission.assignment.max_score}` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      {/* Add view/edit/grade submission buttons here if needed */}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredAssignments.length === 0 && activeTab === 'assignments' && (
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No assignments found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Get started by creating your first assignment.'}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => setShowAddModal(true)}
                    icon={<PlusIcon className="w-5 h-5" />}
                  >
                    Create Assignment
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {filteredSubmissions.length === 0 && activeTab === 'submissions' && (
            <Card variant="default" padding="xl">
              <div className="text-center py-12">
                <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'No submissions available yet.'}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Assignment</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  id="title"
                  className="mt-1 block w-full input"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  rows={3}
                  className="mt-1 block w-full input"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Course</label>
                <select
                  id="course"
                  className="mt-1 block w-full input"
                  value={newAssignment.course_id}
                  onChange={(e) => setNewAssignment({ ...newAssignment, course_id: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course.course_id} value={course.course_id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="max-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Score</label>
                  <input
                    type="number"
                    id="max-score"
                    className="mt-1 block w-full input"
                    value={newAssignment.max_score}
                    onChange={(e) => setNewAssignment({ ...newAssignment, max_score: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <input
                    type="date"
                    id="due-date"
                    className="mt-1 block w-full input"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="assignment-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignment File</label>
                <input
                  type="file"
                  id="assignment-file"
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => setAssignmentFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUploading}>
                  {isCreating ? <LoadingSpinner size="sm" /> : 'Create Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Assignment Modal */}
      {showViewModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Assignment Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedAssignment.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Course: {selectedAssignment.courses?.title || 'N/A'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{selectedAssignment.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Max Score:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedAssignment.max_score}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{selectedAssignment.due_date ? new Date(selectedAssignment.due_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Created:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{new Date(selectedAssignment.created_at).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Updated:</span>
                  <span className="ml-1 font-medium text-gray-900 dark:text-white">{new Date(selectedAssignment.updated_at).toLocaleDateString()}</span>
                </div>
                {selectedAssignment.assignment_file_url && (
                  <div className="col-span-2">
                    <span className="text-gray-500 dark:text-gray-400">Assignment File:</span>
                    <a
                      href={selectedAssignment.assignment_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 text-blue-600 hover:underline"
                    >
                      View File
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && editedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Assignment</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateAssignment} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input
                  type="text"
                  id="edit-title"
                  className="mt-1 block w-full input"
                  value={editedAssignment.title}
                  onChange={(e) => setEditedAssignment({ ...editedAssignment, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="edit-description"
                  rows={3}
                  className="mt-1 block w-full input"
                  value={editedAssignment.description}
                  onChange={(e) => setEditedAssignment({ ...editedAssignment, description: e.target.value })}
                  required
                ></textarea>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-max-score" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Score</label>
                  <input
                    type="number"
                    id="edit-max-score"
                    className="mt-1 block w-full input"
                    value={editedAssignment.max_score}
                    onChange={(e) => setEditedAssignment({ ...editedAssignment, max_score: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="edit-due-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                  <input
                    type="date"
                    id="edit-due-date"
                    className="mt-1 block w-full input"
                    value={editedAssignment.due_date ? new Date(editedAssignment.due_date).toISOString().split("T")[0] : ""}
                    onChange={(e) => setEditedAssignment({ ...editedAssignment, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="published"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={newAssignment.is_published || false}
                  onChange={(e) => setNewAssignment({ ...newAssignment, is_published: e.target.checked })}
                />
                <label htmlFor="published" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Published</label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : "Save Changes"}
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


