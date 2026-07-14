import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useBrand } from '../contexts/BrandContext';
import { useSyncState } from '../hooks/useSyncState';
import { offlineService } from '../services/offlineService';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Button, 
  Avatar, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Badge,
  Chip
} from '@mui/material';
import { 
  Camera, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  LogOut, 
  User, 
  Menu as MenuIcon,
  Wifi,
  WifiOff,
  Sliders
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  onDrawerToggle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setTab, onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const { settings } = useBrand();
  const syncState = useSyncState();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [syncing, setSyncing] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
  };

  const handleForceSync = async () => {
    setSyncing(true);
    await offlineService.syncAll();
    setTimeout(() => setSyncing(false), 1200);
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

  return (
    <AppBar position="sticky" elevation={0} className="border-b border-[#D4AF37]/20 bg-[#0D0D0C]/95 backdrop-blur-md">
      <Toolbar className="justify-between px-4 sm:px-6">
        {/* Left Side: Brand Logo */}
        <Box className="flex items-center gap-3">
          {onDrawerToggle && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              className="mr-1 md:hidden text-[#D4AF37]"
            >
              <MenuIcon className="w-5 h-5" />
            </IconButton>
          )}

          <Box className="flex items-center gap-2 cursor-pointer" onClick={() => setTab('dashboard')}>
            <Box className="w-9 h-9 rounded-full border border-[#D4AF37] flex items-center justify-center bg-black/40 overflow-hidden">
              {settings.studioLogo ? (
                <img src={settings.studioLogo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Camera className="w-4 h-4 text-[#D4AF37]" />
              )}
            </Box>
            <Box>
              <Typography variant="h6" className="text-gold-gradient font-bold tracking-widest font-serif leading-none text-base sm:text-lg">
                {settings.studioLogo ? settings.studioName : "Asmaul Production"}
              </Typography>
              <Typography variant="caption" className="text-[9px] text-gray-500 tracking-wider uppercase block -mt-0.5">
                {settings.studioTagline}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Side: Sync States, Indicators & Profile */}
        <Box className="flex items-center gap-2 sm:gap-4">
          {/* Connection & Sync Status */}
          <Box className="flex items-center gap-1.5">
            {!syncState.isOnline ? (
              <Tooltip title="You are Offline (using local IndexedDB cache)">
                <Chip
                  icon={<WifiOff className="w-3.5 h-3.5 text-[#D8A31A]" />}
                  label="Offline"
                  size="small"
                  variant="outlined"
                  className="border-[#D8A31A]/30 text-[#D8A31A] text-[11px] bg-[#D8A31A]/5 font-semibold"
                />
              </Tooltip>
            ) : (syncState.isSyncing || syncState.pendingCount > 0 || syncing) ? (
              <Tooltip title="Syncing local changes to Cloud Firestore...">
                <Chip
                  icon={<RefreshCw className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />}
                  label={
                    <>
                      <span className="hidden sm:inline">Syncing...</span>
                      <span className="inline sm:hidden">Syncing</span>
                    </>
                  }
                  size="small"
                  variant="outlined"
                  className="border-[#D4AF37]/30 text-[#D4AF37] text-[11px] bg-[#D4AF37]/5 font-semibold"
                />
              </Tooltip>
            ) : (
              <Tooltip title="All local data successfully synced with Cloud Firestore">
                <Chip
                  icon={<Cloud className="w-3.5 h-3.5 text-[#4E9F3D]" />}
                  label={
                    <>
                      <span className="hidden sm:inline">Online & Synced</span>
                      <span className="inline sm:hidden">Synced</span>
                    </>
                  }
                  size="small"
                  variant="outlined"
                  className="border-[#4E9F3D]/30 text-[#4E9F3D] text-[11px] bg-[#4E9F3D]/5 font-semibold"
                />
              </Tooltip>
            )}

            {/* Sync Queue / Force Sync Action */}
            {syncState.isOnline && (
              <Tooltip title={syncState.pendingCount > 0 ? `${syncState.pendingCount} updates queued. Click to force sync.` : "Fully Synced. Click to sync again."}>
                <IconButton 
                  onClick={handleForceSync}
                  className={`text-[#D4AF37] ${syncing || syncState.isSyncing ? 'animate-spin' : ''}`}
                  size="small"
                  disabled={syncing || syncState.isSyncing}
                >
                  <Badge badgeContent={syncState.pendingCount} color="error" overlap="circular">
                    <RefreshCw className="w-4 h-4" />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* User Profile Dropdown */}
          {user && (
            <Box>
              <Tooltip title={user.displayName || user.email || 'Studio User'}>
                <IconButton onClick={handleMenuOpen} size="small" className="p-0 border border-[#D4AF37]/50 rounded-full">
                  <Avatar 
                    src={user.photoURL || undefined}
                    slotProps={{ img: { referrerPolicy: 'no-referrer' } }}
                    className="bg-gradient-to-br from-[#D4AF37] to-[#AA7C11] text-[#0D0D0C] font-bold text-xs"
                    sx={{ width: 34, height: 34 }}
                  >
                    {getUserInitials()}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                keepMounted
                slotProps={{
                  paper: {
                    className: "border border-[#D4AF37]/30 bg-[#141413] mt-1 shadow-2xl",
                    sx: { minWidth: 200 }
                  }
                }}
              >
                <Box className="px-4 py-2 border-b border-[#D4AF37]/10 mb-1">
                  <Typography variant="body2" className="text-gold-gradient font-bold font-serif">
                    {user.displayName || 'Alexander Sterling'}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500 block truncate text-[11px]">
                    {user.email}
                  </Typography>
                </Box>
                
                <MenuItem onClick={() => { handleMenuClose(); setTab('settings'); }} className="text-gray-300 gap-2 text-sm hover:bg-[#D4AF37]/10">
                  <Sliders className="w-4 h-4 text-[#D4AF37]" />
                  Studio Settings
                </MenuItem>

                <MenuItem onClick={handleLogout} className="text-red-400 gap-2 text-sm hover:bg-red-950/20">
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
