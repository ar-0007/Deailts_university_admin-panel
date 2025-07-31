export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'mentor';
  status: 'active' | 'blocked' | 'pending';
  createdAt: string;
  lastLogin?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  enrolledStudents: number;
  chapters: Chapter[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration: number; // in minutes
  order: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  user: User;
  course: Course;
}

export interface MentorshipBooking {
  id: string;
  userId: string;
  mentorId: string;
  date: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  zoomLink?: string;
  user: User;
  mentor: User;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  chapterId?: string;
  dueDate: string;
  totalSubmissions: number;
  status: 'active' | 'expired';
  course: Course;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  user: User;
}

export interface Podcast {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // in minutes
  releaseDate: string;
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
  user: User;
  course: Course;
}

export interface MarketingContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'converted';
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalMentorshipBookings: number;
  pendingAssignments: number;
  totalRevenue: number;
} 