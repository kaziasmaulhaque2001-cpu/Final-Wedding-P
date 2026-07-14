import React, { useState, useEffect } from 'react';
import { Booking, Payment } from '../types';
import { offlineService } from '../services/offlineService';
import { useSyncState } from '../hooks/useSyncState';
import { useBrand } from '../contexts/BrandContext';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip
} from '@mui/material';
import {
  Search,
  Camera,
  DollarSign,
  Calendar,
  MapPin,
  User,
  CreditCard,
  Briefcase,
  ChevronRight,
  FileText
} from 'lucide-react';

interface SearchModuleProps {
  onOpenDetails: (booking: Booking) => void;
  refreshTrigger: number;
  initialQuery?: string;
  onQueryChange?: (query: string) => void;
}

export const SearchModule: React.FC<SearchModuleProps> = ({
  onOpenDetails,
  refreshTrigger,
  initialQuery,
  onQueryChange
}) => {
  const syncState = useSyncState();
  const { formatCurrency } = useBrand();
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  const searchQuery = initialQuery !== undefined ? initialQuery : localSearchQuery;
  const setSearchQuery = (query: string) => {
    if (onQueryChange) {
      onQueryChange(query);
    } else {
      setLocalSearchQuery(query);
    }
  };
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const bData = await offlineService.getBookings();
      const pData = await offlineService.getPayments();
      setBookings(bData);
      setPayments(pData);
    };
    loadData();
  }, [refreshTrigger, syncState.syncVersion]);

  // Search Results
  const getSearchResults = () => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: 'booking_production' | 'booking_freelancer' | 'payment';
      date: string;
      amount?: number;
      meta?: string;
      originalItem: any;
    }> = [];

    // Search bookings
    bookings.forEach(b => {
      if (
        b.clientName.toLowerCase().includes(query) ||
        b.venue.toLowerCase().includes(query) ||
        b.packageName.toLowerCase().includes(query) ||
        b.photographer.toLowerCase().includes(query) ||
        (b.notes && b.notes.toLowerCase().includes(query)) ||
        b.weddingDate.includes(query)
      ) {
        results.push({
          id: b.id,
          title: b.clientName,
          subtitle: `${b.packageName} at ${b.venue}`,
          type: b.type === 'production' ? 'booking_production' : 'booking_freelancer',
          date: b.weddingDate,
          amount: b.totalAmount,
          meta: `Photographer: ${b.photographer}`,
          originalItem: b
        });
      }
    });

    // Search payments
    payments.forEach(p => {
      if (
        p.clientName.toLowerCase().includes(query) ||
        p.paymentMethod.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query)) ||
        p.date.includes(query)
      ) {
        results.push({
          id: p.id,
          title: `Payment: ${p.clientName}`,
          subtitle: `${p.paymentMethod} settlement - ${p.notes || 'No remarks'}`,
          type: 'payment',
          date: p.date,
          amount: p.amount,
          meta: `Transaction ID: ${p.id}`,
          originalItem: p
        });
      }
    });

    // Sort by date descending
    return results.sort((a, b) => b.date.localeCompare(a.date));
  };

  const results = getSearchResults();

  const getResultBadge = (type: string) => {
    switch (type) {
      case 'booking_production':
        return <Chip label="Studio Production" size="small" className="text-[9px] h-4.5 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 uppercase font-semibold" />;
      case 'booking_freelancer':
        return <Chip label="Freelance Contract" size="small" className="text-[9px] h-4.5 bg-slate-500/15 text-slate-300 border border-slate-500/30 uppercase font-semibold" />;
      case 'payment':
        return <Chip label="Ledger Settlement" size="small" className="text-[9px] h-4.5 bg-green-500/10 text-green-400 border border-green-500/20 uppercase font-semibold" />;
      default:
        return null;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'booking_production':
        return <Camera className="w-5 h-5 text-[#D4AF37]" />;
      case 'booking_freelancer':
        return <Briefcase className="w-5 h-5 text-[#AA7C11]" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const handleResultClick = (item: any) => {
    if (item.type === 'payment') {
      // Find associated booking and open its details
      const matchedBooking = bookings.find(b => b.id === item.originalItem.bookingId);
      if (matchedBooking) {
        onOpenDetails(matchedBooking);
      }
    } else {
      onOpenDetails(item.originalItem);
    }
  };

  return (
    <Box className="space-y-6">
      {/* Title */}
      <Box>
        <Typography variant="h5" className="text-gold-gradient font-bold tracking-wider font-serif mb-0.5">
          GLOBAL ARCHIVE SEARCH
        </Typography>
        <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[11px] block">
          Omnibar inquiry of clients, venues, dates, and contracts
        </Typography>
      </Box>

      {/* Main Search Bar */}
      <Card className="border border-[#D4AF37]/20 p-2 shadow-2xl bg-gradient-to-r from-black via-[#141413] to-black">
        <TextField
          fullWidth
          autoFocus
          placeholder="Type Client Name, Venue, Package, or photographer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="w-5 h-5 text-[#D4AF37]" />
                </InputAdornment>
              ),
              className: "text-lg py-1 border-0"
            }
          }}
          variant="standard"
          className="border-0 px-2"
        />
      </Card>

      {/* Results panel */}
      <Box>
        {!searchQuery.trim() ? (
          <Box className="py-20 text-center border border-dashed border-[#D4AF37]/15 rounded-xl bg-black/10">
            <Search className="w-12 h-12 text-[#AA7C11]/50 mx-auto mb-3" />
            <Typography variant="subtitle1" className="text-gray-400 font-serif font-semibold">
              Ready to Query Registers
            </Typography>
            <Typography variant="caption" className="text-gray-500 block max-w-xs mx-auto mt-1">
              Begin writing client names, venues, dates, or packages above to filter matching results.
            </Typography>
          </Box>
        ) : results.length === 0 ? (
          <Box className="py-16 text-center border border-dashed border-red-500/20 rounded-xl bg-black/10">
            <Typography variant="subtitle1" className="text-red-400 font-serif font-semibold mb-1">
              No Matching Entries Located
            </Typography>
            <Typography variant="caption" className="text-gray-500 block">
              We couldn't locate any bookings or payments matching "{searchQuery}".
            </Typography>
          </Box>
        ) : (
          <Box className="space-y-3">
            <Typography variant="caption" className="text-gray-500 uppercase tracking-wider text-[10px] block font-bold mb-1">
              Ledger Discoveries ({results.length} matches)
            </Typography>
            
            <List className="p-0 space-y-2.5">
              {results.map((item) => (
                <ListItem
                  key={item.id}
                  onClick={() => handleResultClick(item)}
                  className="p-4 rounded-lg border border-[#D4AF37]/15 hover:border-[#D4AF37]/45 hover:bg-[#D4AF37]/5 bg-[#141413]/50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <Box className="flex items-start gap-3.5">
                    <Box className="w-10 h-10 rounded-full border border-gold-glow/20 bg-black/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getResultIcon(item.type)}
                    </Box>
                    <Box>
                      <Box className="flex items-center gap-2 flex-wrap mb-1">
                        <Typography variant="subtitle2" className="text-white font-serif font-bold text-sm sm:text-base leading-none">
                          {item.title}
                        </Typography>
                        {getResultBadge(item.type)}
                      </Box>
                      <Typography variant="body2" className="text-gray-400 text-xs sm:text-sm">
                        {item.subtitle}
                      </Typography>
                      
                      <Box className="flex items-center gap-4 mt-2 text-[11px] text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#AA7C11]" />
                          {item.date}
                        </span>
                        {item.meta && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-[#AA7C11]" />
                            {item.meta}
                          </span>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Box className="sm:text-right flex sm:flex-col justify-between sm:justify-center items-center sm:items-end w-full sm:w-auto border-t sm:border-0 pt-2 sm:pt-0 border-gold-glow/5">
                    {item.amount && (
                      <Typography variant="subtitle1" className="font-mono font-bold text-[#D4AF37] text-sm sm:text-base">
                        {formatCurrency(item.amount)}
                      </Typography>
                    )}
                    <Typography variant="caption" className="text-[#D4AF37]/80 text-[10px] uppercase font-semibold flex items-center gap-0.5 hover:underline mt-1">
                      Details
                      <ChevronRight className="w-3 h-3" />
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Box>
    </Box>
  );
};
