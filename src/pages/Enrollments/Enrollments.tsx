import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  // FunnelIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  // BookOpenIcon,
  // CalendarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  // EyeIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';
import enrollmentService, { type Enrollment, type GuestCoursePurchase } from '../../services/enrollmentService';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const Enrollments: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [guestPurchases, setGuestPurchases] = useState<GuestCoursePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'enrollments' | 'guest-purchases'>('enrollments');
  const [processingEnrollment, setProcessingEnrollment] = useState<string | null>(null);
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<GuestCoursePurchase | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [isUnlockingSeriesAccess, setIsUnlockingSeriesAccess] = useState(false);
  const [unlockResult, setUnlockResult] = useState<{ message: string; processed: number; unlocked: number } | null>(null);

  // Fetch enrollments from API
  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, guestPurchasesData] = await Promise.all([
        enrollmentService.getAllEnrollments(),
        enrollmentService.getAllGuestCoursePurchases()
      ]);
      setEnrollments(enrollmentsData);
      setGuestPurchases(guestPurchasesData);
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

  // Guest Purchase Modal Functions
  const openPurchaseModal = (purchase: GuestCoursePurchase) => {
    setSelectedPurchase(purchase);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedPurchase(null);
  };

  // Handle guest purchase approval
  const handleApprovePurchase = async () => {
    if (!selectedPurchase) return;
    
    if (!confirm('Are you sure you want to approve this purchase? This will change the payment status to PAID.')) return;

    setProcessingPurchase(selectedPurchase.purchase_id);
    try {
      const updatedPurchase = await enrollmentService.updateGuestCoursePurchaseStatus(
        selectedPurchase.purchase_id,
        'PAID'
      );
      
      if (updatedPurchase) {
        setGuestPurchases(prev => 
          prev.map(purchase => 
            purchase.purchase_id === selectedPurchase.purchase_id 
              ? { ...purchase, payment_status: 'PAID' }
              : purchase
          )
        );
        alert('Purchase approved successfully! Payment status updated to PAID.');
        closeModal();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve purchase');
      alert('Failed to approve purchase. Please try again.');
    } finally {
      setProcessingPurchase(null);
    }
  };

  // Handle sending credentials
  const handleSendCredentials = async () => {
    if (!selectedPurchase) return;
    
    if (!confirm('Send credentials email to the customer? This will create a user account if one doesn\'t exist.')) return;

    setProcessingPurchase(selectedPurchase.purchase_id);
    try {
      await enrollmentService.sendGuestPurchaseCredentials(selectedPurchase.purchase_id);
      alert('Credentials email sent successfully!');
      closeModal();
    } catch (err: any) {
      setError(err.message || 'Failed to send credentials');
      alert('Failed to send credentials. Please try again.');
    } finally {
      setProcessingPurchase(null);
    }
  };

  // Handle comprehensive series unlock
  const handleTriggerSeriesUnlock = async () => {
    if (!confirm('This will check all customer purchases and unlock missing series parts. This may take a few moments. Continue?')) {
      return;
    }

    setIsUnlockingSeriesAccess(true);
    setUnlockResult(null);
    try {
      const result = await enrollmentService.triggerComprehensiveSeriesUnlock();
      setUnlockResult(result);
      alert(`Series unlock completed!\n\nProcessed: ${result.processed} customers\nNew courses unlocked: ${result.unlocked}\n\n${result.message}`);
    } catch (err: any) {
      setError(err.message || 'Failed to trigger series unlock');
      alert('Failed to trigger series unlock. Please try again.');
    } finally {
      setIsUnlockingSeriesAccess(false);
    }
  };

  const filteredEnrollments = enrollments.filter(enrollment => {
    const matchesSearch = !searchTerm || 
      (enrollment.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (enrollment.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (enrollment.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (enrollment.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = filterStatus === 'all' || enrollment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const filteredGuestPurchases = guestPurchases.filter(purchase => {
    const matchesSearch = !searchTerm ||
      purchase.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.course?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.access_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || purchase.payment_status === filterStatus;
    
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

    const IconComponent = statusIcons[status as keyof typeof statusIcons] || ClockIcon;
    const statusStyle = statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };



  const getStats = () => {
    const enrollmentStats = {
      total: enrollments.length,
      pending: enrollments.filter(e => e.status === 'pending').length,
      approved: enrollments.filter(e => e.status === 'approved').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      revenue: enrollments
        .filter(e => e.status === 'approved' || e.status === 'completed')
        .reduce((sum, e) => sum + e.course.price, 0)
    };

    const guestPurchaseStats = {
      total: guestPurchases.length,
      pending: guestPurchases.filter(p => p.payment_status === 'PENDING').length,
      paid: guestPurchases.filter(p => p.payment_status === 'PAID').length,
      failed: guestPurchases.filter(p => p.payment_status === 'FAILED').length,
      revenue: guestPurchases
        .filter(p => p.payment_status === 'PAID')
        .reduce((sum, p) => sum + p.course_price, 0)
    };

    return {
      enrollments: enrollmentStats,
      guestPurchases: guestPurchaseStats,
      combined: {
        total: enrollmentStats.total + guestPurchaseStats.total,
        revenue: enrollmentStats.revenue + guestPurchaseStats.revenue
      }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enrollments & Purchases</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage student course enrollments and guest course purchases
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button
            onClick={handleTriggerSeriesUnlock}
            disabled={isUnlockingSeriesAccess}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isUnlockingSeriesAccess ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <LockOpenIcon className="w-4 h-4 mr-2" />
                Unlock Series Access
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Series Unlock Info */}
      {unlockResult && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Series Unlock Completed
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Processed {unlockResult.processed} customers and unlocked {unlockResult.unlocked} new courses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'enrollments'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Regular Enrollments ({stats.enrollments.total})
          </button>
          <button
            onClick={() => setActiveTab('guest-purchases')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'guest-purchases'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Guest Purchases ({stats.guestPurchases.total})
          </button>
        </nav>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'enrollments' ? stats.enrollments.total : stats.guestPurchases.total}
              </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'enrollments' ? stats.enrollments.pending : stats.guestPurchases.pending}
              </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'enrollments' ? stats.enrollments.approved : stats.guestPurchases.paid}
              </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {activeTab === 'enrollments' ? stats.enrollments.completed : stats.guestPurchases.failed}
              </p>
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
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${(activeTab === 'enrollments' ? stats.enrollments.revenue : stats.guestPurchases.revenue).toLocaleString()}
              </p>
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
                placeholder={activeTab === 'enrollments' ? "Search students or courses..." : "Search customers, courses, or access codes..."}
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
            {activeTab === 'enrollments' ? (
              <>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
              </>
            ) : (
              <>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Enrollments Table */}
      {activeTab === 'enrollments' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Regular Enrollments</h3>
          </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
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
                  Actions
                </th>
              </tr>
            </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEnrollments.map((enrollment) => (
                  <tr key={enrollment.enrollment_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {enrollment.user?.first_name || 'N/A'} {enrollment.user?.last_name || ''}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {enrollment.user?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{enrollment.course?.title || 'N/A'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">${enrollment.course?.price || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(enrollment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(enrollment.requested_at).toLocaleDateString()}
                  </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {enrollment.status === 'pending' && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApproveEnrollment(enrollment.enrollment_id)}
                            disabled={processingEnrollment === enrollment.enrollment_id}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                          >
                            {processingEnrollment === enrollment.enrollment_id ? 'Processing...' : 'Approve'}
                          </Button>
                          <Button
                            onClick={() => handleRejectEnrollment(enrollment.enrollment_id)}
                          disabled={processingEnrollment === enrollment.enrollment_id}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                          >
                            {processingEnrollment === enrollment.enrollment_id ? 'Processing...' : 'Reject'}
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Guest Purchases Table */}
      {activeTab === 'guest-purchases' && (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Guest Course Purchases</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Access Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Purchased
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredGuestPurchases.map((purchase) => (
                  <tr 
                    key={purchase.purchase_id} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => openPurchaseModal(purchase)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {purchase.customer_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {purchase.customer_email}
                          </div>
                          {purchase.customer_phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {purchase.customer_phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {purchase.course?.title || 'Course Title N/A'}
                      </div>
                      {purchase.course?.instructor && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          by {purchase.course.instructor.first_name} {purchase.course.instructor.last_name}
                      </div>
                    )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        purchase.payment_status === 'PAID' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : purchase.payment_status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : purchase.payment_status === 'FAILED'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {purchase.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${purchase.course_price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                        {purchase.access_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(purchase.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Card>
      )}

      {activeTab === 'enrollments' && filteredEnrollments.length === 0 && (
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

      {activeTab === 'guest-purchases' && filteredGuestPurchases.length === 0 && (
        <div className="text-center py-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No guest purchases found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterStatus !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'No guest course purchases have been made yet.'}
          </p>
        </div>
      )}

      {/* Guest Purchase Modal */}
      {showModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Guest Purchase Details
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Customer Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Name:</strong> {selectedPurchase.customer_name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Email:</strong> {selectedPurchase.customer_email}
                  </p>
                  {selectedPurchase.customer_phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Phone:</strong> {selectedPurchase.customer_phone}
                    </p>
                  )}
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Course Information</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Course:</strong> {selectedPurchase.course?.title || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Price:</strong> ${selectedPurchase.course_price}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Access Code:</strong> 
                    <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded ml-1">
                      {selectedPurchase.access_code}
                    </span>
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Payment Status</h4>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedPurchase.payment_status === 'PAID' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : selectedPurchase.payment_status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : selectedPurchase.payment_status === 'FAILED'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {selectedPurchase.payment_status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col space-y-2">
                {/* Show Approve button only for PENDING status */}
                {selectedPurchase.payment_status === 'PENDING' && (
                  <Button
                    onClick={handleApprovePurchase}
                    disabled={processingPurchase === selectedPurchase.purchase_id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {processingPurchase === selectedPurchase.purchase_id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CheckIcon className="w-4 h-4 mr-2" />
                        Approve Purchase
                      </>
                    )}
                  </Button>
                )}
                
                {/* Show Send Credentials button only for PAID status */}
                {selectedPurchase.payment_status === 'PAID' && (
                  <Button
                    onClick={handleSendCredentials}
                    disabled={processingPurchase === selectedPurchase.purchase_id}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {processingPurchase === selectedPurchase.purchase_id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <UserIcon className="w-4 h-4 mr-2" />
                        Send Credentials
                      </>
                    )}
                  </Button>
                )}
                

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Enrollments;

