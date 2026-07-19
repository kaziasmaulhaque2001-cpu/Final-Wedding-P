export interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  weddingDate: string; // YYYY-MM-DD
  venue: string;
  packageName: string; // e.g. "Classic Gold", "Diamond", etc.
  totalAmount: number;
  paidAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress';
  type: 'production' | 'freelancer';
  photographer: string; // Main studio or Freelancer name
  notes: string;
  createdAt: number;
  updatedAt?: number;
  userId?: string;
  freelancerRate?: number; // Only applicable/visible for freelancer bookings
  freelancerPhone?: string;
  brideName?: string;
  groomName?: string;
  eventTime?: string;
  reportingTime?: string;
  whatsappStatus?: 'none' | 'sent' | 'failed';
  whatsappHistory?: Array<{ id: string; timestamp: number; status: 'sent' | 'failed'; message: string; recipientPhone: string }>;
  assignedFreelancers?: string[];
  freelancerAssignments?: FreelancerAssignment[];
  bookingFor?: string; // e.g. Wedding, Reception, Pre Wedding, Engagement, Other
  coverage?: string; // e.g. Bride Side, Groom Side, Both Side
  
  // Custom Manual Agreement Fields
  eventDate?: string;
  weddingLocation?: string;
  receptionDate?: string;
  receptionLocation?: string;
  preWedding?: 'Yes' | 'No';
  firstPayment?: number;
  secondPayment?: number;
  
  // Client Portal & Tracking Fields
  photographyStatus?: string;
  videographyStatus?: string;
  photoEditingStatus?: string;
  videoEditingStatus?: string;
  clientPhotoSelectionStatus?: string;
  albumDesigningStatus?: string;
  albumPrintingStatus?: string;
  albumDeliveryStatus?: string;
  videoDeliveryStatus?: string;
  projectStatus?: string;

  // Album Design Module Fields
  albumDesignPdfUrl?: string;
  albumDesignStatus?: 'Not Uploaded' | 'Waiting for Client Review' | 'Client Reviewing' | 'Changes Requested' | 'Album Approved' | 'Approved';
  albumDesignUploadDate?: string;
  albumDesignNotes?: string;

  brideAlbum?: AlbumDesignData;
  groomAlbum?: AlbumDesignData;

  // Simplified Form Custom Fields
  contactPerson?: string;
  alternatePhone?: string;
  fullAddress?: string;
  bookingDate?: string;
  googleMapLocation?: string;
  packagePrice?: number;
  discount?: number;
  advanceAmount?: number;
  paymentMethod?: string;
  events?: Record<string, { enabled: boolean; date: string; time: string; location: string }>;

  // Package Details - Photography Features
  photographyService?: boolean;
  albumService?: boolean;
  frameService?: boolean;
  pendriveService?: boolean;
  editedPhotosService?: boolean;

  // Package Details - Videography Features
  videographyService?: boolean;
  standardEditService?: boolean;
  cinematicEditService?: boolean;
  rawVideoService?: boolean;
  trailerService?: boolean;
  droneService?: boolean;
  ledWallService?: boolean;
  craneService?: boolean;
  liveStreamingService?: boolean;

  // Team Assignment
  leadPhotographer?: string;
  leadCinematographer?: string;

  // Agreement Details
  agreementNumber?: string;
  agreementDate?: string;
  specialNotes?: string;
}

export interface FreelanceEvent {
  eventType: string;
  eventDate: string;
  location?: string;
  customEventType?: string;
}

export interface FreelanceJob {
  id: string;
  studioName: string;
  contactPerson: string;
  contactPhone: string;
  eventDate: string; // YYYY-MM-DD
  location: string;
  eventTypes: string[]; // multi-select options: Wedding, Holud, Reception, etc.
  customEventType?: string;
  totalAmount: number;
  advancePayment: number;
  dueAmount: number; // automatically calculated: totalAmount - advancePayment
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  userId?: string;
  events?: FreelanceEvent[];
}

export interface FreelancerAssignment {
  freelancerName: string;
  eventType: 'Aiburo Bhat' | 'Mehendi' | 'Wedding' | 'Bidaay Boron' | 'Reception';
  eventDate: string;
  venue: string;
  perDayRate: number;
  workingDays: number;
  totalPayment: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  clientName: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'PayPal' | 'Other';
  status: 'completed' | 'pending';
  notes: string;
  createdAt: number;
  updatedAt?: number;
  userId?: string;
}

export type CollectionName = 'bookings' | 'payments' | 'settings' | 'freelance_jobs';

export interface PendingOperation {
  id: string;
  collection: CollectionName;
  type: 'create' | 'update' | 'delete';
  data: any; // complete object for create/update, or id string/object for delete
  timestamp: number;
}

export interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: number | null;
  isSyncing?: boolean;
  syncVersion?: number;
}

export interface AlbumDesignData {
  pdfUrl?: string;
  status?: 'Not Uploaded' | 'Waiting for Upload' | 'Waiting for Client Review' | 'Client Reviewing' | 'Changes Requested' | 'Approved';
  uploadDate?: string;
  notes?: string;
  comments?: string;
  versionHistory?: Array<{ pdfUrl: string; uploadDate: string; notes?: string }>;
}
