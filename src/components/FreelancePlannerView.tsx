import React, { useState, useEffect } from 'react';
import { FreelanceJob, FreelanceEvent } from '../types';
import { offlineService } from '../services/offlineService';
import { useSyncState } from '../hooks/useSyncState';
import { useBrand } from '../contexts/BrandContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
  Tooltip
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  MapPin,
  User,
  Plus,
  Clock,
  Briefcase,
  X,
  Phone,
  DollarSign,
  FileText,
  Layers,
  Filter
} from 'lucide-react';

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

interface FreelancePlannerViewProps {
  refreshTrigger?: number;
}

interface PlannerEvent {
  eventId: string;
  eventType: string;
  eventDate: string;
  location: string;
  studioName: string;
  contactPerson: string;
  contactPhone: string;
  paymentStatus: 'Pending' | 'Partial' | 'Paid';
  totalAmount: number;
  dueAmount: number;
  notes?: string;
  job: FreelanceJob;
}

export const FreelancePlannerView: React.FC<FreelancePlannerViewProps> = ({ refreshTrigger = 0 }) => {
  const { settings } = useBrand();
  const syncState = useSyncState();
  
  // App views: 'monthly' | 'weekly' | 'daily'
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date('2026-07-11')); // Focused near simulated date
  const [selectedDayStr, setSelectedDayStr] = useState('2026-07-11');
  
  // Data State
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [localRefresh, setLocalRefresh] = useState(0);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed' | 'paid' | 'pending'>('all');
  
  // UI Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  
  // Add Job Form State
  const [formData, setFormData] = useState({
    studioName: '',
    contactPerson: '',
    contactPhone: '',
    location: '',
    totalAmount: 0,
    advancePayment: 0,
    dueAmount: 0,
    paymentStatus: 'Pending' as 'Pending' | 'Partial' | 'Paid',
    notes: '',
    events: [
      { eventType: '', eventDate: '', location: '', customEventType: '' }
    ] as FreelanceEvent[]
  });

  // Toast notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' });

  // Load Freelance Jobs
  useEffect(() => {
    const loadJobs = async () => {
      const allJobs = await offlineService.getFreelanceJobs();
      setJobs(allJobs);
    };
    loadJobs();
  }, [refreshTrigger, localRefresh, syncState.syncVersion]);

  // Handle Form Amount Auto-calculations
  useEffect(() => {
    const total = Number(formData.totalAmount) || 0;
    const advance = Number(formData.advancePayment) || 0;
    const due = Math.max(0, total - advance);
    let autoStatus: 'Pending' | 'Partial' | 'Paid' = 'Pending';
    if (advance === 0) {
      autoStatus = 'Pending';
    } else if (advance >= total && total > 0) {
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

  // Extract events from jobs list with support for legacy and newer array format
  const getAllEvents = (): PlannerEvent[] => {
    const list: PlannerEvent[] = [];
    jobs.forEach(job => {
      if (job.events && job.events.length > 0) {
        job.events.forEach((ev, idx) => {
          list.push({
            eventId: `${job.id}-ev-${idx}`,
            eventType: ev.eventType === 'Others' && ev.customEventType ? ev.customEventType : ev.eventType,
            eventDate: ev.eventDate,
            location: ev.location || job.location || 'N/A',
            studioName: job.studioName,
            contactPerson: job.contactPerson,
            contactPhone: job.contactPhone || 'N/A',
            paymentStatus: job.paymentStatus,
            totalAmount: job.totalAmount,
            dueAmount: job.dueAmount,
            notes: job.notes,
            job: job
          });
        });
      } else {
        // Backwards compatibility
        const typeStr = job.eventTypes.includes('Others') && job.customEventType
          ? `Others (${job.customEventType})`
          : job.eventTypes.join(', ');
        list.push({
          eventId: `${job.id}-legacy`,
          eventType: typeStr,
          eventDate: job.eventDate,
          location: job.location || 'N/A',
          studioName: job.studioName,
          contactPerson: job.contactPerson,
          contactPhone: job.contactPhone || 'N/A',
          paymentStatus: job.paymentStatus,
          totalAmount: job.totalAmount,
          dueAmount: job.dueAmount,
          notes: job.notes,
          job: job
        });
      }
    });
    return list;
  };

  // Apply planner filters
  const getFilteredEvents = (): PlannerEvent[] => {
    const all = getAllEvents();
    const simulatedTodayStr = '2026-07-11';
    
    return all.filter(ev => {
      switch (filterType) {
        case 'upcoming':
          return ev.eventDate >= simulatedTodayStr;
        case 'completed':
          return ev.eventDate < simulatedTodayStr;
        case 'paid':
          return ev.paymentStatus === 'Paid';
        case 'pending':
          return ev.paymentStatus === 'Pending' || ev.paymentStatus === 'Partial';
        case 'all':
        default:
          return true;
      }
    }).sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date('2026-07-11'));
    setSelectedDayStr('2026-07-11');
  };

  const handleEventClick = (ev: PlannerEvent) => {
    setSelectedEvent(ev);
    setIsDetailsOpen(true);
  };

  // Add Job Form Handlers
  const handleOpenForm = () => {
    setFormData({
      studioName: '',
      contactPerson: '',
      contactPhone: '',
      location: '',
      totalAmount: 0,
      advancePayment: 0,
      dueAmount: 0,
      paymentStatus: 'Pending',
      notes: '',
      events: [
        { eventType: '', eventDate: '', location: '', customEventType: '' }
      ]
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddEventField = () => {
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, { eventType: '', eventDate: '', location: '', customEventType: '' }]
    }));
  };

  const handleRemoveEventField = (index: number) => {
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

    const sortedEvents = [...formData.events]
      .filter(e => e.eventDate)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));

    const primaryEvent = sortedEvents[0] || formData.events[0];
    const computedEventDate = primaryEvent?.eventDate || '';
    const computedLocation = primaryEvent?.location || formData.location || '';
    const computedEventTypes = formData.events.map(ev => ev.eventType);
    const computedCustomEventType = formData.events.find(ev => ev.eventType === 'Others')?.customEventType || '';

    try {
      const newJob: FreelanceJob = {
        id: `free-job-${Date.now()}`,
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
      setIsFormOpen(false);
      setLocalRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
      showSnackbar('Failed to register freelance job.', 'error');
    }
  };

  // Monthly Calendar cells setup
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ type: 'padding', key: `pad-${i}` });
  }

  const filteredEvents = getFilteredEvents();

  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = d < 10 ? `0${d}` : d;
    const mStr = (month + 1) < 10 ? `0${month + 1}` : (month + 1);
    const dateStr = `${year}-${mStr}-${dStr}`;
    
    const dayEvents = filteredEvents.filter(ev => ev.eventDate === dateStr);
    
    cells.push({
      type: 'day',
      key: `day-${d}`,
      dayNum: d,
      dateStr,
      events: dayEvents
    });
  }

  // Weekly planner date list (Sunday to Saturday of focused date's week)
  const getWeeklyDays = () => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay(); // 0 is Sunday, etc.
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      
      const y = nextDay.getFullYear();
      const m = nextDay.getMonth() + 1;
      const d = nextDay.getDate();
      
      const mStr = m < 10 ? `0${m}` : m;
      const dStr = d < 10 ? `0${d}` : d;
      const dateStr = `${y}-${mStr}-${dStr}`;
      
      days.push({
        date: nextDay,
        dateStr,
        events: filteredEvents.filter(ev => ev.eventDate === dateStr)
      });
    }
    return days;
  };

  const handlePrevWeek = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(nextDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(nextDate);
  };

  // Daily Planner handler
  const handlePrevDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(nextDate);
    
    const y = nextDate.getFullYear();
    const m = nextDate.getMonth() + 1;
    const d = nextDate.getDate();
    const mStr = m < 10 ? `0${m}` : m;
    const dStr = d < 10 ? `0${d}` : d;
    setSelectedDayStr(`${y}-${mStr}-${dStr}`);
  };

  const handleNextDay = () => {
    const nextDate = new Date(currentDate);
    nextDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(nextDate);
    
    const y = nextDate.getFullYear();
    const m = nextDate.getMonth() + 1;
    const d = nextDate.getDate();
    const mStr = m < 10 ? `0${m}` : m;
    const dStr = d < 10 ? `0${d}` : d;
    setSelectedDayStr(`${y}-${mStr}-${dStr}`);
  };

  const dailyEvents = filteredEvents.filter(ev => ev.eventDate === selectedDayStr);

  return (
    <Box className="space-y-6">
      {/* Page Title & View Mode Selector */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#D4AF37]/15 pb-4">
        <Box>
          <Typography variant="h5" className="text-gold-gradient font-bold tracking-wider font-serif mb-0.5 uppercase">
            Freelance Studio Planner
          </Typography>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[11px] block">
            DEDICATED SCHEDULE TIMELINE ONLY FOR EXTERNAL FREELANCE CONTRACTS
          </Typography>
        </Box>

        {/* View Selection Button Group */}
        <Box className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          <div className="flex bg-black/40 border border-[#D4AF37]/15 rounded-lg p-0.5">
            <Button
              size="small"
              onClick={() => setViewMode('monthly')}
              className={`text-[11px] font-bold normal-case px-3 py-1 rounded ${
                viewMode === 'monthly' ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </Button>
            <Button
              size="small"
              onClick={() => setViewMode('weekly')}
              className={`text-[11px] font-bold normal-case px-3 py-1 rounded ${
                viewMode === 'weekly' ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90' : 'text-gray-400 hover:text-white'
              }`}
            >
              Weekly
            </Button>
            <Button
              size="small"
              onClick={() => setViewMode('daily')}
              className={`text-[11px] font-bold normal-case px-3 py-1 rounded ${
                viewMode === 'daily' ? 'bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90' : 'text-gray-400 hover:text-white'
              }`}
            >
              Daily
            </Button>
          </div>

          <Button
            variant="outlined"
            size="small"
            onClick={handleGoToToday}
            className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 normal-case text-[11px] font-bold h-8 px-3"
          >
            Today Focus
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenForm}
            className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-bold h-8 text-[11px] px-3.5"
          >
            Add Freelance Job
          </Button>
        </Box>
      </div>

      {/* Interactive Filters Bar */}
      <Box className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-black/20 border border-white/5 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono font-bold">FILTERS:</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['all', 'upcoming', 'completed', 'paid', 'pending'].map((filter) => {
            const isActive = filterType === filter;
            return (
              <button
                key={filter}
                onClick={() => setFilterType(filter as any)}
                className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold uppercase transition-all duration-200 outline-none ${
                  isActive
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.1)]'
                    : 'bg-black/10 border-white/5 text-gray-400 hover:text-white hover:border-[#D4AF37]/40'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </Box>

      {/* VIEW MODES */}

      {/* 1. Monthly Calendar View */}
      {viewMode === 'monthly' && (
        <Card className="border border-[#D4AF37]/15 bg-[#0D0D0C]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <Typography variant="h6" className="text-gold-gradient font-serif font-bold tracking-widest text-lg sm:text-xl uppercase">
                {monthNames[month]} {year}
              </Typography>
              <div className="flex items-center gap-1 border border-gold-glow/15 rounded bg-black/40">
                <IconButton onClick={handlePrevMonth} size="small" className="text-gray-400 hover:text-white">
                  <ChevronLeft className="w-5 h-5" />
                </IconButton>
                <Divider orientation="vertical" flexItem className="border-gold-glow/10" />
                <IconButton onClick={handleNextMonth} size="small" className="text-gray-400 hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </IconButton>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 text-center mb-3 border-b border-white/5 pb-2.5 text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest font-mono">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-2 min-h-[380px] sm:min-h-[440px]">
              {cells.map((cell) => {
                if (cell.type === 'padding') {
                  return <div key={cell.key} className="bg-white/[0.01] rounded border border-transparent min-h-[75px] sm:min-h-[90px]" />;
                }

                const { dayNum, dateStr, events } = cell as { dayNum: number, dateStr: string, events: PlannerEvent[] };
                const isToday = dateStr === '2026-07-11';

                return (
                  <div
                    key={cell.key}
                    onClick={() => {
                      if (events.length > 0) {
                        setSelectedDayStr(dateStr);
                        setViewMode('daily');
                      }
                    }}
                    className={`border rounded min-h-[75px] sm:min-h-[90px] p-1.5 flex flex-col justify-between transition-all duration-200 bg-black/30 ${
                      events.length > 0 ? 'cursor-pointer border-[#D4AF37]/30 hover:border-[#D4AF37]/60 hover:bg-[#D4AF37]/5' : 'border-white/5'
                    } ${isToday ? 'border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10 bg-[#D4AF37]/5' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] sm:text-xs font-mono font-bold ${
                        isToday ? 'text-[#D4AF37] px-1.5 py-0.5 bg-[#D4AF37]/20 rounded' : 'text-gray-400'
                      }`}>
                        {dayNum}
                      </span>
                      {events.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-1 mt-1.5">
                      {events.slice(0, 2).map((ev) => (
                        <Tooltip key={ev.eventId} title={`${ev.eventType} - ${ev.studioName}`}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(ev);
                            }}
                            className={`text-[9px] px-1 py-0.5 rounded truncate leading-tight border font-semibold font-sans uppercase hover:opacity-85 ${
                              ev.paymentStatus === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/25' :
                              ev.paymentStatus === 'Partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/25' :
                              'bg-red-500/10 text-red-400 border-red-500/25'
                            }`}
                          >
                            {ev.eventType}
                          </div>
                        </Tooltip>
                      ))}
                      {events.length > 2 && (
                        <div className="text-[8px] text-[#D4AF37] font-bold font-mono text-center">
                          +{events.length - 2} MORE
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 2. Weekly Planner View */}
      {viewMode === 'weekly' && (
        <Box className="space-y-4">
          <div className="flex justify-between items-center bg-[#0D0D0C] border border-white/5 p-4 rounded-xl">
            <Typography variant="subtitle1" className="text-white font-serif font-bold text-sm tracking-wide">
              Weekly Overview: <span className="text-[#D4AF37] font-mono font-semibold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            </Typography>
            <div className="flex items-center gap-1 border border-white/10 rounded bg-black/40">
              <IconButton onClick={handlePrevWeek} size="small" className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </IconButton>
              <Divider orientation="vertical" flexItem className="border-white/5" />
              <IconButton onClick={handleNextWeek} size="small" className="text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {getWeeklyDays().map((day, idx) => {
              const isTodayStr = day.dateStr === '2026-07-11';
              const dayName = day.date.toLocaleDateString('en-US', { weekday: 'short' });
              const monthDay = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

              return (
                <Card 
                  key={idx} 
                  className={`border transition-all duration-200 ${
                    isTodayStr ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-md shadow-[#D4AF37]/5' : 'border-white/5 bg-[#0D0D0C]/80'
                  }`}
                >
                  <CardContent className="p-3 flex flex-col h-full min-h-[160px]">
                    <div className="border-b border-white/5 pb-2 mb-2 flex justify-between items-center">
                      <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#D4AF37]">{dayName}</span>
                      <span className={`text-[11px] font-bold font-mono ${isTodayStr ? 'text-white' : 'text-gray-400'}`}>{monthDay}</span>
                    </div>

                    <div className="space-y-2 flex-grow overflow-y-auto max-h-[180px]">
                      {day.events.length === 0 ? (
                        <div className="text-[10px] text-gray-600 font-medium italic mt-2 text-center">Empty</div>
                      ) : (
                        day.events.map((ev) => (
                          <div
                            key={ev.eventId}
                            onClick={() => handleEventClick(ev)}
                            className={`p-2 rounded-lg border text-left cursor-pointer transition-colors hover:bg-white/[0.02] ${
                              ev.paymentStatus === 'Paid' ? 'border-green-500/20 bg-green-500/5' :
                              ev.paymentStatus === 'Partial' ? 'border-amber-500/20 bg-amber-500/5' :
                              'border-red-500/20 bg-red-500/5'
                            }`}
                          >
                            <Typography className="text-[10px] font-bold text-white truncate">{ev.eventType}</Typography>
                            <Typography className="text-[9px] text-gray-400 font-semibold truncate mt-0.5">{ev.studioName}</Typography>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </Box>
      )}

      {/* 3. Daily Planner View */}
      {viewMode === 'daily' && (
        <Box className="space-y-4">
          <div className="flex justify-between items-center bg-[#0D0D0C] border border-[#D4AF37]/15 p-4 rounded-xl shadow-lg">
            <Typography variant="subtitle1" className="text-white font-serif font-bold text-sm tracking-wider uppercase flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#D4AF37]" />
              Date Agenda: <span className="text-[#D4AF37] font-mono font-bold">{selectedDayStr}</span>
            </Typography>
            <div className="flex items-center gap-1 border border-white/10 rounded bg-black/40">
              <IconButton onClick={handlePrevDay} size="small" className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </IconButton>
              <Divider orientation="vertical" flexItem className="border-white/5" />
              <IconButton onClick={handleNextDay} size="small" className="text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          <Card className="border border-white/5 bg-[#0D0D0C] p-4 sm:p-6">
            <CardContent className="p-0 space-y-4">
              {dailyEvents.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-medium italic text-xs">
                  No freelance contracts or events registered for this date.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dailyEvents.map((ev) => (
                    <Box
                      key={ev.eventId}
                      onClick={() => handleEventClick(ev)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:border-[#D4AF37] bg-black/40 hover:shadow-lg flex flex-col justify-between ${
                        ev.paymentStatus === 'Paid' ? 'border-green-500/15' :
                        ev.paymentStatus === 'Partial' ? 'border-amber-500/15' :
                        'border-red-500/15'
                      }`}
                    >
                      <Box className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <Box>
                            <span className="text-[9px] font-bold font-mono tracking-widest text-[#D4AF37] uppercase bg-[#D4AF37]/10 px-2 py-0.5 rounded border border-[#D4AF37]/20">
                              Freelance Event
                            </span>
                            <Typography variant="subtitle1" className="text-white font-serif font-bold text-sm mt-1.5">
                              {ev.eventType}
                            </Typography>
                          </Box>

                          <Chip
                            size="small"
                            label={ev.paymentStatus.toUpperCase()}
                            className={`text-[8px] font-bold ${
                              ev.paymentStatus === 'Paid' ? 'bg-green-500/15 text-green-400 border border-green-500/30' :
                              ev.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                              'bg-red-500/15 text-red-400 border border-red-500/30'
                            }`}
                          />
                        </div>

                        <Divider className="border-white/5" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                          <div className="flex items-center gap-2 text-gray-300">
                            <Briefcase className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="font-semibold">{ev.studioName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300">
                            <User className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span>Contact: <span className="font-medium text-white">{ev.contactPerson}</span></span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-300 sm:col-span-2">
                            <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        </div>
                      </Box>

                      <Box className="flex justify-between items-center border-t border-white/5 pt-3 mt-3">
                        <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Due Amount</span>
                        <span className="text-xs font-mono font-bold text-white">₹ {ev.dueAmount.toLocaleString('en-IN')}</span>
                      </Box>
                    </Box>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* --- ADD FREELANCE JOB FORM DIALOG --- */}
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
              📸 Register Freelance Job
            </Typography>
            <IconButton onClick={handleCloseForm} className="text-gray-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </IconButton>
          </DialogTitle>

          <DialogContent className="p-6 bg-[#0D0D0C]">
            <Grid container spacing={3}>
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
              <Grid size={{ xs: 12, sm: 12 }}>
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

              {/* Dynamic Multiple Events Builder */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mt-2 mb-3">
                  Events & Schedule
                </Typography>
              </Grid>

              {formData.events.map((ev, index) => (
                <Grid size={12} key={index} className="p-4 bg-black/30 border border-[#D4AF37]/15 rounded-xl mb-2">
                  <Box className="flex justify-between items-center mb-3">
                    <Typography variant="subtitle2" className="text-[#D4AF37] font-serif font-bold text-xs tracking-wider uppercase">
                      Event #{index + 1}
                    </Typography>
                    {formData.events.length > 1 && (
                      <Button
                        size="small"
                        onClick={() => handleRemoveEventField(index)}
                        className="text-red-400 hover:text-red-300 normal-case min-w-0 p-0 text-xs font-semibold"
                      >
                        Remove Event
                      </Button>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl fullWidth size="small" required>
                        <InputLabel id={`event-type-p-label-${index}`} className="text-gray-400">Event Type</InputLabel>
                        <Select
                          labelId={`event-type-p-label-${index}`}
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
                  onClick={handleAddEventField}
                  className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 normal-case rounded-lg text-xs font-bold"
                >
                  + Add Another Event
                </Button>
              </Grid>

              {/* Financial Section */}
              <Grid size={12}>
                <Typography className="text-xs font-serif font-bold text-[#D4AF37] tracking-wider uppercase mt-4 mb-3">
                  Financial Terms
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  required
                  type="number"
                  name="totalAmount"
                  label="Total Contract Value (₹)"
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
                  label="Advance/Paid Amount (₹)"
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
                <TextField
                  fullWidth
                  disabled
                  label="Outstanding Balance (₹)"
                  size="small"
                  value={formData.dueAmount}
                  slotProps={{
                    inputLabel: { shrink: true, className: 'text-[#D4AF37]' },
                    input: { className: 'bg-black/20 text-gray-400 rounded-lg font-mono font-bold border-[#D4AF37]/20' }
                  }}
                />
              </Grid>

              <Grid size={12}>
                <Box className="bg-black/40 border border-white/5 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-medium">Automatic Status Resolution:</span>
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

              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  name="notes"
                  label="Production Directives / Job Notes"
                  size="small"
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

          <DialogActions className="p-4 border-t border-white/5 bg-black/40">
            <Button onClick={handleCloseForm} color="inherit" className="text-xs font-bold uppercase tracking-wider" size="small">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-black font-bold text-xs uppercase tracking-wider px-5"
              size="small"
            >
              Add Job
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* --- DRILL DOWN EVENT DETAIL DIALOG --- */}
      <Dialog 
        open={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
        fullWidth 
        maxWidth="sm"
        slotProps={{
          paper: {
            className: 'border border-[#D4AF37]/35 bg-[#141413] text-white rounded-xl'
          }
        }}
      >
        {selectedEvent && (
          <>
            <DialogTitle className="border-b border-white/5 p-5 flex justify-between items-start bg-black/40">
              <Box>
                <Typography variant="h6" className="text-gold-gradient font-bold font-serif leading-tight">
                  {selectedEvent.studioName}
                </Typography>
                <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">
                  Contact Person: {selectedEvent.contactPerson}
                </Typography>
              </Box>
              <Chip
                label={selectedEvent.paymentStatus.toUpperCase()}
                className={`text-[9px] font-mono font-bold px-2 border ${
                  selectedEvent.paymentStatus === 'Paid' ? 'bg-green-500/15 text-green-400 border-green-500/35' :
                  selectedEvent.paymentStatus === 'Partial' ? 'bg-amber-500/15 text-amber-400 border-amber-500/35' :
                  'bg-red-500/15 text-red-400 border-red-500/35'
                }`}
              />
            </DialogTitle>

            <DialogContent className="pt-5 space-y-4 bg-[#0D0D0C]">
              {/* Financial Box */}
              <Box className="grid grid-cols-2 gap-3 bg-black/25 p-4 rounded border border-[#D4AF37]/10">
                <Box>
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block text-[10px]">Total Amount</Typography>
                  <Typography variant="subtitle1" className="text-[#D4AF37] font-mono font-bold">₹ {selectedEvent.totalAmount.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block text-[10px]">Outstanding Balance</Typography>
                  <Typography variant="subtitle1" className="text-red-400 font-mono font-bold">₹ {selectedEvent.dueAmount.toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>

              {/* Event Attributes */}
              <List className="p-0 space-y-1">
                <ListItem className="px-0 py-2 border-b border-white/5">
                  <ListItemIcon className="min-w-8"><CalendarIcon className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText
                    primary={<span className="text-gray-500 text-[10px] uppercase block font-semibold tracking-wider">Scheduled Date</span>}
                    secondary={<span className="text-white font-mono font-bold text-sm block mt-0.5">{selectedEvent.eventDate}</span>}
                  />
                </ListItem>
                <ListItem className="px-0 py-2 border-b border-white/5">
                  <ListItemIcon className="min-w-8"><Briefcase className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText
                    primary={<span className="text-gray-500 text-[10px] uppercase block font-semibold tracking-wider">Event Type</span>}
                    secondary={<span className="text-white font-serif font-bold text-sm block mt-0.5">{selectedEvent.eventType}</span>}
                  />
                </ListItem>
                <ListItem className="px-0 py-2 border-b border-white/5">
                  <ListItemIcon className="min-w-8"><MapPin className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText
                    primary={<span className="text-gray-500 text-[10px] uppercase block font-semibold tracking-wider">Event Location</span>}
                    secondary={<span className="text-white text-sm block mt-0.5">{selectedEvent.location}</span>}
                  />
                </ListItem>
                <ListItem className="px-0 py-2 border-b border-white/5">
                  <ListItemIcon className="min-w-8"><Phone className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText
                    primary={<span className="text-gray-500 text-[10px] uppercase block font-semibold tracking-wider">Contact Phone</span>}
                    secondary={<span className="text-white text-sm block mt-0.5">{selectedEvent.contactPhone}</span>}
                  />
                </ListItem>
              </List>

              {selectedEvent.notes && (
                <Box className="space-y-1 pt-2">
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block text-[10px]">Production Notes</Typography>
                  <Box className="p-3 bg-black/30 rounded border border-white/5 text-xs text-gray-300 leading-relaxed whitespace-pre-line max-h-36 overflow-y-auto">
                    {selectedEvent.notes}
                  </Box>
                </Box>
              )}
            </DialogContent>

            <DialogActions className="border-t border-white/5 p-3 bg-black/40">
              <Button onClick={() => setIsDetailsOpen(false)} color="inherit" size="small" className="text-xs font-bold">
                Dismiss
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Global Alert Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          className="border border-[#D4AF37]/30 bg-[#121211] text-white rounded-lg"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
