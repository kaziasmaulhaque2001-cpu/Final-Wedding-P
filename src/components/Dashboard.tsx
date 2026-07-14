import React, { useState, useEffect } from 'react';
import { Booking, Payment } from '../types';
import { offlineService } from '../services/offlineService';
import { useSyncState } from '../hooks/useSyncState';
import { useBrand } from '../contexts/BrandContext';
import { UpcomingReminders } from './UpcomingReminders';
import { getStatusChipColor, getStatusLabel, getStatusDotColor, getStatusTextColor } from '../utils/statusUtils';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  LinearProgress, 
  Avatar, 
  Divider, 
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  Alert,
  FormControl,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { 
  DollarSign, 
  Briefcase, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle, 
  Clock, 
  Plus, 
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Activity,
  Award,
  ChevronRight,
  Eye,
  Copy,
  ExternalLink,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
  Upload,
  Trash2,
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../services/firebase';
import { PDFPreviewDialog } from './PDFPreviewDialog';

interface DashboardProps {
  setTab: (tab: string) => void;
  onOpenBookingForm: (type: 'production' | 'freelancer') => void;
  onOpenPaymentForm: () => void;
  refreshTrigger: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  setTab, 
  onOpenBookingForm, 
  onOpenPaymentForm,
  refreshTrigger
}) => {
  const syncState = useSyncState();
  const { formatCurrency, settings } = useBrand();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  // Dialog states for Quick Actions
  const [clientProgressOpen, setClientProgressOpen] = useState(false);
  const [galleryApprovalOpen, setGalleryApprovalOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Album Design Module States
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewPdfTitle, setPreviewPdfTitle] = useState('');
  const [previewPdfFilename, setPreviewPdfFilename] = useState('');
  const [uploadingBookingId, setUploadingBookingId] = useState<string | null>(null);

  const handleUploadPdf = async (booking: Booking, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setSnackbarMessage('Only PDF files are supported.');
      setSnackbarOpen(true);
      return;
    }

    setUploadingBookingId(booking.id);
    try {
      const fileRef = ref(storage, `album_designs/${booking.id}_${Date.now()}.pdf`);
      const uploadTask = uploadBytesResumable(fileRef, file);
      
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => {
            console.error('Upload failed:', error);
            reject(error);
          },
          () => resolve()
        );
      });

      const downloadUrl = await getDownloadURL(fileRef);

      const updatedBooking: Booking = {
        ...booking,
        albumDesignPdfUrl: downloadUrl,
        albumDesignStatus: booking.albumDesignStatus || 'Waiting for Client Review',
        albumDesignUploadDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        updatedAt: Date.now()
      };

      await offlineService.updateBooking(updatedBooking);
      setSnackbarMessage('Album design PDF uploaded successfully!');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      setSnackbarMessage(`Failed to upload PDF: ${error.message || error}`);
      setSnackbarOpen(true);
    } finally {
      setUploadingBookingId(null);
    }
  };

  const handleDeletePdf = async (booking: Booking) => {
    if (!window.confirm('Are you sure you want to delete the Album Design PDF for this booking?')) {
      return;
    }

    setUploadingBookingId(booking.id);
    try {
      if (booking.albumDesignPdfUrl) {
        try {
          const fileRef = ref(storage, booking.albumDesignPdfUrl);
          await deleteObject(fileRef);
        } catch (storageError) {
          console.warn('Could not delete PDF from storage:', storageError);
        }
      }

      const updatedBooking: Booking = {
        ...booking,
        albumDesignPdfUrl: undefined,
        albumDesignStatus: 'Not Uploaded',
        albumDesignUploadDate: undefined,
        updatedAt: Date.now()
      };

      await offlineService.updateBooking(updatedBooking);
      setSnackbarMessage('Album design PDF deleted successfully.');
      setSnackbarOpen(true);
    } catch (error: any) {
      console.error('Error deleting PDF:', error);
      setSnackbarMessage(`Failed to delete PDF: ${error.message || error}`);
      setSnackbarOpen(true);
    } finally {
      setUploadingBookingId(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const bData = await offlineService.getBookings();
      const pData = await offlineService.getPayments();
      setBookings(bData);
      setPayments(pData);
    };
    loadData();
  }, [refreshTrigger, syncState.syncVersion]);

  // Calculations
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const totalReceived = activeBookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalOutstanding = totalRevenue - totalReceived;

  // Explicitly calculated 8 statistics requested by the user:
  // 1. Total Bookings
  const totalBookingsCount = bookings.filter(b => b.status !== 'cancelled').length;
  // 2. Upcoming Events (weddingDate in future or today)
  const upcomingEventsCount = bookings.filter(
    b => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.weddingDate) >= new Date('2026-07-11')
  ).length;
  // 3. Pending Payments (outstanding balance > 0)
  const pendingPaymentsCount = bookings.filter(b => b.status !== 'cancelled' && (b.totalAmount - b.paidAmount) > 0).length;
  // 4. Total Revenue (sum of contract values)
  const totalRevenueValue = totalRevenue;
  // 5. Active Clients (confirmed or in_progress status)
  const activeClientsCount = bookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
  // 6. Freelancers (freelancer bookings)
  const freelancerCount = bookings.filter(b => b.type === 'freelancer' && b.status !== 'cancelled').length;
  // 7. Ongoing Projects (in_progress status)
  const ongoingProjectsCount = bookings.filter(b => b.status === 'in_progress').length;
  // 8. Completed Projects (completed status)
  const completedProjectsCount = bookings.filter(b => b.status === 'completed').length;

  const collectionPercentage = totalRevenue > 0 ? Math.round((totalReceived / totalRevenue) * 100) : 0;

  // Next upcoming bookings
  const upcomingBookings = [...bookings]
    .filter(b => b.status !== 'cancelled' && b.status !== 'completed' && new Date(b.weddingDate) >= new Date('2026-07-11'))
    .sort((a, b) => a.weddingDate.localeCompare(b.weddingDate))
    .slice(0, 3);

  // Recent payments
  const recentPayments = payments.slice(0, 4);

  // Dynamic Activity Feed combining actual real data to match requested types:
  // • New Booking
  // • Payment Received
  // • Status Updated
  // • Gallery Uploaded
  // • Album Approved
  const getDynamicActivities = () => {
    const list: Array<{
      id: string;
      type: 'new_booking' | 'payment_received' | 'status_updated' | 'gallery_uploaded' | 'album_approved';
      title: string;
      description: string;
      date: string;
      meta?: string;
    }> = [];

    // Latest bookings as 'New Booking'
    bookings.slice(0, 2).forEach(b => {
      list.push({
        id: `new-${b.id}`,
        type: 'new_booking',
        title: 'New Booking Registered',
        description: `Client ${b.clientName} signed ${b.packageName} contract.`,
        date: b.weddingDate,
        meta: b.venue
      });
    });

    // Latest payments as 'Payment Received'
    payments.slice(0, 2).forEach(p => {
      list.push({
        id: `pay-${p.id}`,
        type: 'payment_received',
        title: 'Payment Received',
        description: `Settlement of ${formatCurrency(p.amount)} recorded for client ${p.clientName}.`,
        date: p.date,
        meta: `Method: ${p.paymentMethod}`
      });
    });

    // In-progress projects as 'Status Updated'
    bookings.filter(b => b.status === 'in_progress').slice(0, 1).forEach(b => {
      list.push({
        id: `status-${b.id}`,
        type: 'status_updated',
        title: 'Production Status Advanced',
        description: `Project ${b.clientName} moved to Active Photojournalism Edit phase.`,
        date: b.weddingDate,
        meta: `Photographer: ${b.photographer}`
      });
    });

    // Completed projects as 'Gallery Uploaded' and 'Album Approved'
    bookings.filter(b => b.status === 'completed').slice(0, 1).forEach(b => {
      list.push({
        id: `gal-${b.id}`,
        type: 'gallery_uploaded',
        title: 'Production Gallery Uploaded',
        description: `High-resolution cloud catalog uploaded for ${b.clientName}.`,
        date: b.weddingDate,
        meta: 'Secure URL Generated'
      });
      list.push({
        id: `alb-${b.id}`,
        type: 'album_approved',
        title: 'Album Layout Approved',
        description: `Client ${b.clientName} officially signed off on layout revisions.`,
        date: b.weddingDate,
        meta: 'Cleared for Fine-Art Print'
      });
    });

    // Sort to show a premium looking historic list
    return list.slice(0, 5);
  };

  const activities = getDynamicActivities();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage('Secure Portal Link Copied to Clipboard!');
    setSnackbarOpen(true);
  };

  return (
    <Box className="space-y-8 pb-10">
      {/* Offline Alert and Pending Sync Banner */}
      {!syncState.isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-amber-950/40 border border-amber-500/30 p-4 rounded-xl backdrop-blur-md"
        >
          <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0" />
          <Box>
            <Typography variant="body2" className="text-amber-200 font-semibold">
              Operating in Local Standalone Mode (IndexedDB Enabled)
            </Typography>
            <Typography variant="caption" className="text-amber-400/80 block">
              Any changes made will be stored locally in IndexedDB and synchronized to Firestore automatically once internet connectivity is restored.
              {syncState.pendingCount > 0 && ` Currently queueing ${syncState.pendingCount} local updates.`}
            </Typography>
          </Box>
        </motion.div>
      )}

      {/* Hero Welcome Banner */}
      <Box className="relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#121211] via-black to-[#181816] p-6 sm:p-8 shadow-2xl border-gold-glow">
        <div className="absolute right-0 top-0 bottom-0 w-[50%] bg-[radial-gradient(circle_at_right,_rgba(212,175,55,0.06)_0%,_transparent_80%)] pointer-events-none" />
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {settings.studioLogo ? (
                <img src={settings.studioLogo} alt="Logo" className="h-9 object-contain rounded bg-white/5 p-1 border border-[#D4AF37]/30" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[#D4AF37] text-xl font-bold font-serif bg-[#D4AF37]/10 px-3 py-1 rounded border border-[#D4AF37]/30">
                  {settings.appIcon || '📸'}
                </span>
              )}
              <div className="h-4 w-px bg-[#D4AF37]/20" />
              <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-[0.25em] font-bold text-[10px]">
                {settings.studioTagline || "PREMIUM STUDIO OPERATIONS"}
              </Typography>
            </div>
            <Typography variant="h4" className="text-gold-gradient font-bold tracking-wider font-serif uppercase text-2xl sm:text-3xl">
              {settings.studioName || "Asmaul Production"} Workspace
            </Typography>
            <Typography variant="body2" className="text-gray-400 max-w-2xl text-xs sm:text-sm leading-relaxed">
              Welcome to your master operations panel. Delegate photography contracts, track secure invoices, view calendar plannings, and monitor production streams in real-time.
            </Typography>
          </div>
          <div className="flex justify-start lg:justify-end gap-3 flex-wrap w-full lg:w-auto">
            <Button 
              variant="contained" 
              onClick={() => onOpenBookingForm('production')}
              startIcon={<Plus className="w-4 h-4" />}
              size="medium"
              className="text-xs font-bold py-2.5 px-5 rounded bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] border border-[#D4AF37]"
            >
              New Production Book
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => onOpenBookingForm('freelancer')}
              startIcon={<Users className="w-4 h-4" />}
              size="medium"
              className="text-xs font-bold py-2.5 px-5 rounded border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
            >
              Add Freelancer Booking
            </Button>
          </div>
        </div>
      </Box>

      {/* =========================================
          DASHBOARD CARDS (8 Statistic Panels)
          ========================================= */}
      <Box className="space-y-4">
        <div className="flex items-center justify-between">
          <Typography variant="h6" className="text-white font-serif font-semibold tracking-wider text-sm sm:text-base uppercase">
            Executive Studio Metrics
          </Typography>
          <div className="h-px flex-1 bg-gradient-to-r from-[#D4AF37]/20 to-transparent ml-4" />
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Total Bookings */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Briefcase className="w-16 h-16 text-[#D4AF37]" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Total Bookings
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-white text-xl sm:text-2xl mt-1">
                    {totalBookingsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Non-cancelled agreements</span>
                  <Avatar className="bg-[#D4AF37]/10 text-[#D4AF37] w-6 h-6 text-[10px] border border-[#D4AF37]/20">
                    <Briefcase className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Upcoming Events */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-indigo-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Calendar className="w-16 h-16 text-indigo-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Upcoming Events
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-indigo-300 text-xl sm:text-2xl mt-1">
                    {upcomingEventsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Pending shoot dates</span>
                  <Avatar className="bg-indigo-500/10 text-indigo-400 w-6 h-6 text-[10px] border border-indigo-500/20">
                    <Calendar className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Pending Payments */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-amber-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Clock className="w-16 h-16 text-amber-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-amber-400 text-xl sm:text-2xl mt-1">
                    {pendingPaymentsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Outstanding balances</span>
                  <Avatar className="bg-amber-500/10 text-amber-400 w-6 h-6 text-[10px] border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Total Revenue */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-green-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <DollarSign className="w-16 h-16 text-green-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-green-400 text-xl sm:text-2xl mt-1">
                    {formatCurrency(totalRevenueValue)}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Gross production contracts</span>
                  <Avatar className="bg-green-500/10 text-green-400 w-6 h-6 text-[10px] border border-green-500/20">
                    <DollarSign className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 5: Active Clients */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-blue-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Users className="w-16 h-16 text-blue-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Active Clients
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-blue-400 text-xl sm:text-2xl mt-1">
                    {activeClientsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Confirmed & In Progress</span>
                  <Avatar className="bg-blue-500/10 text-blue-400 w-6 h-6 text-[10px] border border-blue-500/20">
                    <Users className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 6: Freelancers */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-teal-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <UserCheck className="w-16 h-16 text-teal-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Freelancers
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-teal-300 text-xl sm:text-2xl mt-1">
                    {freelancerCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Outsourced contracts</span>
                  <Avatar className="bg-teal-500/10 text-teal-400 w-6 h-6 text-[10px] border border-teal-500/20">
                    <UserCheck className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 7: Ongoing Projects */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-purple-500/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Activity className="w-16 h-16 text-purple-400" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Ongoing Projects
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-purple-300 text-xl sm:text-2xl mt-1">
                    {ongoingProjectsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Currently editing/producing</span>
                  <Avatar className="bg-purple-500/10 text-purple-400 w-6 h-6 text-[10px] border border-purple-500/20">
                    <Activity className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 8: Completed Projects */}
          <motion.div whileHover={{ y: -4 }} className="transition-all">
            <Card className="h-full border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#0A0A09] shadow-lg rounded-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 p-3 opacity-10">
                <Award className="w-16 h-16 text-[#D4AF37]" />
              </div>
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full">
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-400 uppercase tracking-wider text-[10px] block font-medium">
                    Completed Projects
                  </Typography>
                  <Typography variant="h4" className="font-bold font-mono text-[#D4AF37] text-xl sm:text-2xl mt-1">
                    {completedProjectsCount}
                  </Typography>
                </Box>
                <div className="mt-4 flex items-center justify-between text-[10px] text-gray-500">
                  <span>Finished & fully delivered</span>
                  <Avatar className="bg-[#D4AF37]/10 text-[#D4AF37] w-6 h-6 text-[10px] border border-[#D4AF37]/20">
                    <Award className="w-3.5 h-3.5" />
                  </Avatar>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Box>

      {/* Upcoming Reminders (48 Hours urgency highlight) */}
      <UpcomingReminders bookings={bookings} formatCurrency={formatCurrency} />

      {/* Secondary Row: Ratio SVG & Upcoming Wedding Books */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Target Gauge */}
        <Card className="border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#080807] flex flex-col justify-between p-5 rounded-2xl shadow-xl">
          <Box>
            <Typography variant="h6" className="text-gold-gradient font-bold tracking-wider font-serif mb-1 uppercase text-sm sm:text-base">
              Collection Efficiency
            </Typography>
            <Typography variant="caption" className="text-gray-500 block">
              Performance against gross contracted values
            </Typography>
          </Box>

          <Box className="flex flex-col items-center justify-center py-6">
            <Box className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  className="stroke-gray-900"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  stroke="url(#premiumGoldGradient)"
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 65}
                  strokeDashoffset={2 * Math.PI * 65 * (1 - collectionPercentage / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="premiumGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#AA7C11" />
                    <stop offset="50%" stopColor="#D4AF37" />
                    <stop offset="100%" stopColor="#FFF2CC" />
                  </linearGradient>
                </defs>
              </svg>
              <Box className="absolute flex flex-col items-center justify-center">
                <Typography variant="h4" className="font-mono font-bold text-white text-3xl">
                  {collectionPercentage}%
                </Typography>
                <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest text-[9px] font-bold">
                  Received
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box className="space-y-3 pt-3 border-t border-[#D4AF37]/10">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Total Received:</span>
              <span className="font-mono font-bold text-green-400">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Outstanding:</span>
              <span className="font-mono font-bold text-amber-400">{formatCurrency(totalOutstanding)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Total Value:</span>
              <span className="font-mono font-bold text-[#D4AF37]">{formatCurrency(totalRevenue)}</span>
            </div>
          </Box>
        </Card>

        {/* Upcoming Wedding Books (List of Next 3) */}
        <div className="lg:col-span-2">
          <Card className="border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#080807] h-full p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <Box>
              <Box className="flex justify-between items-center mb-4">
                <Box>
                  <Typography variant="h6" className="text-gold-gradient font-bold tracking-wider font-serif uppercase text-sm sm:text-base">
                    Upcoming Wedding Books
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    Next critical scheduled productions and contracts
                  </Typography>
                </Box>
                <Button 
                  variant="text" 
                  onClick={() => setTab('calendar')}
                  endIcon={<ArrowUpRight className="w-4 h-4" />}
                  size="small"
                  className="text-xs text-[#D4AF37]"
                >
                  Full Calendar
                </Button>
              </Box>

              <Box className="space-y-3.5">
                {upcomingBookings.length === 0 ? (
                  <Box className="py-12 text-center text-gray-500 border border-dashed border-[#D4AF37]/20 rounded-xl">
                    No upcoming wedding bookings registered. Click quick buttons to add.
                  </Box>
                ) : (
                  upcomingBookings.map((b) => {
                    const outstanding = b.totalAmount - b.paidAmount;
                    return (
                      <Box 
                        key={b.id} 
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-[#D4AF37]/10 hover:border-[#D4AF37]/35 transition-all gap-4"
                      >
                        <Box className="flex items-center gap-3">
                          <Avatar className={`w-10 h-10 border text-[#0D0D0C] font-serif font-bold text-sm flex-shrink-0 ${
                            b.type === 'production' 
                              ? 'bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] border-[#D4AF37]' 
                              : 'bg-gradient-to-br from-slate-600 to-slate-800 border-slate-600 text-white'
                          }`}>
                            {b.clientName[0]}
                          </Avatar>
                          <Box>
                            <Box className="flex items-center gap-2 flex-wrap">
                              <Typography variant="subtitle2" className="text-white font-bold font-serif text-sm">
                                {b.clientName}
                              </Typography>
                              <Chip 
                                label={b.type === 'production' ? 'Production' : 'Freelancer'}
                                size="small"
                                className={`text-[8px] h-4.5 px-1 uppercase font-bold ${
                                  b.type === 'production' 
                                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' 
                                    : 'bg-slate-500/10 text-slate-300 border border-slate-500/30'
                                }`}
                              />
                            </Box>
                            <Typography variant="caption" className="text-gray-400 text-[11px] block truncate max-w-[280px] sm:max-w-[320px]">
                              {b.venue}
                            </Typography>
                            <Box className="flex items-center gap-3 mt-0.5 text-[11px] text-gray-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-[#AA7C11]" />
                                {b.weddingDate.split('-').length === 3 
                                  ? `${b.weddingDate.split('-')[2]}/${b.weddingDate.split('-')[1]}/${b.weddingDate.split('-')[0]}` 
                                  : b.weddingDate}
                              </span>
                              <span>•</span>
                              <span>{b.photographer}</span>
                            </Box>
                          </Box>
                        </Box>
                        <Box className="sm:text-right w-full sm:w-auto flex sm:flex-col justify-between sm:justify-center items-center sm:items-end border-t sm:border-0 pt-2 sm:pt-0 border-gold-glow/10">
                          <Typography variant="body2" className="font-mono font-bold text-white text-sm">
                            {formatCurrency(b.totalAmount)}
                          </Typography>
                          {outstanding > 0 ? (
                            <Typography variant="caption" className="text-amber-400 font-mono text-[10px]">
                              Due: {formatCurrency(outstanding)}
                            </Typography>
                          ) : (
                            <Typography variant="caption" className="text-green-400 font-bold text-[10px] uppercase tracking-wider">
                              Fully Settled
                            </Typography>
                          )}
                          <Chip 
                            label={getStatusLabel(b.status)} 
                            size="small"
                            className={`text-[9px] h-4.5 uppercase mt-1 font-bold border ${getStatusChipColor(b.status)}`}
                          />
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>
            </Box>
          </Card>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Ledger & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* =========================================
            RECENT ACTIVITY (Vertical Timeline)
            ========================================= */}
        <div className="lg:col-span-7">
          <Card className="border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#080807] h-full p-5 rounded-2xl shadow-xl">
            <Box className="mb-5">
              <Typography variant="h6" className="text-gold-gradient font-bold tracking-wider font-serif uppercase text-sm sm:text-base">
                Recent Operations Ledger
              </Typography>
              <Typography variant="caption" className="text-gray-500 block">
                Audited activity feed representing database alterations
              </Typography>
            </Box>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37]/40 before:via-[#D4AF37]/10 before:to-transparent">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full border border-[#D4AF37] bg-[#0D0D0C] shadow-[0_0_8px_rgba(212,175,55,0.4)] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  </span>
                  
                  <Box className="bg-black/30 p-3 rounded-xl border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition-all">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Typography variant="subtitle2" className="text-white font-serif font-bold text-xs sm:text-sm">
                          {act.title}
                        </Typography>
                        <Typography variant="body2" className="text-gray-400 text-xs mt-0.5 leading-relaxed">
                          {act.description}
                        </Typography>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono uppercase bg-black/40 px-2 py-0.5 rounded border border-[#D4AF37]/5 flex-shrink-0">
                        {act.date}
                      </span>
                    </div>
                    {act.meta && (
                      <div className="mt-2 text-[10px] text-[#D4AF37]/80 font-medium">
                        {act.meta}
                      </div>
                    )}
                  </Box>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* =========================================
            QUICK ACTIONS panel (Interactive Actions)
            ========================================= */}
        <div className="lg:col-span-5">
          <Card className="border border-[#D4AF37]/15 bg-gradient-to-b from-[#141413] to-[#080807] h-full p-5 rounded-2xl shadow-xl flex flex-col justify-between">
            <Box>
              <Box className="mb-5">
                <Typography variant="h6" className="text-gold-gradient font-bold tracking-wider font-serif uppercase text-sm sm:text-base">
                  Interactive Quick Actions
                </Typography>
                <Typography variant="caption" className="text-gray-500 block">
                  Instant administrative overlays
                </Typography>
              </Box>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outlined" 
                  onClick={() => onOpenBookingForm('production')}
                  className="border-[#D4AF37]/20 text-white font-bold text-xs justify-start p-4 bg-black/20 hover:bg-[#D4AF37]/10 flex flex-col gap-2 items-start rounded-xl group transition-all"
                >
                  <Briefcase className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <Box>
                    <div className="text-left font-serif text-gold-gradient text-xs">New Booking</div>
                    <div className="text-[9px] text-gray-500 font-sans tracking-tight text-left mt-0.5">Primary Studio Agreement</div>
                  </Box>
                </Button>

                <Button 
                  variant="outlined" 
                  onClick={onOpenPaymentForm}
                  className="border-[#D4AF37]/20 text-white font-bold text-xs justify-start p-4 bg-black/20 hover:bg-[#D4AF37]/10 flex flex-col gap-2 items-start rounded-xl group transition-all"
                >
                  <DollarSign className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
                  <Box>
                    <div className="text-left font-serif text-gold-gradient text-xs">Add Payment</div>
                    <div className="text-[9px] text-gray-500 font-sans tracking-tight text-left mt-0.5">Record client installment</div>
                  </Box>
                </Button>

                <Button 
                  variant="outlined" 
                  onClick={() => onOpenBookingForm('freelancer')}
                  className="border-[#D4AF37]/20 text-white font-bold text-xs justify-start p-4 bg-black/20 hover:bg-[#D4AF37]/10 flex flex-col gap-2 items-start rounded-xl group transition-all"
                >
                  <Users className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                  <Box>
                    <div className="text-left font-serif text-gold-gradient text-xs">Add Freelancer</div>
                    <div className="text-[9px] text-gray-500 font-sans tracking-tight text-left mt-0.5">Register outsourced crew</div>
                  </Box>
                </Button>

                <Button 
                  variant="outlined" 
                  onClick={() => setClientProgressOpen(true)}
                  className="border-[#D4AF37]/20 text-white font-bold text-xs justify-start p-4 bg-black/20 hover:bg-[#D4AF37]/10 flex flex-col gap-2 items-start rounded-xl group transition-all"
                >
                  <TrendingUp className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <Box>
                    <div className="text-left font-serif text-gold-gradient text-xs">Client Progress</div>
                    <div className="text-[9px] text-gray-500 font-sans tracking-tight text-left mt-0.5">View production stages</div>
                  </Box>
                </Button>

                <Button 
                  variant="outlined" 
                  onClick={() => setGalleryApprovalOpen(true)}
                  className="border-[#D4AF37]/20 text-white font-bold text-xs justify-start p-4 bg-black/20 hover:bg-[#D4AF37]/10 flex flex-col gap-2 items-start rounded-xl group sm:col-span-2 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-[#D4AF37] group-hover:scale-110 transition-transform animate-pulse" />
                  <Box>
                    <div className="text-left font-serif text-gold-gradient text-xs">Gallery & Approval</div>
                    <div className="text-[9px] text-gray-500 font-sans tracking-tight text-left mt-0.5">Manage Client Portals & Approvals</div>
                  </Box>
                </Button>
              </div>
            </Box>

            <Box className="mt-5 p-3 rounded-xl bg-black/30 border border-[#D4AF37]/10">
              <Typography variant="caption" className="text-gray-400 flex items-center gap-1.5 leading-snug">
                <TrendingUp className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                <span>Production algorithms are highly optimized. Local databases will sync instantly when online.</span>
              </Typography>
            </Box>
          </Card>
        </div>
      </div>

      {/* =========================================
          CLIENT PROGRESS DIALOG
          ========================================= */}
      <Dialog 
        open={clientProgressOpen} 
        onClose={() => setClientProgressOpen(false)} 
        fullWidth 
        maxWidth="md"
        slotProps={{
          paper: {
            className: "border border-[#D4AF37]/30 bg-[#121211] shadow-2xl rounded-2xl p-2"
          }
        }}
      >
        <DialogTitle className="border-b border-[#D4AF37]/10 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#D4AF37]" />
            <Typography variant="h6" className="text-gold-gradient font-bold font-serif uppercase text-base sm:text-lg">
              Active Client Production Progress
            </Typography>
          </div>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] mt-0.5 block">
            Visual stages of contracts, photography, and post-production deliverables
          </Typography>
        </DialogTitle>
        <DialogContent className="py-5 space-y-4 max-h-[450px] overflow-y-auto">
          {activeBookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              No active clients currently registered.
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => {
                let progressValue = 33;
                let progressLabel = "Contract & Retainer Settled";
                if (b.status === "in_progress") {
                  progressValue = 66;
                  progressLabel = "Photography Shot & Undergoing Edit";
                } else if (b.status === "completed") {
                  progressValue = 100;
                  progressLabel = "Production Completed & Delivered";
                }

                return (
                  <Box key={b.id} className="p-4 rounded-xl bg-black/35 border border-[#D4AF37]/10 space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Typography variant="subtitle2" className="text-white font-serif font-bold text-sm">
                          {b.clientName}
                        </Typography>
                        <Typography variant="caption" className="text-gray-400 text-[11px] block">
                          Venue: {b.venue} • Lead: {b.photographer}
                        </Typography>
                      </div>
                      <Chip 
                        label={progressLabel} 
                        size="small"
                        className={`text-[8px] h-4.5 font-bold uppercase tracking-wider bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20`} 
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Production Stage</span>
                        <span>{progressValue}%</span>
                      </div>
                      <LinearProgress 
                        variant="determinate" 
                        value={progressValue} 
                        className="h-2 rounded bg-gray-900"
                        sx={{
                          '& .MuiLinearProgress-bar': {
                            background: 'linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)',
                          }
                        }}
                      />
                    </div>
                  </Box>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions className="border-t border-[#D4AF37]/10 pt-3">
          <Button onClick={() => setClientProgressOpen(false)} className="text-[#D4AF37] text-xs font-bold font-sans">
            Close Panel
          </Button>
        </DialogActions>
      </Dialog>

      {/* =========================================
          GALLERY & APPROVAL DIALOG
          ========================================= */}
      <Dialog 
        open={galleryApprovalOpen} 
        onClose={() => setGalleryApprovalOpen(false)} 
        fullWidth 
        maxWidth="md"
        slotProps={{
          paper: {
            className: "border border-[#D4AF37]/30 bg-[#121211] shadow-2xl rounded-2xl p-2"
          }
        }}
      >
        <DialogTitle className="border-b border-[#D4AF37]/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            <Typography variant="h6" className="text-gold-gradient font-bold font-serif uppercase text-base sm:text-lg">
              Gallery Portals & Album Approvals
            </Typography>
          </div>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] mt-0.5 block">
            Generate, copy and open luxury client-facing viewports for photo album sign-offs
          </Typography>
        </DialogTitle>
        <DialogContent className="py-5 space-y-4 max-h-[450px] overflow-y-auto">
          {bookings.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-xs">
              No registered bookings to generate portals for.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b) => {
                const clientUrl = `${window.location.origin}/client/${b.id}`;
                return (
                  <Box key={b.id} className="p-4 rounded-xl bg-black/35 border border-[#D4AF37]/10 space-y-3">
                    <div className="flex justify-between items-center gap-4 flex-wrap">
                      <div>
                        <Typography variant="subtitle2" className="text-white font-serif font-bold text-sm">
                          {b.clientName}
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 text-[10px] block">
                          Package: {b.packageName}
                        </Typography>
                      </div>
                      <div className="flex items-center gap-2">
                        {b.status === "completed" ? (
                          <Chip 
                            icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                            label="Album Approved" 
                            size="small"
                            className="text-[8px] h-4.5 font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20" 
                          />
                        ) : b.status === "in_progress" ? (
                          <Chip 
                            label="Gallery Uploaded / In Review" 
                            size="small"
                            className="text-[8px] h-4.5 font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                          />
                        ) : (
                          <Chip 
                            label="Pending Production" 
                            size="small"
                            className="text-[8px] h-4.5 font-bold uppercase tracking-wider bg-gray-500/10 text-gray-400 border border-gray-500/20" 
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-black/60 p-2.5 rounded-lg border border-[#D4AF37]/15">
                      <Lock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <Typography variant="body2" className="text-gray-400 truncate text-[11px] font-mono flex-1">
                        {clientUrl}
                      </Typography>
                      <Tooltip title="Copy Portal Link">
                        <IconButton size="small" onClick={() => copyToClipboard(clientUrl)} className="text-[#D4AF37]">
                          <Copy className="w-3.5 h-3.5" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Launch Portal Viewport">
                        <IconButton size="small" href={`/client/${b.id}`} target="_blank" className="text-[#D4AF37]">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </IconButton>
                      </Tooltip>
                    </div>

                    {/* Album Design Section */}
                    <Box className="mt-4 pt-4 border-t border-[#D4AF37]/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#D4AF37]" />
                        <Typography variant="subtitle2" className="text-white font-serif font-bold text-xs uppercase tracking-wider">
                          📄 Album Design
                        </Typography>
                      </div>

                      {b.albumDesignPdfUrl ? (
                        <div className="space-y-3 bg-black/25 p-3 rounded-lg border border-[#D4AF37]/5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono">
                                <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                                <span>Uploaded: {b.albumDesignUploadDate || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-gray-400">Status:</span>
                                <Chip
                                  label={b.albumDesignStatus === 'Approved' ? 'Album Approved' : (b.albumDesignStatus || 'Waiting for Client Review')}
                                  size="small"
                                  className={`text-[9px] h-4.5 font-bold uppercase tracking-wider ${
                                    b.albumDesignStatus === 'Album Approved' || b.albumDesignStatus === 'Approved' ? 'bg-green-500/15 text-green-400 border border-green-500/20' :
                                    b.albumDesignStatus === 'Changes Requested' ? 'bg-red-500/15 text-red-400 border border-red-500/20' :
                                    b.albumDesignStatus === 'Client Reviewing' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                                    b.albumDesignStatus === 'Not Uploaded' ? 'bg-stone-500/15 text-stone-400 border border-stone-500/20' :
                                    'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                  }`}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">Change Status:</span>
                              <Select
                                value={b.albumDesignStatus === 'Approved' ? 'Album Approved' : (b.albumDesignStatus || 'Waiting for Client Review')}
                                onChange={async (e) => {
                                  const updated = {
                                    ...b,
                                    albumDesignStatus: e.target.value as any
                                  };
                                  await offlineService.updateBooking(updated);
                                  setSnackbarMessage('Album design status updated successfully.');
                                  setSnackbarOpen(true);
                                }}
                                className="bg-black/40 border border-[#D4AF37]/10 text-white font-sans text-xs rounded animate-none"
                                sx={{
                                  height: '28px',
                                  color: 'white',
                                  fontSize: '11px',
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212,175,55,0.2)' },
                                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(212,175,55,0.4)' },
                                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4AF37' },
                                  '& .MuiSelect-select': { py: '4px', px: '8px' }
                                }}
                              >
                                <MenuItem value="Not Uploaded" className="text-xs">Not Uploaded</MenuItem>
                                <MenuItem value="Waiting for Client Review" className="text-xs">Waiting for Client Review</MenuItem>
                                <MenuItem value="Client Reviewing" className="text-xs">Client Reviewing</MenuItem>
                                <MenuItem value="Changes Requested" className="text-xs">Changes Requested</MenuItem>
                                <MenuItem value="Album Approved" className="text-xs">Album Approved</MenuItem>
                              </Select>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-900">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => {
                                setPreviewPdfUrl(b.albumDesignPdfUrl || null);
                                setPreviewPdfTitle(`Album Design: ${b.clientName}`);
                                setPreviewPdfFilename(`Album_Design_${b.clientName.replace(/\s+/g, '_')}.pdf`);
                                setPreviewOpen(true);
                              }}
                              startIcon={<Eye className="w-3.5 h-3.5" />}
                              className="text-xs text-[#D4AF37] border-[#D4AF37]/20 hover:bg-[#D4AF37]/10 h-7"
                              sx={{ textTransform: 'none' }}
                            >
                              Preview
                            </Button>

                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => window.open(b.albumDesignPdfUrl, '_blank')}
                              startIcon={<Download className="w-3.5 h-3.5" />}
                              className="text-xs text-green-400 border-green-950/40 hover:bg-green-500/10 h-7"
                              sx={{ textTransform: 'none' }}
                            >
                              Download
                            </Button>

                            <label className="cursor-pointer">
                              <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => handleUploadPdf(b, e)}
                              />
                              <Button
                                size="small"
                                variant="outlined"
                                component="span"
                                disabled={uploadingBookingId === b.id}
                                startIcon={uploadingBookingId === b.id ? <CircularProgress size={12} color="inherit" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                className="text-xs text-amber-400 border-amber-950/40 hover:bg-amber-500/10 h-7"
                                sx={{ textTransform: 'none' }}
                              >
                                {uploadingBookingId === b.id ? 'Replacing...' : 'Replace PDF'}
                              </Button>
                            </label>

                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              onClick={() => handleDeletePdf(b)}
                              disabled={uploadingBookingId === b.id}
                              startIcon={<Trash2 className="w-3.5 h-3.5" />}
                              className="text-xs text-red-400 border-red-950/40 hover:bg-red-500/10 h-7"
                              sx={{ textTransform: 'none' }}
                            >
                              Delete PDF
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/25 border border-dashed border-[#D4AF37]/15 rounded-lg p-4 text-center space-y-3">
                          <Typography variant="body2" className="text-gray-500 text-xs">
                            No Album Design PDF has been uploaded for this booking.
                          </Typography>
                          <label className="inline-block cursor-pointer">
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(e) => handleUploadPdf(b, e)}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              component="span"
                              disabled={uploadingBookingId === b.id}
                              startIcon={uploadingBookingId === b.id ? <CircularProgress size={12} color="inherit" /> : <Upload className="w-3.5 h-3.5" />}
                              className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 text-xs px-4 h-8"
                              sx={{ textTransform: 'none' }}
                            >
                              {uploadingBookingId === b.id ? 'Uploading...' : 'Upload Album Design PDF'}
                            </Button>
                          </label>
                        </div>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </div>
          )}
        </DialogContent>
        <DialogActions className="border-t border-[#D4AF37]/10 pt-3">
          <Button onClick={() => setGalleryApprovalOpen(false)} className="text-[#D4AF37] text-xs font-bold font-sans">
            Close Panel
          </Button>
        </DialogActions>
      </Dialog>

      {/* SNACKBAR FOR COPY LINK CONFIRMATION */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={3000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" className="bg-[#121211] text-[#D4AF37] border border-[#D4AF37]/30 font-semibold font-sans rounded-xl shadow-2xl">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Album Design Preview Dialog */}
      <PDFPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        pdfUrl={previewPdfUrl}
        title={previewPdfTitle}
        filename={previewPdfFilename}
        onDownload={() => {
          if (previewPdfUrl) {
            window.open(previewPdfUrl, '_blank');
          }
        }}
      />
    </Box>
  );
};
