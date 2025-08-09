import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardStats, User, Enrollment, MentorshipBooking, Assignment, Course } from '../../types';
import dashboardService from '../../services/dashboardService';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined | null): string => {
    return (value ?? 0).toLocaleString();
  };
  const [enrollments, setEnrollments] = useState<(Enrollment & { user: User; course: Course })[]>([]);
  const [upcomingMentorshipSessions, setUpcomingMentorshipSessions] = useState<(MentorshipBooking & { user: User; mentor: User })[]>([]);
  const [recentAssignments, setRecentAssignments] = useState<(Assignment & { course: Course })[]>([]);
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch dashboard stats
        try {
          const statsResponse = await dashboardService.getDashboardStats();
          setDashboardStats(statsResponse.data);
        } catch (error: any) {
          console.error('Error fetching dashboard stats:', error);
          setError('Failed to fetch dashboard statistics. Please check your authentication.');
        }
        
        // Fetch recent enrollments
        try {
          const enrollmentsResponse = await dashboardService.getRecentEnrollments(5);
          if (enrollmentsResponse.success) {
            setEnrollments(enrollmentsResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch enrollments:', error);
        }
        
        // Fetch upcoming mentorship sessions
        try {
          const mentorshipResponse = await dashboardService.getUpcomingMentorshipSessions(5);
          if (mentorshipResponse.success) {
            setUpcomingMentorshipSessions(mentorshipResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch mentorship sessions:', error);
        }
        
        // Fetch recent assignments
        try {
          const assignmentsResponse = await dashboardService.getRecentAssignments(5);
          if (assignmentsResponse.success) {
            setRecentAssignments(assignmentsResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch recent assignments:', error);
        }
        
        // Fetch revenue overview
        try {
          const revenueResponse = await dashboardService.getRevenueOverview(6);
          if (revenueResponse.success) {
            setRevenueData(revenueResponse.data);
          }
        } catch (error: any) {
          console.error('Failed to fetch revenue overview:', error);
        }
        
      } catch (err: any) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center space-y-6 p-8">
          {/* Animated Logo/Icon */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          
          {/* Loading Text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 animate-pulse">
              Loading Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Preparing your analytics and insights...
            </p>
          </div>
          
          {/* Progress Dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
          
          {/* Loading Bar */}
          <div className="w-64 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  // Use actual data from API with proper null checks
  const stats: DashboardStats = {
    totalUsers: dashboardStats?.totalUsers ?? 0,
    totalCourses: dashboardStats?.totalCourses ?? 0,
    totalEnrollments: dashboardStats?.totalEnrollments ?? 0,
    totalMentorshipBookings: dashboardStats?.totalMentorshipBookings ?? 0,
    pendingAssignments: dashboardStats?.pendingAssignments ?? 0,
    totalRevenue: dashboardStats?.totalRevenue ?? 0
  };

  // Use actual data from API
  const recentEnrollmentsData = enrollments || [];
  // Filter only confirmed mentorship sessions
  const upcomingMentorshipData = (upcomingMentorshipSessions || []).filter(session => session.status === 'confirmed');

  // Remove mock data - assignments and revenue data would need separate API endpoints
  // For now, we'll keep these as empty arrays or simple mock data since they're not part of the main dashboard service
  const recentAssignmentsData = recentAssignments || [];
  
  // Use actual revenue data from API or fallback to empty array
  const revenueOverviewData = revenueData.length > 0 ? revenueData : [
    { month: 'Jan', revenue: 0 },
    { month: 'Feb', revenue: 0 },
    { month: 'Mar', revenue: 0 },
    { month: 'Apr', revenue: 0 },
    { month: 'May', revenue: 0 },
    { month: 'Jun', revenue: 0 }
  ];

  return (
    <div className="space-y-3 pt-0 px-4 sm:px-6 lg:px-8">
      {/* Welcome Section - More compact and moved up */}
      <div className="card mb-2 mt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Welcome back, Admin! 👋
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Here's what's happening with Details University today.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards - More compact grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {/* Total Users */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Users</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalUsers)}</p>
            </div>
          </div>
        </div>

        {/* Total Courses */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Courses</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalCourses)}</p>
            </div>
          </div>
        </div>

        {/* Total Enrollments */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Enrollments</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalEnrollments)}</p>
            </div>
          </div>
        </div>

        {/* Mentorship Bookings */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Mentorship</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.totalMentorshipBookings)}</p>
            </div>
          </div>
        </div>

        {/* Pending Assignments */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatNumber(stats.pendingAssignments)}</p>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="card p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${formatNumber(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - Moved up with tighter spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-3 space-y-3">
          {/* Revenue Chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Revenue Overview
            </h2>
            <div className="h-48 flex items-end justify-between space-x-1 px-2">
              {revenueOverviewData.map((data, index) => {
                const maxRevenue = Math.max(...revenueOverviewData.map(d => d.revenue), 1);
                const barHeight = maxRevenue > 0 ? (data.revenue / maxRevenue) * 160 : 0;
                const formattedRevenue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(data.revenue);
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative">
                      <div 
                        className="w-8 sm:w-10 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-300 group-hover:from-blue-700 group-hover:to-blue-500 cursor-pointer"
                        style={{ height: `${Math.max(barHeight, 4)}px` }}
                        title={`${data.month}: ${formattedRevenue}`}
                      ></div>
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {formattedRevenue}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">{data.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Monthly revenue trend (last 6 months)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Total: {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(revenueOverviewData.reduce((sum, data) => sum + data.revenue, 0))}
              </p>
            </div>
          </div>

          {/* Recent Enrollments and Assignments in a row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Recent Enrollments */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Recent Enrollments
              </h2>
              <div className="space-y-1">
                {recentEnrollmentsData.map((enrollment) => (
                  <div key={enrollment.enrollment_id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {(enrollment.user?.first_name || 'U').charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{`${enrollment.user?.first_name || ''} ${enrollment.user?.last_name || ''}`.trim() || 'Unknown User'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{enrollment.course?.title || 'Unknown Course'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-1 py-0.5 text-xs rounded-full ${
                        enrollment.status === 'approved' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Recent Assignments
              </h2>
              <div className="space-y-1">
                {recentAssignmentsData.map((assignment) => (
                  <div key={assignment.assignment_id || assignment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{assignment.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.course?.title || 'Course not specified'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {assignment.submissions?.length || 0} submissions
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {assignment.due_date ? `Due: ${new Date(assignment.due_date).toLocaleDateString()}` : 'No due date'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-3">
          {/* Quick Actions */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Quick Actions
            </h2>
            <div className="space-y-1">
              <button 
                onClick={() => navigate('/courses')}
                className="btn-primary text-left w-full text-xs hover:bg-blue-700 transition-colors"
              >
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Course
              </button>
              <button 
                onClick={() => navigate('/users')}
                className="btn-secondary text-left w-full text-xs hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              <button 
                onClick={() => navigate('/mentorship')}
                className="btn-secondary text-left w-full text-xs hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Mentorship
              </button>
              <button 
                onClick={() => navigate('/assignments')}
                className="btn-secondary text-left w-full text-xs hover:bg-gray-700 transition-colors"
              >
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create Assignment
              </button>
            </div>
          </div>

          {/* Upcoming Mentorship Sessions */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Upcoming Mentorship
            </h2>
            <div className="space-y-1">
              {upcomingMentorshipData.map((session) => (
                <div key={session.booking_id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{`${session.user?.first_name || ''} ${session.user?.last_name || ''}`.trim() || 'Unknown User'}</p>
                    <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    with {`${session.mentor?.first_name || ''} ${session.mentor?.last_name || ''}`.trim() || 'Unknown Mentor'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {session.time_slot}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>



        </div>
      </div>
    </div>
  );
};

export default Dashboard;