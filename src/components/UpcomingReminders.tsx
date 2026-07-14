import React from 'react';
import { Booking } from '../types';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Avatar, 
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Bell, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  Check, 
  AlertTriangle,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { sendTelegramNotification } from '../services/telegramService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

interface UpcomingRemindersProps {
  bookings: Booking[];
  formatCurrency: (amount: number) => string;
}

export const UpcomingReminders: React.FC<UpcomingRemindersProps> = ({ 
  bookings, 
  formatCurrency 
}) => {
  const now = new Date();

  // Filter bookings within the next 48 hours (including currently today)
  const next48HoursBookings = bookings.filter(b => {
    if (b.status === 'cancelled' || b.status === 'completed') return false;

    // Parse wedding date (YYYY-MM-DD)
    const [year, month, day] = b.weddingDate.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return false;

    const bookingMidnight = new Date(year, month - 1, day);
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate difference in calendar days
    const diffDays = Math.round((bookingMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    // We count: Today (0), Tomorrow (1), and Day After Tomorrow (2) as "next 48 hours" range
    return diffDays >= 0 && diffDays <= 2;
  }).sort((a, b) => a.weddingDate.localeCompare(b.weddingDate));

  // Auto-send Telegram notifications for Tomorrow, Today, and Payment Due reminders using Firestore persistence
  React.useEffect(() => {
    if (next48HoursBookings.length === 0) return;

    const processReminders = async () => {
      for (const b of next48HoursBookings) {
        try {
          const [year, month, day] = b.weddingDate.split('-').map(Number);
          if (isNaN(year) || isNaN(month) || isNaN(day)) continue;

          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const bookingMidnight = new Date(year, month - 1, day);
          const diffDays = Math.round((bookingMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

          // Event Today Reminder
          if (diffDays === 0) {
            const docId = `reminder_${b.id}_Wedding_0days`;
            const docRef = doc(db, 'telegram_reminders', docId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              await sendTelegramNotification('Event Today Reminder', b);
              await setDoc(docRef, {
                sentAt: Date.now(),
                bookingId: b.id,
                eventType: 'Wedding',
                diffDays: 0
              });
            }
          }

          // Event Tomorrow Reminder
          if (diffDays === 1) {
            const docId = `reminder_${b.id}_Wedding_1days`;
            const docRef = doc(db, 'telegram_reminders', docId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              await sendTelegramNotification('Event Tomorrow Reminder', b);
              await setDoc(docRef, {
                sentAt: Date.now(),
                bookingId: b.id,
                eventType: 'Wedding',
                diffDays: 1
              });
            }
          }

          // Payment Due Reminder (outstanding amount and within next 48 hours)
          const outstanding = b.totalAmount - b.paidAmount;
          if (outstanding > 0) {
            const docId = `payment_due_${b.id}_${diffDays}days`;
            const docRef = doc(db, 'telegram_reminders', docId);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              await sendTelegramNotification('Payment Due Reminder', b);
              await setDoc(docRef, {
                sentAt: Date.now(),
                bookingId: b.id,
                diffDays
              });
            }
          }
        } catch (err) {
          console.error("Error processing client-side telegram reminder:", err);
        }
      }
    };

    processReminders();
  }, [next48HoursBookings]);

  if (next48HoursBookings.length === 0) {
    return (
      <Card className="border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 via-[#0D0D0C] to-emerald-950/10 hover:border-emerald-500/30 transition-all">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left flex-col sm:flex-row">
            <Avatar className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-11 h-11">
              <Check className="w-5 h-5 animate-bounce" />
            </Avatar>
            <div>
              <Typography variant="subtitle2" className="text-emerald-400 font-bold tracking-wider font-serif uppercase text-xs">
                All Caught Up
              </Typography>
              <Typography variant="body2" className="text-gray-400 text-xs mt-0.5">
                No bookings scheduled for today or the next 48 hours. Excellent job on the schedule!
              </Typography>
            </div>
          </div>
          <Chip 
            icon={<Bell className="w-3 h-3 text-emerald-400" />}
            label="0 Reminders" 
            size="small" 
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-1"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-red-400 animate-swing" />
          <Typography variant="h6" className="text-gold-gradient font-bold tracking-wider font-serif text-base uppercase">
            Upcoming Reminders (Next 48 Hours)
          </Typography>
        </div>
        <Chip 
          label={`${next48HoursBookings.length} Urgent`} 
          color="error"
          size="small"
          className="text-[10px] uppercase font-extrabold px-1 animate-pulse"
        />
      </div>

      {/* Grid of urgent bookings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {next48HoursBookings.map((b) => {
          const [year, month, day] = b.weddingDate.split('-').map(Number);
          const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const bookingMidnight = new Date(year, month - 1, day);
          const diffDays = Math.round((bookingMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

          let statusText = '';
          let statusColorClass = '';

          if (diffDays === 0) {
            statusText = 'Happening Today!';
            statusColorClass = 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse font-extrabold';
          } else if (diffDays === 1) {
            statusText = 'Tomorrow!';
            statusColorClass = 'bg-amber-500/15 text-amber-400 border border-amber-500/30 font-bold';
          } else {
            statusText = 'In 48 Hours';
            statusColorClass = 'bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 font-semibold';
          }

          const outstanding = b.totalAmount - b.paidAmount;
          const cleanPhone = b.clientPhone.replace(/\D/g, '');

          return (
            <Card 
              key={b.id} 
              className="border-l-4 border-l-red-500 hover:border-l-red-400 border-t border-r border-b border-gray-800/60 bg-[#0A0A09] hover:border-gray-700/80 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-4 space-y-3.5">
                {/* Top Row: Client Name and Time status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Typography variant="subtitle1" className="text-white font-serif font-bold text-sm">
                        {b.clientName}
                      </Typography>
                      <Chip 
                        label={b.type === 'production' ? 'Production' : 'Freelancer'}
                        size="small"
                        className={`text-[8px] h-4.5 px-1 font-semibold ${
                          b.type === 'production' 
                            ? 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20' 
                            : 'bg-slate-500/10 text-slate-300 border border-slate-500/20'
                        }`}
                      />
                    </div>
                    <Typography variant="caption" className="text-gray-400 text-xs block font-mono">
                      Pkg: {b.packageName}
                    </Typography>
                  </div>
                  <Chip 
                    label={statusText} 
                    size="small"
                    className={`text-[9px] uppercase tracking-wider h-5 ${statusColorClass}`}
                  />
                </div>

                {/* Event Details */}
                <div className="space-y-1.5 text-xs text-gray-400">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{b.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                    <span>
                      {b.weddingDate.split('-').length === 3 
                        ? `${b.weddingDate.split('-')[2]}/${b.weddingDate.split('-')[1]}/${b.weddingDate.split('-')[0]}` 
                        : b.weddingDate} {b.eventTime ? `@ ${b.eventTime}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Photographer: <strong className="text-gray-300 font-semibold">{b.photographer}</strong></span>
                  </div>
                  {b.reportingTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span>Reporting Time: <strong className="text-gray-300 font-semibold">{b.reportingTime}</strong></span>
                    </div>
                  )}
                </div>

                {/* Financial Status Banner */}
                <div className="p-2.5 rounded bg-black/40 border border-gray-800/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-500">Total Booked:</span>
                  <span className="text-white font-bold">{formatCurrency(b.totalAmount)}</span>
                  <span className="text-gray-500">|</span>
                  {outstanding > 0 ? (
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-amber-400 font-bold">Due: {formatCurrency(outstanding)}</span>
                    </div>
                  ) : (
                    <span className="text-green-400 font-bold uppercase tracking-wider text-[10px]">Fully Settled</span>
                  )}
                </div>

                {/* Quick actions row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-800/40">
                  <span className="text-[10px] text-gray-500 font-mono">Quick Contact:</span>
                  <div className="flex items-center gap-1.5">
                    {/* Phone */}
                    <Tooltip title={`Call ${b.clientName}`}>
                      <IconButton 
                        size="small" 
                        href={`tel:${b.clientPhone}`}
                        className="p-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/20 rounded-md"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </IconButton>
                    </Tooltip>

                    {/* WhatsApp */}
                    <Tooltip title="WhatsApp Client">
                      <IconButton 
                        size="small" 
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        className="p-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-md"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </IconButton>
                    </Tooltip>

                    {/* Email */}
                    <Tooltip title="Email Client">
                      <IconButton 
                        size="small" 
                        href={`mailto:${b.clientEmail}`}
                        className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-md"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
