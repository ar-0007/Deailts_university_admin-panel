import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  BookOpenIcon,
  CalendarIcon,
  AcademicCapIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import enrollmentService, { type Enrollment } from '../../services/enrollmentService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Fetch enrollments from API
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const enrollmentsData = await enrollmentService.getAllEnrollments();
      setEnrollments(enrollmentsData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  // Handle enrollment approval
  const handleApproveEnrollment = async (enrollmentId: string) => {
    if (!confirm('Are you sure you want to approve this enrollment? User credentials will be sent to their email.')) return;

    setProcessingEnrollment(enrollmentId);
    try {
      const updatedEnrollment = await enrollmentService.approveEnrollment(enrollmentId);
      if (updatedEnrollment) {
        setEnrollments(prev => 
          prev.map(enrollment => 
            enrollment.enrollment_id === enrollmentId 
              ? { ...enrollment, status: 'approved', approved_at: new Date().toISOString() }
              : enrollment
          )
        );
        // Show success message
        alert('Enrollment approved successfully! User credentials have been sent to their email.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve enrollment');
      alert('Failed to approve enrollment. Please try again.');
    } finally {
      setProcessingEnrollment(null);
    }
  };

  // Handle enrollment rejection
  const handleRejectEnrollment = async (enrollmentId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    setProcessingEnrollment(enrollmentId);
    try {
      const updatedEnrollment = await enrollmentService.rejectEnrollment(enrollmentId, reason || undefined);
      if (updatedEnrollment) {
        setEnrollments(prev => 
          prev.map(enrollment => 
            enrollment.enrollment_id === enrollmentId 
              ? { ...enrollment, status: 'rejected' }
              : enrollment
          )
        );
        alert('Enrollment rejected successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject enrollment');
      alert('Failed to reject enrollment. Please try again.');
    } finally {
      setProcessingEnrollment(null);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = 
      enrollment.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      approved: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };

    const statusIcons = {
      pending: ClockIcon,
      approved: CheckIcon,
      rejected: XMarkIcon,
      completed: AcademicCapIcon
    };

    const IconComponent = statusIcons[status as keyof typeof statusIcons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleApprove = (enrollmentId: string) => {
    setEnrollments(prev => 
      prev.map(enrollment => 
        enrollment.enrollment_id === enrollmentId 
          ? { ...enrollment, status: 'approved' as const, approved_at: new Date().toISOString() }
          : enrollment
      )
    );
  };

  const handleReject = (enrollmentId: string) => {
    setEnrollments(prev => 
      prev.map(enrollment => 
        enrollment.enrollment_id === enrollmentId 
          ? { ...enrollment, status: 'rejected' as const }
          : enrollment
      )
    );
  };

  const getStats = () => {
    return {
      total: enrollments.length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      approved: enrollments.filter(e => e.status === 'approved').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      revenue: enrollments
        .filter(e => e.status === 'approved' || e.status === 'completed')
        .reduce((sum, e) => sum + e.course.price, 0)
    };
  };

  const stats = getStats();

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollments</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage student course enrollments and approvals
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <CheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <AcademicCapIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.revenue.toLocaleString()}</p>
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
                placeholder="Search students or courses..."
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEnrollments.map((enrollment) => (
                <tr key={enrollment.enrollment_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {enrollment.user.first_name.charAt(0)}{enrollment.user.last_name.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.user.first_name} {enrollment.user.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {enrollment.course.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {enrollment.course.level.charAt(0).toUpperCase() + enrollment.course.level.slice(1)} Level
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(enrollment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {new Date(enrollment.requested_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    ${enrollment.course.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {enrollment.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveEnrollment(enrollment.enrollment_id)}
                          disabled={processingEnrollment === enrollment.enrollment_id}
                          className={`inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors ${
                            processingEnrollment === enrollment.enrollment_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {processingEnrollment === enrollment.enrollment_id ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                          ) : (
                            <CheckIcon className="w-3 h-3 mr-1" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectEnrollment(enrollment.enrollment_id)}
                          disabled={processingEnrollment === enrollment.enrollment_id}
                          className={`inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors ${
                            processingEnrollment === enrollment.enrollment_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <XMarkIcon className="w-3 h-3 mr-1" />
                          Reject
                        </button>
                      </div>
                    )}
                    {enrollment.status !== 'pending' && (
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        {enrollment.status === 'approved' && enrollment.approved_at && 
                          `Approved ${new Date(enrollment.approved_at).toLocaleDateString()}`
                        }
                        {enrollment.status === 'completed' && enrollment.completed_at && 
                          `Completed ${new Date(enrollment.completed_at).toLocaleDateString()}`
                        }
                        {enrollment.status === 'rejected' && 'Rejected'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEnrollments.length === 0 && (
        <div className="text-center py-12">
          <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No enrollments found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No students have enrolled in courses yet.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Enrollments;

