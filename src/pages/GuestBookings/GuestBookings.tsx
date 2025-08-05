import React, { useState, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../../components/ui';
import guestBookingService, { GuestBooking, UpdateBookingStatusData } from '../../services/guestBookingService';

const GuestBookings: React.FC = () => {
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingBooking, setUpdatingBooking] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, [selectedStatus]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let params: any = {};
      
      if (selectedStatus !== 'all') {
        if (['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(selectedStatus)) {
          params.bookingStatus = selectedStatus;
        } else {
          params.paymentStatus = selectedStatus;
        }
      }
      
      const data = await guestBookingService.getAllBookings(params);
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await guestBookingService.getBookingStats();
      setStats(data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string, meetingLink?: string) => {
    try {
      setUpdatingBooking(bookingId);
      const statusData: UpdateBookingStatusData = {
        bookingStatus: newStatus as any,
        meetingLink
      };
      
      await guestBookingService.updateBookingStatus(bookingId, statusData);
      await fetchBookings(); // Refresh the list
      await fetchStats(); // Refresh stats
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdatingBooking(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      await guestBookingService.deleteBooking(bookingId);
      await fetchBookings();
      await fetchStats();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status: string, type: 'booking' | 'payment') => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      PAID: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  if (loading && !bookings.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Guest Bookings</h1>
        <Button onClick={fetchBookings} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${stats.totalRevenue}</div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Bookings</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Payment Failed</option>
          </select>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Bookings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.guest_booking_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {booking.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer_email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.customer_phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        className="h-8 w-8 rounded-full mr-3"
                        src={booking.instructor?.profile_image_url || 'https://via.placeholder.com/32'}
                        alt=""
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.instructor?.first_name} {booking.instructor?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.instructor?.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">
                        {formatDate(booking.preferred_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTime(booking.preferred_time)}
                      </div>
                      {booking.message && (
                        <div className="text-xs text-gray-400 mt-1">
                          "{booking.message.substring(0, 50)}..."
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${booking.session_price}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {getStatusBadge(booking.booking_status, 'booking')}
                      {getStatusBadge(booking.payment_status, 'payment')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col space-y-2">
                      {booking.booking_status === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.guest_booking_id, 'CONFIRMED')}
                            disabled={updatingBooking === booking.guest_booking_id}
                          >
                            {updatingBooking === booking.guest_booking_id ? 'Updating...' : 'Confirm'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(booking.guest_booking_id, 'CANCELLED')}
                            disabled={updatingBooking === booking.guest_booking_id}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.booking_status === 'CONFIRMED' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(booking.guest_booking_id, 'COMPLETED')}
                          disabled={updatingBooking === booking.guest_booking_id}
                        >
                          {updatingBooking === booking.guest_booking_id ? 'Updating...' : 'Mark Complete'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(booking.guest_booking_id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {bookings.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No guest bookings found.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default GuestBookings; 