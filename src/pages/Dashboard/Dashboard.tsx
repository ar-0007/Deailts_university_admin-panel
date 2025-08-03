import React, { useState, useEffect } from 'react';
import type { DashboardStats, User, Enrollment, MentorshipBooking, Assignment, Course } from '../../types';

const Dashboard: React.FC = () => {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [enrollments, setEnrollments] = useState<(Enrollment & { user: User; course: Course })[]>([]);
  const [upcomingMentorshipSessions, setUpcomingMentorshipSessions] = useState<(MentorshipBooking & { user: User; mentor: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Replace with actual API calls
        // const statsResponse = await fetch('/api/dashboard/stats');
        // const enrollmentsResponse = await fetch('/api/enrollments/recent');
        // const mentorshipResponse = await fetch('/api/mentorship/upcoming');
        
        // For now, set empty data using the correct state setters
        setDashboardStats({
          totalUsers: 0,
          totalCourses: 0,
          totalEnrollments: 0,
          totalMentorshipBookings: 0,
          pendingAssignments: 0,
          totalRevenue: 0
        });
        setEnrollments([]);
        setUpcomingMentorshipSessions([]);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600 text-center">{error}</div>;
  }

  // Mock data - replace with actual API calls
  const stats: DashboardStats = {
    totalUsers: 1247,
    totalCourses: 23,
    totalEnrollments: 892,
    totalMentorshipBookings: 156,
    pendingAssignments: 45,
    totalRevenue: 125000
  };

  // Mock data for new sections
  const recentEnrollments: (Enrollment & { user: User; course: Course })[] = [
    {
      id: '1',
      userId: '1',
      courseId: '1',
      status: 'approved',
      requestedAt: '2024-01-15T10:30:00Z',
      approvedAt: '2024-01-15T11:00:00Z',
      user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', createdAt: '2024-01-01' },
      course: { 
        id: '1', 
        title: 'React Fundamentals', 
        description: 'Learn React fundamentals',
        price: 99,
        duration: '8 weeks',
        level: 'beginner',
        status: 'published',
        enrolledStudents: 45,
        chapters: [],
        createdAt: '2024-01-01'
      }
    },
    {
      id: '2',
      userId: '2',
      courseId: '2',
      status: 'pending',
      requestedAt: '2024-01-15T09:15:00Z',
      user: { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'student', status: 'active', createdAt: '2024-01-02' },
      course: { 
        id: '2', 
        title: 'Advanced JavaScript', 
        description: 'Advanced JavaScript concepts',
        price: 149,
        duration: '10 weeks',
        level: 'intermediate',
        status: 'published',
        enrolledStudents: 32,
        chapters: [],
        createdAt: '2024-01-02'
      }
    },
    {
      id: '3',
      userId: '3',
      courseId: '3',
      status: 'approved',
      requestedAt: '2024-01-14T16:45:00Z',
      approvedAt: '2024-01-14T17:00:00Z',
      user: { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'student', status: 'active', createdAt: '2024-01-03' },
      course: { 
        id: '3', 
        title: 'Node.js Backend', 
        description: 'Build backend with Node.js',
        price: 199,
        duration: '12 weeks',
        level: 'advanced',
        status: 'published',
        enrolledStudents: 28,
        chapters: [],
        createdAt: '2024-01-03'
      }
    }
  ];

  const upcomingMentorship: (MentorshipBooking & { user: User; mentor: User })[] = [
    {
      id: '1',
      userId: '1',
      mentorId: '10',
      date: '2024-01-16',
      timeSlot: '14:00-15:00',
      status: 'confirmed',
      paymentStatus: 'paid',
      zoomLink: 'https://zoom.us/j/123456789',
      user: { id: '1', name: 'John Doe', email: 'john@example.com', role: 'student', status: 'active', createdAt: '2024-01-01' },
      mentor: { id: '10', name: 'Dr. Sarah Wilson', email: 'sarah@example.com', role: 'mentor', status: 'active', createdAt: '2024-01-01' }
    },
    {
      id: '2',
      userId: '2',
      mentorId: '11',
      date: '2024-01-17',
      timeSlot: '10:00-11:00',
      status: 'confirmed',
      paymentStatus: 'paid',
      zoomLink: 'https://zoom.us/j/987654321',
      user: { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'student', status: 'active', createdAt: '2024-01-02' },
      mentor: { id: '11', name: 'Prof. David Brown', email: 'david@example.com', role: 'mentor', status: 'active', createdAt: '2024-01-01' }
    }
  ];

  const recentAssignments: (Assignment & { course: Course })[] = [
    {
      id: '1',
      title: 'React Component Building',
      description: 'Build a reusable component library',
      courseId: '1',
      dueDate: '2024-01-20',
      totalSubmissions: 23,
      status: 'active',
      course: { 
        id: '1', 
        title: 'React Fundamentals',
        description: 'Learn React fundamentals',
        price: 99,
        duration: '8 weeks',
        level: 'beginner',
        status: 'published',
        enrolledStudents: 45,
        chapters: [],
        createdAt: '2024-01-01'
      }
    },
    {
      id: '2',
      title: 'JavaScript Algorithms',
      description: 'Implement sorting and searching algorithms',
      courseId: '2',
      dueDate: '2024-01-18',
      totalSubmissions: 18,
      status: 'active',
      course: { 
        id: '2', 
        title: 'Advanced JavaScript',
        description: 'Advanced JavaScript concepts',
        price: 149,
        duration: '10 weeks',
        level: 'intermediate',
        status: 'published',
        enrolledStudents: 32,
        chapters: [],
        createdAt: '2024-01-02'
      }
    },
    {
      id: '3',
      title: 'API Design Project',
      description: 'Design and implement RESTful APIs',
      courseId: '3',
      dueDate: '2024-01-25',
      totalSubmissions: 12,
      status: 'active',
      course: { 
        id: '3', 
        title: 'Node.js Backend',
        description: 'Build backend with Node.js',
        price: 199,
        duration: '12 weeks',
        level: 'advanced',
        status: 'published',
        enrolledStudents: 28,
        chapters: [],
        createdAt: '2024-01-03'
      }
    }
  ];

  const revenueData = [
    { month: 'Jan', revenue: 25000 },
    { month: 'Feb', revenue: 32000 },
    { month: 'Mar', revenue: 28000 },
    { month: 'Apr', revenue: 35000 },
    { month: 'May', revenue: 42000 },
    { month: 'Jun', revenue: 38000 }
  ];

  const systemStatus = {
    server: 'online',
    database: 'online',
    email: 'online',
    storage: 'online',
    lastBackup: '2024-01-15 02:00 AM'
  };

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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers.toLocaleString()}</p>
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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats?.totalCourses ?? 0}</p>
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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.totalEnrollments.toLocaleString()}</p>
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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.totalMentorshipBookings}</p>
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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.pendingAssignments}</p>
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
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue.toLocaleString()}</p>
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
            <div className="h-40 flex items-end justify-between space-x-2">
              {revenueData.map((data, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-blue-500 rounded-t"
                    style={{ height: `${(data.revenue / 42000) * 120}px` }}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{data.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Monthly revenue trend (last 6 months)
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
                {recentEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {enrollment.user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{enrollment.user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{enrollment.course.title}</p>
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
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{assignment.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{assignment.course.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                        {assignment.totalSubmissions} submissions
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
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
              <button className="btn-primary text-left w-full text-xs">
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Course
              </button>
              <button className="btn-secondary text-left w-full text-xs">
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              <button className="btn-secondary text-left w-full text-xs">
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Schedule Mentorship
              </button>
              <button className="btn-secondary text-left w-full text-xs">
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
              {upcomingMentorship.map((session) => (
                <div key={session.id} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
                    <span className="px-1 py-0.5 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                      Confirmed
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    with {session.mentor.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.date).toLocaleDateString()} at {session.timeSlot}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              System Status
            </h2>
            <div className="space-y-1">
              {Object.entries(systemStatus).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {service}
                  </span>
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-1 ${
                      status === 'online' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs ${
                      status === 'online' 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                </div>
              ))}
              <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Last backup: {systemStatus.lastBackup}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Recent Activity
            </h2>
            <div className="space-y-1">
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1"></div>
                <div>
                  <p className="text-xs text-gray-900 dark:text-gray-100">New course "React Fundamentals" published</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-1"></div>
                <div>
                  <p className="text-xs text-gray-900 dark:text-gray-100">15 new student enrollments</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1"></div>
                <div>
                  <p className="text-xs text-gray-900 dark:text-gray-100">Mentorship session completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">6 hours ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1"></div>
                <div>
                  <p className="text-xs text-gray-900 dark:text-gray-100">System maintenance completed</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;