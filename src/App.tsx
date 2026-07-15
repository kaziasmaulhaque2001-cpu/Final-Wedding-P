import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrandProvider, useBrand } from './contexts/BrandContext';
import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BookingsManager } from './components/BookingsManager';
import { PaymentTracker } from './components/PaymentTracker';
import { CalendarView } from './components/CalendarView';
import { SearchModule } from './components/SearchModule';
import { BrandSettingsView } from './components/BrandSettingsView';
import { seedDatabaseIfEmpty } from './data/seedData';
import { Booking } from './types';
import { useSyncState } from './hooks/useSyncState';
import { offlineService } from './services/offlineService';
import { getStatusChipColor, getStatusLabel } from './utils/statusUtils';
import { ClientPortalView } from './components/ClientPortalView';
import { GeminiChat } from './components/GeminiChat';

import { 
  Box, 
  Container, 
  BottomNavigation, 
  BottomNavigationAction, 
  Paper,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Avatar,
  IconButton,
  Menu,
  Badge
} from '@mui/material';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Briefcase, 
  DollarSign, 
  Calendar as CalendarIcon, 
  Search,
  MapPin,
  User,
  Clock,
  Sparkles,
  Settings,
  Camera,
  Menu as MenuIcon,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Wifi,
  WifiOff,
  Cloud,
  Sliders,
  LogOut,
  Info,
  CheckCircle2,
  Lock,
  BadgeAlert
} from 'lucide-react';

