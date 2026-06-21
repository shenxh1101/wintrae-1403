export interface Exhibition {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  languages: string[];
  status: 'draft' | 'active' | 'ended';
  createdAt: string;
}

export interface Session {
  id: string;
  exhibitionId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
}

export interface TicketType {
  id: string;
  exhibitionId: string;
  name: string;
  price: number;
  description: string;
}

export interface Exhibit {
  id: string;
  exhibitionId: string;
  name: string;
  image: string;
  description: string;
}

export interface Booking {
  id: string;
  code: string;
  sessionId: string;
  ticketTypeId: string;
  visitorName: string;
  phone: string;
  count: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'cancelled';
  createdAt: string;
}

export interface Verification {
  id: string;
  bookingId: string;
  checkInTime: string;
  status: 'success' | 'failed' | 'late';
  isLate: boolean;
}

export interface Feedback {
  id: string;
  bookingId: string;
  ratingContent: number;
  ratingGuide: number;
  ratingEnvironment: number;
  comment: string;
  interestedExhibits: string[];
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface BookingWithDetails extends Booking {
  session?: Session;
  exhibition?: Exhibition;
  ticketType?: TicketType;
}

export interface VerificationWithDetails extends Verification {
  booking?: Booking;
}

export interface FeedbackWithDetails extends Feedback {
  booking?: Booking;
  exhibition?: Exhibition;
}
