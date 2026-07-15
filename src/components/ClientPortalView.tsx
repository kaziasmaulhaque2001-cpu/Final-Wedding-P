import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { Booking } from '../types';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  CircularProgress,
  Divider,
  LinearProgress,
  Chip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Camera, 
  Video, 
  Image as ImageIcon, 
  Film, 
  BookOpen, 
  Printer, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Lock, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles, 
  Heart,
  Phone,
  AlertCircle,
  TrendingUp,
  Inbox,
  FileText,
  Download,
  Facebook,
  Instagram,
  Youtube,
  MessageSquare,
  Globe,
  Mail
} from 'lucide-react';
import { PDFPreviewDialog } from './PDFPreviewDialog';
import { useBrand } from '../contexts/BrandContext';
import { buildAgreementPDF, downloadAgreementPDF } from '../utils/pdfGenerator';
import { getBookingAlbums } from '../utils/statusUtils';

interface ClientPortalViewProps {
  bookingId: string;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ bookingId }) => {
  const { settings } = useBrand();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Verification State
  const [phoneInput, setPhoneInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  // Countdown State
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false });

  // Album Design Actions State
  const [viewOpen, setViewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [brideFeedback, setBrideFeedback] = useState('');
  const [groomFeedback, setGroomFeedback] = useState('');
  const [brideFormOpen, setBrideFormOpen] = useState(false);
  const [groomFormOpen, setGroomFormOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const handleApproveAlbum = async (type: 'bride' | 'groom') => {
    if (!booking) return;
    if (!window.confirm(`Are you sure you want to approve the ${type === 'bride' ? 'Bride' : 'Groom'} Album Design? This indicates you are completely satisfied with the layout.`)) {
      return;
    }

    try {
      const { brideAlbum, groomAlbum } = getBookingAlbums(booking);
      const targetAlbum = type === 'bride' ? brideAlbum : groomAlbum;

      const updatedAlbum = {
        ...targetAlbum,
        status: 'Approved' as const,
        comments: '' // Clear comments upon approval
      };

      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        ...(type === 'bride' ? { albumDesignStatus: 'Approved' } : {}),
        brideAlbum: type === 'bride' ? updatedAlbum : brideAlbum,
        groomAlbum: type === 'groom' ? updatedAlbum : groomAlbum,
        updatedAt: Date.now()
      });

      setSnackbarMessage(`Thank you! Your ${type === 'bride' ? 'Bride' : 'Groom'} Album Design has been approved!`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Failed to approve album:', err);
      setSnackbarMessage(`Failed to approve: ${err.message || err}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSubmitFeedback = async (type: 'bride' | 'groom') => {
    if (!booking) return;
    const feedbackText = type === 'bride' ? brideFeedback : groomFeedback;
    if (!feedbackText.trim()) {
      alert('Please enter your feedback comments before submitting.');
      return;
    }

    try {
      const { brideAlbum, groomAlbum } = getBookingAlbums(booking);
      const targetAlbum = type === 'bride' ? brideAlbum : groomAlbum;

      const updatedAlbum = {
        ...targetAlbum,
        status: 'Changes Requested' as const,
        comments: feedbackText
      };

      const docRef = doc(db, 'bookings', bookingId);
      await updateDoc(docRef, {
        ...(type === 'bride' ? { albumDesignStatus: 'Changes Requested' } : {}),
        brideAlbum: type === 'bride' ? updatedAlbum : brideAlbum,
        groomAlbum: type === 'groom' ? updatedAlbum : groomAlbum,
        updatedAt: Date.now()
      });

      // Clear input and close form
      if (type === 'bride') {
        setBrideFeedback('');
        setBrideFormOpen(false);
      } else {
        setGroomFeedback('');
        setGroomFormOpen(false);
      }

      setSnackbarMessage(`Your feedback for the ${type === 'bride' ? 'Bride' : 'Groom'} Album has been submitted successfully.`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err: any) {
      console.error('Failed to submit feedback:', err);
      setSnackbarMessage(`Failed to submit: ${err.message || err}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Agreement Actions State
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null);

  // Load verified status from sessionStorage
  useEffect(() => {
    const verifiedSessions = sessionStorage.getItem(`verified_booking_${bookingId}`);
    if (verifiedSessions === 'true') {
      setIsVerified(true);
    }
  }, [bookingId]);

  // Firestore Real-time listener for the booking
  useEffect(() => {
    const docRef = doc(db, 'bookings', bookingId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setBooking(snapshot.data() as Booking);
        setError(null);
      } else {
        setError("Booking details could not be found. Please contact Asmaul Production support.");
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore onSnapshot error:", err);
      setError("Unable to connect to the server. Please check your internet connection.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [bookingId]);

  // Live countdown effect
  useEffect(() => {
    if (!booking) return;

    const interval = setInterval(() => {
      const weddingDateTime = new Date(`${booking.weddingDate}T${booking.eventTime || '12:00:00'}`).getTime();
      const now = new Date().getTime();
      const distance = weddingDateTime - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        clearInterval(interval);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setCountdown({ days, hours, minutes, seconds, isPast: false });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  // Handles client phone number verification
  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;

    // Clean phone numbers by removing all non-digit characters for matching
    const cleanInput = phoneInput.replace(/\D/g, '');
    const cleanStored = booking.clientPhone.replace(/\D/g, '');

    // Allow match if input is a suffix (e.g. matches last 10 digits to handle country codes)
    if (cleanInput && cleanStored && (cleanStored.endsWith(cleanInput) || cleanInput.endsWith(cleanStored))) {
      setIsVerified(true);
      setVerificationError(null);
      sessionStorage.setItem(`verified_booking_${bookingId}`, 'true');
    } else {
      setVerificationError("The entered phone number does not match our registration records. Please try again.");
    }
  };

  // Helper to calculate progress percentage based on tracker states
  const calculateProgress = (): number => {
    if (!booking) return 0;
    
    const fields = [
      booking.photographyStatus,
      booking.videographyStatus,
      booking.photoEditingStatus,
      booking.videoEditingStatus,
      booking.clientPhotoSelectionStatus,
      booking.albumDesigningStatus,
      booking.albumPrintingStatus,
      booking.albumDeliveryStatus,
      booking.videoDeliveryStatus
    ];

    let completedCount = 0;
    fields.forEach(f => {
      if (!f) return;
      const lower = f.toLowerCase();
      if (lower.includes('complete') || lower.includes('deliver') || lower.includes('done') || lower.includes('shipped') || lower.includes('finish')) {
        completedCount += 1;
      } else if (lower.includes('progress') || lower.includes('culling') || lower.includes('edit') || lower.includes('grad') || lower.includes('queue') || lower.includes('review') || lower.includes('design') || lower.includes('select') || lower.includes('share')) {
        completedCount += 0.5;
      }
    });

    return Math.round((completedCount / fields.length) * 100);
  };

  // Helpers to check step states
  const getStepStatus = (statusText: string | undefined): 'pending' | 'in_progress' | 'completed' => {
    if (!statusText) return 'pending';
    const lower = statusText.toLowerCase();
    if (lower.includes('complete') || lower.includes('deliver') || lower.includes('done') || lower.includes('shipped') || lower.includes('finish')) {
      return 'completed';
    }
    if (lower.includes('pending') || lower.includes('none')) {
      return 'pending';
    }
    return 'in_progress';
  };

  if (loading) {
    return (
      <Box className="min-h-screen bg-[#0D0D0C] flex flex-col items-center justify-center">
        <CircularProgress sx={{ color: '#D4AF37' }} />
        <Typography variant="body2" className="text-gray-400 font-mono mt-4 uppercase tracking-widest text-[10px]">
          Loading Your Secure Client Portal
        </Typography>
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Box className="min-h-screen bg-[#0D0D0C] flex flex-col items-center justify-center p-4">
        <Paper className="max-w-md w-full bg-[#141413] border border-red-900/30 p-6 rounded-lg text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <Typography variant="h6" className="text-white font-serif font-bold">
            Portal Error
          </Typography>
          <Typography variant="body2" className="text-gray-400 leading-relaxed">
            {error || "We could not fetch your booking. Please verify the URL."}
          </Typography>
        </Paper>
      </Box>
    );
  }

  // 1. Render Verification Screen
  if (!isVerified) {
    return (
      <Box className="min-h-screen bg-[#0D0D0C] flex flex-col items-center justify-center p-4">
        <Paper className="max-w-md w-full bg-[#141413] border border-[#D4AF37]/20 p-8 rounded-xl space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Golden Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

          {/* Logo Head */}
          <div className="text-center space-y-2">
            <Box className="w-16 h-16 rounded-full border border-[#D4AF37]/30 flex items-center justify-center bg-black/40 mx-auto border-gold-glow mb-4">
              <Camera className="w-8 h-8 text-[#D4AF37]" />
            </Box>
            <Typography variant="h5" className="text-gold-gradient font-serif font-bold tracking-wider uppercase text-lg">
              Asmaul Production
            </Typography>
            <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[10px] block">
              Client Portal Access
            </Typography>
          </div>

          <Divider className="border-gray-900" />

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-1.5 text-center">
              <Typography variant="body2" className="text-white font-semibold">
                Verify Your Registered Phone Number
              </Typography>
              <Typography variant="caption" className="text-gray-400 block max-w-xs mx-auto">
                For security reasons, enter the mobile number provided during your contract registration.
              </Typography>
            </div>

            <TextField
              fullWidth
              variant="outlined"
              placeholder="e.g. 9876543210"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="bg-black/40 rounded border border-[#D4AF37]/10"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone className="w-4 h-4 text-[#D4AF37]/70 mr-1" />
                    </InputAdornment>
                  ),
                  sx: {
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212, 175, 55, 0.2)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212, 175, 55, 0.4)' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' }
                  }
                }
              }}
            />

            {verificationError && (
              <Box className="flex items-start gap-2 bg-red-950/20 border border-red-900/30 p-3 rounded text-left">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <Typography variant="caption" className="text-red-400 leading-relaxed block">
                  {verificationError}
                </Typography>
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="bg-[#D4AF37] hover:bg-[#bfa032] text-black font-bold tracking-wide uppercase text-xs py-3 rounded mt-2 cursor-pointer transition-colors"
              sx={{
                boxShadow: '0 4px 12px rgba(212, 175, 55, 0.15)',
                '&:hover': {
                  boxShadow: '0 4px 16px rgba(212, 175, 55, 0.3)'
                }
              }}
            >
              Verify & Enter Portal
            </Button>
          </form>

          <Divider className="border-gray-900" />

          {/* Footer lock */}
          <div className="flex items-center justify-center gap-1.5 text-gray-600 text-[10px] uppercase tracking-widest">
            <Lock className="w-3.5 h-3.5" />
            <span>Secure 256-Bit Encrypted Portal</span>
          </div>
        </Paper>
      </Box>
    );
  }

  // 2. Render Portal Dashboard
  const progressPercent = calculateProgress();
  const remainingDue = booking.totalAmount - booking.paidAmount;
  const hasGroomOrBride = booking.brideName || booking.groomName;

  return (
    <Box className="min-h-screen bg-[#0D0D0C] text-gray-200">
      {/* Top Brand Bar */}
      <Box className="bg-[#141413] border-b border-[#D4AF37]/10 py-4 shadow-lg sticky top-0 z-50">
        <Container maxWidth="md" className="flex justify-between items-center px-4">
          <div className="flex items-center gap-3">
            <Box className="w-10 h-10 rounded-full border border-[#D4AF37]/20 flex items-center justify-center bg-black/40">
              <Camera className="w-5 h-5 text-[#D4AF37]" />
            </Box>
            <div>
              <Typography variant="body1" className="text-gold-gradient font-serif font-bold tracking-widest uppercase text-sm leading-none">
                Asmaul Production
              </Typography>
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[8px] block mt-1">
                Premium Visual Production
              </Typography>
            </div>
          </div>
          
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              sessionStorage.removeItem(`verified_booking_${bookingId}`);
              setIsVerified(false);
            }}
            className="border-gray-800 text-gray-500 hover:text-white hover:border-white text-[10px] h-7"
          >
            Logout
          </Button>
        </Container>
      </Box>

      <Container maxWidth="md" className="py-8 px-4 space-y-6">
        
        {/* Welcome Block */}
        <Box className="bg-gradient-to-r from-stone-900/40 to-stone-950/20 border border-[#D4AF37]/15 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#D4AF37]/5 blur-2xl rounded-full pointer-events-none" />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Box className="space-y-1">
              <div className="flex items-center gap-1.5 text-[#D4AF37] text-xs font-bold uppercase tracking-widest">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Personal Client Workspace</span>
              </div>
              <Typography variant="h4" className="text-white font-serif font-bold mt-1">
                Welcome, {booking.clientName}!
              </Typography>
              {hasGroomOrBride && (
                <Typography variant="body2" className="text-[#D4AF37] font-medium flex items-center gap-1 text-sm mt-1">
                  <Heart className="w-4 h-4 fill-current text-rose-500" />
                  <span>
                    {[booking.brideName, booking.groomName].filter(Boolean).join(" & ")}
                  </span>
                </Typography>
              )}
            </Box>
            <Box className="bg-black/35 px-3 py-1.5 rounded border border-[#D4AF37]/10 text-[10px] uppercase tracking-widest font-mono text-gray-400">
              ID: {booking.id}
            </Box>
          </div>
        </Box>

        {/* Live Countdown Clock */}
        {!countdown.isPast ? (
          <Box className="bg-[#141413] border border-[#D4AF37]/10 p-6 rounded-xl text-center space-y-4">
            <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[10px] font-bold block">
              ⏳ Live Countdown To Your Wedding Day
            </Typography>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              <Box className="bg-black/40 p-3 rounded border border-gold-glow/5">
                <Typography variant="h5" className="text-[#D4AF37] font-mono font-bold leading-none">{countdown.days}</Typography>
                <Typography variant="caption" className="text-gray-500 text-[8px] uppercase tracking-wider block mt-1">Days</Typography>
              </Box>
              <Box className="bg-black/40 p-3 rounded border border-gold-glow/5">
                <Typography variant="h5" className="text-[#D4AF37] font-mono font-bold leading-none">{countdown.hours}</Typography>
                <Typography variant="caption" className="text-gray-500 text-[8px] uppercase tracking-wider block mt-1">Hours</Typography>
              </Box>
              <Box className="bg-black/40 p-3 rounded border border-gold-glow/5">
                <Typography variant="h5" className="text-[#D4AF37] font-mono font-bold leading-none">{countdown.minutes}</Typography>
                <Typography variant="caption" className="text-gray-500 text-[8px] uppercase tracking-wider block mt-1">Mins</Typography>
              </Box>
              <Box className="bg-black/40 p-3 rounded border border-gold-glow/5">
                <Typography variant="h5" className="text-[#D4AF37] font-mono font-bold leading-none">{countdown.seconds}</Typography>
                <Typography variant="caption" className="text-gray-500 text-[8px] uppercase tracking-wider block mt-1">Secs</Typography>
              </Box>
            </div>
          </Box>
        ) : (
          <Box className="bg-amber-950/15 border border-[#D4AF37]/20 p-5 rounded-xl text-center flex flex-col items-center justify-center gap-1.5">
            <Heart className="w-8 h-8 fill-current text-rose-500 animate-pulse" />
            <Typography variant="subtitle1" className="text-white font-serif font-bold tracking-wide mt-1">
              Your Wedding Celebrations are Successfully Completed!
            </Typography>
            <Typography variant="caption" className="text-gray-400">
              We are delighted to have captured your beautiful memories forever.
            </Typography>
          </Box>
        )}

        {/* Real-time Project Status Trackers */}
        <Box className="bg-[#141413] border border-[#D4AF37]/10 p-6 rounded-xl space-y-6">
          <div className="flex justify-between items-center">
            <Box className="space-y-0.5">
              <Typography variant="subtitle2" className="text-white font-bold uppercase tracking-wider text-xs">
                ⚡ Project Status & Delivery Trackers
              </Typography>
              <Typography variant="caption" className="text-gray-500 text-[10px]">
                Real-time tracking of production & post-production milestones
              </Typography>
            </Box>
            <Chip
              icon={<TrendingUp className="w-3 h-3 text-emerald-400" />}
              label={`${progressPercent}% COMPLETED`}
              size="small"
              className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] font-bold font-mono px-1"
            />
          </div>

          {/* Progress bar */}
          <Box className="space-y-1">
            <LinearProgress 
              variant="determinate" 
              value={progressPercent} 
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'rgba(214, 175, 55, 0.05)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#D4AF37',
                  borderRadius: 3,
                }
              }}
            />
          </Box>

          <Divider className="border-gray-900" />

          {/* Checklist Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Step 1: Photography */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.photographyStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.photographyStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Camera className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Photography Status</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.photographyStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.photographyStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.photographyStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 2: Videography */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.videographyStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.videographyStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Video className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Videography Status</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.videographyStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.videographyStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.videographyStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 3: Photo Editing */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.photoEditingStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.photoEditingStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <ImageIcon className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Photo Editing Status</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.photoEditingStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.photoEditingStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.photoEditingStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 4: Video Editing */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.videoEditingStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.videoEditingStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Film className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Video Editing Status</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.videoEditingStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.videoEditingStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.videoEditingStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 4b: Client Photo Selection */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.clientPhotoSelectionStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.clientPhotoSelectionStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Camera className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">📸 Client Photo Selection</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    Status: {booking.clientPhotoSelectionStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.clientPhotoSelectionStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.clientPhotoSelectionStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 5: Album Designing */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.albumDesigningStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.albumDesigningStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <BookOpen className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Album Designing</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.albumDesigningStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.albumDesigningStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.albumDesigningStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 6: Album Printing */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.albumPrintingStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.albumPrintingStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Printer className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Album Printing</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.albumPrintingStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.albumPrintingStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.albumPrintingStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 7: Album Delivery */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.albumDeliveryStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.albumDeliveryStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Truck className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Album Delivery</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.albumDeliveryStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.albumDeliveryStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.albumDeliveryStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

            {/* Step 8: Video Delivery */}
            <Box className="p-3.5 bg-black/30 rounded border border-[#D4AF37]/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Box className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  getStepStatus(booking.videoDeliveryStatus) === 'completed' ? 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-400' :
                  getStepStatus(booking.videoDeliveryStatus) === 'in_progress' ? 'bg-amber-950/50 border border-amber-500/30 text-amber-400' :
                  'bg-stone-900 border border-stone-800 text-stone-500'
                }`}>
                  <Inbox className="w-5 h-5" />
                </Box>
                <div>
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none">Video Delivery</Typography>
                  <Typography variant="caption" className="text-gray-400 text-[10px] mt-1.5 block">
                    {booking.videoDeliveryStatus || 'Pending'}
                  </Typography>
                </div>
              </div>
              <Box className="flex-shrink-0">
                {getStepStatus(booking.videoDeliveryStatus) === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : getStepStatus(booking.videoDeliveryStatus) === 'in_progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '3s' }} />
                ) : (
                  <Clock className="w-4 h-4 text-stone-700" />
                )}
              </Box>
            </Box>

          </div>

          {/* Overall status bar */}
          <Divider className="border-gray-900" />
          <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-black/30 p-3.5 rounded border border-[#D4AF37]/5">
            <div>
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] font-bold block leading-none">
                Overall Project Status
              </Typography>
              <Typography variant="body2" className="text-white font-bold mt-1 text-sm">
                {booking.projectStatus || 'In Progress'}
              </Typography>
            </div>
            <span className="text-[10px] font-mono text-gray-500">
              Last Sync: {new Date(booking.updatedAt || booking.createdAt).toLocaleString()}
            </span>
          </Box>

        </Box>

        {/* Shoot Agreement Section */}
        <Box className="bg-[#141413] border border-[#D4AF37]/10 p-6 rounded-xl space-y-4">
          <Typography variant="subtitle2" className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>📄 Wedding Photography & Cinematography Agreement</span>
          </Typography>
          <Divider className="border-gray-900" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/20 p-4 rounded-lg border border-[#D4AF37]/5">
            <div className="space-y-1">
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">
                Agreement Status
              </Typography>
              <Chip
                label="Legally Confirmed & Active"
                size="small"
                className="text-[9px] h-5 font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    const docInstance = await buildAgreementPDF(booking, settings);
                    const url = docInstance.output('bloburl') as any as string;
                    setAgreementUrl(url);
                    setAgreementOpen(true);
                  } catch (err) {
                    console.error('Failed to generate agreement preview:', err);
                  }
                }}
                startIcon={<BookOpen className="w-4 h-4" />}
                className="border-[#D4AF37]/20 text-white font-bold text-xs py-1 px-3 bg-black/25 hover:bg-[#D4AF37]/10 rounded-lg h-9"
                sx={{ textTransform: 'none' }}
              >
                View Agreement
              </Button>
              
              <Button
                variant="outlined"
                onClick={async () => {
                  try {
                    await downloadAgreementPDF(booking, settings);
                  } catch (err) {
                    console.error('Failed to download agreement:', err);
                  }
                }}
                startIcon={<Download className="w-4 h-4" />}
                className="border-[#D4AF37]/20 text-white font-bold text-xs py-1 px-3 bg-black/25 hover:bg-[#D4AF37]/10 rounded-lg h-9"
                sx={{ textTransform: 'none' }}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </Box>

        {/* Album Design Card Section */}
        <Box className="bg-[#141413] border border-[#D4AF37]/10 p-6 rounded-xl space-y-6">
          <Typography variant="subtitle2" className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>📄 Album Design Portal</span>
          </Typography>
          <Divider className="border-gray-900" />

          {(() => {
            const { showBride, showGroom, brideAlbum, groomAlbum } = getBookingAlbums(booking);
            const activeAlbums = [];
            if (showBride) {
              activeAlbums.push({
                type: 'bride' as const,
                label: 'Bride Album Design',
                data: brideAlbum,
                formOpen: brideFormOpen,
                setFormOpen: setBrideFormOpen,
                feedback: brideFeedback,
                setFeedback: setBrideFeedback
              });
            }
            if (showGroom) {
              activeAlbums.push({
                type: 'groom' as const,
                label: 'Groom Album Design',
                data: groomAlbum,
                formOpen: groomFormOpen,
                setFormOpen: setGroomFormOpen,
                feedback: groomFeedback,
                setFeedback: setGroomFeedback
              });
            }

            if (activeAlbums.length === 0) {
              return (
                <div className="py-8 text-center bg-black/20 border border-dashed border-gray-950 rounded-lg">
                  <Typography variant="body2" className="text-gray-500 font-medium text-xs sm:text-sm">
                    Album Design is not available yet.
                  </Typography>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {activeAlbums.map((album) => {
                  const hasPdf = !!album.data.pdfUrl;
                  const isApproved = album.data.status === 'Approved' || album.data.status === 'Album Approved';

                  return (
                    <div key={album.type} className="p-4 bg-black/25 rounded-xl border border-gray-900/50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-900">
                        <div className="space-y-1">
                          <Typography variant="body2" className="text-white font-serif font-bold text-sm tracking-wide">
                            {album.label}
                          </Typography>
                          {hasPdf && (
                            <Typography variant="caption" className="text-gray-500 text-[10px] block">
                              Uploaded: {album.data.uploadDate || 'Unknown'}
                            </Typography>
                          )}
                        </div>

                        <Chip
                          label={album.data.status === 'Approved' ? 'Approved' : (album.data.status || 'Waiting for Upload')}
                          size="small"
                          className={`text-[9px] h-5 font-bold uppercase tracking-wider ${
                            isApproved ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                            album.data.status === 'Changes Requested' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                            album.data.status === 'Client Reviewing' || album.data.status === 'Waiting for Client Review' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                            'bg-stone-500/15 text-stone-400 border border-stone-500/20'
                          }`}
                        />
                      </div>

                      {hasPdf ? (
                        <div className="space-y-4">
                          {/* Admin Notes */}
                          {album.data.notes && (
                            <div className="bg-[#D4AF37]/5 p-3 rounded-lg border border-[#D4AF37]/10">
                              <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-mono block mb-1">Message from Studio</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{album.data.notes}</p>
                            </div>
                          )}

                          {/* Client Feedback Status */}
                          {album.data.status === 'Changes Requested' && album.data.comments && (
                            <div className="bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                              <span className="text-[9px] text-red-400 uppercase tracking-widest font-mono block mb-1">Your Change Request Details</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{album.data.comments}</p>
                            </div>
                          )}

                          {/* Action Buttons: Preview, Download, Approve, Request Changes */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setPreviewUrl(album.data.pdfUrl);
                                setPreviewTitle(`${album.label}: ${booking.clientName}`);
                                setViewOpen(true);
                              }}
                              className="border-[#D4AF37]/20 text-white font-bold text-xs bg-black/25 hover:bg-[#D4AF37]/10 rounded-lg h-9"
                              sx={{ textTransform: 'none' }}
                            >
                              👁️ View PDF
                            </Button>

                            <Button
                              variant="outlined"
                              onClick={() => window.open(album.data.pdfUrl, '_blank')}
                              className="border-[#D4AF37]/20 text-white font-bold text-xs bg-black/25 hover:bg-[#D4AF37]/10 rounded-lg h-9"
                              sx={{ textTransform: 'none' }}
                            >
                              📥 Download PDF
                            </Button>

                            <Button
                              variant="outlined"
                              disabled={isApproved}
                              onClick={() => handleApproveAlbum(album.type)}
                              className={`font-bold text-xs rounded-lg h-9 ${
                                isApproved 
                                  ? 'border-transparent bg-green-500/10 text-green-400 cursor-default' 
                                  : 'border-green-500/20 text-white bg-green-500/5 hover:bg-green-500/15'
                              }`}
                              sx={{ textTransform: 'none' }}
                            >
                              {isApproved ? '✓ Approved' : '✓ Approve'}
                            </Button>

                            <Button
                              variant="outlined"
                              disabled={isApproved}
                              onClick={() => album.setFormOpen(!album.formOpen)}
                              className={`font-bold text-xs rounded-lg h-9 ${
                                isApproved 
                                  ? 'border-transparent bg-stone-500/5 text-stone-600' 
                                  : 'border-red-500/20 text-white bg-red-500/5 hover:bg-red-500/15'
                              }`}
                              sx={{ textTransform: 'none' }}
                            >
                              ⚠ Request Changes
                            </Button>
                          </div>

                          {/* Version History */}
                          {album.data.versionHistory && album.data.versionHistory.length > 0 && (
                            <div className="bg-black/15 p-3 rounded-lg border border-gray-900/50 space-y-1.5">
                              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-mono block">Previous Revisions</span>
                              {album.data.versionHistory.map((history: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs text-gray-400">
                                  <span>Version {idx + 1} ({history.uploadDate})</span>
                                  <a href={history.pdfUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline">
                                    Download v{idx + 1}
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Request Changes Textbox Form */}
                          {album.formOpen && !isApproved && (
                            <div className="bg-black/40 p-4 rounded-lg border border-red-500/10 space-y-3">
                              <Typography variant="body2" className="text-white font-bold text-xs">
                                Submit Change Request Comments
                              </Typography>
                              <TextField
                                fullWidth
                                multiline
                                rows={3}
                                placeholder="Describe precisely which changes or corrections you would like us to make in this revision..."
                                value={album.feedback}
                                onChange={(e) => album.setFeedback(e.target.value)}
                                className="bg-black/60 font-sans text-xs rounded-lg text-white"
                                sx={{
                                  '& .MuiInputBase-root': { color: 'white', fontSize: '12px' },
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212,175,55,0.15)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212,175,55,0.3)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' }
                                }}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="small"
                                  onClick={() => album.setFormOpen(false)}
                                  className="text-gray-400 text-xs hover:bg-white/5"
                                  sx={{ textTransform: 'none' }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleSubmitFeedback(album.type)}
                                  className="bg-[#D4AF37] text-black font-bold text-xs px-4 rounded hover:bg-[#b8952d]"
                                  sx={{ textTransform: 'none' }}
                                >
                                  Submit Feedback
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-6 text-center bg-black/10 border border-dashed border-gray-900 rounded-xl space-y-1">
                          <Typography variant="body2" className="text-gray-500 font-medium text-xs">
                            This design PDF is not available yet.
                          </Typography>
                          <Typography variant="caption" className="text-gray-600 block text-[10px]">
                            Our design team is carefully handcrafting this layout. You'll see it here once uploaded!
                          </Typography>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Box>

        {/* Wedding Event Details Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box className="bg-[#141413] border border-[#D4AF37]/10 p-5 rounded-xl space-y-4">
            <Typography variant="subtitle2" className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs">
              💍 Wedding Event Details
            </Typography>
            <Divider className="border-gray-900" />
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#D4AF37]/70 flex-shrink-0 mt-0.5" />
                <div>
                  <Typography variant="caption" className="text-gray-500 block leading-none">Wedding Date</Typography>
                  <Typography variant="body2" className="text-white font-serif font-semibold text-sm mt-1">
                    {booking.weddingDate.split('-').length === 3 
                      ? `${booking.weddingDate.split('-')[2]}/${booking.weddingDate.split('-')[1]}/${booking.weddingDate.split('-')[0]}` 
                      : booking.weddingDate}
                  </Typography>
                </div>
              </div>
              {booking.eventTime && (
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[#D4AF37]/70 flex-shrink-0 mt-0.5" />
                  <div>
                    <Typography variant="caption" className="text-gray-500 block leading-none">Event Time</Typography>
                    <Typography variant="body2" className="text-white font-mono text-sm mt-1">{booking.eventTime}</Typography>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37]/70 flex-shrink-0 mt-0.5" />
                <div>
                  <Typography variant="caption" className="text-gray-500 block leading-none">Venue</Typography>
                  <Typography variant="body2" className="text-white text-xs mt-1 leading-relaxed">{booking.venue}</Typography>
                </div>
              </div>
            </div>
          </Box>

          {/* Selected Package Details */}
          <Box className="bg-[#141413] border border-[#D4AF37]/10 p-5 rounded-xl space-y-4">
            <Typography variant="subtitle2" className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs">
              📸 Selected Package
            </Typography>
            <Divider className="border-gray-900" />
            <div className="space-y-3.5">
              <div>
                <Typography variant="caption" className="text-gray-500 block leading-none">Package Name</Typography>
                <Typography variant="body1" className="text-white font-serif font-bold text-base mt-1.5">{booking.packageName}</Typography>
              </div>
              {booking.notes && (
                <div>
                  <Typography variant="caption" className="text-gray-500 block leading-none">Custom Specifications</Typography>
                  <Typography variant="body2" className="text-gray-400 text-xs mt-1.5 leading-relaxed bg-black/25 p-2 rounded border border-[#D4AF37]/5 max-h-24 overflow-y-auto">
                    {booking.notes}
                  </Typography>
                </div>
              )}
            </div>
          </Box>
        </div>

        {/* Payment Summary */}
        <Box className="bg-[#141413] border border-[#D4AF37]/10 p-6 rounded-xl space-y-4">
          <Typography variant="subtitle2" className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs">
            💰 Payment Settlement Ledger
          </Typography>
          <Divider className="border-gray-900" />
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Box className="bg-black/25 p-3.5 rounded border border-[#D4AF37]/5 text-center sm:text-left">
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">Contract Amount</Typography>
              <Typography variant="h6" className="text-white font-mono font-bold mt-1">₹{booking.totalAmount.toLocaleString('en-IN')}</Typography>
            </Box>
            
            <Box className="bg-black/25 p-3.5 rounded border border-[#D4AF37]/5 text-center sm:text-left">
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">Amount Settled</Typography>
              <Typography variant="h6" className="text-green-400 font-mono font-bold mt-1">₹{booking.paidAmount.toLocaleString('en-IN')}</Typography>
            </Box>
            
            <Box className="bg-black/25 p-3.5 rounded border border-[#D4AF37]/5 text-center sm:text-left">
              <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">Outstanding Balance</Typography>
              <Typography variant="h6" className={`${remainingDue > 0 ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold mt-1`}>
                ₹{remainingDue.toLocaleString('en-IN')}
              </Typography>
            </Box>
          </div>

          {/* Payment indicator badge */}
          <Box className="flex items-center justify-between p-3 bg-black/45 rounded border border-[#D4AF37]/5 mt-4">
            <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] font-bold">
              Ledger Settlement Status
            </Typography>
            <Chip
              label={remainingDue > 0 ? 'Outstanding Dues' : 'Fully Settled / Paid'}
              size="small"
              className={`text-[9px] font-bold uppercase tracking-wider ${
                remainingDue > 0 ? 'bg-amber-950/55 text-amber-400 border border-amber-800/30' : 'bg-emerald-950/55 text-emerald-400 border border-emerald-800/30'
              }`}
            />
          </Box>
        </Box>

        {/* Contact Asmaul Production Section */}
        <Box className="bg-[#141413] border border-[#D4AF37]/15 p-6 rounded-2xl space-y-6 mt-6 shadow-2xl relative overflow-hidden text-left">
          {/* Subtle gold decorative accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-40" />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <Typography variant="subtitle1" className="text-white font-serif font-bold tracking-wider text-base flex items-center gap-2">
                <span>🤝 Contact Asmaul Production</span>
              </Typography>
              <Typography variant="caption" className="text-gray-500 text-[10px] uppercase tracking-widest block font-mono">
                Get in touch with us instantly for queries, collaborations or support
              </Typography>
            </div>
            <div className="hidden sm:block text-[10px] text-gray-500 uppercase tracking-widest font-mono border border-gray-800/60 px-2.5 py-1 rounded bg-black/20">
              OFFICIAL HANDLES
            </div>
          </div>

          <Divider className="border-gray-900" />

          {/* Social Icons responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Phone */}
            {settings.contactPhone && (
              <a
                href={`tel:${settings.contactPhone}`}
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-emerald-400 transition-colors">
                    Phone
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Call Dialer
                  </Typography>
                </div>
              </a>
            )}

            {/* WhatsApp */}
            {settings.contactWhatsApp && (
              <a
                href={`https://wa.me/${settings.contactWhatsApp.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#25D366]/30 hover:bg-[#25D366]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#25D366]/10 text-[#25D366] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#25D366] transition-colors">
                    WhatsApp
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Instant Chat
                  </Typography>
                </div>
              </a>
            )}

            {/* Email */}
            {settings.contactEmail && (
              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#EA4335]/30 hover:bg-[#EA4335]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#EA4335]/10 text-[#EA4335] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#EA4335] transition-colors">
                    Email
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Send Mail
                  </Typography>
                </div>
              </a>
            )}

            {/* Website */}
            {settings.contactWebsite && (
              <a
                href={settings.contactWebsite.startsWith('http') ? settings.contactWebsite : `https://${settings.contactWebsite}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#D4AF37]/10 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#D4AF37] transition-colors">
                    Website
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Visit Site
                  </Typography>
                </div>
              </a>
            )}

            {/* Google Maps */}
            {settings.contactGoogleMaps && (
              <a
                href={settings.contactGoogleMaps}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#EA4335]/30 hover:bg-[#EA4335]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-rose-400 transition-colors">
                    Google Maps
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Open Maps
                  </Typography>
                </div>
              </a>
            )}

            {/* Facebook */}
            {settings.contactFacebook && (
              <a
                href={settings.contactFacebook}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#1877F2]/30 hover:bg-[#1877F2]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1877F2]/10 text-[#1877F2] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Facebook className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#1877F2] transition-colors">
                    Facebook
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    View Page
                  </Typography>
                </div>
              </a>
            )}

            {/* Instagram */}
            {settings.contactInstagram && (
              <a
                href={settings.contactInstagram}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#E4405F]/30 hover:bg-[#E4405F]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#E4405F]/10 text-[#E4405F] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#E4405F] transition-colors">
                    Instagram
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    View Profile
                  </Typography>
                </div>
              </a>
            )}

            {/* YouTube */}
            {settings.contactYouTube && (
              <a
                href={settings.contactYouTube}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-gray-900/50 hover:border-[#FF0000]/30 hover:bg-[#FF0000]/5 transition-all duration-300 group"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#FF0000]/10 text-[#FF0000] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <Typography variant="body2" className="text-white font-bold text-xs leading-none group-hover:text-[#FF0000] transition-colors">
                    YouTube
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 text-[9px] block truncate mt-1">
                    Watch Channel
                  </Typography>
                </div>
              </a>
            )}
          </div>
        </Box>

        {/* Helpful notice */}
        <div className="text-center py-4">
          <Typography variant="caption" className="text-gray-600 uppercase tracking-widest text-[9px] font-mono">
            Thank you for choosing Asmaul Production • Capturing Your Eternal Moments
          </Typography>
        </div>

      </Container>

      {/* Album Design Preview Dialog */}
      {booking && (
        <PDFPreviewDialog
          open={viewOpen}
          onClose={() => setViewOpen(false)}
          pdfUrl={previewUrl}
          title={previewTitle || `Album Design: ${booking.clientName}`}
          filename={`Album_Design_${booking.clientName.replace(/\s+/g, '_')}.pdf`}
          onDownload={() => {
            if (previewUrl) {
              window.open(previewUrl, '_blank');
            }
          }}
        />
      )}

      {/* SNACKBAR NOTIFICATION FOR STATUS UPDATES */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity} 
          variant="filled" 
          sx={{ width: '100%', fontSize: '12px' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Agreement Document Preview Dialog */}
      {booking && (
        <PDFPreviewDialog
          open={agreementOpen}
          onClose={() => setAgreementOpen(false)}
          pdfUrl={agreementUrl}
          title={`Wedding Agreement: ${booking.clientName}`}
          filename={`wedding_agreement_${booking.id.toUpperCase().slice(-4)}.pdf`}
          onDownload={() => {
            downloadAgreementPDF(booking, settings);
          }}
        />
      )}


    </Box>
  );
};
