import React, { useState, useEffect } from 'react';
import { Booking } from '../types';
import { offlineService } from '../services/offlineService';
import { useSyncState } from '../hooks/useSyncState';
import { getStatusChipColor, getStatusLabel, getStatusDotColor } from '../utils/statusUtils';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Divider
} from '@mui/material';
import { useBrand } from '../contexts/BrandContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Clock,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';

interface CalendarViewProps {
  onOpenBookingForm: (type: 'production' | 'freelancer') => void;
  onOpenDetails: (booking: Booking) => void;
  refreshTrigger: number;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onOpenBookingForm,
  onOpenDetails,
  refreshTrigger
}) => {
  const { settings } = useBrand();
  const syncState = useSyncState();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date('2026-07-11')); // Start focused near the current simulated date
  
  // Dialog State
  const [dayEventsOpen, setDayEventsOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDayEvents, setSelectedDayEvents] = useState<Booking[]>([]);

  useEffect(() => {
    const loadBookings = async () => {
      const bData = await offlineService.getBookings();
      // filter out cancelled bookings
      setBookings(bData.filter(b => b.status !== 'cancelled'));
    };
    loadBookings();
  }, [refreshTrigger, syncState.syncVersion]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date('2026-07-11'));
  };

  const handleDayClick = (dateStr: string, events: Booking[]) => {
    if (events.length === 0) return;
    setSelectedDay(dateStr);
    setSelectedDayEvents(events);
    setDayEventsOpen(true);
  };

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  // Padds before first day of month
  for (let i = 0; i < firstDayOfMonth; i++) {
    cells.push({ type: 'padding', key: `pad-${i}` });
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = d < 10 ? `0${d}` : d;
    const mStr = (month + 1) < 10 ? `0${month + 1}` : (month + 1);
    const dateStr = `${year}-${mStr}-${dStr}`;
    
    // Find matching bookings
    const dateEvents = bookings.filter(b => {
      if (b.weddingDate === dateStr) return true;
      if (b.receptionDate === dateStr) return true;
      if (b.events) {
        return Object.values(b.events).some(ev => ev && ev.enabled && ev.date === dateStr);
      }
      return false;
    });
    
    cells.push({ 
      type: 'day', 
      key: `day-${d}`, 
      dayNum: d, 
      dateStr, 
      events: dateEvents 
    });
  }

  return (
    <Box className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Box>
          <Typography variant="h5" className="text-gold-gradient font-bold tracking-wider font-serif mb-0.5">
            {settings.studioName.toUpperCase()} PLANNER
          </Typography>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[11px] block">
            Studio booking timeline and monthly master plan
          </Typography>
        </Box>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outlined"
            size="small"
            onClick={handleGoToToday}
            className="border-[#D4AF37]/40 text-xs text-white px-4"
          >
            Reset view
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => onOpenBookingForm('production')}
            className="text-xs"
          >
            Add booking
          </Button>
        </div>
      </div>

      {/* Calendar Controller Card */}
      <Card className="border border-[#D4AF37]/15">
        <CardContent className="p-4 sm:p-5">
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-6">
            <Typography variant="h6" className="text-gold-gradient font-serif font-bold tracking-widest text-lg sm:text-xl">
              {monthNames[month]} {year}
            </Typography>
            <div className="flex items-center gap-1 border border-gold-glow/15 rounded bg-black/10">
              <IconButton onClick={handlePrevMonth} size="small" className="text-gray-400 hover:text-white">
                <ChevronLeft className="w-5 h-5" />
              </IconButton>
              <Divider orientation="vertical" flexItem className="border-gold-glow/10" />
              <IconButton onClick={handleNextMonth} size="small" className="text-gray-400 hover:text-white">
                <ChevronRight className="w-5 h-5" />
              </IconButton>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-2 border-b border-[#D4AF37]/10 pb-2 text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[360px] sm:min-h-[420px]">
            {cells.map((cell) => {
              if (cell.type === 'padding') {
                return (
                  <div key={cell.key} className="bg-black/5 rounded opacity-10 min-h-[70px] sm:min-h-[84px]" />
                );
              }

              const { dayNum, dateStr, events } = cell as { dayNum: number, dateStr: string, events: Booking[] };
              const isToday = dateStr === '2026-07-11'; // highlight simulated today's date

              return (
                <div 
                  key={cell.key}
                  onClick={() => handleDayClick(dateStr, events)}
                  className={`border border-gold-glow/5 rounded min-h-[70px] sm:min-h-[84px] p-1.5 flex flex-col justify-between transition-all duration-200 bg-black/15 ${
                    events.length > 0 ? 'cursor-pointer hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5' : ''
                  } ${isToday ? 'border-2 border-[#D4AF37]/60 shadow-lg shadow-[#D4AF37]/10' : ''}`}
                >
                  {/* Day Number */}
                  <div className="flex justify-between items-center">
                    <span className={`text-[11px] sm:text-xs font-mono font-bold ${
                      isToday ? 'text-[#D4AF37] px-1 bg-[#D4AF37]/15 rounded' : 'text-gray-400'
                    }`}>
                      {dayNum}
                    </span>
                    {events.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse hidden sm:inline-block" />
                    )}
                  </div>

                  {/* Booking Badges/Dots inside Calendar Day */}
                  <div className="space-y-1 mt-1">
                    {/* Small dot/bar list for events */}
                    {events.slice(0, 2).map((e) => (
                      <div 
                        key={e.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate leading-tight border font-sans font-semibold hidden sm:block ${getStatusChipColor(e.status)}`}
                      >
                        {e.clientName.split('&')[0].trim()}
                      </div>
                    ))}
                    {/* Compact layout indicators on mobile */}
                    {events.length > 0 && (
                      <div className="flex gap-1 justify-center sm:hidden">
                        {events.map((e) => (
                          <span 
                            key={e.id}
                            className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(e.status)}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Map Legend */}
      <Box className="flex gap-4 items-center justify-center p-3 border border-gold-glow/5 bg-black/10 rounded-lg">
        <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">
          Legend:
        </Typography>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#D4AF37]/15 border border-[#D4AF37]/50" />
          <Typography variant="caption" className="text-[#D4AF37] text-[10px] font-bold uppercase">Production Book</Typography>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-500/10 border border-slate-500/50" />
          <Typography variant="caption" className="text-slate-300 text-[10px] font-bold uppercase">Freelancer Contract</Typography>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#D4AF37]" />
          <Typography variant="caption" className="text-gray-400 text-[10px] font-bold uppercase">Current simulated Date</Typography>
        </div>
      </Box>

      {/* --- DAY EVENTS POPUP --- */}
      <Dialog open={dayEventsOpen} onClose={() => setDayEventsOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle component="div" className="border-b border-[#D4AF37]/20 pb-2.5">
          <Typography variant="h6" className="text-gold-gradient font-serif font-bold">
            {settings.studioName} on {selectedDay.split('-').length === 3 ? `${selectedDay.split('-')[2]}/${selectedDay.split('-')[1]}/${selectedDay.split('-')[0]}` : selectedDay}
          </Typography>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px]">
            {selectedDayEvents.length} shooting schedule(s)
          </Typography>
        </DialogTitle>
        <DialogContent className="p-0">
          <List className="divide-y divide-gold-glow/5 p-0">
            {selectedDayEvents.map((e) => (
              <ListItem 
                key={e.id}
                className="flex flex-col items-start p-4 hover:bg-[#D4AF37]/5 transition-colors gap-2 cursor-pointer"
                onClick={() => {
                  setDayEventsOpen(false);
                  onOpenDetails(e);
                }}
              >
                <div className="flex justify-between items-start w-full">
                  <div>
                    <Typography variant="subtitle2" className="text-white font-serif font-bold">
                      {e.clientName}
                    </Typography>
                    <Typography variant="caption" className="text-gold-gradient font-sans font-semibold text-[10px] uppercase block tracking-wider mt-0.5">
                      {e.packageName}
                    </Typography>
                  </div>
                  <div className="flex gap-1.5 items-center">
                    <Chip
                      label={e.type}
                      size="small"
                      className={`text-[8px] h-4.5 font-bold uppercase ${
                        e.type === 'production' 
                          ? 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30' 
                          : 'bg-slate-500/10 text-slate-300 border border-slate-500/30'
                      }`}
                    />
                    <Chip
                      label={getStatusLabel(e.status)}
                      size="small"
                      className={`text-[8px] h-4.5 font-bold uppercase border ${getStatusChipColor(e.status)}`}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-xs text-gray-400 w-full">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span className="truncate">{e.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                    <span>Staff: {e.photographer}</span>
                  </div>
                </div>
                <Typography variant="caption" className="text-[#D4AF37] font-semibold text-[10px] flex items-center gap-1 mt-1 self-end hover:underline">
                  View Full Contract Details
                  <ExternalLink className="w-3 h-3" />
                </Typography>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions className="p-3 border-t border-[#D4AF37]/15">
          <Button onClick={() => setDayEventsOpen(false)} color="inherit" size="small">
            Dismiss
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