const AppContent: React.FC = () => {
  const pathname = window.location.pathname;
  const isClientPortal = pathname.startsWith('/client/');
  const clientBookingId = isClientPortal ? pathname.split('/client/')[1] : null;

  if (isClientPortal && clientBookingId) {
    return <ClientPortalView bookingId={clientBookingId} />;
  }

  const { user, loading, logout } = useAuth();
  const { settings, formatCurrency } = useBrand();
  const syncState = useSyncState();
  const [tab, setTab] = useState('dashboard');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Premium Navigation & Layout states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [currentDateString, setCurrentDateString] = useState('');

  // Dropdown anchors
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [syncing, setSyncing] = useState(false);

  // Common Dialog Triggers across different components
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [bookingFormType, setBookingFormType] = useState<'production' | 'freelancer' | null>(null);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  
  // Detail popup trigger
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailedBooking, setDetailedBooking] = useState<Booking | null>(null);

  // Format date once on mount
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setCurrentDateString(new Date().toLocaleDateString('en-US', options));
  }, []);

  // Trigger cache refresh
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Run initial seed
  useEffect(() => {
    if (user) {
      seedDatabaseIfEmpty().then(() => {
        triggerRefresh();
      });
    }
  }, [user]);

  if (loading) {
    return (
      <Box className="min-h-screen bg-[#0D0D0C] flex flex-col items-center justify-center gap-3">
        <Box className="w-16 h-16 rounded-full border-2 border-[#D4AF37] flex items-center justify-center bg-black/40 border-gold-glow overflow-hidden mb-2">
          {settings.studioLogo ? (
            <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Camera className="w-8 h-8 text-[#D4AF37]" />
          )}
        </Box>
        <div className="text-gold-gradient font-serif font-bold tracking-widest text-lg uppercase animate-pulse">
          {settings.studioLogo ? settings.studioName : "Asmaul Production"}
        </div>
        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
          Establishing Secure Session
        </div>
      </Box>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Quick launch helper methods
  const handleOpenBookingForm = (type: 'production' | 'freelancer') => {
    setBookingFormType(type);
    setBookingFormOpen(true);
    setTab('bookings'); // Switch view so the form opens in the correct context
  };

  const handleCloseBookingForm = () => {
    setBookingFormOpen(false);
    setBookingFormType(null);
  };

  const handleOpenPaymentForm = () => {
    setPaymentFormOpen(true);
    setTab('payments');
  };

  const handleClosePaymentForm = () => {
    setPaymentFormOpen(false);
  };

  const handleOpenDetails = (booking: Booking) => {
    setDetailedBooking(booking);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setDetailedBooking(null);
  };

  const handleForceSync = async () => {
    setSyncing(true);
    await offlineService.syncAll();
    setTimeout(() => setSyncing(false), 1200);
  };

  const handleProfileOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };
  const handleProfileClose = () => {
    setProfileAnchorEl(null);
  };
  const handleNotifOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileClose();
    await logout();
  };

  const handleHeaderSearchChange = (val: string) => {
    setGlobalSearchQuery(val);
    if (tab !== 'search') {
      setTab('search');
    }
  };

  const getUserInitials = () => {
    if (!user) return 'S';
    if (!user.displayName) {
      if (user.email) {
        return user.email.slice(0, 2).toUpperCase();
      }
      return 'S';
    }
    return user.displayName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Sidebar link items
  const sidebarItems = [
    { value: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { value: 'bookings', label: 'Bookings Registry', icon: <Briefcase className="w-5 h-5" /> },
    { value: 'payments', label: 'Financial Ledger', icon: <DollarSign className="w-5 h-5" /> },
    { value: 'calendar', label: 'Studio Planner', icon: <CalendarIcon className="w-5 h-5" /> },
    { value: 'search', label: 'Archive Search', icon: <Search className="w-5 h-5" /> },
    { value: 'ai_copilot', label: 'Cinematic AI', icon: <Sparkles className="w-5 h-5" /> },
    { value: 'settings', label: 'Studio Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const notificationsList = [
    { id: 1, title: 'Outstanding Balance Retainers', desc: 'Bookings are awaiting milestone payment confirmation.', time: 'Priority' },
    { id: 2, title: 'Upcoming Production Shoot', desc: 'Wedding schedule on calendar in the next 48 hours.', time: 'Soon' },
    { id: 3, title: 'Database Sync Completed', desc: syncState.isOnline ? 'Online session synced with Cloud Firestore.' : 'Operational offline. Storing updates locally.', time: 'System' }
  ];

  // Active View Render Router
  const renderActiveView = () => {
    switch (tab) {
      case 'bookings':
        return (
          <BookingsManager 
            initialTab={bookingFormType || 'production'}
            bookingFormOpen={bookingFormOpen}
            bookingFormType={bookingFormType}
            selectedBooking={null}
            onCloseBookingForm={handleCloseBookingForm}
            onTriggerRefresh={triggerRefresh}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'payments':
        return (
          <PaymentTracker 
            paymentFormOpen={paymentFormOpen}
            onClosePaymentForm={handleClosePaymentForm}
            onTriggerRefresh={triggerRefresh}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'calendar':
        return (
          <CalendarView 
            onOpenBookingForm={handleOpenBookingForm}
            onOpenDetails={handleOpenDetails}
            refreshTrigger={refreshTrigger}
          />
        );
      case 'search':
        return (
          <SearchModule 
            onOpenDetails={handleOpenDetails}
            refreshTrigger={refreshTrigger}
            initialQuery={globalSearchQuery}
            onQueryChange={setGlobalSearchQuery}
          />
        );
      case 'settings':
        return <BrandSettingsView />;
      case 'ai_copilot':
        return <GeminiChat />;
      case 'dashboard':
      default:
        return (
          <Dashboard 
            setTab={setTab} 
            onOpenBookingForm={handleOpenBookingForm} 
            onOpenPaymentForm={handleOpenPaymentForm}
            refreshTrigger={refreshTrigger}
          />
        );
    }
  };

  return (
    <Box className="min-h-screen bg-[#070706] text-white flex flex-col md:flex-row">
      
      {/* =========================================
          DESKTOP SIDEBAR (Collapsible)
          ========================================= */}
      <Box 
        className={`hidden md:flex flex-col border-r border-[#D4AF37]/15 bg-[#0A0A09] select-none h-screen sticky top-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <Box className="p-4 border-b border-[#D4AF37]/10 flex items-center justify-between gap-3 h-[70px]">
          <Box className="flex items-center gap-3 overflow-hidden">
            <Box className="w-10 h-10 rounded-xl border border-[#D4AF37]/40 flex items-center justify-center bg-black/40 overflow-hidden flex-shrink-0">
              {settings.studioLogo ? (
                <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[#D4AF37] font-serif font-bold text-base">
                  {settings.appIcon || '📸'}
                </span>
              )}
            </Box>
            {!sidebarCollapsed && (
              <Box className="truncate">
                <Typography variant="subtitle2" className="text-gold-gradient font-bold font-serif leading-none tracking-wider text-xs uppercase">
                  {settings.studioName || "Asmaul Production"}
                </Typography>
                <Typography variant="caption" className="text-[9px] text-gray-500 tracking-wider uppercase block mt-1">
                  Studio System
                </Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Menu Items */}
        <Box className="flex-grow py-6 px-3 space-y-1.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = tab === item.value;
            return (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl transition-all duration-200 text-left outline-none ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#D4AF37]/15 to-[#AA7C11]/5 border-l-2 border-[#D4AF37] text-white font-semibold shadow-[inset_1px_0_10px_rgba(212,175,55,0.05)]' 
                    : 'text-gray-400 hover:text-white hover:bg-[#D4AF37]/5'
                }`}
              >
                <span className={`${isActive ? 'text-[#D4AF37]' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="text-xs tracking-wider font-medium font-sans truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </Box>

        {/* Sidebar Footer */}
        <Box className="p-4 border-t border-[#D4AF37]/10 space-y-3 bg-[#080807]">
          {/* Sync Status Badge */}
          <Box className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-black/40 border border-[#D4AF37]/10 justify-center">
            {!syncState.isOnline ? (
              <>
                <WifiOff className="w-4 h-4 text-[#D8A31A]" />
                {!sidebarCollapsed && <span className="text-[10px] text-[#D8A31A] font-bold font-mono">STANDALONE</span>}
              </>
            ) : syncState.isSyncing || syncState.pendingCount > 0 || syncing ? (
              <>
                <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
                {!sidebarCollapsed && <span className="text-[10px] text-[#D4AF37] font-bold font-mono">SYNCING...</span>}
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-green-400" />
                {!sidebarCollapsed && <span className="text-[10px] text-green-400 font-bold font-mono">SECURE SYNC</span>}
              </>
            )}
          </Box>

          {/* Collapse toggle */}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center py-2 text-gray-500 hover:text-white bg-black/20 hover:bg-black/40 rounded-xl transition-all border border-[#D4AF37]/5"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </Box>
      </Box>

      {/* =========================================
          MOBILE SLIDE-OUT DRAWER
          ========================================= */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <Box className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black"
            />
            
            {/* Content panel */}
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[85vw] bg-[#0A0A09] h-full flex flex-col border-r border-[#D4AF37]/20 z-10"
            >
              <Box className="p-4 border-b border-[#D4AF37]/10 flex items-center justify-between h-[70px]">
                <Box className="flex items-center gap-3">
                  <Box className="w-8 h-8 rounded-lg border border-[#D4AF37]/40 flex items-center justify-center bg-black/40 overflow-hidden">
                    {settings.studioLogo ? (
                      <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="w-4 h-4 text-[#D4AF37]" />
                    )}
                  </Box>
                  <Typography variant="subtitle2" className="text-gold-gradient font-bold font-serif uppercase tracking-wider text-xs">
                    {settings.studioName || "Asmaul Production"}
                  </Typography>
                </Box>
                <IconButton onClick={() => setMobileSidebarOpen(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </IconButton>
              </Box>

              <Box className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const isActive = tab === item.value;
                  return (
                    <button
                      key={item.value}
                      onClick={() => { setTab(item.value); setMobileSidebarOpen(false); }}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 text-left outline-none ${
                        isActive 
                          ? 'bg-gradient-to-r from-[#D4AF37]/20 to-[#AA7C11]/5 border-l-2 border-[#D4AF37] text-white font-semibold' 
                          : 'text-gray-400 hover:text-white hover:bg-[#D4AF37]/5'
                      }`}
                    >
                      {item.icon}
                      <span className="text-xs tracking-wider font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </Box>

              <Box className="p-4 border-t border-[#D4AF37]/10 bg-[#080807] flex items-center justify-between">
                <Box className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-green-400" />
                  <span className="text-[9px] text-gray-400 font-mono font-bold">REALTIME DATA SYNC</span>
                </Box>
                <span className="text-[9px] text-[#D4AF37] font-serif uppercase tracking-widest font-bold">ASMAUL V2</span>
              </Box>
            </motion.div>
          </Box>
        )}
      </AnimatePresence>

      {/* =========================================
          MAIN MASTER WORKSPACE (Content Column)
          ========================================= */}
      <Box className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        
        {/* =========================================
            TOP HEADER
            ========================================= */}
        <Box className="sticky top-0 z-40 bg-[#0D0D0C]/90 backdrop-blur-md border-b border-[#D4AF37]/15 px-4 sm:px-6 h-[70px] flex items-center justify-between shadow-lg">
          
          {/* Left Block: Mobile Hamburger & Dynamic Branding */}
          <Box className="flex items-center gap-3">
            <IconButton 
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden text-[#D4AF37] hover:bg-[#D4AF37]/10"
              size="small"
            >
              <MenuIcon className="w-5 h-5" />
            </IconButton>

            <Box className="flex items-center gap-2">
              {/* Dynamic Logo */}
              <Box className="w-8 h-8 rounded-lg border border-[#D4AF37]/30 flex items-center justify-center bg-black/40 overflow-hidden flex-shrink-0">
                {settings.studioLogo ? (
                  <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <Camera className="w-4 h-4 text-[#D4AF37]" />
                )}
              </Box>
              <Box className="hidden sm:block">
                <Typography variant="subtitle2" className="text-white font-serif font-bold text-xs tracking-wide uppercase leading-none">
                  {settings.studioName || "Asmaul Production"}
                </Typography>
                <Typography variant="caption" className="text-gray-500 font-sans text-[9px] uppercase tracking-wider block mt-0.5">
                  Studio Management System
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Center Block: Search Box & Current Date */}
          <Box className="flex items-center gap-4 flex-1 justify-center max-w-xl px-4">
            {/* Real Date formatted */}
            <Typography variant="caption" className="hidden lg:block text-gray-400 font-mono text-[11px] font-bold tracking-tight uppercase bg-black/30 px-3.5 py-1.5 rounded-xl border border-[#D4AF37]/10">
              {currentDateString}
            </Typography>

            {/* Search Box */}
            <Box className="flex items-center bg-black/40 border border-[#D4AF37]/15 rounded-xl px-3 py-1.5 w-full hover:border-[#D4AF37]/45 focus-within:border-[#D4AF37] focus-within:shadow-[0_0_12px_rgba(212,175,55,0.15)] transition-all">
              <Search className="w-4 h-4 text-[#AA7C11] mr-2 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Search clients, venues, dates..." 
                value={globalSearchQuery}
                onChange={(e) => handleHeaderSearchChange(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none w-full font-sans"
              />
            </Box>
          </Box>

          {/* Right Block: Actions, Indicators & Profile Menu */}
          <Box className="flex items-center gap-2 sm:gap-4">
            {/* Notification trigger */}
            <IconButton 
              onClick={handleNotifOpen} 
              className="text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-black/20 p-2 rounded-xl border border-[#D4AF37]/10" 
              size="small"
            >
              <BadgeAlert className="w-4.5 h-4.5" />
            </IconButton>

            {/* Notifications Dropdown */}
            <Menu
              anchorEl={notifAnchorEl}
              open={Boolean(notifAnchorEl)}
              onClose={handleNotifClose}
              keepMounted
              slotProps={{
                paper: {
                  className: "border border-[#D4AF37]/30 bg-[#121211] mt-2 shadow-2xl p-1 rounded-2xl",
                  sx: { minWidth: 320, maxWidth: 360 }
                }
              }}
            >
              <Box className="px-4 py-2.5 border-b border-[#D4AF37]/10 mb-1.5">
                <Typography variant="subtitle2" className="text-gold-gradient font-bold font-serif uppercase tracking-wider text-xs">
                  Studio System Alerts
                </Typography>
              </Box>
              {notificationsList.map((notif) => (
                <MenuItem key={notif.id} onClick={handleNotifClose} className="hover:bg-[#D4AF37]/10 whitespace-normal p-3 rounded-xl flex flex-col items-start gap-1">
                  <div className="flex justify-between items-start w-full gap-2">
                    <Typography variant="body2" className="text-white font-bold text-xs">
                      {notif.title}
                    </Typography>
                    <span className="text-[9px] text-[#D4AF37] uppercase tracking-wider font-mono bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">
                      {notif.time}
                    </span>
                  </div>
                  <Typography variant="caption" className="text-gray-400 text-[10px] leading-relaxed">
                    {notif.desc}
                  </Typography>
                </MenuItem>
              ))}
            </Menu>

            {/* Profile Avatar trigger */}
            {user && (
              <Box>
                <IconButton onClick={handleProfileOpen} size="small" className="p-0 border border-[#D4AF37]/45 rounded-xl bg-black/20">
                  <Avatar 
                    src={user.photoURL || undefined}
                    slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                    className="bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] text-[#0D0D0C] font-bold text-xs rounded-xl"
                    sx={{ width: 34, height: 34 }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>

                {/* Profile dropdown */}
                <Menu
                  anchorEl={profileAnchorEl}
                  open={Boolean(profileAnchorEl)}
                  onClose={handleProfileClose}
                  keepMounted
                  slotProps={{
                    paper: {
                      className: "border border-[#D4AF37]/30 bg-[#121211] mt-2 shadow-2xl rounded-2xl p-1",
                      sx: { minWidth: 220 }
                    }
                  }}
                >
                  <Box className="px-4 py-3 border-b border-[#D4AF37]/10 mb-1.5">
                    <Typography variant="body2" className="text-gold-gradient font-bold font-serif text-sm">
                      {user.displayName || ' Alexander Sterling'}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 block truncate text-[10px] mt-0.5 font-mono">
                      {user.email}
                    </Typography>
                  </Box>
                  
                  <MenuItem onClick={() => { handleProfileClose(); setTab('settings'); }} className="text-gray-300 gap-3 text-xs py-2.5 rounded-xl hover:bg-[#D4AF37]/10 mx-1">
                    <Sliders className="w-4 h-4 text-[#D4AF37]" />
                    Studio Settings
                  </MenuItem>

                  <MenuItem onClick={() => { handleProfileClose(); handleForceSync(); }} disabled={syncing || syncState.isSyncing} className="text-gray-300 gap-3 text-xs py-2.5 rounded-xl hover:bg-[#D4AF37]/10 mx-1">
                    <RefreshCw className={`w-4 h-4 text-[#D4AF37] ${syncing || syncState.isSyncing ? 'animate-spin' : ''}`} />
                    Force Database Sync
                  </MenuItem>

                  <MenuItem onClick={handleLogout} className="text-red-400 gap-3 text-xs py-2.5 rounded-xl hover:bg-red-950/20 mx-1">
                    <LogOut className="w-4 h-4" />
                    Sign Out Session
                  </MenuItem>
                </Menu>
              </Box>
            )}
          </Box>
        </Box>

        {/* =========================================
            MAIN WORKSPACE BODY CONTENT (Scrollable)
            ========================================= */}
        <Box className="flex-grow p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto relative overflow-x-hidden">
          {renderActiveView()}
        </Box>

        {/* =========================================
            MOBILE BOTTOM NAV BAR (Fallback / Sync Helper)
            ========================================= */}
        <Paper 
          elevation={10} 
          className="block md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0C] border-t border-[#D4AF37]/20"
        >
          <BottomNavigation
            value={tab}
            onChange={(e, v) => setTab(v)}
            className="bg-transparent h-14"
            showLabels
          >
            <BottomNavigationAction
              label="Overview"
              value="dashboard"
              icon={<LayoutDashboard className="w-4.5 h-4.5" />}
              className="text-gray-400 select-none min-w-0"
              sx={{
                '&.Mui-selected': { color: '#D4AF37' },
                '& .MuiBottomNavigationAction-label': { fontSize: '9px', fontWeight: 600, marginTop: '2px' }
              }}
            />
            <BottomNavigationAction
              label="Bookings"
              value="bookings"
              icon={<Briefcase className="w-4.5 h-4.5" />}
              className="text-gray-400 select-none min-w-0"
              sx={{
                '&.Mui-selected': { color: '#D4AF37' },
                '& .MuiBottomNavigationAction-label': { fontSize: '9px', fontWeight: 600, marginTop: '2px' }
              }}
            />
            <BottomNavigationAction
              label="Payments"
              value="payments"
              icon={<DollarSign className="w-4.5 h-4.5" />}
              className="text-gray-400 select-none min-w-0"
              sx={{
                '&.Mui-selected': { color: '#D4AF37' },
                '& .MuiBottomNavigationAction-label': { fontSize: '9px', fontWeight: 600, marginTop: '2px' }
              }}
            />
            <BottomNavigationAction
              label="Planner"
              value="calendar"
              icon={<CalendarIcon className="w-4.5 h-4.5" />}
              className="text-gray-400 select-none min-w-0"
              sx={{
                '&.Mui-selected': { color: '#D4AF37' },
                '& .MuiBottomNavigationAction-label': { fontSize: '9px', fontWeight: 600, marginTop: '2px' }
              }}
            />
            <BottomNavigationAction
              label="Search"
              value="search"
              icon={<Search className="w-4.5 h-4.5" />}
              className="text-gray-400 select-none min-w-0"
              sx={{
                '&.Mui-selected': { color: '#D4AF37' },
                '& .MuiBottomNavigationAction-label': { fontSize: '9px', fontWeight: 600, marginTop: '2px' }
              }}
            />
          </BottomNavigation>
        </Paper>

      </Box>

      {/* --- GLOBAL DRILL DOWN DETAILS DIALOG --- */}
      <Dialog open={detailsOpen} onClose={handleCloseDetails} fullWidth maxWidth="sm">
        {detailedBooking && (
          <>
            <DialogTitle component="div" className="border-b border-[#D4AF37]/20 flex justify-between items-start">
              <Box>
                <Typography variant="h5" className="text-gold-gradient font-bold font-serif leading-tight">
                  {detailedBooking.clientName}
                </Typography>
                <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[9px] block">
                  {detailedBooking.packageName} • {detailedBooking.type === 'production' ? 'Production' : 'Freelancer Contract'}
                </Typography>
              </Box>
              <FormControl size="small" variant="outlined" className="min-w-[120px]">
                <Select
                  value={detailedBooking.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value as Booking['status'];
                    const updatedBooking = { ...detailedBooking, status: newStatus };
                    setDetailedBooking(updatedBooking);
                    await offlineService.updateBooking(updatedBooking);
                    triggerRefresh();
                  }}
                  className={`text-[10px] font-bold uppercase tracking-wider h-7 ${getStatusChipColor(detailedBooking.status)}`}
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
                  <Typography variant="h6" className="text-[#D4AF37] font-mono font-bold">{formatCurrency(detailedBooking.totalAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Paid to Date</Typography>
                  <Typography variant="h6" className="text-green-400 font-mono font-bold">{formatCurrency(detailedBooking.paidAmount)}</Typography>
                </Box>
                <Box className="sm:col-span-2">
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Outstanding Receivables</Typography>
                  <Typography variant="subtitle1" className="text-amber-400 font-mono font-bold">
                    {formatCurrency(detailedBooking.totalAmount - detailedBooking.paidAmount)}
                  </Typography>
                </Box>
              </Box>

              <List className="p-0 space-y-2">
                <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                  <ListItemIcon className="min-w-8"><CalendarIcon className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText 
                    primary={<span className="text-gray-400 text-xs block">Wedding Date</span>} 
                    secondary={
                      <span className="text-white font-serif font-semibold text-sm block mt-0.5">
                        {detailedBooking.weddingDate.split('-').length === 3 
                          ? `${detailedBooking.weddingDate.split('-')[2]}/${detailedBooking.weddingDate.split('-')[1]}/${detailedBooking.weddingDate.split('-')[0]}` 
                          : detailedBooking.weddingDate}
                      </span>
                    } 
                  />
                </ListItem>
                <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                  <ListItemIcon className="min-w-8"><MapPin className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText 
                    primary={<span className="text-gray-400 text-xs block">Venue Location</span>} 
                    secondary={<span className="text-white text-sm block mt-0.5">{detailedBooking.venue}</span>} 
                  />
                </ListItem>
                <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                  <ListItemIcon className="min-w-8"><User className="w-4 h-4 text-[#D4AF37]" /></ListItemIcon>
                  <ListItemText 
                    primary={<span className="text-gray-400 text-xs block">Staff Assignment</span>} 
                    secondary={<span className="text-white text-sm block mt-0.5">{detailedBooking.photographer}</span>} 
                  />
                </ListItem>
                {detailedBooking.type === 'freelancer' && detailedBooking.freelancerRate !== undefined && (
                  <ListItem className="px-0 py-1.5 border-b border-gold-glow/5">
                    <ListItemIcon className="min-w-8"><DollarSign className="w-4 h-4 text-amber-500" /></ListItemIcon>
                    <ListItemText 
                      primary={<span className="text-gray-500 text-xs block">Freelancer Outsource Rate</span>} 
                      secondary={<span className="text-[#D4AF37] font-mono font-bold text-sm block mt-0.5">{formatCurrency(detailedBooking.freelancerRate)}</span>} 
                    />
                  </ListItem>
                )}
              </List>

              {detailedBooking.notes && (
                <Box className="space-y-1">
                  <Typography variant="caption" className="text-gray-500 uppercase tracking-wider block">Production Directives</Typography>
                  <Box className="p-3 bg-black/20 rounded border border-[#D4AF37]/10 text-xs text-gray-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-line">
                    {detailedBooking.notes}
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions className="border-t border-[#D4AF37]/15 p-3">
              <Button onClick={handleCloseDetails} color="inherit" size="small">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrandProvider>
          <AppContent />
        </BrandProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
