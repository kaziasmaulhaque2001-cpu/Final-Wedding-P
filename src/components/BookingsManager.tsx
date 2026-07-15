import React, { useState, useEffect } from 'react';
import { Booking, FreelancerAssignment } from '../types';
import { offlineService } from '../services/offlineService';
import { getStatusChipColor, getStatusLabel } from '../utils/statusUtils';
import { useSyncState } from '../hooks/useSyncState';
import { useBrand } from '../contexts/BrandContext';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  FormControl,
  Select,
  InputLabel,
  OutlinedInput,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  User,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  FileText,
  MessageSquare,
  Check,
  RefreshCw,
  Send,
  History,
  AlertCircle,
  Clock,
  ArrowUpDown,
  Users,
  Download,
  Copy,
  QrCode,
  ExternalLink,
  Share2,
  Camera,
  Video
} from 'lucide-react';
import { 
  buildBookingConfirmationPDF,
  buildInvoicePDF,
  buildFreelancerWorkOrderPDF,
  downloadBookingConfirmationPDF, 
  downloadInvoicePDF, 
  downloadFreelancerWorkOrderPDF,
  handlePDFActions,
  buildAgreementPDF,
  downloadAgreementPDF
} from '../utils/pdfGenerator';
import { PDFActionsTriggerDialog } from './PDFActionsTriggerDialog';
import { PDFPreviewDialog } from './PDFPreviewDialog';

interface BookingsManagerProps {
  initialTab?: 'production' | 'freelancer';
  bookingFormOpen: boolean;
  bookingFormType: 'production' | 'freelancer' | null;
  selectedBooking: Booking | null;
  onCloseBookingForm: () => void;
  onTriggerRefresh: () => void;
  refreshTrigger: number;
}

