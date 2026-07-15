import { Booking, AlbumDesignData } from '../types';

export const getStatusLabel = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'In Progress';
    case 'cancelled':
      return 'Cancelled';
    case 'pending':
    default:
      return 'Pending';
  }
};

export const getStatusChipColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      // Confirmed = Yellow (#EAB308) with Black text
      return '!bg-[#EAB308] !text-black !border-transparent !rounded-full font-bold';
    case 'completed':
      // Completed = Green (#22C55E) with White text
      return '!bg-[#22C55E] !text-white !border-transparent !rounded-full font-bold';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      // In Progress = Blue (#3B82F6) with White text
      return '!bg-[#3B82F6] !text-white !border-transparent !rounded-full font-bold';
    case 'cancelled':
      // Cancelled = Red (#EF4444) with White text
      return '!bg-[#EF4444] !text-white !border-transparent !rounded-full font-bold';
    case 'pending':
    default:
      // Pending = Gray (#9CA3AF) with White text
      return '!bg-[#9CA3AF] !text-white !border-transparent !rounded-full font-bold';
  }
};

export const getStatusDotColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-[#EAB308]';
    case 'completed':
      return 'bg-[#22C55E]';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'bg-[#3B82F6]';
    case 'cancelled':
      return 'bg-[#EF4444]';
    case 'pending':
    default:
      return 'bg-[#9CA3AF]';
  }
};

export const getStatusTextColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'text-[#EAB308]';
    case 'completed':
      return 'text-[#22C55E]';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'text-[#3B82F6]';
    case 'cancelled':
      return 'text-[#EF4444]';
    case 'pending':
    default:
      return 'text-[#9CA3AF]';
  }
};

export function getBookingAlbums(booking: Booking): {
  showBride: boolean;
  showGroom: boolean;
  brideAlbum: AlbumDesignData;
  groomAlbum: AlbumDesignData;
} {
  const pkgName = (booking.packageName || '').toLowerCase();
  const packageHas2Albums = pkgName.includes('royal') || pkgName.includes('two') || pkgName.includes('2 album') || pkgName.includes('2-album') || pkgName.includes('two album');

  const coverage = (booking.coverage || 'Both Side').toLowerCase();
  const isBothSide = coverage.includes('both') || (!coverage.includes('bride') && !coverage.includes('groom'));
  const isGroomOnly = coverage.includes('groom') || coverage.includes('groom side') || coverage.includes('groom only');
  const isBrideOnly = coverage.includes('bride') || coverage.includes('bride side') || coverage.includes('bride only');

  const showBride = packageHas2Albums || isBothSide || isBrideOnly;
  const showGroom = packageHas2Albums || isBothSide || isGroomOnly;

  // Retrieve Bride Album Data with thorough fallback
  const rawBrideStatus = booking.brideAlbum?.status || (!isGroomOnly ? (booking.albumDesignStatus || 'Not Uploaded') : 'Not Uploaded');
  const resolvedBrideStatus = (rawBrideStatus === 'Album Approved' ? 'Approved' : rawBrideStatus) as any;

  const brideAlbum: AlbumDesignData = {
    pdfUrl: booking.brideAlbum?.pdfUrl || (!isGroomOnly ? booking.albumDesignPdfUrl : undefined),
    status: resolvedBrideStatus,
    uploadDate: booking.brideAlbum?.uploadDate || (!isGroomOnly ? booking.albumDesignUploadDate : undefined),
    notes: booking.brideAlbum?.notes || (!isGroomOnly ? booking.albumDesignNotes : undefined),
    comments: booking.brideAlbum?.comments || '',
    versionHistory: booking.brideAlbum?.versionHistory || []
  };

  // Retrieve Groom Album Data with thorough fallback
  const rawGroomStatus = booking.groomAlbum?.status || (isGroomOnly ? (booking.albumDesignStatus || 'Not Uploaded') : 'Not Uploaded');
  const resolvedGroomStatus = (rawGroomStatus === 'Album Approved' ? 'Approved' : rawGroomStatus) as any;

  const groomAlbum: AlbumDesignData = {
    pdfUrl: booking.groomAlbum?.pdfUrl || (isGroomOnly ? booking.albumDesignPdfUrl : undefined),
    status: resolvedGroomStatus,
    uploadDate: booking.groomAlbum?.uploadDate || (isGroomOnly ? booking.albumDesignUploadDate : undefined),
    notes: booking.groomAlbum?.notes || (isGroomOnly ? booking.albumDesignNotes : undefined),
    comments: booking.groomAlbum?.comments || '',
    versionHistory: booking.groomAlbum?.versionHistory || []
  };

  return {
    showBride,
    showGroom,
    brideAlbum,
    groomAlbum
  };
}
