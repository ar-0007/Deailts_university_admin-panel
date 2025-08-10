// src/pages/Submissions/Submissions.tsx
import React, { useState, useEffect } from 'react';
import { DocumentTextIcon, AcademicCapIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { GradeSubmissionModal } from '../../components/GradeSubmissionModal';
import submissionService, { type Submission } from '../../services/submissionService';

const Submissions: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'graded'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await submissionService.getAllSubmissions();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setIsGradeModalOpen(true);
  };

  const handleGradeSuccess = (gradedSubmission: Submission) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.submission_id === gradedSubmission.submission_id 
          ? { ...gradedSubmission, status: 'graded' as const }
          : sub
      )
    );
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesStatus = filterStatus === 'all' || submission.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      submission.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.assignment?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'late':
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      default:
        return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'graded':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'late':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Submissions</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage and grade student submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <AcademicCapIcon className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Submissions</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{submissions.length}</p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Graded</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'graded').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.status === 'submitted').length}
              </p>
            </div>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AcademicCapIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Grade</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {submissions.filter(s => s.grade !== undefined).length > 0
                  ? (submissions
                      .filter(s => s.grade !== undefined)
                      .reduce((sum, s) => sum + (s.grade || 0), 0) / 
                      submissions.filter(s => s.grade !== undefined).length
                    ).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card variant="default" padding="lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by student name, email, or assignment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'submitted' | 'graded')}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending</option>
              <option value="graded">Graded</option>
            </select>
            <Button variant="outline" onClick={fetchSubmissions}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Card variant="default" padding="lg">
          <div className="text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        </Card>
      )}

      {/* Submissions List */}
      {filteredSubmissions.length > 0 ? (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.submission_id} variant="default" padding="lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(submission.status)}
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {submission.assignment?.title || 'Unknown Assignment'}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(submission.status)}`}>
                      {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Student:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {submission.user?.first_name || 'Unknown'} {submission.user?.last_name || 'User'}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">{submission.user?.email || 'No email'}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submitted:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {new Date(submission.submitted_at).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Grade:</span>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {submission.grade !== undefined 
                          ? `${submission.grade}/${submission.assignment?.max_score || 100}` 
                          : 'Not graded'
                        }
                      </p>
                      {submission.graded_at && (
                        <p className="text-gray-500 dark:text-gray-400">
                          Graded: {new Date(submission.graded_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Submission:</span>
                      <div className="space-y-1">
                        {submission.submission_text && (
                          <p className="text-gray-900 dark:text-white text-xs">
                            Text: {submission.submission_text.substring(0, 50)}...
                          </p>
                        )}
                        {submission.cloudinary_url && (
                          <a
                            href={submission.cloudinary_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-xs underline"
                          >
                            View File
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Feedback:</span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">{submission.feedback}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  <Button
                    variant={submission.status === 'graded' ? 'outline' : 'primary'}
                    onClick={() => handleGradeSubmission(submission)}
                  >
                    {submission.status === 'graded' ? 'Edit Grade' : 'Grade'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card variant="default" padding="xl">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No submissions have been made yet.'}
            </p>
          </div>
        </Card>
      )}

      {/* Grade Submission Modal */}
      {selectedSubmission && (
        <GradeSubmissionModal
          isOpen={isGradeModalOpen}
          onClose={() => {
            setIsGradeModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          onGradeSuccess={handleGradeSuccess}
        />
      )}
    </div>
  );
};

export default Submissions;