import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Snackbar,
  Alert,
  OutlinedInput
} from '@mui/material';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Phone,
  User,
  FileText,
  Send,
  Download,
  Eye,
  X,
  Trash2,
  Edit,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FolderMinus
} from 'lucide-react';
import { offlineService } from '../services/offlineService';
import { useBrand } from '../contexts/BrandContext';
import { FreelanceJob } from '../types';
import {
  downloadFreelanceBookingConfirmationPDF,
  buildFreelanceBookingConfirmationPDF
} from '../utils/freelancePdfGenerator';
import { PDFPreviewDialog } from './PDFPreviewDialog';

const EVENT_TYPE_OPTIONS = [
  'Wedding',
  'Holud',
  'Reception',
  'Engagement',
  'Pre-Wedding',
  'Birthday',
  'Anniversary',
  'Aqd/Kabin',
  'Others'
];

interface FreelanceJobsManagerProps {
  refreshTrigger?: number;
}

export const FreelanceJobsManager: React.FC<FreelanceJobsManagerProps> = ({ refreshTrigger = 0 }) => {
  const { settings } = useBrand();
  
  // State variables
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterStart, setDateFilterStart] = useState('');
  const [dateFilterEnd, setDateFilterEnd] = useState('');
  
  // UI States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<FreelanceJob | null>(null);
  const [editingJob, setEditingJob] = useState<FreelanceJob | null>(null);
  
  // PDF Preview State
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewFilename, setPdfPreviewFilename] = useState('');
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState('');
  const [pdfPreviewJob, setPdfPreviewJob] = useState<FreelanceJob | null>(null);

  // Snackbar Alert State
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Form State
  const [formData, setFormData] = useState({
    studioName: '',
    contactPerson: '',
    contactPhone: '',
    eventDate: '',
    location: '',
    eventTypes: [] as string[],
    customEventType: '',
    totalAmount: 0,
    advancePayment: 0,
    dueAmount: 0,
    paymentStatus: 'Pending' as 'Pending' | 'Partial' | 'Paid',
    notes: '',
    events: [] as Array<{
      eventType: string;
      eventDate: string;
      location?: string;
      customEventType?: string;
    }>
  });

  // Load jobs from offlineService
  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await offlineService.getFreelanceJobs();
      setJobs(data);
    } catch (err: any) {
      console.error('Error loading freelance jobs:', err);
      showSnackbar('Failed to load freelance jobs.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [refreshTrigger]);

  // Listener to offlineService updates to auto-refresh UI
  useEffect(() => {
    const unsubscribe = offlineService.subscribe(() => {
      loadJobs();
    });
    return () => unsubscribe();
  }, []);

  // Form field calculations
  useEffect(() => {
    const total = Number(formData.totalAmount) || 0;
    const advance = Number(formData.advancePayment) || 0;
    const due = Math.max(0, total - advance);
    
    let autoStatus: 'Pending' | 'Partial' | 'Paid' = 'Pending';
    if (advance === 0) {
      autoStatus = 'Pending';
    } else if (due === 0) {
      autoStatus = 'Paid';
    } else {
      autoStatus = 'Partial';
    }

    setFormData(prev => ({
      ...prev,
      dueAmount: due,
      paymentStatus: autoStatus
    }));
  }, [formData.totalAmount, formData.advancePayment]);

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenForm = (job: FreelanceJob | null = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
        studioName: job.studioName,
        contactPerson: job.contactPerson,
        contactPhone: job.contactPhone,
        eventDate: job.eventDate,
        location: job.location,
        eventTypes: job.eventTypes,
        customEventType: job.customEventType || '',
        totalAmount: job.totalAmount,
        advancePayment: job.advancePayment,
        dueAmount: job.dueAmount,
        paymentStatus: job.paymentStatus,
        notes: job.notes || '',
        events: job.events && job.events.length > 0 ? job.events.map(ev => ({
          eventType: ev.eventType,
          eventDate: ev.eventDate,
          location: ev.location || '',
          customEventType: ev.customEventType || ''
        })) : [{
          eventType: job.eventTypes[0] || '',
          eventDate: job.eventDate,
          location: job.location || '',
          customEventType: job.customEventType || ''
        }]
      });
    } else {
      setEditingJob(null);
      setFormData({
        studioName: '',
        contactPerson: '',
        contactPhone: '',
        eventDate: '',
        location: '',
        eventTypes: [],
        customEventType: '',
        totalAmount: 0,
        advancePayment: 0,
        dueAmount: 0,
        paymentStatus: 'Pending',
        notes: '',
        events: [{
          eventType: '',
          eventDate: '',
          location: '',
          customEventType: ''
        }]
      });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingJob(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEvent = () => {
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, { eventType: '', eventDate: '', location: '', customEventType: '' }]
    }));
  };

  const handleRemoveEvent = (index: number) => {
    if (formData.events.length <= 1) {
      showSnackbar('At least one event is required.', 'warning');
      return;
    }
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));
  };

  const handleEventFieldChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedEvents = [...prev.events];
      updatedEvents[index] = {
        ...updatedEvents[index],
        [field]: value
      };
      return {
        ...prev,
        events: updatedEvents
      };
    });
  };

  const handleSelectEventTypes = (event: any) => {
    const { value } = event.target;
    setFormData(prev => ({
      ...prev,
      eventTypes: typeof value === 'string' ? value.split(',') : value
    }));
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studioName || !formData.contactPerson || !formData.contactPhone) {
      showSnackbar('Please fill in all required client fields.', 'warning');
      return;
    }

    if (!formData.events || formData.events.length === 0) {
      showSnackbar('Please add at least one event.', 'warning');
      return;
    }

    // Validate each event in the list
    for (let i = 0; i < formData.events.length; i++) {
      const ev = formData.events[i];
      if (!ev.eventType) {
        showSnackbar(`Please select an event type for Event #${i + 1}.`, 'warning');
        return;
      }
      if (!ev.eventDate) {
        showSnackbar(`Please enter an event date for Event #${i + 1}.`, 'warning');
        return;
      }
      if (ev.eventType === 'Others' && !ev.customEventType) {
        showSnackbar(`Please enter a custom event name for Event #${i + 1}.`, 'warning');
        return;
      }
    }

    // Compute legacy fields from the events list for backward compatibility
    // 1. Sort events by date to find the earliest event
    const sortedEvents = [...formData.events]
      .filter(e => e.eventDate)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    const primaryEvent = sortedEvents[0] || formData.events[0];
    const computedEventDate = primaryEvent?.eventDate || '';
    const computedLocation = primaryEvent?.location || formData.location || '';
    const computedEventTypes = formData.events.map(ev => ev.eventType);
    const computedCustomEventType = formData.events.find(ev => ev.eventType === 'Others')?.customEventType || '';

    try {
      if (editingJob) {
        const updatedJob: FreelanceJob = {
          ...editingJob,
          studioName: formData.studioName,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          eventDate: computedEventDate,
          location: computedLocation,
          eventTypes: computedEventTypes,
          customEventType: computedCustomEventType,
          totalAmount: Number(formData.totalAmount),
          advancePayment: Number(formData.advancePayment),
          dueAmount: formData.dueAmount,
          paymentStatus: formData.paymentStatus,
          notes: formData.notes,
          events: formData.events
        };
        await offlineService.updateFreelanceJob(updatedJob);
        showSnackbar('Freelance job updated successfully.', 'success');
        if (selectedJob && selectedJob.id === editingJob.id) {
          setSelectedJob(updatedJob);
        }
      } else {
        const newJob: FreelanceJob = {
          id: `freelance_${Date.now()}`,
          studioName: formData.studioName,
          contactPerson: formData.contactPerson,
          contactPhone: formData.contactPhone,
          eventDate: computedEventDate,
          location: computedLocation,
          eventTypes: computedEventTypes,
          customEventType: computedCustomEventType,
          totalAmount: Number(formData.totalAmount),
          advancePayment: Number(formData.advancePayment),
          dueAmount: formData.dueAmount,
          paymentStatus: formData.paymentStatus,
          notes: formData.notes,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          events: formData.events
        };
        await offlineService.addFreelanceJob(newJob);
        showSnackbar('Freelance job added successfully.', 'success');
      }
      handleCloseForm();
      loadJobs();
    } catch (err: any) {
      console.error('Error saving freelance job:', err);
      showSnackbar('Error saving freelance job.', 'error');
    }
  };

  const handleDeleteJob = async (job: FreelanceJob) => {
    if (window.confirm(`Are you sure you want to delete the freelance job for "${job.studioName}" on ${job.eventDate}?`)) {
      try {
        await offlineService.deleteFreelanceJob(job.id);
        showSnackbar('Freelance job deleted successfully.', 'success');
        setIsDetailsOpen(false);
        loadJobs();
      } catch (err) {
        console.error('Error deleting freelance job:', err);
        showSnackbar('Failed to delete freelance job.', 'error');
      }
    }
  };

  const handleDownloadPDF = (job: FreelanceJob) => {
    downloadFreelanceBookingConfirmationPDF(job, settings);
    showSnackbar('Freelance PDF download triggered.', 'success');
  };

  const handlePreviewPDF = async (job: FreelanceJob) => {
    try {
      const doc = await buildFreelanceBookingConfirmationPDF(job, settings);
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewTitle(`Freelance Booking - ${job.studioName}`);
      setPdfPreviewFilename(`freelance_confirmation_${job.id.slice(0, 8)}.pdf`);
      setPdfPreviewJob(job);
      setPdfPreviewOpen(true);
    } catch (err) {
      console.error('Error building PDF for preview:', err);
      showSnackbar('Failed to preview PDF.', 'error');
    }
  };

  const handleWhatsAppShare = (job: FreelanceJob) => {
    const template = settings.freelanceWhatsappTemplate || '';
    if (!template) {
      showSnackbar('No WhatsApp template found in settings.', 'error');
      return;
    }

    let eventTypesString = '';
    let eventDatesString = '';
    let locationsString = '';

    if (job.events && job.events.length > 0) {
      eventTypesString = job.events.map(ev => ev.eventType === 'Others' && ev.customEventType ? `Others (${ev.customEventType})` : ev.eventType).join(', ');
      eventDatesString = job.events.map(ev => ev.eventDate).join(', ');
      locationsString = job.events.map(ev => ev.location || 'N/A').filter((v, idx, arr) => arr.indexOf(v) === idx).join(', ');
    } else {
      eventTypesString = job.eventTypes.includes('Others') && job.customEventType
        ? job.eventTypes.map(t => t === 'Others' ? `Others (${job.customEventType})` : t).join(', ')
        : job.eventTypes.join(', ');
      eventDatesString = job.eventDate;
      locationsString = job.location;
    }

    const formattedMessage = template
      .replace(/\{\{Contact Person\}\}/g, job.contactPerson)
      .replace(/\{\{Event Date\}\}/g, eventDatesString)
      .replace(/\{\{Event Types\}\}/g, eventTypesString)
      .replace(/\{\{Location\}\}/g, locationsString)
      .replace(/\{\{Total Amount\}\}/g, `₹ ${job.totalAmount.toLocaleString('en-IN')}`)
      .replace(/\{\{Advance\}\}/g, `₹ ${job.advancePayment.toLocaleString('en-IN')}`)
      .replace(/\{\{Due Amount\}\}/g, `₹ ${job.dueAmount.toLocaleString('en-IN')}`)
      .replace(/\{\{Studio Name\}\}/g, settings.studioName || 'Asmaul Production');

    const cleanPhone = job.contactPhone.replace(/\D/g, '');
    const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(formattedMessage)}`;
    
    window.open(whatsappUrl, '_blank');
    showSnackbar('WhatsApp share initiated.', 'success');
  };

  // Filtering list
  const filteredJobs = jobs.filter(job => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      job.studioName.toLowerCase().includes(searchLower) ||
      job.contactPerson.toLowerCase().includes(searchLower) ||
      job.contactPhone.includes(searchQuery) ||
      job.location.toLowerCase().includes(searchLower) ||
      job.eventTypes.some(t => t.toLowerCase().includes(searchLower));

    let matchesDate = true;
    if (dateFilterStart) {
      matchesDate = matchesDate && job.eventDate >= dateFilterStart;
    }
    if (dateFilterEnd) {
      matchesDate = matchesDate && job.eventDate <= dateFilterEnd;
    }

    return matchesSearch && matchesDate;
  });

  return (
    <Box id="freelance-jobs-manager-root" className="p-4 sm:p-6 bg-[#070706] min-h-screen text-white">
      {/* Module Title and Actions */}
      <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <Box>
          <Typography variant="h4" className="font-serif font-bold text-gold-gradient tracking-wide mb-1 flex items-center gap-2">
            📸 Freelance Jobs
          </Typography>
          <Typography variant="body2" className="text-gray-400">
            Manage your external freelance assignments, client studios, contracts and payments
          </Typography>
        </Box>
        <Button
          id="btn-add-freelance-job"
          variant="outlined"
          onClick={() => handleOpenForm()}
          startIcon={<Plus className="w-4 h-4" />}
          className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg px-4 py-2 font-medium tracking-wide uppercase text-xs"
        >
          Add Freelance Job
        </Button>
      </Box>

      {/* Filters & Search Control Bar */}
      <Card className="bg-[#141413] border border-[#D4AF37]/15 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="col-span-12 md:col-span-4">
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search by Studio, Contact Person, Phone, Location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <Search className="w-4 h-4 text-gray-500 mr-2" />,
                  className: 'bg-black/30 border border-white/5 rounded-lg text-white text-sm'
                }
              }}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              size="small"
              value={dateFilterStart}
              onChange={(e) => setDateFilterStart(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  className: 'bg-black/30 border border-white/5 rounded-lg text-white text-sm'
                }
              }}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 md:col-span-3">
            <TextField
              fullWidth
              type="date"
              label="End Date"
              size="small"
              value={dateFilterEnd}
              onChange={(e) => setDateFilterEnd(e.target.value)}
              slotProps={{
                inputLabel: { shrink: true },
                input: {
                  className: 'bg-black/30 border border-white/5 rounded-lg text-white text-sm'
                }
              }}
            />
          </div>
          <div className="col-span-12 md:col-span-2 flex gap-2">
            <Button
              fullWidth
              variant="text"
              onClick={() => {
                setSearchQuery('');
                setDateFilterStart('');
                setDateFilterEnd('');
              }}
              className="text-gray-400 hover:text-white capitalize text-xs font-semibold py-2"
            >
              Clear Filters
            </Button>
            <IconButton onClick={loadJobs} className="text-gray-400 hover:text-white p-2">
              <RefreshCw className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </Card>

      {/* Main Jobs Listing Table */}
      {loading ? (
        <Box className="flex justify-center items-center py-20">
          <CircularProgress className="text-[#D4AF37]" size={40} />
        </Box>
      ) : filteredJobs.length === 0 ? (
        <Box className="flex flex-col justify-center items-center py-16 bg-[#141413]/50 border border-dashed border-white/5 rounded-xl">
          <FolderMinus className="w-12 h-12 text-[#D4AF37]/30 mb-3" />
          <Typography className="text-gray-400 font-medium mb-1">No freelance jobs found</Typography>
          <Typography className="text-gray-500 text-xs text-center px-4 max-w-sm">
            Try adjusting your search criteria, clearing the dates, or add a brand new freelance assignment above.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} className="bg-[#141413] border border-[#D4AF37]/15 rounded-xl overflow-hidden shadow-xl">
          <Table className="min-w-full">
            <TableHead className="bg-[#0f0f0e]">
              <TableRow>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4 pl-6">Company / Studio</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4">Contact Representative</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4">Event Date</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4">Event Types</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4">Due Amount</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4">Payment Status</TableCell>
                <TableCell className="text-gray-400 font-serif font-bold text-xs uppercase border-b border-white/5 py-4 pr-6 text-right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.map((job) => {
                const eventTypesString = job.eventTypes.includes('Others') && job.customEventType
                  ? job.eventTypes.map(t => t === 'Others' ? `Others (${job.customEventType})` : t).join(', ')
                  : job.eventTypes.join(', ');

                return (
                  <TableRow key={job.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
                    <TableCell className="font-medium text-white border-none py-4 pl-6">
                      <Box className="flex flex-col">
                        <span className="font-serif font-bold text-sm tracking-wide text-[#D4AF37]">{job.studioName}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 text-gray-500" /> {job.location}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell className="border-none py-4">
                      <Box className="flex flex-col">
                        <span className="text-xs font-semibold text-white">{job.contactPerson}</span>
                        <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {job.contactPhone}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-300 border-none py-4">
                      {job.events && job.events.length > 0 ? (
                        <Box className="flex flex-col gap-0.5 font-mono text-[11px] text-indigo-300">
                          {job.events.map((ev, idx) => (
                            <div key={idx}>{ev.eventDate}</div>
                          ))}
                        </Box>
                      ) : (
                        job.eventDate
                      )}
                    </TableCell>
                    <TableCell className="border-none py-4">
                      {job.events && job.events.length > 0 ? (
                        <Box className="flex flex-col gap-0.5 text-xs text-gray-400">
                          {job.events.map((ev, idx) => {
                            const typeStr = ev.eventType === 'Others' && ev.customEventType
                              ? `Others (${ev.customEventType})`
                              : ev.eventType;
                            return <div key={idx} className="line-clamp-1 font-medium text-white/95">• {typeStr}</div>;
                          })}
                        </Box>
                      ) : (
                        <Typography className="text-xs text-gray-400 line-clamp-1 max-w-[200px]">
                          {eventTypesString}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-white border-none py-4">
                      ₹ {job.dueAmount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell className="border-none py-4">
                      <Chip
                        size="small"
                        label={job.paymentStatus.toUpperCase()}
                        className={`text-[9px] font-mono font-bold tracking-wider px-1 ${
                          job.paymentStatus === 'Paid' ? 'bg-green-500/15 text-green-400 border border-green-500/35' :
                          job.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35' :
                          'bg-red-500/15 text-red-400 border border-red-500/35'
                        }`}
                      />
                    </TableCell>
                    <TableCell className="border-none py-4 pr-6 text-right">
                      <Box className="flex justify-end items-center gap-1">
                        <Tooltip title="View Full Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedJob(job);
                              setIsDetailsOpen(true);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <Eye className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Job">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenForm(job)}
                            className="text-[#D4AF37] hover:text-[#D4AF37]/80"
                          >
                            <Edit className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="WhatsApp Sharing">
                          <IconButton
                            size="small"
                            onClick={() => handleWhatsAppShare(job)}
                            className="text-green-400 hover:text-green-500"
                          >
                            <Send className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Job">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteJob(job)}
                            className="text-red-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Form Dialog */}
      <Dialog
        open={isFormOpen}
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            className: 'border border-[#D4AF37]/35 bg-[#141413] text-white rounded-xl'
          }
        }}
      >
        <form onSubmit={handleSaveJob}>
          <DialogTitle className="border-b border-white/5 p-5 flex justify-between items-center bg-black/40">
            <Typography variant="h6" className="font-serif font-bold text-[#D4AF37] uppercase tracking-wider">
              {editingJob ? '📸 Edit Freelance Job' : '📸 Add Freelance Job'}
            </Typography>
            <IconButton onClick={handleCloseForm} className="text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </IconButton>
          </DialogTitle>
          
          <DialogContent className="p-6 bg-[#0D0D0C]">
            <Grid container spacing={3}>
              {/* Studio Info Section */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mb-3">
                  Studio & Client Details
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  name="studioName"
                  label="Studio / Company Name"
                  size="small"
                  value={formData.studioName}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  name="contactPerson"
                  label="Contact Person Name"
                  size="small"
                  value={formData.contactPerson}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  name="contactPhone"
                  label="Contact Phone Number"
                  size="small"
                  placeholder="e.g. +91 98765 43210"
                  value={formData.contactPhone}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
              
              {/* Event Details Section (Multiple Events) */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mt-2 mb-3">
                  Events & Schedule
                </Typography>
              </Grid>

              {formData.events && formData.events.map((ev, index) => (
                <Grid size={12} key={index} className="p-4 bg-black/30 border border-[#D4AF37]/15 rounded-xl mb-2">
                  <Box className="flex justify-between items-center mb-3">
                    <Typography variant="subtitle2" className="text-[#D4AF37] font-serif font-bold text-xs tracking-wider uppercase">
                      Event #{index + 1}
                    </Typography>
                    {formData.events.length > 1 && (
                      <Button
                        size="small"
                        onClick={() => handleRemoveEvent(index)}
                        className="text-red-400 hover:text-red-300 normal-case min-w-0 p-0 text-xs font-semibold"
                      >
                        Remove Event
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel id={`event-type-label-${index}`} className="text-gray-400">Event Type</InputLabel>
                        <Select
                          labelId={`event-type-label-${index}`}
                          value={ev.eventType}
                          onChange={(e) => handleEventFieldChange(index, 'eventType', e.target.value)}
                          input={<OutlinedInput label="Event Type" className="bg-black/40 text-white rounded-lg" />}
                        >
                          {EVENT_TYPE_OPTIONS.map((name) => (
                            <MenuItem key={name} value={name} className="bg-[#141413] text-white hover:bg-white/10">
                              {name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        required
                        type="date"
                        label="Event Date"
                        size="small"
                        value={ev.eventDate}
                        onChange={(e) => handleEventFieldChange(index, 'eventDate', e.target.value)}
                        slotProps={{
                          inputLabel: { shrink: true, className: 'text-gray-400' },
                          input: { className: 'bg-black/40 text-white rounded-lg' }
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        name="location"
                        label="Location (Optional)"
                        size="small"
                        value={ev.location || ''}
                        onChange={(e) => handleEventFieldChange(index, 'location', e.target.value)}
                        slotProps={{
                          inputLabel: { className: 'text-gray-400' },
                          input: { className: 'bg-black/40 text-white rounded-lg' }
                        }}
                      />
                    </Grid>

                    {ev.eventType === 'Others' && (
                      <Grid size={12}>
                        <TextField
                          fullWidth
                          required
                          label="Custom Event Name"
                          size="small"
                          value={ev.customEventType || ''}
                          onChange={(e) => handleEventFieldChange(index, 'customEventType', e.target.value)}
                          slotProps={{
                            inputLabel: { className: 'text-gray-400' },
                            input: { className: 'bg-black/40 text-white rounded-lg' }
                          }}
                        />
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              ))}

              <Grid size={12} className="flex justify-start mb-2">
                <Button
                  variant="outlined"
                  onClick={handleAddEvent}
                  className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 normal-case rounded-lg text-xs font-bold"
                >
                  + Add Another Event
                </Button>
              </Grid>

              {/* Financial Section */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mt-2 mb-3">
                  Payments & Finance
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="totalAmount"
                  label="Total Amount (INR)"
                  size="small"
                  value={formData.totalAmount || ''}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  name="advancePayment"
                  label="Advance Payment (INR)"
                  size="small"
                  value={formData.advancePayment || ''}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Box className="bg-black/40 border border-white/5 p-2 rounded-lg flex flex-col justify-center h-full">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wide">Due Amount (Auto-Calculated)</span>
                  <span className="text-sm font-mono font-bold text-[#D4AF37]">₹ {formData.dueAmount.toLocaleString('en-IN')}</span>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Box className="bg-black/40 border border-white/5 p-2.5 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Payment Status:</span>
                  <Chip
                    label={formData.paymentStatus.toUpperCase()}
                    className={`text-[10px] font-mono font-bold px-2 ${
                      formData.paymentStatus === 'Paid' ? 'bg-green-500/15 text-green-400 border border-green-500/35' :
                      formData.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35' :
                      'bg-red-500/15 text-red-400 border border-red-500/35'
                    }`}
                  />
                </Box>
              </Grid>

              {/* Notes Field */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mt-2 mb-3">
                  Additional Scope / Notes
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="notes"
                  label="Scope of Work, Special Agreements or Notes"
                  value={formData.notes}
                  onChange={handleFormChange}
                  slotProps={{
                    inputLabel: { className: 'text-gray-400' },
                    input: { className: 'bg-black/40 text-white rounded-lg' }
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          
          <DialogActions className="border-t border-white/5 p-4 bg-black/40">
            <Button onClick={handleCloseForm} className="text-gray-400 hover:text-white capitalize text-sm px-4">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black font-semibold rounded-lg px-5 py-2 capitalize text-sm"
            >
              {editingJob ? 'Update Job' : 'Add Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            className: 'border border-[#D4AF37]/35 bg-[#141413] text-white rounded-xl overflow-hidden'
          }
        }}
      >
        {selectedJob && (
          <Box>
            <DialogTitle className="border-b border-white/5 p-5 flex justify-between items-center bg-black/40">
              <Box>
                <Typography variant="h6" className="font-serif font-bold text-[#D4AF37] tracking-wider leading-tight">
                  {selectedJob.studioName}
                </Typography>
                <Typography variant="body2" className="text-xs text-gray-400 flex items-center gap-1 mt-1 font-mono">
                  Job ID: {selectedJob.id.toUpperCase()}
                </Typography>
              </Box>
              <IconButton onClick={() => setIsDetailsOpen(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </IconButton>
            </DialogTitle>
            
            <DialogContent className="p-6 bg-[#0D0D0C]">
              <Grid container spacing={4}>
                {/* Information Segment */}
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box className="space-y-4">
                    <Box className="flex flex-col border-b border-white/5 pb-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Client Studio / Company Name</span>
                      <span className="text-sm font-medium text-white">{selectedJob.studioName}</span>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid size={6}>
                        <Box className="flex flex-col border-b border-white/5 pb-2">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Contact Person</span>
                          <span className="text-sm font-medium text-white">{selectedJob.contactPerson}</span>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box className="flex flex-col border-b border-white/5 pb-2">
                          <span className="text-[10px] text-gray-500 uppercase tracking-wide">Contact Phone</span>
                          <span className="text-sm font-medium text-white">{selectedJob.contactPhone}</span>
                        </Box>
                      </Grid>
                    </Grid>
                    <Box className="flex flex-col border-b border-white/5 pb-2">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wide">Events Schedule</span>
                      {selectedJob.events && selectedJob.events.length > 0 ? (
                        <Box className="mt-2 space-y-2">
                          {selectedJob.events.map((ev, idx) => {
                            const typeStr = ev.eventType === 'Others' && ev.customEventType
                              ? `Others (${ev.customEventType})`
                              : ev.eventType;
                            return (
                              <Box key={idx} className="p-2.5 bg-black/30 border border-[#D4AF37]/15 rounded-lg flex flex-col sm:flex-row sm:justify-between gap-1">
                                <span className="text-xs font-bold text-[#D4AF37]">{typeStr}</span>
                                <Box className="flex flex-wrap gap-x-2 text-[11px] text-gray-400">
                                  <span className="font-mono text-indigo-300 font-medium">{ev.eventDate}</span>
                                  {ev.location && (
                                    <>
                                      <span>•</span>
                                      <span>{ev.location}</span>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <Grid container spacing={2} className="mt-1">
                          <Grid size={6}>
                            <Box className="flex flex-col">
                              <span className="text-xs text-gray-500">Event Date</span>
                              <span className="text-sm font-semibold font-mono text-[#D4AF37]">{selectedJob.eventDate}</span>
                            </Box>
                          </Grid>
                          <Grid size={6}>
                            <Box className="flex flex-col">
                              <span className="text-xs text-gray-500">Location</span>
                              <span className="text-sm font-medium text-white">{selectedJob.location}</span>
                            </Box>
                          </Grid>
                          <Grid size={12}>
                            <Box className="flex flex-wrap gap-1.5 mt-1.5">
                              {selectedJob.eventTypes.map(t => (
                                <Chip
                                  key={t}
                                  size="small"
                                  label={t === 'Others' && selectedJob.customEventType ? `Others (${selectedJob.customEventType})` : t}
                                  className="bg-white/5 border border-white/10 text-gray-300 text-[10px]"
                                />
                              ))}
                            </Box>
                          </Grid>
                        </Grid>
                      )}
                    </Box>
                    {selectedJob.notes && (
                      <Box className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Additional Scope & Notes</span>
                        <Box className="bg-black/30 p-3 rounded-lg border border-white/5">
                          <Typography variant="body2" className="text-gray-300 text-xs whitespace-pre-line leading-relaxed">
                            {selectedJob.notes}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Grid>

                {/* Financial Overview Segment */}
                <Grid size={{ xs: 12, md: 5 }}>
                  <Card className="bg-black/40 border border-[#D4AF37]/20 rounded-xl p-4 h-full flex flex-col justify-between">
                    <Box>
                      <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mb-4 pb-2 border-b border-white/5">
                        Financial Summary
                      </Typography>
                      <Box className="space-y-3">
                        <Box className="flex justify-between items-center text-xs text-gray-400">
                          <span>Total Service Fee:</span>
                          <span className="font-mono text-white font-bold">₹ {selectedJob.totalAmount.toLocaleString('en-IN')}</span>
                        </Box>
                        <Box className="flex justify-between items-center text-xs text-gray-400">
                          <span>Advance Payment Received:</span>
                          <span className="font-mono text-green-400">₹ {selectedJob.advancePayment.toLocaleString('en-IN')}</span>
                        </Box>
                        <Box className="flex justify-between items-center pt-2 border-t border-white/5">
                          <span className="text-xs text-gray-300 font-semibold">Remaining Due:</span>
                          <span className="font-mono text-[#D4AF37] font-extrabold text-sm">₹ {selectedJob.dueAmount.toLocaleString('en-IN')}</span>
                        </Box>
                      </Box>
                    </Box>

                    <Box className="mt-6 space-y-3">
                      <Box className="flex justify-between items-center p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                        <span className="text-xs text-gray-400 font-medium">Payment Status:</span>
                        <Chip
                          size="small"
                          label={selectedJob.paymentStatus.toUpperCase()}
                          className={`text-[9px] font-mono font-bold px-2 ${
                            selectedJob.paymentStatus === 'Paid' ? 'bg-green-500/15 text-green-400 border border-green-500/35' :
                            selectedJob.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35' :
                            'bg-red-500/15 text-red-400 border border-red-500/35'
                          }`}
                        />
                      </Box>

                      {/* PDF Action Triggers */}
                      <Typography className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold text-center mt-4">
                        Contract Documentation Actions
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handlePreviewPDF(selectedJob)}
                            startIcon={<Eye className="w-3.5 h-3.5" />}
                            className="border-white/10 hover:border-white/20 text-white hover:bg-white/5 rounded-lg text-xs py-1.5"
                          >
                            Preview PDF
                          </Button>
                        </Grid>
                        <Grid size={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleDownloadPDF(selectedJob)}
                            startIcon={<Download className="w-3.5 h-3.5" />}
                            className="border-white/10 hover:border-white/20 text-white hover:bg-white/5 rounded-lg text-xs py-1.5"
                          >
                            Download PDF
                          </Button>
                        </Grid>
                        <Grid size={12}>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleWhatsAppShare(selectedJob)}
                            startIcon={<Send className="w-3.5 h-3.5" />}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-xs py-2"
                          >
                            Share to WhatsApp
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions className="border-t border-white/5 p-4 bg-black/40">
              <Button
                variant="outlined"
                onClick={() => {
                  handleOpenForm(selectedJob);
                  setIsDetailsOpen(false);
                }}
                className="border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 capitalize text-sm rounded-lg px-4"
              >
                Edit Details
              </Button>
              <Button
                onClick={() => handleOpenForm()}
                className="text-gray-400 hover:text-white capitalize text-sm"
              >
                Close
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>

      {/* PDF Preview Dialog */}
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
        onDownload={() => pdfPreviewJob && handleDownloadPDF(pdfPreviewJob)}
      />

      {/* Snackbar Alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          className="border border-white/10"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
