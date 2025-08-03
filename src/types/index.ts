// User types
export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  status: 'active' | 'blocked'; // Remove 'pending' since it's not supported
  is_active: boolean;
  created_at: string;
  last_login?: string;
  // Computed properties for compatibility
  id: string;
  name: string;
  createdAt: string;
  lastLogin?: string;
}

// Course types
export interface Course {
  course_id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  enrolled_students: number;
  chapters: Chapter[];
  created_at: string;
  updated_at?: string;
  // Computed properties for compatibility
  id: string;
  enrolledStudents: number;
  createdAt: string;
}

// Chapter types
export interface Chapter {
  chapter_id: string;
  course_id: string;
  title: string;
  description: string;
  order_index: number;
  duration: string;
  is_free: boolean;
  media: ChapterMedia[];
  created_at: string;
  // Computed properties for compatibility
  id: string;
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
}

// Chapter Media types
export interface ChapterMedia {
  media_id: string;
  chapter_id: string;
  title: string;
  media_type: 'video' | 'document' | 'image';
  media_url: string;
  duration?: string;
  order_index: number;
  created_at: string;
}

// Enrollment types
export interface Enrollment {
  enrollment_id: string;
  user_id: string;
  course_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_at: string;
  approved_at?: string;
  completed_at?: string;
  user: User;
  course: Course;
  // Computed properties for compatibility
  id: string;
  userId: string;
  courseId: string;
  requestedAt: string;
  approvedAt?: string;
}

// Chapter Progress types
export interface ChapterProgress {
  progress_id: string;
  user_id: string;
  chapter_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  started_at?: string;
  completed_at?: string;
}

// Mentorship types
export interface MentorshipSlot {
  slot_id: string;
  mentor_id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  price: number;
  created_at: string;
}

export interface MentorshipBooking {
  booking_id: string;
  user_id: string;
  mentor_id: string;
  slot_id: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'refunded';
  zoom_link?: string;
  created_at: string;
  user: User;
  mentor: User;
  // Computed properties for compatibility
  id: string;
  userId: string;
  mentorId: string;
  timeSlot: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  zoomLink?: string;
}

// Assignment types
export interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  course_id: string;
  due_date: string;
  total_submissions: number;
  status: 'active' | 'inactive';
  created_at: string;
  course: Course;
  // Computed properties for compatibility
  id: string;
  courseId: string;
  chapterId?: string;
  dueDate: string;
  totalSubmissions: number;
}

// Submission types
export interface Submission {
  submission_id: string;
  assignment_id: string;
  user_id: string;
  submission_text: string;
  file_url?: string;
  grade?: number;
  feedback?: string;
  submitted_at: string;
  graded_at?: string;
  user: User;
  // Computed properties for compatibility
  id: string;
  assignmentId: string;
  userId: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface AssignmentSubmission extends Submission {
  // Alias for compatibility
}

// Quiz types
export interface Quiz {
  quiz_id: string;
  title: string;
  description: string;
  course_id: string;
  time_limit: number;
  total_questions: number;
  passing_score: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface QuizAttempt {
  attempt_id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
}

// Podcast types
export interface Podcast {
  podcast_id: string;
  title: string;
  description: string;
  audio_url: string;
  duration: string;
  episode_number: number;
  published_at: string;
  status: 'draft' | 'published';
  created_at: string;
  // Computed properties for compatibility
  id: string;
  audioUrl: string;
  releaseDate: string;
}

// Certificate types
export interface Certificate {
  certificate_id: string;
  user_id: string;
  course_id: string;
  certificate_url: string;
  issued_at: string;
  user: User;
  course: Course;
  // Computed properties for compatibility
  id: string;
  userId: string;
  courseId: string;
  issuedAt: string;
  certificateUrl: string;
}

// Marketing Contact types
export interface MarketingContact {
  contact_id: string;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  source: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  created_at: string;
  // Computed properties for compatibility
  id: string;
  notes?: string;
  createdAt: string;
}

// Dashboard Stats types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalMentorshipBookings: number;
  pendingAssignments: number;
  totalRevenue: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string;
}

// File Upload types
export interface UploadResponse {
  url: string;
  publicId: string;
  originalName: string;
  size: number;
  mimetype: string;
}

// Payment types
export interface Payment {
  payment_id: string;
  user_id: string;
  course_id?: string;
  mentorship_booking_id?: string;
  amount: number;
  currency: string;
  payment_method: 'stripe' | 'paypal' | 'razorpay';
  payment_intent_id: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string;
}

export interface PaymentIntent {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

