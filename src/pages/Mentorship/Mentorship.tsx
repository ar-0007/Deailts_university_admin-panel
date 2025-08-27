import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyDollarIcon,
  StarIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import mentorshipService, { type MentorshipRequest } from '../../services/mentorshipService';
import guestBookingService, { type GuestBooking } from '../../services/guestBookingService';
import Button from '../../components/ui/Button';
// import Card from '../../components/ui/Card';
// import LoadingSpinner from '../../components/ui/LoadingSpinner';

// Define booking interface for consistency
interface MentorshipBooking {
  booking_id: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  mentor: {
    first_name: string;
    last_name: string;
    email: string;
  };
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  price: number;
  zoom_link?: string;
}

const Mentorship: React.FC = () => {
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [bookings, setBookings] = useState<MentorshipBooking[]>([]);
  const [guestBookings, setGuestBookings] = useState<GuestBooking[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'requests' | 'bookings' | 'guest-bookings'>('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MentorshipRequest | null>(null);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    duration: 60,
    zoom_link: ''
  });

  // Fetch mentorship requests from API (excluding approved requests)
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const allRequests = await mentorshipService.getAllRequests();
      // Filter out approved requests as they should appear in bookings tab
      const nonApprovedRequests = allRequests.filter(request => request.status !== 'approved');
      setRequests(nonApprovedRequests);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch mentorship requests');
    } finally {
      setLoading(false);
    }
  };



  // Fetch mentorship bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [bookingsData, slotsData] = await Promise.all([
        mentorshipService.getAllBookings(),
        mentorshipService.getAllSlots()
      ]);
      
      // Transform the data to match MentorshipBooking interface
      const transformedBookings: MentorshipBooking[] = bookingsData.map(booking => {
        // Find matching slot for mentor and price information
        const matchingSlot = slotsData.find(slot => 
          slot.date === booking.scheduled_date && 
          slot.time_slot === booking.scheduled_time
        );
        
        return {
          booking_id: booking.request_id,
          user: booking.user,
          mentor: matchingSlot?.mentor || {
            first_name: 'Unknown',
            last_name: 'Mentor',
            email: 'mentor@example.com'
          },
          date: booking.scheduled_date || '',
          time_slot: booking.scheduled_time || '',
          status: booking.status === 'approved' ? 'confirmed' : 
                  booking.status === 'completed' ? 'completed' : 
                  booking.status === 'rejected' ? 'cancelled' : 'pending',
          payment_status: booking.status === 'approved' ? 'paid' : 
                         booking.status === 'completed' ? 'paid' : 
                         booking.status === 'rejected' ? 'refunded' : 'pending',
          price: matchingSlot?.price || 0,
          zoom_link: booking.zoom_link
        };
      });
      setBookings(transformedBookings);
    } catch (err: any) {
      console.error('Failed to fetch bookings:', err);
      setError('Failed to load mentorship bookings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch guest bookings from API
  const fetchGuestBookings = async () => {
    try {
      setLoading(true);
      const guestBookingsData = await guestBookingService.getAllBookings();
      setGuestBookings(guestBookingsData);
    } catch (err: any) {
      console.error('Failed to fetch guest bookings:', err);
      setError('Failed to load guest bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchBookings();
    fetchGuestBookings();
  }, []);

  // Handle mentorship request approval with scheduling
  const handleApproveRequest = (request: MentorshipRequest) => {
    setSelectedRequest(request);
    setShowScheduleModal(true);
  };

  // Handle scheduling confirmation
  const handleScheduleConfirm = async () => {
    if (!selectedRequest) return;

    if (!scheduleData.date || !scheduleData.time) {
      setError('Please provide both date and time for the session');
      return;
    }

    setProcessingRequest(selectedRequest.request_id);
    try {
      const updatedRequest = await mentorshipService.approveRequest(selectedRequest.request_id, {
        scheduled_date: scheduleData.date,
        scheduled_time: scheduleData.time,
        duration_minutes: scheduleData.duration,
        zoom_link: scheduleData.zoom_link || undefined
      });

      if (updatedRequest) {
        // Remove approved request from requests and refresh bookings
        setRequests(prev => prev.filter(request => request.request_id !== selectedRequest.request_id));
        await fetchBookings(); // Refresh bookings to show the new booking
        setShowScheduleModal(false);
        setSelectedRequest(null);
        setScheduleData({ date: '', time: '', duration: 60, zoom_link: '' });
        alert('Mentorship request approved and scheduled successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve mentorship request');
      alert('Failed to approve mentorship request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle mentorship request rejection
  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    setProcessingRequest(requestId);
    try {
      const updatedRequest = await mentorshipService.rejectRequest(requestId, reason || undefined);
      if (updatedRequest) {
        setRequests(prev => 
          prev.map(request => 
            request.request_id === requestId 
              ? { ...request, status: 'rejected' }
              : request
          )
        );
        alert('Mentorship request rejected successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject mentorship request');
      alert('Failed to reject mentorship request. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  // Guest booking handlers
  const handleConfirmGuestBooking = async (bookingId: string) => {
    try {
      setProcessingRequest(bookingId);
      const meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;
      await guestBookingService.updateBookingStatus(bookingId, {
        bookingStatus: 'CONFIRMED',
        meetingLink
      });
      await fetchGuestBookings();
      setError('');
      alert('✅ Guest booking confirmed successfully!\n\n📧 Confirmation emails have been sent to:\n• Customer\n• Instructor\n\n🔗 Meeting link has been generated and included in the emails.');
    } catch (err: any) {
      setError(err.message || 'Failed to confirm booking');
      alert('❌ Failed to confirm booking. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCompleteGuestBooking = async (bookingId: string) => {
    try {
      setProcessingRequest(bookingId);
      await guestBookingService.updateBookingStatus(bookingId, {
        bookingStatus: 'COMPLETED'
      });
      await fetchGuestBookings();
      setError('');
      alert('Guest booking marked as completed!');
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking');
      alert('Failed to complete booking. Please try again.');
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleCancelGuestBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?\n\n📧 Cancellation emails will be sent to the customer and instructor.')) {
      try {
        setProcessingRequest(bookingId);
        await guestBookingService.updateBookingStatus(bookingId, {
          bookingStatus: 'CANCELLED'
        });
        await fetchGuestBookings();
        setError('');
        alert('✅ Guest booking cancelled successfully!\n\n📧 Cancellation emails have been sent to:\n• Customer (with refund information)\n• Instructor (with schedule update)');
      } catch (err: any) {
        setError(err.message || 'Failed to cancel booking');
        alert('❌ Failed to cancel booking. Please try again.');
      } finally {
        setProcessingRequest(null);
      }
    }
  };

  const handleDeleteGuestBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      try {
        setProcessingRequest(bookingId);
        await guestBookingService.deleteBooking(bookingId);
        await fetchGuestBookings();
        setError('');
        alert('Guest booking deleted successfully!');
      } catch (err: any) {
        setError(err.message || 'Failed to delete booking');
        alert('Failed to delete booking. Please try again.');
      } finally {
        setProcessingRequest(null);
      }
    }
  };

    const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-700',
      approved: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-200 border border-green-200 dark:border-green-700',
      rejected: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/50 dark:to-pink-900/50 dark:text-red-200 border border-red-200 dark:border-red-700',
      confirmed: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200 border border-blue-200 dark:border-blue-700',
      completed: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-200 border border-green-200 dark:border-green-700',
      cancelled: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/50 dark:to-pink-900/50 dark:text-red-200 border border-red-200 dark:border-red-700'
    };

    // Convert status to lowercase for consistent lookup
    const statusKey = status.toLowerCase() as keyof typeof statusStyles;
    const style = statusStyles[statusKey] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/50 dark:to-slate-900/50 dark:text-gray-200 border border-gray-200 dark:border-gray-700';

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${style}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 dark:from-amber-900/50 dark:to-yellow-900/50 dark:text-amber-200 border border-amber-200 dark:border-amber-700',
      paid: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/50 dark:to-emerald-900/50 dark:text-green-200 border border-green-200 dark:border-green-700',
      refunded: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/50 dark:to-pink-900/50 dark:text-red-200 border border-red-200 dark:border-red-700',
      failed: 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 dark:from-red-900/50 dark:to-pink-900/50 dark:text-red-200 border border-red-200 dark:border-red-700',
      cancelled: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/50 dark:to-slate-900/50 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
    };

    // Get the style for the status, with fallback for unknown statuses
    const styleKey = status.toLowerCase() as keyof typeof statusStyles;
    const statusStyle = statusStyles[styleKey] || statusStyles.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${statusStyle}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    
    // Only show pending and rejected requests (approved requests should be in bookings)
    const isNotApproved = request.status !== 'approved';
    
    return matchesSearch && matchesStatus && isNotApproved;
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mentor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.mentor.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    
    // Only show bookings with paid payment status (confirmed bookings)
    const isPaidBooking = booking.payment_status === 'paid';
    
    return matchesSearch && matchesStatus && isPaidBooking;
  });

  const getStats = () => {
    return {
      totalRequests: requests.filter(r => r.status !== 'approved').length,
      pendingRequests: requests.filter(r => r.status === 'pending').length,
      approvedRequests: requests.filter(r => r.status === 'approved').length,
      totalBookings: bookings.length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      totalGuestBookings: guestBookings.length,
      pendingGuestBookings: guestBookings.filter(b => b.booking_status === 'PENDING').length,
      confirmedGuestBookings: guestBookings.filter(b => b.booking_status === 'CONFIRMED').length,
      completedGuestBookings: guestBookings.filter(b => b.booking_status === 'COMPLETED').length,

      revenue: bookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, b) => sum + b.price, 0) +
        guestBookings
          .filter(b => b.payment_status === 'PAID')
          .reduce((sum, b) => sum + b.session_price, 0)
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Mentorship Dashboard
          </h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-300 font-medium">
            Manage mentorship requests and bookings with ease
          </p>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <UserGroupIcon className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-300 uppercase tracking-wide">Requests</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/50 dark:to-amber-800/50 rounded-2xl shadow-lg border border-amber-200 dark:border-amber-700 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-lg">
              <ClockIcon className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.pendingRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/50 dark:to-purple-800/50 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-700 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <UserIcon className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-wide">Guest Bookings</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.totalGuestBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/50 dark:to-emerald-800/50 rounded-2xl shadow-lg border border-emerald-200 dark:border-emerald-700 p-6 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
              <CurrencyDollarIcon className="w-7 h-7 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-wide">Revenue</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">${stats.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-1 px-6">
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-4 px-6 font-semibold text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'requests'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center">
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Requests ({requests.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-6 font-semibold text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'bookings'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Bookings ({bookings.length})
              </span>
            </button>
            <button
              onClick={() => setActiveTab('guest-bookings')}
              className={`py-4 px-6 font-semibold text-sm rounded-t-lg transition-all duration-200 ${
                activeTab === 'guest-bookings'
                  ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <span className="flex items-center">
                <UserIcon className="w-4 h-4 mr-2" />
                Guest Bookings ({guestBookings.length})
              </span>
            </button>

          </nav>
        </div>

        <div className="p-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
                />
              </div>
            </div>
            
            {(activeTab === 'requests' || activeTab === 'bookings' || activeTab === 'guest-bookings') && (
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                {activeTab === 'requests' && (
                  <>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </>
                )}
                {activeTab === 'bookings' && (
                  <>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </>
                )}
                {activeTab === 'guest-bookings' && (
                  <>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </>
                )}
              </select>
            )}
          </div>

          {/* Content */}
          {activeTab === 'requests' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Requested Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => (
                    <tr key={request.request_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {request.user.first_name.charAt(0)}{request.user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {request.user.first_name} {request.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {request.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {request.message || 'No message provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(request.requested_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                onClick={() => handleApproveRequest(request)}
                                disabled={processingRequest === request.request_id}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                              >
                                <CheckCircleIcon className="w-3 h-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleRejectRequest(request.request_id)}
                                disabled={processingRequest === request.request_id}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs"
                              >
                                <XCircleIcon className="w-3 h-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'bookings' ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Payment
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
                  {filteredBookings.map((booking) => (
                    <tr key={booking.booking_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {booking.user.first_name.charAt(0)}{booking.user.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {booking.user.first_name} {booking.user.last_name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {booking.user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.mentor.first_name} {booking.mentor.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.mentor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(booking.date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.time_slot}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(booking.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${booking.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {booking.zoom_link && (
                            <a
                              href={booking.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                            >
                              <VideoCameraIcon className="w-3 h-3 mr-1" />
                              Join
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'guest-bookings' ? (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Session Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Booking Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                  {guestBookings
                    .filter(booking => 
                      searchTerm === '' || 
                      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      booking.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      booking.instructor?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      booking.instructor?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .filter(booking => 
                      filterStatus === 'all' || 
                      booking.booking_status.toLowerCase() === filterStatus.toLowerCase() ||
                      booking.payment_status.toLowerCase() === filterStatus.toLowerCase()
                    )
                    .map((booking) => (
                    <tr key={booking.guest_booking_id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-700 dark:hover:to-gray-600 transition-all duration-200">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                            <UserIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              {booking.customer_name}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                              {booking.customer_email}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              {booking.customer_phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {booking.instructor?.first_name} {booking.instructor?.last_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {booking.instructor?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          <div className="flex items-center mb-1">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {new Date(booking.preferred_date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-2" />
                            {booking.preferred_time}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {booking.preferred_topics.join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentBadge(booking.payment_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.booking_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        ${booking.session_price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {booking.payment_status === 'PAID' && booking.booking_status === 'PENDING' && (
                            <Button
                              onClick={() => handleConfirmGuestBooking(booking.guest_booking_id)}
                              disabled={processingRequest === booking.guest_booking_id}
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Confirm
                            </Button>
                          )}
                          {booking.booking_status === 'CONFIRMED' && (
                            <Button
                              onClick={() => handleCompleteGuestBooking(booking.guest_booking_id)}
                              disabled={processingRequest === booking.guest_booking_id}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Complete
                            </Button>
                          )}
                          {booking.booking_status !== 'COMPLETED' && booking.booking_status !== 'CANCELLED' && (
                            <Button
                              onClick={() => handleCancelGuestBooking(booking.guest_booking_id)}
                              disabled={processingRequest === booking.guest_booking_id}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <XCircleIcon className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteGuestBooking(booking.guest_booking_id)}
                            disabled={processingRequest === booking.guest_booking_id}
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <XMarkIcon className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {/* Empty States */}
          {activeTab === 'requests' && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No mentorship requests have been submitted yet.'}
              </p>
            </div>
          )}

          {activeTab === 'bookings' && filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'No mentorship sessions have been booked yet.'}
              </p>
            </div>
          )}

          {activeTab === 'guest-bookings' && guestBookings.length === 0 && (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full flex items-center justify-center mb-6">
                <UserIcon className="h-12 w-12 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Guest Bookings Found</h3>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'No guest mentorship bookings have been submitted yet. They will appear here once customers start booking sessions.'}
              </p>
            </div>
          )}


        </div>
      </div>

      {/* Schedule Session Modal */}
      {showScheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule Mentorship Session</h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Student Details</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedRequest.user.first_name} {selectedRequest.user.last_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">{selectedRequest.user.email}</p>
              </div>

              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Date *
                </label>
                <input
                  id="date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Time *
                </label>
                <input
                  id="time"
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  value={scheduleData.duration}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </select>
              </div>

              <div>
                <label htmlFor="zoom_link" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zoom Link (optional)
                </label>
                <input
                  id="zoom_link"
                  type="url"
                  value={scheduleData.zoom_link}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, zoom_link: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://zoom.us/j/..."
                />
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleScheduleConfirm}
                  disabled={processingRequest === selectedRequest.request_id}
                  className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg ${processingRequest === selectedRequest.request_id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processingRequest === selectedRequest.request_id ? 'Scheduling...' : 'Schedule Session'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mentorship;