export const BookingsManager: React.FC<BookingsManagerProps> = ({
  initialTab = 'production',
  bookingFormOpen,
  bookingFormType,
  selectedBooking,
  onCloseBookingForm,
  onTriggerRefresh,
  refreshTrigger
}) => {
  const syncState = useSyncState();
  const { formatCurrency, settings } = useBrand();
  const [activeTab, setActiveTab] = useState<'production' | 'freelancer'>(initialTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Advanced Filter States for Freelancer module
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [freelancerFilter, setFreelancerFilter] = useState('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  
  // Dialog States
  const [formOpen, setFormOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // PDF Action Dialog states
  const [pdfActionOpen, setPdfActionOpen] = useState(false);
  const [pdfActionData, setPdfActionData] = useState<{
    title: string;
    subtitle: string;
    clientName: string;
    documentType: 'Booking Confirmation' | 'Payment Receipt' | 'Invoice' | 'Agreement';
    booking: Booking;
  } | null>(null);

  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('');
  const [pdfPreviewFilename, setPdfPreviewFilename] = useState('');
  const [pdfPreviewDoc, setPdfPreviewDoc] = useState<any | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);

  // QR Dialog States
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [qrCodeLink, setQrCodeLink] = useState('');

  // Status Dropdown rendering helper for live tracking
  const renderStatusDropdown = (label: string, field: keyof Booking, options: string[]) => {
    if (!currentBooking) return null;
    const val = (currentBooking[field] as string) || 'Pending';
    return (
      <Box className="flex flex-col gap-1">
        <Typography variant="caption" className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">{label}</Typography>
        <FormControl size="small" fullWidth>
          <Select
            value={val}
            onChange={async (e) => {
              const newVal = e.target.value;
              const updated = { ...currentBooking, [field]: newVal };
              setCurrentBooking(updated);
              await offlineService.updateBooking(updated);
              if (onTriggerRefresh) onTriggerRefresh();
            }}
            className="text-xs text-white bg-black/40 border border-[#D4AF37]/20 rounded h-8"
            sx={{
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSelect-select': { py: 0.5, px: 1, display: 'flex', alignItems: 'center' }
            }}
          >
            {options.map(opt => (
              <MenuItem key={opt} value={opt} className="text-xs text-gray-300 bg-[#141413] hover:bg-[#D4AF37]/10">{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    );
  };

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [venue, setVenue] = useState('');
  const [packageName, setPackageName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<Booking['status']>('pending');
  const [photographer, setPhotographer] = useState('');
  const [notes, setNotes] = useState('');
  const [freelancerRate, setFreelancerRate] = useState<number | ''>('');
  const [assignedFreelancers, setAssignedFreelancers] = useState<string[]>([]);
  const [freelancerAssignments, setFreelancerAssignments] = useState<FreelancerAssignment[]>([]);

  // Automatic sync of weddingDate and venue to existing assignments
  useEffect(() => {
    setFreelancerAssignments(prev => prev.map(row => ({
      ...row,
      eventDate: weddingDate,
      venue: venue || 'Studio Production'
    })));
  }, [weddingDate, venue]);

  const handleAddAssignmentRow = () => {
    const newRow: FreelancerAssignment = {
      freelancerName: settings.photographers?.[0] || '',
      eventType: 'Wedding',
      eventDate: weddingDate || '',
      venue: venue || 'Studio Production',
      perDayRate: 0,
      workingDays: 1,
      totalPayment: 0
    };
    setFreelancerAssignments(prev => [...prev, newRow]);
  };

  const handleRemoveAssignmentRow = (index: number) => {
    setFreelancerAssignments(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateAssignmentRow = (index: number, field: keyof FreelancerAssignment, value: any) => {
    setFreelancerAssignments(prev => prev.map((row, i) => {
      if (i === index) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'perDayRate' || field === 'workingDays') {
          updatedRow.totalPayment = Number(updatedRow.perDayRate || 0) * Number(updatedRow.workingDays || 0);
        }
        return updatedRow;
      }
      return row;
    }));
  };
  
  // Custom Metadata Form Fields
  const [freelancerPhone, setFreelancerPhone] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [eventTime, setEventTime] = useState('12:00 PM');
  const [reportingTime, setReportingTime] = useState('11:00 AM');
  const [bookingFor, setBookingFor] = useState('Wedding');
  const [coverage, setCoverage] = useState('Both Side');

  // Custom Manual Agreement Fields
  const [preWedding, setPreWedding] = useState<'Yes' | 'No'>('No');
  const [eventDate, setEventDate] = useState('');
  const [weddingLocation, setWeddingLocation] = useState('');
  const [receptionDate, setReceptionDate] = useState('');
  const [receptionLocation, setReceptionLocation] = useState('');
  const [firstPayment, setFirstPayment] = useState<number | ''>('');
  const [secondPayment, setSecondPayment] = useState<number | ''>('');

  // Simplified Form Custom Fields
  const [contactPerson, setContactPerson] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [googleMapLocation, setGoogleMapLocation] = useState('');
  const [packagePrice, setPackagePrice] = useState<number | ''>('');
  const [discount, setDiscount] = useState<number | ''>('');
  const [advanceAmount, setAdvanceAmount] = useState<number | ''>('');
  const [totalPaid, setTotalPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Automatically sync clientName for listings
  useEffect(() => {
    if (activeTab === 'production') {
      if (brideName.trim() && groomName.trim()) {
        setClientName(`${brideName.trim()} & ${groomName.trim()}`);
      } else if (brideName.trim()) {
        setClientName(brideName.trim());
      } else if (groomName.trim()) {
        setClientName(groomName.trim());
      } else {
        setClientName('');
      }
    }
  }, [brideName, groomName, activeTab]);

  // Sync weddingLocation with venue for standard listings/maps
  useEffect(() => {
    if (weddingLocation.trim()) {
      setVenue(weddingLocation.trim());
    }
  }, [weddingLocation]);

  // Auto-calculate Total Amount on packagePrice or discount change
  useEffect(() => {
    const calculatedTotal = Math.max(0, Number(packagePrice || 0) - Number(discount || 0));
    setTotalAmount(calculatedTotal === 0 ? '' : calculatedTotal);
  }, [packagePrice, discount]);

  // Automatically update complex event list schedules from simple Work Info fields
  useEffect(() => {
    if (bookingFor === 'Wedding') return; // Do not overwrite user checklist selections for Wedding bookingFor
    setEvents(prev => ({
      ...prev,
      wedding: {
        ...prev.wedding,
        enabled: true,
        date: weddingDate,
        location: weddingLocation
      },
      preWedding: {
        ...prev.preWedding,
        enabled: preWedding === 'Yes',
        date: eventDate || prev.preWedding.date
      },
      reception: {
        ...prev.reception,
        enabled: !!receptionDate,
        date: receptionDate,
        location: receptionLocation
      }
    }));
  }, [weddingDate, weddingLocation, preWedding, eventDate, receptionDate, receptionLocation, bookingFor]);

  // Auto populate defaults on selecting packages
  const handlePackageChange = (pkg: string) => {
    setPackageName(pkg);
    
    if (pkg === 'Premium Wedding Cine Suite') {
      setPackagePrice(65000);
      setDiscount(5000);
      setAdvanceAmount(15000);
      setFirstPayment(35000);
      setSecondPayment(10000);
      
      // Photo inclusions
      setPhotographyService(true);
      setAlbumService(true);
      setFrameService(true);
      setPendriveService(true);
      setEditedPhotosService(true);
      
      // Video inclusions
      setVideographyService(true);
      setStandardEditService(true);
      setCinematicEditService(true);
      setRawVideoService(true);
      setTrailerService(true);
    } else if (pkg === 'Pre-Wedding Love Story') {
      setPackagePrice(25000);
      setDiscount(2000);
      setAdvanceAmount(5000);
      setFirstPayment(15000);
      setSecondPayment(3000);
      
      // Photo inclusions
      setPhotographyService(true);
      setAlbumService(false);
      setFrameService(true);
      setPendriveService(true);
      setEditedPhotosService(true);
      
      // Video inclusions
      setVideographyService(true);
      setStandardEditService(false);
      setCinematicEditService(true);
      setRawVideoService(true);
      setTrailerService(true);
    } else if (pkg === 'Royal Cinematic Editorial') {
      setPackagePrice(120000);
      setDiscount(10000);
      setAdvanceAmount(25000);
      setFirstPayment(65000);
      setSecondPayment(20000);
      
      // Photo inclusions
      setPhotographyService(true);
      setAlbumService(true);
      setFrameService(true);
      setPendriveService(true);
      setEditedPhotosService(true);
      
      // Video inclusions
      setVideographyService(true);
      setStandardEditService(true);
      setCinematicEditService(true);
      setRawVideoService(true);
      setTrailerService(true);
    } else {
      // Fallback custom elite
      setPackagePrice(50000);
      setDiscount(0);
      setAdvanceAmount(10000);
      setFirstPayment(30000);
      setSecondPayment(10000);
      
      // Photo inclusions
      setPhotographyService(true);
      setAlbumService(true);
      setFrameService(true);
      setPendriveService(true);
      setEditedPhotosService(true);
      
      // Video inclusions
      setVideographyService(true);
      setStandardEditService(true);
      setCinematicEditService(true);
      setRawVideoService(true);
      setTrailerService(true);
    }
  };

  // Package Details - Photography Features
  const [photographyService, setPhotographyService] = useState(false);
  const [albumService, setAlbumService] = useState(false);
  const [frameService, setFrameService] = useState(false);
  const [pendriveService, setPendriveService] = useState(false);
  const [editedPhotosService, setEditedPhotosService] = useState(false);

  // Package Details - Videography Features
  const [videographyService, setVideographyService] = useState(false);
  const [standardEditService, setStandardEditService] = useState(false);
  const [cinematicEditService, setCinematicEditService] = useState(false);
  const [rawVideoService, setRawVideoService] = useState(false);
  const [trailerService, setTrailerService] = useState(false);
  const [droneService, setDroneService] = useState(false);
  const [ledWallService, setLedWallService] = useState(false);
  const [craneService, setCraneService] = useState(false);
  const [liveStreamingService, setLiveStreamingService] = useState(false);

  // Team Assignment
  const [leadPhotographer, setLeadPhotographer] = useState('');
  const [leadCinematographer, setLeadCinematographer] = useState('');

  // Agreement Details
  const [agreementNumber, setAgreementNumber] = useState('');
  const [agreementDate, setAgreementDate] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [events, setEvents] = useState<Record<string, { enabled: boolean; date: string; time: string; location: string }>>({
    wedding: { enabled: true, date: '', time: '12:00 PM', location: '' },
    preWedding: { enabled: false, date: '', time: '12:00 PM', location: '' },
    mehendi: { enabled: false, date: '', time: '12:00 PM', location: '' },
    haldi: { enabled: false, date: '', time: '12:00 PM', location: '' },
    reception: { enabled: false, date: '', time: '12:00 PM', location: '' },
    aiburobhat: { enabled: false, date: '', time: '12:00 PM', location: '' },
    boubat: { enabled: false, date: '', time: '12:00 PM', location: '' },
    biday: { enabled: false, date: '', time: '12:00 PM', location: '' },
    boron: { enabled: false, date: '', time: '12:00 PM', location: '' },
  });
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({ wedding: true });

  const formatDMY = (dateStr: string): string => {
    if (!dateStr) return 'N/A';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch (_) {}
    return dateStr;
  };

  // When bookingFor is 'Wedding', sync enabled events back to primary fields for compatibility
  useEffect(() => {
    if (bookingFor === 'Wedding') {
      if (events.wedding?.enabled && events.wedding?.date) {
        setWeddingDate(events.wedding.date);
      }
      if (events.reception?.enabled && events.reception?.date) {
        setReceptionDate(events.reception.date);
      }
    }
  }, [bookingFor, events.wedding?.enabled, events.wedding?.date, events.reception?.enabled, events.reception?.date]);

  // Keep totalAmount synced with packagePrice and discount
  useEffect(() => {
    const price = Number(packagePrice || 0);
    const disc = Number(discount || 0);
    setTotalAmount(Math.max(0, price - disc));
  }, [packagePrice, discount]);

  // Keep totalPaid synced with advanceAmount on creation
  useEffect(() => {
    if (!isEditMode) {
      setTotalPaid(advanceAmount);
    }
  }, [advanceAmount, isEditMode]);

  const toggleEventExpand = (key: string) => {
    setExpandedEvents(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleEventEnable = (key: string, enabled: boolean) => {
    setEvents(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled
      }
    }));
  };

  const handleUpdateEventField = (key: string, field: string, value: any) => {
    setEvents(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // WhatsApp Notification Dialog States
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [whatsappTargetBooking, setWhatsappTargetBooking] = useState<Booking | null>(null);
  const [whatsappRecipientPhone, setWhatsappRecipientPhone] = useState('');
  const [whatsappBrideName, setWhatsappBrideName] = useState('');
  const [whatsappGroomName, setWhatsappGroomName] = useState('');
  const [whatsappEventTime, setWhatsappEventTime] = useState('12:00 PM');
  const [whatsappReportingTime, setWhatsappReportingTime] = useState('11:00 AM');
  const [whatsappCustomMessage, setWhatsappCustomMessage] = useState('');
  const [whatsappDispatchStep, setWhatsappDispatchStep] = useState<'idle' | 'sending' | 'confirming'>('idle');

  // Template Generator helper
  const generateWhatsAppMessage = (params: {
    freelancerName: string;
    weddingDate: string;
    eventTime: string;
    clientName: string;
    brideName: string;
    groomName: string;
    venue: string;
    reportingTime: string;
    payoutAmount: number;
    notes: string;
    studioPhone: string;
    type?: 'production' | 'freelancer';
  }) => {
    if (params.type === 'freelancer') {
      return `Hello ${params.freelancerName},

You have been booked for a wedding shoot.

📅 Date: ${params.weddingDate}
💰 Payment: ₹${params.payoutAmount}

Please confirm your availability.

Thank you.`;
    }

    return `Hello ${params.freelancerName}! 👋

This is ${settings.studioName} with details for your upcoming assignment.

📅 Event Date: ${params.weddingDate}
⏰ Event Time: ${params.eventTime}
📍 Location: ${params.venue}
👥 Client: ${params.clientName}
👰 Bride: ${params.brideName || 'N/A'}
🤵 Groom: ${params.groomName || 'N/A'}
⏱️ Reporting Time: ${params.reportingTime}
💰 Payment payout: ${formatCurrency(params.payoutAmount)}

📝 Directives & Notes:
${params.notes || 'No custom instructions.'}

📞 If you have any questions, please reach back at ${params.studioPhone}.

Looking forward to working with you!`;
  };

  // Live preview update in the WhatsApp dialog
  useEffect(() => {
    if (whatsappTargetBooking && whatsappDialogOpen) {
      const generated = generateWhatsAppMessage({
        freelancerName: whatsappTargetBooking.photographer,
        weddingDate: whatsappTargetBooking.weddingDate,
        eventTime: whatsappEventTime,
        clientName: whatsappTargetBooking.clientName,
        brideName: whatsappBrideName,
        groomName: whatsappGroomName,
        venue: whatsappTargetBooking.venue,
        reportingTime: whatsappReportingTime,
        payoutAmount: whatsappTargetBooking.totalAmount || whatsappTargetBooking.freelancerRate || 0,
        notes: whatsappTargetBooking.notes,
        studioPhone: settings.studioPhone,
        type: whatsappTargetBooking.type
      });
      setWhatsappCustomMessage(generated);
    }
  }, [whatsappBrideName, whatsappGroomName, whatsappEventTime, whatsappReportingTime, whatsappTargetBooking, whatsappDialogOpen]);

  const handleTriggerWhatsAppDialog = (booking: Booking) => {
    setWhatsappTargetBooking(booking);
    setWhatsappRecipientPhone(booking.freelancerPhone || '');
    setWhatsappBrideName(booking.brideName || '');
    setWhatsappGroomName(booking.groomName || '');
    setWhatsappEventTime(booking.eventTime || '12:00 PM');
    setWhatsappReportingTime(booking.reportingTime || '11:00 AM');
    setWhatsappDispatchStep('idle');
    
    const initialMsg = generateWhatsAppMessage({
      freelancerName: booking.photographer,
      weddingDate: booking.weddingDate,
      eventTime: booking.eventTime || '12:00 PM',
      clientName: booking.clientName,
      brideName: booking.brideName || '',
      groomName: booking.groomName || '',
      venue: booking.venue,
      reportingTime: booking.reportingTime || '11:00 AM',
      payoutAmount: booking.totalAmount || booking.freelancerRate || 0,
      notes: booking.notes,
      studioPhone: settings.studioPhone,
      type: booking.type
    });
    setWhatsappCustomMessage(initialMsg);
    setWhatsappDialogOpen(true);
  };

  useEffect(() => {
    const loadBookings = async () => {
      const bData = await offlineService.getBookings();
      setBookings(bData);
    };
    loadBookings();
  }, [refreshTrigger, syncState.syncVersion]);

  // Sync external dialog triggers
  useEffect(() => {
    if (bookingFormOpen && bookingFormType) {
      handleOpenCreateForm(bookingFormType);
    }
  }, [bookingFormOpen, bookingFormType, selectedBooking]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'production' | 'freelancer') => {
    setActiveTab(newValue);
    setStatusFilter('all');
  };

  const resetForm = () => {
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setWeddingDate('');
    setVenue('');
    setPackageName('');
    setTotalAmount('');
    setStatus('pending');
    setPhotographer('');
    setNotes('');
    setFreelancerRate('');
    setFreelancerPhone('');
    setBrideName('');
    setGroomName('');
    setEventTime('12:00 PM');
    setReportingTime('11:00 AM');
    setBookingFor('Wedding');
    setCoverage('Both Side');
    setAssignedFreelancers([]);
    setFreelancerAssignments([]);
    setIsEditMode(false);
    setCurrentBooking(null);

    // Reset Simplified Form Fields
    setContactPerson('');
    setAlternatePhone('');
    setFullAddress('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setGoogleMapLocation('');
    setPackagePrice('');
    setDiscount('');
    setAdvanceAmount('');
    setTotalPaid('');
    setPaymentMethod('Cash');

    // Reset Manual Agreement Custom Fields
    setPreWedding('No');
    setEventDate('');
    setWeddingLocation('');
    setReceptionDate('');
    setReceptionLocation('');
    setFirstPayment('');
    setSecondPayment('');

    // Reset Package Details, Assignments, Agreements
    setPhotographyService(false);
    setAlbumService(false);
    setFrameService(false);
    setPendriveService(false);
    setEditedPhotosService(false);
    setVideographyService(false);
    setStandardEditService(false);
    setCinematicEditService(false);
    setRawVideoService(false);
    setTrailerService(false);
    setDroneService(false);
    setLedWallService(false);
    setCraneService(false);
    setLiveStreamingService(false);
    setLeadPhotographer('');
    setLeadCinematographer('');
    setAgreementNumber('');
    setAgreementDate('');
    setSpecialNotes('');

    setEvents({
      wedding: { enabled: true, date: '', time: '12:00 PM', location: '' },
      preWedding: { enabled: false, date: '', time: '12:00 PM', location: '' },
      mehendi: { enabled: false, date: '', time: '12:00 PM', location: '' },
      haldi: { enabled: false, date: '', time: '12:00 PM', location: '' },
      reception: { enabled: false, date: '', time: '12:00 PM', location: '' },
      aiburobhat: { enabled: false, date: '', time: '12:00 PM', location: '' },
      boubat: { enabled: false, date: '', time: '12:00 PM', location: '' },
      biday: { enabled: false, date: '', time: '12:00 PM', location: '' },
      boron: { enabled: false, date: '', time: '12:00 PM', location: '' },
    });
    setExpandedEvents({ wedding: true });
  };

  const handleOpenCreateForm = (type: 'production' | 'freelancer') => {
    resetForm();
    setActiveTab(type);
    
    // Set smart defaults from dynamic branding settings
    if (settings.packages.length > 0) {
      setPackageName(settings.packages[0]);
    }
    
    if (type === 'production') {
      setPhotographer(settings.photographers[0] || '');
    } else {
      setPhotographer('');
    }
    
    // Set auto Agreement Number and Date
    const tempId = Math.floor(1000 + Math.random() * 9000);
    setAgreementNumber(`AP/AGR/${new Date().getFullYear()}/${tempId}`);
    setAgreementDate(new Date().toISOString().split('T')[0]);

    setIsEditMode(false);
    setFormOpen(true);
  };

  const handleOpenEditForm = (booking: Booking) => {
    setIsEditMode(true);
    setCurrentBooking(booking);
    setClientName(booking.clientName);
    setClientEmail(booking.clientEmail);
    setClientPhone(booking.clientPhone);
    setWeddingDate(booking.weddingDate);
    setVenue(booking.venue);
    setPackageName(booking.packageName);
    setTotalAmount(booking.totalAmount);
    setStatus(booking.status);
    setPhotographer(booking.photographer);
    setNotes(booking.notes);
    if (booking.type === 'freelancer' && booking.freelancerRate !== undefined) {
      setFreelancerRate(booking.freelancerRate);
    } else {
      setFreelancerRate('');
    }
    setFreelancerPhone(booking.freelancerPhone || '');
    setBrideName(booking.brideName || '');
    setGroomName(booking.groomName || '');
    setEventTime(booking.eventTime || '12:00 PM');
    setReportingTime(booking.reportingTime || '11:00 AM');
    setBookingFor(booking.bookingFor || 'Wedding');
    setCoverage(booking.coverage || 'Both Side');
    setAssignedFreelancers(booking.assignedFreelancers || []);
    setFreelancerAssignments(booking.freelancerAssignments || []);

    // Load Simplified Form Fields
    setContactPerson(booking.contactPerson || '');
    setAlternatePhone(booking.alternatePhone || '');
    setFullAddress(booking.fullAddress || '');
    setBookingDate(booking.bookingDate || (booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
    setGoogleMapLocation(booking.googleMapLocation || '');
    setPackagePrice(booking.packagePrice || booking.totalAmount || '');
    setDiscount(booking.discount || 0);
    setAdvanceAmount(booking.advanceAmount || booking.paidAmount || '');
    setTotalPaid(booking.paidAmount || 0);
    setPaymentMethod(booking.paymentMethod || 'Cash');

    // Load Manual Agreement Custom Fields
    setPreWedding(booking.preWedding || 'No');
    setEventDate(booking.eventDate || '');
    setWeddingLocation(booking.weddingLocation || booking.venue || '');
    setReceptionDate(booking.receptionDate || '');
    setReceptionLocation(booking.receptionLocation || '');
    setFirstPayment(booking.firstPayment || '');
    setSecondPayment(booking.secondPayment || '');

    // Load Package Details, Team Assignments, Agreements
    setPhotographyService(booking.photographyService || false);
    setAlbumService(booking.albumService || false);
    setFrameService(booking.frameService || false);
    setPendriveService(booking.pendriveService || false);
    setEditedPhotosService(booking.editedPhotosService || false);
    setVideographyService(booking.videographyService || false);
    setStandardEditService(booking.standardEditService || false);
    setCinematicEditService(booking.cinematicEditService || false);
    setRawVideoService(booking.rawVideoService || false);
    setTrailerService(booking.trailerService || false);
    setDroneService(booking.droneService || false);
    setLedWallService(booking.ledWallService || false);
    setCraneService(booking.craneService || false);
    setLiveStreamingService(booking.liveStreamingService || false);
    setLeadPhotographer(booking.leadPhotographer || '');
    setLeadCinematographer(booking.leadCinematographer || '');
    
    const autoAgrNum = `AP/AGR/${new Date(booking.createdAt || Date.now()).getFullYear()}/${booking.id.toUpperCase().slice(-4)}`;
    setAgreementNumber(booking.agreementNumber || autoAgrNum);
    setAgreementDate(booking.agreementDate || (booking.createdAt ? new Date(booking.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]));
    setSpecialNotes(booking.specialNotes || '');

    const defaultEvents = {
      wedding: { enabled: true, date: booking.weddingDate || '', time: '12:00 PM', location: booking.venue || '' },
      preWedding: { enabled: false, date: '', time: '12:00 PM', location: '' },
      mehendi: { enabled: false, date: '', time: '12:00 PM', location: '' },
      haldi: { enabled: false, date: '', time: '12:00 PM', location: '' },
      reception: { enabled: false, date: booking.receptionDate || '', time: '12:00 PM', location: booking.receptionLocation || '' },
      aiburobhat: { enabled: false, date: '', time: '12:00 PM', location: '' },
      boubat: { enabled: false, date: '', time: '12:00 PM', location: '' },
      biday: { enabled: false, date: '', time: '12:00 PM', location: '' },
      boron: { enabled: false, date: '', time: '12:00 PM', location: '' },
    };

    if (booking.events) {
      Object.keys(defaultEvents).forEach((key) => {
        const k = key as keyof typeof defaultEvents;
        if (booking.events[k]) {
          defaultEvents[k] = {
            ...defaultEvents[k],
            ...booking.events[k]
          };
        } else {
          defaultEvents[k].enabled = false;
        }
      });
    } else {
      if (booking.receptionDate) {
        defaultEvents.reception.enabled = true;
      }
    }

    setEvents(defaultEvents);
    setExpandedEvents({ wedding: true });
    setFormOpen(true);
  };

  const handleOpenDetails = (booking: Booking) => {
    setCurrentBooking(booking);
    setDetailOpen(true);
  };

  const handleOpenDeleteConfirm = (id: string) => {
    setBookingToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    onCloseBookingForm();
    resetForm();
  };

  const handleDownloadBookingPDF = async () => {
    const bookingToUse: Booking = {
      id: isEditMode && currentBooking ? currentBooking.id : `b_draft_${Date.now()}`,
      clientName: clientName.trim() || "Client Name",
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      weddingDate: weddingDate || new Date().toISOString().split('T')[0],
      venue: venue.trim() || "TBD",
      packageName: packageName || "Classic Package",
      totalAmount: Number(totalAmount || 0),
      paidAmount: Number(totalPaid || advanceAmount || 0),
      status,
      type: 'production',
      photographer: photographer || 'Alexander Sterling (Lead)',
      notes: notes.trim(),
      createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
      assignedFreelancers: assignedFreelancers,
      freelancerAssignments: freelancerAssignments,
      bookingFor,
      coverage,
      contactPerson,
      alternatePhone,
      fullAddress,
      bookingDate,
      googleMapLocation,
      packagePrice: Number(packagePrice || 0),
      discount: Number(discount || 0),
      advanceAmount: Number(advanceAmount || 0),
      paymentMethod,
      events,
      brideName,
      groomName,
      preWedding,
      eventDate,
      weddingLocation,
      receptionDate,
      receptionLocation,
      firstPayment: Number(firstPayment || 0),
      secondPayment: Number(secondPayment || 0),
      photographyService,
      albumService,
      frameService,
      pendriveService,
      editedPhotosService,
      videographyService,
      standardEditService,
      cinematicEditService,
      rawVideoService,
      trailerService,
      droneService,
      ledWallService,
      craneService,
      liveStreamingService,
      leadPhotographer,
      leadCinematographer,
      agreementNumber,
      agreementDate,
      specialNotes
    };
    await downloadBookingConfirmationPDF(bookingToUse, settings);
  };

  const handleDownloadAgreementPDF = async () => {
    const bookingToUse: Booking = {
      id: isEditMode && currentBooking ? currentBooking.id : `b_draft_${Date.now()}`,
      clientName: clientName.trim() || "Client Name",
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      weddingDate: weddingDate || new Date().toISOString().split('T')[0],
      venue: venue.trim() || "TBD",
      packageName: packageName || "Classic Package",
      totalAmount: Number(totalAmount || 0),
      paidAmount: Number(totalPaid || advanceAmount || 0),
      status,
      type: 'production',
      photographer: photographer || 'Alexander Sterling (Lead)',
      notes: notes.trim(),
      createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
      assignedFreelancers: assignedFreelancers,
      freelancerAssignments: freelancerAssignments,
      bookingFor,
      coverage,
      contactPerson,
      alternatePhone,
      fullAddress,
      bookingDate,
      googleMapLocation,
      packagePrice: Number(packagePrice || 0),
      discount: Number(discount || 0),
      advanceAmount: Number(advanceAmount || 0),
      paymentMethod,
      events,
      brideName,
      groomName,
      preWedding,
      eventDate,
      weddingLocation,
      receptionDate,
      receptionLocation,
      firstPayment: Number(firstPayment || 0),
      secondPayment: Number(secondPayment || 0),
      photographyService,
      albumService,
      frameService,
      pendriveService,
      editedPhotosService,
      videographyService,
      standardEditService,
      cinematicEditService,
      rawVideoService,
      trailerService,
      droneService,
      ledWallService,
      craneService,
      liveStreamingService,
      leadPhotographer,
      leadCinematographer,
      agreementNumber,
      agreementDate,
      specialNotes
    };
    await downloadAgreementPDF(bookingToUse, settings);
  };

  const handlePreviewAgreementPDF = async () => {
    const bookingToUse: Booking = {
      id: isEditMode && currentBooking ? currentBooking.id : `b_draft_${Date.now()}`,
      clientName: clientName.trim() || "Client Name",
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      weddingDate: weddingDate || new Date().toISOString().split('T')[0],
      venue: venue.trim() || "TBD",
      packageName: packageName || "Classic Package",
      totalAmount: Number(totalAmount || 0),
      paidAmount: Number(totalPaid || advanceAmount || 0),
      status,
      type: 'production',
      photographer: photographer || 'Alexander Sterling (Lead)',
      notes: notes.trim(),
      createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
      assignedFreelancers: assignedFreelancers,
      freelancerAssignments: freelancerAssignments,
      bookingFor,
      coverage,
      contactPerson,
      alternatePhone,
      fullAddress,
      bookingDate,
      googleMapLocation,
      packagePrice: Number(packagePrice || 0),
      discount: Number(discount || 0),
      advanceAmount: Number(advanceAmount || 0),
      paymentMethod,
      events,
      brideName,
      groomName,
      preWedding,
      eventDate,
      weddingLocation,
      receptionDate,
      receptionLocation,
      firstPayment: Number(firstPayment || 0),
      secondPayment: Number(secondPayment || 0),
      photographyService,
      albumService,
      frameService,
      pendriveService,
      editedPhotosService,
      videographyService,
      standardEditService,
      cinematicEditService,
      rawVideoService,
      trailerService,
      droneService,
      ledWallService,
      craneService,
      liveStreamingService,
      leadPhotographer,
      leadCinematographer,
      agreementNumber,
      agreementDate,
      specialNotes
    };
    try {
      const docInstance = await buildAgreementPDF(bookingToUse, settings);
      const url = docInstance.output('bloburl') as any as string;
      setPdfPreviewUrl(url);
      setPdfPreviewTitle(`Agreement Preview: ${bookingToUse.clientName}`);
      setPdfPreviewFilename(`wedding_agreement_${bookingToUse.id.toUpperCase().slice(-4)}.pdf`);
      setPdfPreviewDoc(docInstance);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error("Error generating agreement preview:", err);
    }
  };

  const handleTriggerWhatsAppInsideForm = () => {
    const bookingToUse: Booking = {
      id: isEditMode && currentBooking ? currentBooking.id : `b_draft_${Date.now()}`,
      clientName: clientName.trim() || "Client Name",
      clientEmail: clientEmail.trim(),
      clientPhone: clientPhone.trim(),
      weddingDate: weddingDate || new Date().toISOString().split('T')[0],
      venue: venue.trim() || "TBD",
      packageName: packageName || "Classic Package",
      totalAmount: Number(totalAmount || 0),
      paidAmount: Number(totalPaid || advanceAmount || 0),
      status,
      type: 'production',
      photographer: photographer || 'Alexander Sterling (Lead)',
      notes: notes.trim(),
      createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
      assignedFreelancers: assignedFreelancers,
      freelancerAssignments: freelancerAssignments,
      bookingFor,
      coverage,
      contactPerson,
      alternatePhone,
      fullAddress,
      bookingDate,
      googleMapLocation,
      packagePrice: Number(packagePrice || 0),
      discount: Number(discount || 0),
      advanceAmount: Number(advanceAmount || 0),
      paymentMethod,
      events,
      brideName,
      groomName,
      preWedding,
      eventDate,
      weddingLocation,
      receptionDate,
      receptionLocation,
      firstPayment: Number(firstPayment || 0),
      secondPayment: Number(secondPayment || 0),
      photographyService,
      albumService,
      frameService,
      pendriveService,
      editedPhotosService,
      videographyService,
      standardEditService,
      cinematicEditService,
      rawVideoService,
      trailerService,
      droneService,
      ledWallService,
      craneService,
      liveStreamingService,
      leadPhotographer,
      leadCinematographer,
      agreementNumber,
      agreementDate,
      specialNotes
    };
    handleTriggerWhatsAppDialog(bookingToUse);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let bookingData: Booking;
    const finalAssignedFreelancers = Array.from(new Set([
      ...assignedFreelancers,
      ...freelancerAssignments.map(fa => fa.freelancerName)
    ])).filter(Boolean);
    
    if (activeTab === 'freelancer') {
      if (!photographer.trim() || !weddingDate || totalAmount === '') return;
      
      bookingData = {
        id: isEditMode && currentBooking ? currentBooking.id : `b_${Date.now()}`,
        clientName: photographer.trim(), // Maps Freelancer Name to clientName to satisfy database requirements and render in lists
        clientEmail: '',
        clientPhone: '',
        weddingDate,
        venue: 'Studio Production',
        packageName: 'Freelancer Outsource',
        totalAmount: Number(totalAmount),
        paidAmount: 0,
        status: 'confirmed',
        type: 'freelancer',
        photographer: photographer.trim(),
        notes: '',
        createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
        freelancerRate: Number(totalAmount),
        freelancerPhone: '',
        brideName: '',
        groomName: '',
        eventTime: '12:00 PM',
        reportingTime: '11:00 AM',
        whatsappStatus: isEditMode && currentBooking ? currentBooking.whatsappStatus || 'none' : 'none',
        whatsappHistory: isEditMode && currentBooking ? currentBooking.whatsappHistory || [] : [],
        assignedFreelancers: finalAssignedFreelancers,
        freelancerAssignments
      };
    } else {
      if (!clientName.trim() || !weddingDate || !venue.trim() || !packageName.trim() || totalAmount === '') return;
      
      bookingData = {
        id: isEditMode && currentBooking ? currentBooking.id : `b_${Date.now()}`,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        weddingDate,
        venue: venue.trim(),
        packageName: packageName.trim(),
        totalAmount: Number(totalAmount),
        paidAmount: Number(totalPaid || advanceAmount || 0),
        status,
        type: 'production',
        photographer: photographer.trim() || 'Alexander Sterling (Lead)',
        notes: notes.trim(),
        createdAt: isEditMode && currentBooking ? currentBooking.createdAt : Date.now(),
        assignedFreelancers: finalAssignedFreelancers,
        freelancerAssignments,
        bookingFor,
        coverage,

        // Simplified Form Fields
        contactPerson: contactPerson.trim(),
        alternatePhone: alternatePhone.trim(),
        fullAddress: fullAddress.trim(),
        bookingDate,
        googleMapLocation: googleMapLocation.trim(),
        packagePrice: Number(packagePrice || 0),
        discount: Number(discount || 0),
        advanceAmount: Number(advanceAmount || 0),
        paymentMethod,
        events: Object.fromEntries(
          Object.entries(events).filter(([_, ev]) => ev && ev.enabled)
        ),
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        preWedding,
        eventDate: eventDate.trim(),
        weddingLocation: weddingLocation.trim(),
        receptionDate: receptionDate.trim(),
        receptionLocation: receptionLocation.trim(),
        firstPayment: Number(firstPayment || 0),
        secondPayment: Number(secondPayment || 0),

        // Save Package Details
        photographyService,
        albumService,
        frameService,
        pendriveService,
        editedPhotosService,
        videographyService,
        standardEditService,
        cinematicEditService,
        rawVideoService,
        trailerService,
        droneService,
        ledWallService,
        craneService,
        liveStreamingService,

        // Save Team Assignment
        leadPhotographer: leadPhotographer.trim(),
        leadCinematographer: leadCinematographer.trim(),

        // Save Agreement Details
        agreementNumber: agreementNumber.trim(),
        agreementDate: agreementDate.trim(),
        specialNotes: specialNotes.trim()
      };
    }

    try {
      if (isEditMode) {
        await offlineService.updateBooking(bookingData);
      } else {
        await offlineService.addBooking(bookingData);
      }
      onTriggerRefresh();
      handleCloseForm();

      // Automatically pop up the luxury PDF Actions Dialog for successfully saved client bookings
      if (bookingData.type === 'production') {
        setTimeout(() => {
          setPdfActionData({
            title: isEditMode ? 'Booking Updated Successfully!' : 'Booking Created Successfully!',
            subtitle: isEditMode 
              ? 'We have updated and compiled your Booking Confirmation.' 
              : 'We have registered your shoot and prepared the Booking Confirmation.',
            clientName: bookingData.clientName,
            documentType: 'Booking Confirmation',
            booking: bookingData
          });
          setPdfActionOpen(true);
        }, 300);
      }

      // Automatically launch WhatsApp verification dialog for NEW freelancer bookings
      if (!isEditMode && activeTab === 'freelancer') {
        setTimeout(() => {
          handleTriggerWhatsAppDialog(bookingData);
        }, 500);
      }
    } catch (err) {
      console.error('Error saving booking:', err);
    }
  };

  const handleTriggerPdfAction = async (action: 'preview' | 'download' | 'share' | 'whatsapp') => {
    if (!pdfActionData) return;
    const { booking, documentType } = pdfActionData;
    
    let doc;
    let filename = '';
    let messageText = '';
    
    if (documentType === 'Booking Confirmation') {
      doc = await buildBookingConfirmationPDF(booking, settings);
      filename = `booking_confirmation_${booking.id.slice(0, 8)}.pdf`;
      messageText = `📸 *Asmaul Production*

Hello *${booking.clientName}*,

Your booking has been confirmed.

*Booking ID:*
${booking.id.toUpperCase().slice(0, 8)}

*Event Date:*
${booking.weddingDate}

*Package:*
${booking.packageName}

*Total Amount:*
₹${booking.totalAmount.toLocaleString('en-IN')}

*Advance Paid:*
₹${booking.paidAmount.toLocaleString('en-IN')}

*Remaining Due:*
₹${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}

Thank you for choosing Asmaul Production.`;
    } else if (documentType === 'Agreement') {
      doc = await buildAgreementPDF(booking, settings);
      filename = `wedding_photography_agreement_${booking.id.slice(0, 8)}.pdf`;
      messageText = `📸 *Asmaul Production*

Hello *${booking.clientName}*,

Here is your Wedding Photography & Cinematography Agreement.

*Booking ID:*
${booking.id.toUpperCase().slice(0, 8)}

*Agreement Date:*
${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}

*Package:*
${booking.packageName}

*Net Contract value:*
₹${booking.totalAmount.toLocaleString('en-IN')}

Please review and confirm. Thank you for choosing Asmaul Production!`;
    } else {
      // Invoice
      doc = await buildInvoicePDF(booking, settings);
      filename = `invoice_${booking.id.slice(0, 8)}.pdf`;
      messageText = `📸 *Asmaul Production*

Hello *${booking.clientName}*,

Your booking Invoice is ready.

*Booking ID:*
${booking.id.toUpperCase().slice(0, 8)}

*Total Package Value:*
₹${booking.totalAmount.toLocaleString('en-IN')}

*Advance Received:*
₹${booking.paidAmount.toLocaleString('en-IN')}

*Net Outstanding:*
₹${(booking.totalAmount - booking.paidAmount).toLocaleString('en-IN')}

Thank you for choosing Asmaul Production.`;
    }

    if (action === 'preview') {
      const url = doc.output('bloburl');
      setPdfPreviewUrl(url);
      setPdfPreviewTitle(`${documentType} Preview`);
      setPdfPreviewFilename(filename);
      setPdfPreviewDoc(doc);
      setPdfPreviewOpen(true);
    } else {
      await handlePDFActions(doc, filename, action, messageText, booking.clientPhone || '', (url) => {
        setPdfPreviewUrl(url);
        setPdfPreviewTitle(`${documentType} Preview`);
        setPdfPreviewFilename(filename);
        setPdfPreviewDoc(doc);
        setPdfPreviewOpen(true);
      });
    }
  };

  const handleMarkAsSent = async () => {
    if (!whatsappTargetBooking) return;
    
    const updatedHistory = whatsappTargetBooking.whatsappHistory ? [...whatsappTargetBooking.whatsappHistory] : [];
    updatedHistory.push({
      id: `w_${Date.now()}`,
      timestamp: Date.now(),
      status: 'sent',
      message: whatsappCustomMessage,
      recipientPhone: whatsappRecipientPhone
    });
    
    const updatedBooking: Booking = {
      ...whatsappTargetBooking,
      whatsappStatus: 'sent',
      whatsappHistory: updatedHistory,
      freelancerPhone: whatsappRecipientPhone,
      brideName: whatsappBrideName,
      groomName: whatsappGroomName,
      eventTime: whatsappEventTime,
      reportingTime: whatsappReportingTime
    };
    
    try {
      await offlineService.updateBooking(updatedBooking);
      setWhatsappDialogOpen(false);
      onTriggerRefresh();
      
      // Update details dialog state if open
      if (detailOpen && currentBooking && currentBooking.id === whatsappTargetBooking.id) {
        setCurrentBooking(updatedBooking);
      }
    } catch (err) {
      console.error('Error recording WhatsApp log:', err);
    }
  };

  const handleMarkAsFailed = async () => {
    if (!whatsappTargetBooking) return;
    
    const updatedHistory = whatsappTargetBooking.whatsappHistory ? [...whatsappTargetBooking.whatsappHistory] : [];
    updatedHistory.push({
      id: `w_${Date.now()}`,
      timestamp: Date.now(),
      status: 'failed',
      message: whatsappCustomMessage,
      recipientPhone: whatsappRecipientPhone
    });
    
    const updatedBooking: Booking = {
      ...whatsappTargetBooking,
      whatsappStatus: 'failed',
      whatsappHistory: updatedHistory,
      freelancerPhone: whatsappRecipientPhone,
      brideName: whatsappBrideName,
      groomName: whatsappGroomName,
      eventTime: whatsappEventTime,
      reportingTime: whatsappReportingTime
    };
    
    try {
      await offlineService.updateBooking(updatedBooking);
      setWhatsappDispatchStep('idle');
      onTriggerRefresh();
      
      // Update details dialog state if open
      if (detailOpen && currentBooking && currentBooking.id === whatsappTargetBooking.id) {
        setCurrentBooking(updatedBooking);
      }
    } catch (err) {
      console.error('Error recording WhatsApp log:', err);
    }
  };

  const handleDispatchWhatsApp = () => {
    if (!whatsappRecipientPhone) return;
    
    setWhatsappDispatchStep('confirming');
    
    // Construct WhatsApp link
    const cleanPhone = whatsappRecipientPhone.replace(/\D/g, '');
    const encodedText = encodeURIComponent(whatsappCustomMessage);
    const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!bookingToDelete) return;
    try {
      await offlineService.deleteBooking(bookingToDelete);
      onTriggerRefresh();
      setDeleteConfirmOpen(false);
      setBookingToDelete(null);
      if (detailOpen) setDetailOpen(false);
    } catch (err) {
      console.error('Error deleting booking:', err);
    }
  };

  // Unique list of freelancer names for filtering
  const uniqueFreelancers = Array.from(
    new Set(
      bookings
        .filter((b) => b.type === 'freelancer' && b.photographer)
        .map((b) => b.photographer.trim())
    )
  ).sort();

  // Helper to parse YYYY-MM-DD string to a local Date object (at noon to avoid timezone shift)
  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  };

  // Filter and Search Bookings
  const filteredBookings = bookings.filter((b) => {
    if (b.type !== activeTab) return false;
    
    if (activeTab === 'freelancer') {
      // 1. By Freelancer Name (Search Input)
      if (searchQuery && !b.photographer.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // 2. By Selected Freelancer Name (Dropdown Filter)
      if (freelancerFilter !== 'all' && b.photographer !== freelancerFilter) {
        return false;
      }

      // 3. Date Range Filter
      const bDateStr = b.weddingDate; // 'YYYY-MM-DD'
      if (!bDateStr) return false;

      const bDate = parseLocalDate(bDateStr);
      const today = new Date();
      
      // Helper to format Date to YYYY-MM-DD local format
      const formatYYYYMMDD = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const todayStr = formatYYYYMMDD(today);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = formatYYYYMMDD(tomorrow);

      if (dateFilter === 'today') {
        if (bDateStr !== todayStr) return false;
      } else if (dateFilter === 'tomorrow') {
        if (bDateStr !== tomorrowStr) return false;
      } else if (dateFilter === 'week') {
        // Find start and end of current local week (Sunday to Saturday)
        const currentDay = today.getDay();
        const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        startOfWeek.setDate(today.getDate() - currentDay);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const bTime = bDate.getTime();
        if (bTime < startOfWeek.getTime() || bTime > endOfWeek.getTime()) {
          return false;
        }
      } else if (dateFilter === 'month') {
        // Start and end of current calendar month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

        const bTime = bDate.getTime();
        if (bTime < startOfMonth.getTime() || bTime > endOfMonth.getTime()) {
          return false;
        }
      } else if (dateFilter === 'custom') {
        if (startDate && bDateStr < startDate) {
          return false;
        }
        if (endDate && bDateStr > endDate) {
          return false;
        }
      }

      return true;
    }
    
    const matchesSearch = 
      b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.photographer.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort Bookings by Event Date (ascending or descending) or Amount (Low to High / High to Low)
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (activeTab === 'freelancer') {
      if (sortField === 'amount') {
        const amountA = a.totalAmount || a.freelancerRate || 0;
        const amountB = b.totalAmount || b.freelancerRate || 0;
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      } else {
        // Default Date sort
        const dateA = new Date(a.weddingDate).getTime() || 0;
        const dateB = new Date(b.weddingDate).getTime() || 0;
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      }
    }
    return new Date(b.weddingDate).getTime() - new Date(a.weddingDate).getTime(); // Default newest first for production
  });

  const filteredFreelancerBookings = filteredBookings.filter(b => b.type === 'freelancer');
  const filteredFreelancerCount = filteredFreelancerBookings.length;
  const filteredFreelancerAmount = filteredFreelancerBookings.reduce((sum, b) => sum + (b.totalAmount || b.freelancerRate || 0), 0);

  const totalFreelancerAmount = bookings
    .filter(b => b.type === 'freelancer')
    .reduce((sum, b) => sum + (b.totalAmount || b.freelancerRate || 0), 0);

  return (
    <Box className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Box>
          <Typography variant="h5" className="text-gold-gradient font-bold tracking-wider font-serif mb-0.5">
            BOOKING ARCHIVES
          </Typography>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[11px] block">
            Studio Production & Contractual Portfolios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus className="w-4 h-4" />}
          onClick={() => handleOpenCreateForm(activeTab)}
          className="w-full sm:w-auto"
        >
          {activeTab === 'production' ? 'Add Production Book' : 'Add Freelancer Book'}
        </Button>
      </div>

      {/* Tabs Menu (Production vs Freelancer) */}
      <Box className="border-b border-[#D4AF37]/15">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          className="min-h-0"
        >
          <Tab
            label="Production Bookings"
            value="production"
            className="font-serif tracking-widest text-xs font-bold py-3.5"
          />
          <Tab
            label="Freelancer Contracts"
            value="freelancer"
            className="font-serif tracking-widest text-xs font-bold py-3.5"
          />
        </Tabs>
      </Box>

      {/* KPI Card for Freelancer contracts */}
      {activeTab === 'freelancer' && (
        <Card className="border border-[#D4AF37]/20 bg-gradient-to-r from-black/50 to-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/5">
          <CardContent className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Box>
              <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest text-[11px] block font-bold">
                Total Freelancer Outsource Volume
              </Typography>
              <Typography variant="h4" className="text-gold-gradient font-mono font-black mt-1">
                {formatCurrency(totalFreelancerAmount)}
              </Typography>
            </Box>
            <Box className="bg-[#D4AF37]/10 px-3 py-1.5 rounded border border-[#D4AF37]/20 text-right">
              <Typography variant="caption" className="text-gray-400 block text-[10px] uppercase font-bold">
                Active Contracts
              </Typography>
              <Typography variant="subtitle2" className="text-white font-mono font-bold">
                {bookings.filter(b => b.type === 'freelancer').length} Schedules logged
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:flex-grow">
          <TextField
            fullWidth
            placeholder={activeTab === 'production' ? "Search clients, venues, photographers or packages..." : "Search by freelancer name..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search className="w-4 h-4 text-gray-500" />
                  </InputAdornment>
                ),
                className: "bg-black/20"
              }
            }}
            size="small"
          />
        </div>
        
        {activeTab === 'production' ? (
          <div className="w-full sm:w-1/3">
            <TextField
              select
              fullWidth
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Filter className="w-4 h-4 text-[#D4AF37]" />
                    </InputAdornment>
                  ),
                  className: "bg-black/20"
                }
              }}
            >
              <MenuItem value="all">All Booking States</MenuItem>
              <MenuItem value="pending">Awaiting (Pending)</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </TextField>
          </div>
        ) : (
          <Button
            variant="outlined"
            size="medium"
            onClick={() => setShowFilters(prev => !prev)}
            className={`h-10 px-4 flex items-center justify-center gap-2 font-serif font-bold normal-case text-xs w-full sm:w-auto shrink-0 transition-all duration-200 ${
              showFilters || (dateFilter !== 'all' || freelancerFilter !== 'all' || sortField !== 'date')
                ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' 
                : 'border-[#D4AF37]/35 text-[#D4AF37]'
            }`}
            startIcon={<Filter className="w-4 h-4" />}
          >
            Filters
            {((dateFilter !== 'all' ? 1 : 0) + (freelancerFilter !== 'all' ? 1 : 0) + (sortField !== 'date' ? 1 : 0)) > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-[10px] bg-[#D4AF37] text-black font-mono font-black rounded-full leading-none">
                {(dateFilter !== 'all' ? 1 : 0) + (freelancerFilter !== 'all' ? 1 : 0) + (sortField !== 'date' ? 1 : 0)}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Advanced Collapsible Filter Panel */}
      {activeTab === 'freelancer' && showFilters && (
        <Card className="border border-[#D4AF37]/20 bg-[#070707] p-5 rounded-lg space-y-4 shadow-lg shadow-[#D4AF37]/5 transition-all duration-300">
          <Typography variant="subtitle2" className="text-[#D4AF37] font-serif font-bold uppercase tracking-wider text-xs">
            Advanced Freelancer Filters
          </Typography>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Filter Selection */}
            <div className="space-y-2">
              <Typography variant="caption" className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                Filter by Date Range
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                slotProps={{ input: { className: "bg-black/45" } }}
              >
                <MenuItem value="all">Show All Bookings</MenuItem>
                <MenuItem value="today">Today's Bookings</MenuItem>
                <MenuItem value="tomorrow">Tomorrow's Bookings</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="custom">Custom Date Range</MenuItem>
              </TextField>
            </div>

            {/* Freelancer Name Selection */}
            <div className="space-y-2">
              <Typography variant="caption" className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                Filter by Freelancer Name
              </Typography>
              <TextField
                select
                fullWidth
                size="small"
                value={freelancerFilter}
                onChange={(e) => setFreelancerFilter(e.target.value)}
                slotProps={{ input: { className: "bg-black/45" } }}
              >
                <MenuItem value="all">Show All Freelancers</MenuItem>
                {uniqueFreelancers.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            {/* Sort Order Selector */}
            <div className="space-y-2">
              <Typography variant="caption" className="text-gray-400 block font-bold uppercase tracking-wider text-[10px]">
                Sort List Order
              </Typography>
              <div className="grid grid-cols-2 gap-2">
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  slotProps={{ input: { className: "bg-black/45" } }}
                >
                  <MenuItem value="date">Sort by Date</MenuItem>
                  <MenuItem value="amount">Sort by Amount</MenuItem>
                </TextField>
                
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as any)}
                  slotProps={{ input: { className: "bg-black/45" } }}
                >
                  {sortField === 'amount' ? [
                    <MenuItem key="asc" value="asc">Low to High</MenuItem>,
                    <MenuItem key="desc" value="desc">High to Low</MenuItem>
                  ] : [
                    <MenuItem key="asc" value="asc">Oldest First</MenuItem>,
                    <MenuItem key="desc" value="desc">Newest First</MenuItem>
                  ]}
                </TextField>
              </div>
            </div>
          </div>

          {/* Collapsible Custom Date Range Pickers */}
          {dateFilter === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#D4AF37]/10">
              <div className="space-y-1">
                <Typography variant="caption" className="text-gray-400 block font-bold text-[10px] uppercase">
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
              <div className="space-y-1">
                <Typography variant="caption" className="text-gray-400 block font-bold text-[10px] uppercase">
                  End Date
                </Typography>
                <TextField
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </div>
            </div>
          )}

          {/* Quick Clear Button */}
          <div className="flex justify-end pt-2 border-t border-[#D4AF37]/10">
            <Button
              variant="text"
              size="small"
              onClick={() => {
                setDateFilter('all');
                setStartDate('');
                setEndDate('');
                setFreelancerFilter('all');
                setSortField('date');
                setSortOrder('asc');
                setSearchQuery('');
              }}
              className="text-[#D4AF37] font-bold text-xs normal-case"
            >
              Reset All Filters
            </Button>
          </div>
        </Card>
      )}

      {/* Dynamic Results Summary Banner */}
      {activeTab === 'freelancer' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-lg bg-gradient-to-r from-black/60 to-[#D4AF37]/5 border border-[#D4AF37]/15 shadow-md">
          <div>
            <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] font-bold block leading-none mb-1">
              Currently Displayed Contracts
            </Typography>
            <Typography variant="body1" className="text-white font-serif font-black">
              <span className="text-[#D4AF37] font-mono font-black text-lg">{filteredFreelancerCount}</span> {filteredFreelancerCount === 1 ? 'Schedule' : 'Schedules'} matched
            </Typography>
          </div>
          <div className="mt-3 sm:mt-0 text-left sm:text-right">
            <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] font-bold block leading-none mb-1">
              Filtered Volume Payout
            </Typography>
            <Typography variant="h6" className="text-emerald-400 font-mono font-black">
              {formatCurrency(filteredFreelancerAmount)}
            </Typography>
          </div>
        </div>
      )}

      {/* Bookings Cards Grid */}
      {sortedBookings.length === 0 ? (
        <Box className="py-16 text-center border border-dashed border-[#D4AF37]/25 rounded-xl bg-black/10">
          <FileText className="w-12 h-12 text-[#AA7C11]/50 mx-auto mb-3" />
          <Typography variant="subtitle1" className="text-gray-400 font-serif font-semibold">
            No Records Uncovered
          </Typography>
          <Typography variant="caption" className="text-gray-500 block max-w-sm mx-auto mt-1">
            Try adjusting search terms, altering filters or log a fresh wedding booking.
          </Typography>
        </Box>
      ) : activeTab === 'freelancer' ? (
        /* Minimalist Freelancer Contract Cards List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBookings.map((b) => (
            <Card 
              key={b.id}
              className="hover:border-[#D4AF37]/45 border border-[#D4AF37]/15 bg-[#0a0a0a] transition-all group duration-300 relative overflow-hidden flex flex-col justify-between"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                <div className="space-y-3">
                  {/* Freelancer Name Header */}
                  <div>
                    <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] font-bold block mb-0.5">
                      Freelancer Name
                    </Typography>
                    <Typography variant="h6" className="text-white font-serif font-bold group-hover:text-[#D4AF37] transition-colors text-base sm:text-lg truncate">
                      {b.photographer}
                    </Typography>
                  </div>

                  {/* Event Date Grid */}
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <div>
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider text-[8px] font-bold block leading-none">
                        Event Date
                      </Typography>
                      <span className="font-mono font-bold mt-0.5 block">{formatDMY(b.weddingDate)}</span>
                    </div>
                  </div>

                  {/* Amount Grid */}
                  <div className="flex items-center gap-2.5 text-xs text-gray-300">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <div>
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider text-[8px] font-bold block leading-none">
                        Amount
                      </Typography>
                      <span className="font-mono font-black text-emerald-400 text-sm mt-0.5 block">
                        ₹{(b.totalAmount || b.freelancerRate || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Row */}
                <Box className="flex justify-between items-center gap-2 pt-3.5 border-t border-gold-glow/5">
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleTriggerWhatsAppDialog(b)}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] normal-case px-3 py-1 flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Send WhatsApp
                  </Button>

                  <Box className="flex items-center gap-0.5">
                    <Tooltip title="Edit Booking Info">
                      <IconButton size="small" onClick={() => handleOpenEditForm(b)} className="text-[#D4AF37]/80 hover:text-[#D4AF37]">
                        <Edit2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Archive">
                      <IconButton size="small" onClick={() => handleOpenDeleteConfirm(b.id)} className="text-red-400/80 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Standard Production Bookings Card List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedBookings.map((b) => {
            const outstanding = b.totalAmount - b.paidAmount;
            return (
              <Card 
                key={b.id}
                className="hover:border-[#D4AF37]/45 transition-all group duration-300 relative overflow-hidden h-full flex flex-col justify-between"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <Box className="space-y-3.5">
                    {/* Top Row: Client Name & Status */}
                    <Box className="flex justify-between items-start gap-2">
                      <Box>
                        <Typography variant="h6" className="text-white font-serif font-bold group-hover:text-gold-gradient transition-colors text-base sm:text-lg">
                          {b.clientName}
                        </Typography>
                        <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-wider text-[10px] block font-medium">
                          {b.packageName}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStatusLabel(b.status)}
                        variant="outlined"
                        size="small"
                        className={`text-[9px] font-bold uppercase tracking-widest h-5 px-1.5 ${getStatusChipColor(b.status)}`}
                      />
                    </Box>

                    {/* Detail list metadata */}
                    <Box className="space-y-1.5 text-xs text-gray-400">
                      <Box className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#AA7C11] flex-shrink-0" />
                        <span className="font-semibold">{formatDMY(b.weddingDate)}</span>
                      </Box>
                      <Box className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#AA7C11] flex-shrink-0" />
                        <span className="truncate">{b.venue}</span>
                      </Box>
                      <Box className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-[#AA7C11] flex-shrink-0" />
                        <span>{b.photographer}</span>
                      </Box>
                      {b.type === 'freelancer' && b.freelancerRate !== undefined && (
                        <Box className="flex items-center gap-2 mt-1 p-1 bg-black/20 rounded border border-[#D4AF37]/10 w-fit">
                          <span className="text-[10px] text-gray-500 uppercase tracking-widest px-1 font-bold">Freelancer Payout:</span>
                          <span className="font-mono font-bold text-[#D4AF37] text-[11px]">{formatCurrency(b.freelancerRate)}</span>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  {/* Divider and financial summary */}
                  <Box className="mt-4 pt-3.5 border-t border-[#D4AF37]/10 flex justify-between items-end">
                    <Box>
                      <Typography variant="caption" className="text-gray-500 uppercase text-[9px] tracking-wider block">
                        Total Gross Contract
                      </Typography>
                      <Typography variant="subtitle1" className="font-mono font-bold text-[#D4AF37] text-sm sm:text-base leading-none">
                        {formatCurrency(b.totalAmount)}
                      </Typography>
                    </Box>
                    <Box className="text-right">
                      <Typography variant="caption" className="text-gray-500 uppercase text-[9px] tracking-wider block">
                        Pending Balance
                      </Typography>
                      {outstanding > 0 ? (
                        <Typography variant="subtitle1" className="font-mono font-bold text-amber-400 text-sm sm:text-base leading-none">
                          {formatCurrency(outstanding)}
                        </Typography>
                      ) : (
                        <Typography variant="caption" className="text-green-400 font-bold tracking-widest text-[10px] uppercase block">
                          PAID IN FULL
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Actions row */}
                  <Box className="flex justify-end gap-1 mt-4 pt-2 border-t border-dashed border-gold-glow/5">
                    <Tooltip title="View Contract Details">
                      <IconButton size="small" onClick={() => handleOpenDetails(b)} className="text-gray-400 hover:text-white">
                        <ChevronRight className="w-4 h-4" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit Booking Info">
                      <IconButton size="small" onClick={() => handleOpenEditForm(b)} className="text-[#D4AF37]/80 hover:text-[#D4AF37]">
                        <Edit2 className="w-4 h-4" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Archive">
                      <IconButton size="small" onClick={() => handleOpenDeleteConfirm(b.id)} className="text-red-400/80 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- FORM DIALOG (CREATE/EDIT) --- */}
      <Dialog open={formOpen} onClose={handleCloseForm} fullWidth maxWidth="md">
        <DialogTitle component="div" className="border-b border-[#D4AF37]/20 pb-3">
          <Typography variant="h5" className="text-gold-gradient font-bold font-serif">
            {isEditMode ? 'AMEND CONTRACT BOOK' : activeTab === 'production' ? 'NEW PRODUCTION BOOK' : 'NEW FREELANCER CONTRACT'}
          </Typography>
          <Typography variant="caption" className="text-gray-400 text-[11px]">
            {isEditMode ? 'Modify record parameters' : 'Seed details into IndexedDB registers'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4 pt-4">
            {activeTab === 'freelancer' ? (
              <>
                {/* Freelancer Name */}
                <TextField
                  fullWidth
                  label="Freelancer Name"
                  placeholder="e.g. Elena Rostova"
                  value={photographer}
                  onChange={(e) => setPhotographer(e.target.value)}
                  required
                />

                {/* Event Date */}
                <TextField
                  fullWidth
                  label="Event Date"
                  type="date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={weddingDate}
                  onChange={(e) => setWeddingDate(e.target.value)}
                  required
                />

                {/* Amount */}
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start">{settings.currencySymbol}</InputAdornment>,
                    }
                  }}
                  required
                />

                {/* Assign Freelancers Option */}
                <FormControl fullWidth className="mt-2">
                  <InputLabel id="assigned-freelancers-freelancer-label">Assign Freelancers</InputLabel>
                  <Select
                    labelId="assigned-freelancers-freelancer-label"
                    id="assigned-freelancers-freelancer"
                    multiple
                    value={assignedFreelancers}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAssignedFreelancers(typeof val === 'string' ? val.split(',') : val);
                    }}
                    input={<OutlinedInput label="Assign Freelancers" />}
                    renderValue={(selected) => (
                      <Box className="flex flex-wrap gap-1">
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" className="bg-[#D4AF37]/20 text-[#D4AF37] text-[11px] font-medium" />
                        ))}
                      </Box>
                    )}
                  >
                    {!settings.photographers || settings.photographers.length === 0 ? (
                      <MenuItem disabled value="">
                        <em>No photographers configured (Add in Brand Settings)</em>
                      </MenuItem>
                    ) : (
                      settings.photographers.map((name) => (
                        <MenuItem key={name} value={name}>
                          <Checkbox checked={assignedFreelancers.indexOf(name) > -1} size="small" className="text-[#D4AF37] p-1 mr-1" />
                          <ListItemText primary={name} slotProps={{ primary: { className: 'text-xs' } }} />
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {/* Granular Freelancer Event Assignments */}
                <Box className="border border-[#D4AF37]/20 rounded-lg p-3 bg-black/20 space-y-3 mt-3">
                  <div className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-1.5">
                    <Typography className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Event-Specific Freelancer Assignments
                    </Typography>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={handleAddAssignmentRow}
                      className="text-[9px] h-5 py-0 border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold uppercase tracking-wider px-1.5"
                    >
                      + Add Event
                    </Button>
                  </div>

                  {freelancerAssignments.length === 0 ? (
                    <div className="text-gray-500 text-[10px] py-1 text-center italic">
                      No event-specific freelancer assignments added yet.
                    </div>
                  ) : (
                    <Box className="space-y-3">
                      {freelancerAssignments.map((assignment, index) => (
                        <Box key={index} className="p-2.5 bg-black/40 rounded border border-gray-900 space-y-2.5 relative">
                          <IconButton 
                            size="small" 
                            className="absolute top-1 right-1 text-red-400 hover:text-red-300 p-0.5"
                            onClick={() => handleRemoveAssignmentRow(index)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconButton>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                            {/* Freelancer Name Select */}
                            <FormControl fullWidth size="small">
                              <InputLabel id={`assignment-freelancer-label-f-${index}`} className="text-xs">Freelancer</InputLabel>
                              <Select
                                labelId={`assignment-freelancer-label-f-${index}`}
                                value={assignment.freelancerName}
                                label="Freelancer"
                                onChange={(e) => handleUpdateAssignmentRow(index, 'freelancerName', e.target.value)}
                                className="text-xs"
                              >
                                {!settings.photographers || settings.photographers.length === 0 ? (
                                  <MenuItem disabled value="">
                                    <em>No photographers configured</em>
                                  </MenuItem>
                                ) : (
                                  settings.photographers.map((name) => (
                                    <MenuItem key={name} value={name} className="text-xs">
                                      {name}
                                    </MenuItem>
                                  ))
                                )}
                              </Select>
                            </FormControl>

                            {/* Event Type Select */}
                            <FormControl fullWidth size="small">
                              <InputLabel id={`assignment-event-type-label-f-${index}`} className="text-xs">Event Type</InputLabel>
                              <Select
                                labelId={`assignment-event-type-label-f-${index}`}
                                value={assignment.eventType}
                                label="Event Type"
                                onChange={(e) => handleUpdateAssignmentRow(index, 'eventType', e.target.value)}
                                className="text-xs"
                              >
                                {['Aiburo Bhat', 'Mehendi', 'Wedding', 'Bidaay Boron', 'Reception'].map((type) => (
                                  <MenuItem key={type} value={type} className="text-xs">
                                    {type}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {/* Event Date (Automatic) */}
                            <TextField
                              size="small"
                              label="Date"
                              disabled
                              value={weddingDate || 'No date set'}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />

                            {/* Venue (Automatic) */}
                            <TextField
                              size="small"
                              label="Venue"
                              disabled
                              value={venue || 'Studio Production'}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />

                            {/* Per Day Rate */}
                            <TextField
                              size="small"
                              type="number"
                              label={`Rate (${settings.currencySymbol})`}
                              value={assignment.perDayRate === 0 ? '' : assignment.perDayRate}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                handleUpdateAssignmentRow(index, 'perDayRate', val);
                              }}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />

                            {/* Working Days */}
                            <TextField
                              size="small"
                              type="number"
                              label="Days"
                              value={assignment.workingDays === 0 ? '' : assignment.workingDays}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : Number(e.target.value);
                                handleUpdateAssignmentRow(index, 'workingDays', val);
                              }}
                              slotProps={{ inputLabel: { shrink: true } }}
                            />
                          </div>

                          <div className="flex justify-end text-[10px] text-[#D4AF37] font-semibold pr-1">
                            Total: {settings.currencySymbol}{assignment.perDayRate * assignment.workingDays}
                          </div>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </>
            ) : (
              <div className="space-y-6 pt-2 pb-6 redial-form-container">
                {/* SECTION 1: CLIENT INFORMATION */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Client Information
                    </Typography>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Bride Name"
                      placeholder="e.g. Eleanor"
                      value={brideName}
                      onChange={(e) => setBrideName(e.target.value)}
                      className="bg-black/25"
                    />
                    <TextField
                      fullWidth
                      label="Groom Name"
                      placeholder="e.g. Charles"
                      value={groomName}
                      onChange={(e) => setGroomName(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Contact Person Name"
                      placeholder="e.g. Eleanor"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="bg-black/25"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email ID"
                      type="email"
                      placeholder="e.g. client@example.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Mobile Number"
                      placeholder="e.g. +91 98765 43210"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-black/25"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Alternate Mobile Number"
                      placeholder="e.g. +91 98765 43211"
                      value={alternatePhone}
                      onChange={(e) => setAlternatePhone(e.target.value)}
                      className="bg-black/25"
                    />
                  </div>

                  <TextField
                    fullWidth
                    label="Full Address"
                    placeholder="e.g. 123 Luxury Lane, Kolkata"
                    multiline
                    rows={3}
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    className="bg-black/25"
                  />
                </Card>

                {/* SECTION 2: WORK INFORMATION */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Work Information
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <TextField
                      select
                      fullWidth
                      label="Booking For"
                      value={bookingFor}
                      onChange={(e) => setBookingFor(e.target.value)}
                      required
                      className="bg-black/25"
                    >
                      {['Wedding', 'Reception', 'Aiburobhat', 'Mehendi', 'Haldi', 'Pre Wedding', 'Birthday', 'Others'].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Pre Wedding"
                      value={preWedding}
                      onChange={(e) => setPreWedding(e.target.value as 'Yes' | 'No')}
                      className="bg-black/25"
                    >
                      {['Yes', 'No'].map((opt) => (
                        <MenuItem key={opt} value={opt}>
                          {opt}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Booking Status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Booking['status'])}
                      className="bg-black/25 font-bold"
                    >
                      <MenuItem value="pending">Pending Engagement</MenuItem>
                      <MenuItem value="confirmed">Confirmed / Retained</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Coverage"
                      value={coverage}
                      onChange={(e) => setCoverage(e.target.value)}
                      className="bg-black/25 font-bold"
                    >
                      <MenuItem value="Both Side">Both Side</MenuItem>
                      <MenuItem value="Bride">Bride Only</MenuItem>
                      <MenuItem value="Groom">Groom Only</MenuItem>
                    </TextField>
                  </div>

                  {bookingFor === 'Wedding' ? (
                    <div className="space-y-4">
                      <div className="border border-[#D4AF37]/15 rounded-xl p-4 bg-black/40 space-y-4">
                        <Typography className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider font-mono">
                          Wedding Event Schedule Checklist
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Aiburobhat Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.aiburobhat?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    aiburobhat: {
                                      ...prev.aiburobhat,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Aiburobhat</span>}
                            />
                            {(events.aiburobhat?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Aiburobhat Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.aiburobhat?.date || ''}
                                onChange={(e) => setEvents(prev => ({
                                  ...prev,
                                  aiburobhat: {
                                    ...prev.aiburobhat,
                                    date: e.target.value
                                  }
                                }))}
                                className="bg-black/25 mt-1"
                              />
                            )}
                          </div>

                          {/* Mehendi Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.mehendi?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    mehendi: {
                                      ...prev.mehendi,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Mehendi</span>}
                            />
                            {(events.mehendi?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Mehendi Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.mehendi?.date || ''}
                                onChange={(e) => setEvents(prev => ({
                                  ...prev,
                                  mehendi: {
                                    ...prev.mehendi,
                                    date: e.target.value
                                  }
                                }))}
                                className="bg-black/25 mt-1"
                              />
                            )}
                          </div>

                          {/* Wedding Day Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.wedding?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    wedding: {
                                      ...prev.wedding,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Wedding Day</span>}
                            />
                            {(events.wedding?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Wedding Day Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.wedding?.date || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setWeddingDate(val);
                                  setEvents(prev => ({
                                    ...prev,
                                    wedding: {
                                      ...prev.wedding,
                                      date: val
                                    }
                                  }));
                                }}
                                className="bg-black/25 mt-1"
                                required
                              />
                            )}
                          </div>

                          {/* Biday Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.biday?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    biday: {
                                      ...prev.biday,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Biday</span>}
                            />
                            {(events.biday?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Biday Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.biday?.date || ''}
                                onChange={(e) => setEvents(prev => ({
                                  ...prev,
                                  biday: {
                                    ...prev.biday,
                                    date: e.target.value
                                  }
                                }))}
                                className="bg-black/25 mt-1"
                              />
                            )}
                          </div>

                          {/* Boron Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.boron?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    boron: {
                                      ...prev.boron,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Boron</span>}
                            />
                            {(events.boron?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Boron Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.boron?.date || ''}
                                onChange={(e) => setEvents(prev => ({
                                  ...prev,
                                  boron: {
                                    ...prev.boron,
                                    date: e.target.value
                                  }
                                }))}
                                className="bg-black/25 mt-1"
                              />
                            )}
                          </div>

                          {/* Reception Section */}
                          <div className="border border-[#D4AF37]/10 p-3 rounded-lg bg-black/20 flex flex-col justify-center space-y-2">
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={events.reception?.enabled || false}
                                  onChange={(e) => setEvents(prev => ({
                                    ...prev,
                                    reception: {
                                      ...prev.reception,
                                      enabled: e.target.checked
                                    }
                                  }))}
                                  sx={{ color: '#D4AF37', '&.Mui-checked': { color: '#D4AF37' } }}
                                />
                              }
                              label={<span className="text-white text-sm font-semibold">Reception</span>}
                            />
                            {(events.reception?.enabled) && (
                              <TextField
                                fullWidth
                                type="date"
                                label="Reception Date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                value={events.reception?.date || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReceptionDate(val);
                                  setEvents(prev => ({
                                    ...prev,
                                    reception: {
                                      ...prev.reception,
                                      date: val
                                    }
                                  }));
                                }}
                                className="bg-black/25 mt-1"
                              />
                            )}
                          </div>
                        </div>
                      </div>

                      <TextField
                        fullWidth
                        label="Wedding Location"
                        placeholder="e.g. Chateau Montelena, Kolkata"
                        value={weddingLocation}
                        onChange={(e) => setWeddingLocation(e.target.value)}
                        required
                        className="bg-black/25"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                          fullWidth
                          label="Event Date"
                          placeholder="e.g. 8th Mar - 11th Mar 2027"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="bg-black/25"
                        />
                        <TextField
                          fullWidth
                          label="Wedding Date"
                          type="date"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={weddingDate}
                          onChange={(e) => setWeddingDate(e.target.value)}
                          required
                          className="bg-black/25"
                        />
                      </div>

                      <TextField
                        fullWidth
                        label="Wedding Location"
                        placeholder="e.g. Chateau Montelena, Kolkata"
                        value={weddingLocation}
                        onChange={(e) => setWeddingLocation(e.target.value)}
                        required
                        className="bg-black/25"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                          fullWidth
                          label="Reception Date"
                          type="date"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={receptionDate}
                          onChange={(e) => setReceptionDate(e.target.value)}
                          className="bg-black/25"
                        />
                        <TextField
                          fullWidth
                          label="Reception Location"
                          placeholder="e.g. Marriott Grand Ballroom, Kolkata"
                          value={receptionLocation}
                          onChange={(e) => setReceptionLocation(e.target.value)}
                          className="bg-black/25"
                        />
                      </div>
                    </>
                  )}
                </Card>

                {/* SECTION 3: PRICE DETAILS */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Price Details
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      select
                      fullWidth
                      label="Package Name"
                      value={packageName}
                      onChange={(e) => handlePackageChange(e.target.value)}
                      required
                      className="bg-black/25"
                    >
                      {!settings.packages || settings.packages.length === 0 ? (
                        <MenuItem disabled value="">
                          <em>No packages configured (Add in Brand Settings)</em>
                        </MenuItem>
                      ) : (
                        settings.packages.map((pkg) => (
                          <MenuItem key={pkg} value={pkg}>
                            {pkg}
                          </MenuItem>
                        ))
                      )}
                    </TextField>

                    <TextField
                      fullWidth
                      label="Package Price"
                      type="number"
                      value={packagePrice}
                      onChange={(e) => setPackagePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextField
                      fullWidth
                      label="Discount"
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="Total Amount"
                      type="number"
                      value={totalAmount}
                      disabled
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-gray-500 font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/10 text-gray-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextField
                      fullWidth
                      label="Advance Amount"
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="First Payment"
                      type="number"
                      value={firstPayment}
                      onChange={(e) => setFirstPayment(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />

                    <TextField
                      fullWidth
                      label="Second Payment"
                      type="number"
                      value={secondPayment}
                      onChange={(e) => setSecondPayment(e.target.value !== '' ? Number(e.target.value) : '')}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start" className="text-[#D4AF37] font-mono">{settings.currencySymbol}</InputAdornment>,
                        }
                      }}
                      className="bg-black/25"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-[#D4AF37]/30 bg-gradient-to-r from-amber-500/10 to-transparent flex justify-between items-center">
                    <div>
                      <Typography className="text-xs text-gray-400 font-serif uppercase tracking-wider">Remaining Due Balance</Typography>
                      <Typography variant="h5" className="text-[#D4AF37] font-bold font-mono mt-1">
                        {settings.currencySymbol}
                        {(
                          Number(totalAmount || 0) -
                          Number(advanceAmount || 0) -
                          Number(firstPayment || 0) -
                          Number(secondPayment || 0)
                        ).toLocaleString('en-IN')}
                      </Typography>
                    </div>
                    <Chip 
                      variant="outlined" 
                      label="Auto Calculated"
                      size="small"
                      className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5"
                    />
                  </div>
                </Card>

                {/* SECTION 4: PACKAGE INCLUDE */}
                <Card className="border border-[#D4AF37]/20 bg-[#0c0c0b]/80 p-5 rounded-xl shadow-lg space-y-4 relative overflow-hidden">
                  <div className="border-b border-[#D4AF37]/10 pb-2.5 flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#D4AF37]" />
                    <Typography className="text-sm text-[#D4AF37] font-bold uppercase tracking-widest font-serif">
                      Package Include (Deliverables)
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Photography Inclusions */}
                    <div className="p-4 bg-black/30 rounded-xl border border-gray-900 space-y-3">
                      <Typography className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider border-b border-gray-900 pb-1 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5" /> Photography Deliverables
                      </Typography>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={albumService}
                            onChange={(e) => setAlbumService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Album</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={frameService}
                            onChange={(e) => setFrameService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Photo Frame</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={pendriveService}
                            onChange={(e) => setPendriveService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Pendrive</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={editedPhotosService}
                            onChange={(e) => setEditedPhotosService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Edited Photos</Typography>
                        </div>
                      </div>
                    </div>

                    {/* Videography Inclusions */}
                    <div className="p-4 bg-black/30 rounded-xl border border-gray-900 space-y-3">
                      <Typography className="text-xs text-[#D4AF37] font-bold uppercase tracking-wider border-b border-gray-900 pb-1 flex items-center gap-1.5">
                        <Video className="w-3.5 h-3.5" /> Videography Deliverables
                      </Typography>
                      <div className="grid grid-cols-1 gap-1">
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={standardEditService}
                            onChange={(e) => setStandardEditService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Standard Video Editing</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={cinematicEditService}
                            onChange={(e) => setCinematicEditService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Cinematic Video Editing</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={rawVideoService}
                            onChange={(e) => setRawVideoService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Raw Video</Typography>
                        </div>
                        <div className="flex items-center gap-1.5 py-0.5">
                          <Checkbox
                            checked={trailerService}
                            onChange={(e) => setTrailerService(e.target.checked)}
                            size="small"
                            className="text-[#D4AF37] p-1"
                          />
                          <Typography className="text-xs text-gray-300">Short Trailer</Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* SECTION 5: TERMS & CONDITIONS PREVIEW */}
                <Card className="border border-gray-800 bg-[#0c0c0b]/40 p-5 rounded-xl space-y-3 relative overflow-hidden">
                  <Typography className="text-xs text-gray-400 font-bold uppercase tracking-widest font-serif border-b border-gray-900 pb-2">
                    Terms & Conditions Reference
                  </Typography>
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-800 text-[11px] text-gray-500 leading-relaxed font-serif">
                    <p>1. Advanced payment is completely non-refundable under any circumstances.</p>
                    <p>2. Complete raw files will be handed over to the client on external storage once full settlement is cleared.</p>
                    <p>3. 50% payment of the total budget needs to be cleared on the main event date before dispatch.</p>
                    <p>4. Album production and video edit selection lists must be shared by client within 3 months of raw delivery.</p>
                    <p>5. Output delivery standard timeframe is 60-90 working days post final selections receive-date.</p>
                    <p>6. Meals, transport, travel allowances and overnight hotel stays must be managed fully by the client group.</p>
                    <p>7. Final print/render selection once submitted cannot be edited or modified without surcharge rates.</p>
                    <p>8. Studio preserves copyright ownership to utilize visual snaps in portfolios or online media presence.</p>
                    <p>9. Any event day delay beyond standard 10 working hours is subject to premium staff overtime fees of ₹2,500/hr.</p>
                    <p>10. Under natural hazards, mechanical faults or accidental file losses, studio responsibility is capped up to budget refund values.</p>
                  </div>
                </Card>
              </div>)}
          </DialogContent>
          <DialogActions className="border-t border-[#D4AF37]/15 p-4 justify-between">
            <Typography variant="caption" className="text-gray-500">
              {!syncState.isOnline && '⚠️ Saving offline to IndexedDB'}
            </Typography>
            <Box className="flex gap-2">
              <Button onClick={handleCloseForm} color="inherit" size="small">
                Cancel
              </Button>
              <Button type="submit" variant="contained" size="small">
                Save Booking
              </Button>
            </Box>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- DETAILS DIALOG --- */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} fullWidth maxWidth="sm">
        {currentBooking && (
          <>
            {currentBooking.type === 'freelancer' ? (
              /* Minimalist Freelancer Details View */
              <>
                <DialogTitle component="div" className="border-b border-[#D4AF37]/20 flex justify-between items-start">
                  <Box>
                    <Typography variant="h5" className="text-gold-gradient font-bold font-serif leading-tight">
                      {currentBooking.photographer}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block mt-0.5">
                      Freelancer Contract
                    </Typography>
                  </Box>
                  <FormControl size="small" variant="outlined" className="min-w-[120px]">
                    <Select
                      value={currentBooking.status || 'pending'}
                      onChange={async (e) => {
                        const newStatus = e.target.value as Booking['status'];
                        const updatedBooking = { ...currentBooking, status: newStatus };
                        setCurrentBooking(updatedBooking);
                        await offlineService.updateBooking(updatedBooking);
                        if (onTriggerRefresh) onTriggerRefresh();
                      }}
                      className={`text-[10px] font-bold uppercase tracking-wider h-7 ${getStatusChipColor(currentBooking.status || 'pending')}`}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-select': { py: 0.5, px: 1.5, display: 'flex', alignItems: 'center' },
                        color: 'inherit'
                      }}
                    >
                      <MenuItem value="pending" className="text-xs uppercase font-bold text-gray-400">Pending</MenuItem>
                      <MenuItem value="confirmed" className="text-xs uppercase font-bold text-yellow-400">Confirmed</MenuItem>
                      <MenuItem value="in_progress" className="text-xs uppercase font-bold text-blue-400">In Progress</MenuItem>
                      <MenuItem value="completed" className="text-xs uppercase font-bold text-green-400">Completed</MenuItem>
                      <MenuItem value="cancelled" className="text-xs uppercase font-bold text-red-400">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </DialogTitle>
                <DialogContent className="pt-4 space-y-4">
                  <Box className="bg-black/25 p-4 rounded border border-[#D4AF37]/10 flex justify-between items-center">
                    <Box>
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block leading-none">Contract Amount</Typography>
                      <Typography variant="h5" className="text-emerald-400 font-mono font-bold mt-1 leading-none">
                        ₹{(currentBooking.totalAmount || 0).toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </Box>

                  <List className="p-0 space-y-2">
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><Calendar className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Event Date</span>} 
                        secondary={<span className="text-white font-mono font-bold text-sm block mt-0.5">{formatDMY(currentBooking.weddingDate)}</span>} 
                      />
                    </ListItem>
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><User className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Freelancer Name</span>} 
                        secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.photographer}</span>} 
                      />
                    </ListItem>
                    {currentBooking.assignedFreelancers && currentBooking.assignedFreelancers.length > 0 && (
                      <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                        <ListItemIcon className="min-w-8"><Users className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                        <ListItemText 
                          primary={<span className="text-gray-400 text-xs block">Assigned Freelancers</span>} 
                          secondary={
                            <Box className="flex flex-wrap gap-1 mt-1.5">
                              {currentBooking.assignedFreelancers.map((val) => (
                                <Chip key={val} label={val} size="small" className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] border border-[#D4AF37]/30" />
                              ))}
                            </Box>
                          } 
                        />
                      </ListItem>
                    )}
                  </List>

                  {/* Event-Specific Freelancer Assignments List in Detail dialog */}
                  {currentBooking.freelancerAssignments && currentBooking.freelancerAssignments.length > 0 && (
                    <Box className="space-y-2 pt-3 border-t border-[#D4AF37]/15">
                      <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest font-bold text-[10px] block mb-1">
                        Freelancer Event Assignments
                      </Typography>
                      <Box className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {currentBooking.freelancerAssignments.map((assignment, idx) => {
                          const freelancerPhoneLookup = bookings.find(b => b.type === 'freelancer' && b.photographer === assignment.freelancerName)?.freelancerPhone || currentBooking.freelancerPhone || '';
                          
                          const handleSendAssignmentWhatsApp = () => {
                            const message = `Event Type: ${assignment.eventType}
Event Date: ${assignment.eventDate}
Venue: ${assignment.venue}
Per Day Rate: ${settings.currencySymbol}${assignment.perDayRate}
Working Days: ${assignment.workingDays}
Total Payment: ${settings.currencySymbol}${assignment.totalPayment}`;
                            
                            const cleanPhone = freelancerPhoneLookup.replace(/\D/g, '') || '';
                            const encodedText = encodeURIComponent(message);
                            const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          };

                          return (
                            <Box key={idx} className="p-3 bg-black/45 rounded border border-[#D4AF37]/10 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <Typography variant="body2" className="text-[#D4AF37] font-bold text-xs">
                                  {assignment.freelancerName} — {assignment.eventType}
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={handleSendAssignmentWhatsApp}
                                  className="text-[9px] h-5 py-0 bg-green-950/40 border border-green-800/40 text-green-400 font-bold uppercase hover:bg-green-900/30 px-2"
                                >
                                  WhatsApp
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-400">
                                <div>📅 <span className="text-gray-500">Date:</span> {assignment.eventDate}</div>
                                <div>📍 <span className="text-gray-500">Venue:</span> {assignment.venue}</div>
                                <div>💰 <span className="text-gray-500">Rate:</span> {settings.currencySymbol}{assignment.perDayRate}/day</div>
                                <div>⏱️ <span className="text-gray-500">Days:</span> {assignment.workingDays} days</div>
                              </div>
                              <div className="text-right text-[10px] text-emerald-400 font-bold pt-1 border-t border-gray-900/40 font-mono">
                                Total: {settings.currencySymbol}{assignment.totalPayment}
                              </div>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {/* WhatsApp Notification Dispatch block */}
                  <Box className="mt-4 pt-4 border-t border-[#D4AF37]/20">
                    <Typography variant="caption" className="text-gray-500 uppercase tracking-widest font-bold text-[10px] block mb-2">
                      WhatsApp Outsource Dispatch
                    </Typography>
                    
                    {/* Current WhatsApp Status */}
                    <Box className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-black/40 rounded border border-[#D4AF37]/10 gap-3 mb-3">
                      <Box className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 animate-pulse ${
                          currentBooking.whatsappStatus === 'sent' ? 'bg-green-500' :
                          currentBooking.whatsappStatus === 'failed' ? 'bg-red-500' : 'bg-gray-600'
                        }`} />
                        <Box>
                          <Typography variant="body2" className="text-white font-medium text-xs leading-none">
                            {currentBooking.whatsappStatus === 'sent' ? 'Status: DISPATCHED' :
                             currentBooking.whatsappStatus === 'failed' ? 'Status: DISPATCH FAILED' : 'Status: UNNOTIFIED'}
                          </Typography>
                          <Typography variant="caption" className="text-gray-400 text-[10px] block mt-1">
                            {currentBooking.freelancerPhone ? `Freelancer Phone: ${currentBooking.freelancerPhone}` : 'No phone specified'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleTriggerWhatsAppDialog(currentBooking)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold normal-case text-xs px-3 py-1 flex items-center gap-1.5 self-end sm:self-center"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {currentBooking.whatsappStatus === 'sent' ? 'Send Again' : currentBooking.whatsappStatus === 'failed' ? 'Retry Dispatch' : 'Dispatch Info'}
                      </Button>
                    </Box>
                    
                    {/* Dispatch History log */}
                    {currentBooking.whatsappHistory && currentBooking.whatsappHistory.length > 0 ? (
                      <Box className="space-y-2 mt-2">
                        <Typography variant="caption" className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider block">
                          Communication History Log
                        </Typography>
                        <Box className="max-h-36 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                          {currentBooking.whatsappHistory.slice().reverse().map((h, idx) => (
                            <Box key={h.id || idx} className="p-2.5 bg-black/20 rounded border border-[#D4AF37]/5 text-[11px] flex justify-between items-start gap-2">
                              <Box className="flex-grow">
                                <div className="text-gray-400 font-mono text-[9px] flex items-center gap-1.5">
                                  <History className="w-3 h-3 text-gray-500" />
                                  {new Date(h.timestamp).toLocaleString()}
                                </div>
                                <div className="text-gray-300 mt-1.5 whitespace-pre-wrap leading-relaxed border-l-2 border-[#D4AF37]/30 pl-2 font-mono text-[10px] line-clamp-3">
                                  {h.message}
                                </div>
                              </Box>
                              <Chip
                                label={h.status === 'sent' ? 'dispatched' : 'failed'}
                                size="small"
                                className={`text-[8px] uppercase font-bold h-4 flex-shrink-0 ${
                                  h.status === 'sent' ? 'bg-green-950/80 text-green-400 border border-green-800/30' : 'bg-red-950/80 text-red-400 border border-red-800/30'
                                }`}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Box className="flex items-center gap-1.5 text-gray-500 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <Typography variant="caption" className="italic text-[11px]">
                          No dispatch operations have been recorded yet.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </DialogContent>
                <DialogActions className="border-t border-[#D4AF37]/15 p-3 flex justify-between items-center w-full">
                  <Box className="flex gap-2">
                    <Button 
                      onClick={() => downloadFreelancerWorkOrderPDF(currentBooking, settings)} 
                      variant="contained" 
                      color="secondary" 
                      size="small"
                      startIcon={<Download className="w-4 h-4" />}
                      className="bg-amber-950/40 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-amber-900/30 text-xs py-1"
                    >
                      Work Order PDF
                    </Button>
                  </Box>
                  <Box className="flex gap-2">
                    <Button onClick={() => handleOpenEditForm(currentBooking)} variant="outlined" size="small" className="border-[#D4AF37]/50 text-[#D4AF37]">
                      Edit Contract
                    </Button>
                    <Button onClick={() => setDetailOpen(false)} color="inherit" size="small">
                      Close
                    </Button>
                  </Box>
                </DialogActions>
              </>
            ) : (
              /* Standard Production Details View */
              <>
                <DialogTitle component="div" className="border-b border-[#D4AF37]/20 flex justify-between items-start">
                  <Box>
                    <Typography variant="h5" className="text-gold-gradient font-bold font-serif leading-tight">
                      {currentBooking.clientName}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">
                      {currentBooking.packageName} • Production
                    </Typography>
                  </Box>
                  <FormControl size="small" variant="outlined" className="min-w-[120px]">
                    <Select
                      value={currentBooking.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value as Booking['status'];
                        const updatedBooking = { ...currentBooking, status: newStatus };
                        setCurrentBooking(updatedBooking);
                        await offlineService.updateBooking(updatedBooking);
                        if (onTriggerRefresh) onTriggerRefresh();
                      }}
                      className={`text-[10px] font-bold uppercase tracking-wider h-7 ${getStatusChipColor(currentBooking.status)}`}
                      sx={{
                        '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                        '& .MuiSelect-select': { py: 0.5, px: 1.5, display: 'flex', alignItems: 'center' },
                        color: 'inherit'
                      }}
                    >
                      <MenuItem value="pending" className="text-xs uppercase font-bold text-gray-400">Pending</MenuItem>
                      <MenuItem value="confirmed" className="text-xs uppercase font-bold text-yellow-400">Confirmed</MenuItem>
                      <MenuItem value="in_progress" className="text-xs uppercase font-bold text-blue-400">In Progress</MenuItem>
                      <MenuItem value="completed" className="text-xs uppercase font-bold text-green-400">Completed</MenuItem>
                      <MenuItem value="cancelled" className="text-xs uppercase font-bold text-red-400">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                </DialogTitle>
                <DialogContent className="pt-4 space-y-4">
                  <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/25 p-4 rounded border border-[#D4AF37]/10">
                    <Box>
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Total Contract Value</Typography>
                      <Typography variant="h6" className="text-[#D4AF37] font-mono font-bold">{formatCurrency(currentBooking.totalAmount)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Paid to Date</Typography>
                      <Typography variant="h6" className="text-green-400 font-mono font-bold">{formatCurrency(currentBooking.paidAmount)}</Typography>
                    </Box>
                    <Box className="sm:col-span-2">
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Outstanding Receivables</Typography>
                      <Typography variant="subtitle1" className="text-amber-400 font-mono font-bold">
                        {formatCurrency(currentBooking.totalAmount - currentBooking.paidAmount)}
                      </Typography>
                    </Box>
                  </Box>

                  <List className="p-0 space-y-2">
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><Calendar className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Wedding Date</span>} 
                        secondary={<span className="text-white font-serif font-semibold text-sm block mt-0.5">{formatDMY(currentBooking.weddingDate)}</span>} 
                      />
                    </ListItem>
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><FileText className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Booking For</span>} 
                        secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.bookingFor || 'Wedding'}</span>} 
                      />
                    </ListItem>
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><Users className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Coverage</span>} 
                        secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.coverage || 'Both Side'}</span>} 
                      />
                    </ListItem>
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><MapPin className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Venue & Coordinates</span>} 
                        secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.venue}</span>} 
                      />
                    </ListItem>
                    {currentBooking.clientEmail && (
                      <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                        <ListItemIcon className="min-w-8"><Mail className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                        <ListItemText 
                          primary={<span className="text-gray-400 text-xs block">Client Email</span>} 
                          secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.clientEmail}</span>} 
                        />
                      </ListItem>
                    )}
                    {currentBooking.clientPhone && (
                      <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                        <ListItemIcon className="min-w-8"><Phone className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                        <ListItemText 
                          primary={<span className="text-gray-400 text-xs block">Client Phone Contact</span>} 
                          secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.clientPhone}</span>} 
                        />
                      </ListItem>
                    )}
                    <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                      <ListItemIcon className="min-w-8"><User className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                      <ListItemText 
                        primary={<span className="text-gray-400 text-xs block">Staff Assignment</span>} 
                        secondary={<span className="text-white text-sm block mt-0.5">{currentBooking.photographer}</span>} 
                      />
                    </ListItem>
                    {currentBooking.assignedFreelancers && currentBooking.assignedFreelancers.length > 0 && (
                      <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                        <ListItemIcon className="min-w-8"><Users className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                        <ListItemText 
                          primary={<span className="text-gray-400 text-xs block">Assigned Freelancers</span>} 
                          secondary={
                            <Box className="flex flex-wrap gap-1 mt-1.5">
                              {currentBooking.assignedFreelancers.map((val) => (
                                <Chip key={val} label={val} size="small" className="bg-[#D4AF37]/10 text-[#D4AF37] text-[10px] border border-[#D4AF37]/30" />
                              ))}
                            </Box>
                          } 
                        />
                      </ListItem>
                    )}
                  </List>

                  {/* Event-Specific Freelancer Assignments List in Detail dialog */}
                  {currentBooking.freelancerAssignments && currentBooking.freelancerAssignments.length > 0 && (
                    <Box className="space-y-2 pt-3 border-t border-[#D4AF37]/15">
                      <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest font-bold text-[10px] block mb-1">
                        Freelancer Event Assignments
                      </Typography>
                      <Box className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {currentBooking.freelancerAssignments.map((assignment, idx) => {
                          const freelancerPhoneLookup = bookings.find(b => b.type === 'freelancer' && b.photographer === assignment.freelancerName)?.freelancerPhone || currentBooking.freelancerPhone || '';
                          
                          const handleSendAssignmentWhatsApp = () => {
                            const message = `Event Type: ${assignment.eventType}
Event Date: ${assignment.eventDate}
Venue: ${assignment.venue}
Per Day Rate: ${settings.currencySymbol}${assignment.perDayRate}
Working Days: ${assignment.workingDays}
Total Payment: ${settings.currencySymbol}${assignment.totalPayment}`;
                            
                            const cleanPhone = freelancerPhoneLookup.replace(/\D/g, '') || '';
                            const encodedText = encodeURIComponent(message);
                            const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          };

                          return (
                            <Box key={idx} className="p-3 bg-black/45 rounded border border-[#D4AF37]/10 space-y-1.5">
                              <div className="flex justify-between items-center">
                                <Typography variant="body2" className="text-[#D4AF37] font-bold text-xs">
                                  {assignment.freelancerName} — {assignment.eventType}
                                </Typography>
                                <Button
                                  size="small"
                                  onClick={handleSendAssignmentWhatsApp}
                                  className="text-[9px] h-5 py-0 bg-green-950/40 border border-green-800/40 text-green-400 font-bold uppercase hover:bg-green-900/30 px-2"
                                >
                                  WhatsApp
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-gray-400">
                                <div>📅 <span className="text-gray-500">Date:</span> {assignment.eventDate}</div>
                                <div>📍 <span className="text-gray-500">Venue:</span> {assignment.venue}</div>
                                <div>💰 <span className="text-gray-500">Rate:</span> {settings.currencySymbol}{assignment.perDayRate}/day</div>
                                <div>⏱️ <span className="text-gray-500">Days:</span> {assignment.workingDays} days</div>
                              </div>
                              <div className="text-right text-[10px] text-emerald-400 font-bold pt-1 border-t border-gray-900/40 font-mono">
                                Total: {settings.currencySymbol}{assignment.totalPayment}
                              </div>
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  )}

                  {currentBooking.notes && (
                    <Box className="space-y-1">
                      <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Production Directives</Typography>
                      <Box className="p-3 bg-black/20 rounded border border-[#D4AF37]/10 text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                        {currentBooking.notes}
                      </Box>
                    </Box>
                  )}

                  {/* ⚡ Live Project Status Tracking for Admin */}
                  <Box className="space-y-3 pt-3 border-t border-[#D4AF37]/15">
                    <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest font-bold text-[10px] block mb-1">
                      ⚡ Live Project Status Tracking
                    </Typography>
                    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-black/25 rounded border border-[#D4AF37]/10">
                      {renderStatusDropdown("Photography Status", "photographyStatus", ["Pending", "Shooting in Progress", "Shooting Completed"])}
                      {renderStatusDropdown("Videography Status", "videographyStatus", ["Pending", "Shooting in Progress", "Shooting Completed"])}
                      {renderStatusDropdown("Photo Editing", "photoEditingStatus", ["Pending", "Culling in Progress", "Color Grading", "Retouching", "Completed"])}
                      {renderStatusDropdown("Video Editing", "videoEditingStatus", ["Pending", "Draft Editing", "Color Grading", "Audio Syncing", "Completed"])}
                      
                      {/* 📸 Client Photo Selection Stage */}
                      <Box className="sm:col-span-2 p-3 bg-black/40 border border-[#D4AF37]/20 rounded-lg space-y-2">
                        <Box className="flex items-center justify-between">
                          <Typography variant="caption" className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            📸 Client Photo Selection
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={async () => {
                              if (!currentBooking) return;
                              const stages = ["Pending", "Photo Selection Shared", "Client Selecting Photos", "Photos Selected", "Completed"];
                              const current = currentBooking.clientPhotoSelectionStatus || "Pending";
                              const nextIdx = (stages.indexOf(current) + 1) % stages.length;
                              const nextVal = stages[nextIdx];
                              const updated = { ...currentBooking, clientPhotoSelectionStatus: nextVal };
                              setCurrentBooking(updated);
                              await offlineService.updateBooking(updated);
                              if (onTriggerRefresh) onTriggerRefresh();
                            }}
                            className="text-[10px] text-[#D4AF37] border-[#D4AF37]/30 hover:bg-[#D4AF37]/10 py-0.5 px-2 h-6"
                          >
                            One-Click Advance →
                          </Button>
                        </Box>
                        
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {["Pending", "Photo Selection Shared", "Client Selecting Photos", "Photos Selected", "Completed"].map((stage) => {
                            const current = currentBooking?.clientPhotoSelectionStatus || "Pending";
                            const isCurrent = current === stage;
                            return (
                              <button
                                key={stage}
                                onClick={async () => {
                                  if (!currentBooking) return;
                                  const updated = { ...currentBooking, clientPhotoSelectionStatus: stage };
                                  setCurrentBooking(updated);
                                  await offlineService.updateBooking(updated);
                                  if (onTriggerRefresh) onTriggerRefresh();
                                }}
                                className={`text-[10px] px-2.5 py-1 rounded transition-all duration-200 border cursor-pointer ${
                                  isCurrent
                                    ? "bg-[#D4AF37] text-black border-[#D4AF37] font-semibold"
                                    : "bg-black/40 text-gray-400 border-gray-800 hover:border-gray-600 hover:text-white"
                                }`}
                              >
                                {stage}
                              </button>
                            );
                          })}
                        </div>
                      </Box>

                      {renderStatusDropdown("Album Designing", "albumDesigningStatus", ["Pending", "Layout Finalized", "Client Review", "Completed"])}
                      {renderStatusDropdown("Album Printing", "albumPrintingStatus", ["Pending", "In Queue", "Printing in Progress", "Completed"])}
                      {renderStatusDropdown("Album Delivery", "albumDeliveryStatus", ["Pending", "Shipped", "Delivered"])}
                      {renderStatusDropdown("Video Delivery", "videoDeliveryStatus", ["Pending", "Uploaded to Drive", "Delivered"])}
                      <Box className="sm:col-span-2">
                        {renderStatusDropdown("Overall Project Status", "projectStatus", ["Pending", "In Progress", "Completed", "On Hold"])}
                      </Box>
                    </Box>
                  </Box>

                  {/* 🔗 Client Portal Section */}
                  <Box className="space-y-3 pt-3 border-t border-[#D4AF37]/15">
                    <Typography variant="caption" className="text-[#D4AF37] uppercase tracking-widest font-bold text-[10px] block mb-1">
                      🔗 Client Portal Link
                    </Typography>
                    <Box className="p-4 bg-black/30 border border-[#D4AF37]/15 rounded-lg space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/45 p-2.5 rounded border border-[#D4AF37]/5 font-mono text-xs text-gray-300">
                        <span className="truncate select-all">{`${window.location.origin}/client/${currentBooking.id}`}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => window.open(`${window.location.origin}/client/${currentBooking.id}`, '_blank')}
                          startIcon={<ExternalLink className="w-3.5 h-3.5" />}
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold uppercase text-[10px]"
                        >
                          Open Portal
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const link = `${window.location.origin}/client/${currentBooking.id}`;
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(link).then(() => alert("Client Portal Link copied to clipboard!")).catch(() => {
                                const ta = document.createElement("textarea");
                                ta.value = link;
                                document.body.appendChild(ta);
                                ta.select();
                                document.execCommand('copy');
                                document.body.removeChild(ta);
                                alert("Client Portal Link copied to clipboard!");
                              });
                            }
                          }}
                          startIcon={<Copy className="w-3.5 h-3.5" />}
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold uppercase text-[10px]"
                        >
                          Copy Link
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const link = `${window.location.origin}/client/${currentBooking.id}`;
                            if (navigator.share) {
                              navigator.share({
                                title: 'Client Portal - Asmaul Production',
                                text: `Track your shoot live on our Client Portal:`,
                                url: link
                              }).catch(() => {
                                window.open(`https://wa.me/?text=${encodeURIComponent(`Here is your Client Portal link to track your booking: ${link}`)}`, '_blank');
                              });
                            } else {
                              window.open(`https://wa.me/?text=${encodeURIComponent(`Here is your Client Portal link to track your booking: ${link}`)}`, '_blank');
                            }
                          }}
                          startIcon={<Share2 className="w-3.5 h-3.5" />}
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold uppercase text-[10px]"
                        >
                          Share Link
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            setQrCodeLink(`${window.location.origin}/client/${currentBooking.id}`);
                            setQrCodeOpen(true);
                          }}
                          startIcon={<QrCode className="w-3.5 h-3.5" />}
                          className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-bold uppercase text-[10px]"
                        >
                          Generate QR
                        </Button>
                      </div>
                    </Box>
                  </Box>
                </DialogContent>
                <DialogActions className="border-t border-[#D4AF37]/15 p-3 flex justify-between items-center w-full">
                  <Box className="flex gap-2">
                    <Button 
                      onClick={() => {
                        setPdfActionData({
                          title: 'Booking Confirmation',
                          subtitle: 'View, download or transmit your shoot confirmation document.',
                          clientName: currentBooking.clientName,
                          documentType: 'Booking Confirmation',
                          booking: currentBooking
                        });
                        setPdfActionOpen(true);
                      }} 
                      variant="contained" 
                      color="secondary" 
                      size="small"
                      startIcon={<Download className="w-4 h-4" />}
                      className="bg-amber-950/40 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-amber-900/30 text-[10px] sm:text-xs py-1"
                    >
                      Confirm PDF
                    </Button>
                    <Button 
                      onClick={() => {
                        setPdfActionData({
                          title: 'Invoice',
                          subtitle: 'View, download or transmit your invoice document.',
                          clientName: currentBooking.clientName,
                          documentType: 'Invoice',
                          booking: currentBooking
                        });
                        setPdfActionOpen(true);
                      }} 
                      variant="contained" 
                      color="secondary" 
                      size="small"
                      startIcon={<Download className="w-4 h-4" />}
                      className="bg-amber-950/40 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-amber-900/30 text-[10px] sm:text-xs py-1"
                    >
                      Invoice PDF
                    </Button>
                    <Button 
                      onClick={() => {
                        setPdfActionData({
                          title: 'Agreement Document',
                          subtitle: 'View, download or transmit your legally binding agreement document.',
                          clientName: currentBooking.clientName,
                          documentType: 'Agreement',
                          booking: currentBooking
                        });
                        setPdfActionOpen(true);
                      }} 
                      variant="contained" 
                      color="secondary" 
                      size="small"
                      startIcon={<Download className="w-4 h-4" />}
                      className="bg-amber-950/40 border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-amber-900/30 text-[10px] sm:text-xs py-1"
                    >
                      Agreement PDF
                    </Button>
                  </Box>
                  <Box className="flex gap-2">
                    <Button onClick={() => handleOpenEditForm(currentBooking)} variant="outlined" size="small" className="border-[#D4AF37]/50 text-[#D4AF37]">
                      Edit Contract
                    </Button>
                    <Button onClick={() => setDetailOpen(false)} color="inherit" size="small">
                      Close
                    </Button>
                  </Box>
                </DialogActions>
              </>
            )}
          </>
        )}
      </Dialog>

      {/* --- CONFIRM DELETE DIALOG --- */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle className="font-serif">Purge Record Archive?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" className="text-gray-400">
            Warning: This action will permanently remove the wedding booking record from your local IndexedDB log and queue a delete sync to fire on Firestore. This operation cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions className="p-3">
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit" size="small">
            Retain
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" size="small">
            Purge Forever
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- WHATSAPP NOTIFICATION DISPATCH DIALOG --- */}
      <Dialog 
        open={whatsappDialogOpen} 
        onClose={() => setWhatsappDialogOpen(false)} 
        fullWidth 
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            background: '#121212',
            border: '1px solid #D4AF37/30',
            color: '#ffffff'
          }
        }}
      >
        <DialogTitle component="div" className="border-b border-[#D4AF37]/20 pb-3">
          <Typography variant="h5" className="text-gold-gradient font-bold font-serif flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
            DISPATCH WHATSAPP NOTIFICATION
          </Typography>
          <Typography variant="caption" className="text-gray-400 text-[11px] uppercase tracking-wider block">
            Automated Contract Outsource Notification System
          </Typography>
        </DialogTitle>
        
        <DialogContent className="pt-4 space-y-4">
          {whatsappDispatchStep === 'idle' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Live Field Updates */}
              <div className="lg:col-span-5 space-y-4 border-r border-[#D4AF37]/10 lg:pr-5">
                <Typography variant="subtitle2" className="text-[#D4AF37] font-semibold text-xs uppercase tracking-wider">
                  Dispatch Variables
                </Typography>
                
                <TextField
                  fullWidth
                  label="Freelancer WhatsApp Number"
                  placeholder="e.g. +91 98765 43210"
                  value={whatsappRecipientPhone}
                  onChange={(e) => setWhatsappRecipientPhone(e.target.value)}
                  required
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><Phone className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                    }
                  }}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    fullWidth
                    size="small"
                    label="Bride Name"
                    value={whatsappBrideName}
                    onChange={(e) => setWhatsappBrideName(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Groom Name"
                    value={whatsappGroomName}
                    onChange={(e) => setWhatsappGroomName(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    fullWidth
                    size="small"
                    label="Event Time"
                    value={whatsappEventTime}
                    onChange={(e) => setWhatsappEventTime(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Reporting Time"
                    value={whatsappReportingTime}
                    onChange={(e) => setWhatsappReportingTime(e.target.value)}
                  />
                </div>
                
                <Box className="p-3 bg-black/40 rounded border border-[#D4AF37]/10 text-[11px] text-gray-400 leading-relaxed">
                  <div className="font-bold text-amber-500 flex items-center gap-1 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    DISPATCH NOTES
                  </div>
                  Modifying variables on the left dynamically regenerates the production-grade message draft template seen on the right. You can also directly type and edit the final template box.
                </Box>
              </div>
              
              {/* Right Column: Live Chat Message Preview */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <Typography variant="subtitle2" className="text-[#D4AF37] font-semibold text-xs uppercase tracking-wider flex justify-between items-center">
                  <span>Live Dispatch Preview</span>
                  <span className="text-[10px] font-mono font-normal text-gray-500">Recipient: {whatsappRecipientPhone || 'unspecified'}</span>
                </Typography>
                
                <div className="flex-grow p-4 bg-[#0d140e] rounded border border-green-900/40 relative flex flex-col justify-between min-h-[300px]">
                  {/* Decorative Mock WhatsApp Header */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-[#121b14] border-b border-green-950 flex items-center px-3 justify-between rounded-t">
                    <span className="text-[10px] text-green-500 font-bold font-mono tracking-widest uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Studio Telegram Dispatch
                    </span>
                    <span className="text-[9px] text-gray-500">{settings.studioName}</span>
                  </div>
                  
                  {/* Message body text area */}
                  <textarea
                    className="w-full bg-transparent border-0 outline-0 ring-0 text-gray-200 font-mono text-[11px] leading-relaxed resize-none mt-6 flex-grow custom-scrollbar"
                    style={{ minHeight: '260px' }}
                    value={whatsappCustomMessage}
                    onChange={(e) => setWhatsappCustomMessage(e.target.value)}
                  />
                  
                  <div className="text-[9px] text-green-700 text-right mt-2 font-mono">
                    Character Count: {whatsappCustomMessage.length}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Confirming status view */
            <Box className="flex flex-col items-center justify-center py-8 text-center space-y-6 max-w-md mx-auto">
              <Box className="relative">
                <div className="w-20 h-20 rounded-full bg-green-950/40 border-2 border-green-500/50 flex items-center justify-center animate-pulse">
                  <Send className="w-10 h-10 text-green-400" />
                </div>
                <span className="absolute -bottom-1 -right-1 bg-green-500 text-black p-1 rounded-full border border-black">
                  <Check className="w-4 h-4 font-bold" />
                </span>
              </Box>
              
              <Box className="space-y-2">
                <Typography variant="h6" className="text-white font-serif font-bold">
                  Confirm Dispatch Transmission
                </Typography>
                <Typography variant="body2" className="text-gray-400 leading-relaxed text-xs">
                  We have successfully generated and launched the pre-filled dispatch to WhatsApp Web for <strong className="text-white">{whatsappTargetBooking?.photographer}</strong> at <strong className="text-white">{whatsappRecipientPhone}</strong> in a new browser window.
                </Typography>
                <Typography variant="caption" className="text-amber-500/80 italic text-[11px] block mt-1">
                  Did the contractor successfully receive/confirm the message payload?
                </Typography>
              </Box>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleMarkAsSent}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 normal-case"
                >
                  <Check className="w-4 h-4" />
                  Yes, Message Delivered
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleMarkAsFailed}
                  className="border-red-900 hover:bg-red-950 text-red-400 font-bold text-xs py-2.5 flex items-center justify-center gap-1.5 normal-case"
                >
                  <AlertCircle className="w-4 h-4" />
                  No, Log Delivery Failure
                </Button>
              </div>
              
              <Button
                variant="text"
                size="small"
                onClick={handleDispatchWhatsApp}
                className="text-gray-400 hover:text-white normal-case text-xs flex items-center gap-1 mt-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Re-open WhatsApp Link
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions className="border-t border-[#D4AF37]/15 p-4 justify-between bg-black/40">
          {whatsappDispatchStep === 'idle' ? (
            <>
              <Button 
                onClick={() => setWhatsappDialogOpen(false)} 
                color="inherit" 
                size="small"
                className="normal-case text-xs"
              >
                Dismiss Draft
              </Button>
              <Button
                variant="contained"
                onClick={handleDispatchWhatsApp}
                className="bg-green-600 hover:bg-green-700 text-white font-bold normal-case text-xs px-4 py-1.5 flex items-center gap-2"
                disabled={!whatsappRecipientPhone}
              >
                <Send className="w-4 h-4" />
                Launch WhatsApp Dispatch
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setWhatsappDispatchStep('idle')}
              color="inherit"
              size="small"
              className="normal-case text-xs"
            >
              ← Edit Message Parameters
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* PDFActionsTriggerDialog for client-facing PDF flows */}
      {pdfActionOpen && pdfActionData && (
        <PDFActionsTriggerDialog
          open={pdfActionOpen}
          onClose={() => setPdfActionOpen(false)}
          title={pdfActionData.title}
          subtitle={pdfActionData.subtitle}
          clientName={pdfActionData.clientName}
          documentType={pdfActionData.documentType}
          onAction={handleTriggerPdfAction}
        />
      )}

      {/* PDFPreviewDialog to view PDFs inline securely */}
      {pdfPreviewOpen && (
        <PDFPreviewDialog
          open={pdfPreviewOpen}
          onClose={() => {
            setPdfPreviewOpen(false);
            if (pdfPreviewUrl) {
              URL.revokeObjectURL(pdfPreviewUrl);
              setPdfPreviewUrl(null);
            }
          }}
          pdfUrl={pdfPreviewUrl}
          title={pdfPreviewTitle}
          filename={pdfPreviewFilename}
          onDownload={() => {
            if (pdfPreviewDoc) {
              pdfPreviewDoc.save(pdfPreviewFilename);
            }
          }}
        />
      )}

      {/* QR Code Modal for Client Portal Sharing */}
      <Dialog open={qrCodeOpen} onClose={() => setQrCodeOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle className="border-b border-[#D4AF37]/20 text-center">
          <Typography variant="h6" className="text-gold-gradient font-serif font-bold">
            Client Portal QR Code
          </Typography>
        </DialogTitle>
        <DialogContent className="pt-6 pb-6 flex flex-col items-center justify-center space-y-4 text-center">
          <Typography variant="caption" className="text-gray-400 max-w-xs uppercase tracking-wider block">
            Scan this QR code with any mobile device to access your personalized Client Portal instantly.
          </Typography>
          
          <Box className="p-3 bg-white rounded-lg border-2 border-[#D4AF37]/50 flex items-center justify-center shadow-lg">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeLink)}`}
              alt="Client Portal QR Code"
              className="w-48 h-48"
              referrerPolicy="no-referrer"
            />
          </Box>
          
          <Typography variant="body2" className="text-gray-300 font-mono text-[10px] bg-black/45 px-3 py-1.5 rounded border border-[#D4AF37]/10 w-full truncate">
            {qrCodeLink}
          </Typography>
        </DialogContent>
        <DialogActions className="border-t border-[#D4AF37]/15 p-3 justify-center">
          <Button onClick={() => setQrCodeOpen(false)} variant="contained" className="bg-[#D4AF37] hover:bg-[#bfa032] text-black font-bold normal-case text-xs px-6">
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
