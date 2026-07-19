import React, { useState, useEffect } from 'react';
import { useBrand, themeConfigs } from '../contexts/BrandContext';
import { useAuth } from '../contexts/AuthContext';
import { offlineService } from '../services/offlineService';
import { Booking } from '../types';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  MenuItem,
  InputAdornment,
  Switch,
  FormControlLabel,
  Checkbox,
  Dialog,
  CircularProgress
} from '@mui/material';
import {
  Save,
  Plus,
  Trash2,
  Sliders,
  DollarSign,
  Users,
  Camera,
  Layers,
  MapPin,
  Phone,
  Mail,
  RotateCcw,
  Sparkles,
  Palette,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Calendar,
  Globe,
  Smartphone,
  Facebook,
  Instagram,
  Youtube,
  MessageSquare,
  Lock,
  CloudLightning,
  FileText,
  Cloud,
  Download,
  Upload,
  User,
  Check,
  Shield,
  HelpCircle,
  Eye,
  EyeOff,
  Bell,
  Video,
  Plane,
  Heart
} from 'lucide-react';

export const BrandSettingsView: React.FC = () => {
  const { settings, updateSettings, resetSettings } = useBrand();
  const { user, logout } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'branding' | 'bookings' | 'whatsapp' | 'telegram' | 'payments' | 'team' | 'sync' | 'account' | 'about' | 'message_templates'>('profile');

  // Bookings state for assigned staff
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Telegram notifications state
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [showBotToken, setShowBotToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error' | 'testing'>('idle');
  const [testMessageStatus, setTestMessageStatus] = useState<'idle' | 'success' | 'error' | 'sending'>('idle');
  const [saveTelegramStatus, setSaveTelegramStatus] = useState<'idle' | 'success' | 'error' | 'saving'>('idle');

  // Categories Toggles
  const [telegramBookingNotifications, setTelegramBookingNotifications] = useState(settings.telegramBookingNotifications ?? true);
  const [telegramPaymentNotifications, setTelegramPaymentNotifications] = useState(settings.telegramPaymentNotifications ?? true);
  const [telegramReminderNotifications, setTelegramReminderNotifications] = useState(settings.telegramReminderNotifications ?? true);
  const [telegramAlbumNotifications, setTelegramAlbumNotifications] = useState(settings.telegramAlbumNotifications ?? true);
  const [telegramDeliveryNotifications, setTelegramDeliveryNotifications] = useState(settings.telegramDeliveryNotifications ?? true);
  const [telegramDailySummary, setTelegramDailySummary] = useState(settings.telegramDailySummary ?? true);

  // Load Telegram secure config
  useEffect(() => {
    async function loadTelegramConfig() {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch('/api/telegram/config', {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTelegramEnabled(data.enabled);
          setTelegramChatId(data.chatId);
          if (data.hasBotToken) {
            setTelegramBotToken('••••••••');
          }
        }
      } catch (e) {
        console.error('Error loading Telegram secure config:', e);
      }
    }

    loadTelegramConfig();
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchBookings = async () => {
      try {
        const data = await offlineService.getBookings();
        if (active) {
          setBookings(data);
        }
      } catch (err) {
        console.error('Error fetching bookings for settings view:', err);
      }
    };
    fetchBookings();
    
    const unsubscribe = offlineService.subscribe(() => {
      fetchBookings();
    });
    
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // --- Form States ---

  // 1. Business Profile
  const [studioName, setStudioName] = useState(settings.studioName);
  const [studioTagline, setStudioTagline] = useState(settings.studioTagline || '');
  const [studioEmail, setStudioEmail] = useState(settings.studioEmail || '');
  const [studioPhone, setStudioPhone] = useState(settings.studioPhone || '');
  const [studioAddress, setStudioAddress] = useState(settings.studioAddress || '');
  const [mobileNumber, setMobileNumber] = useState(settings.mobileNumber || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [ownerName, setOwnerName] = useState(settings.ownerName || '');
  const [googleMapsLocation, setGoogleMapsLocation] = useState(settings.googleMapsLocation || '');
  const [studioLogo, setStudioLogo] = useState(settings.studioLogo || '');
  const [coverPhoto, setCoverPhoto] = useState(settings.coverPhoto || '');

  // Contact & Social Media Fields
  const [contactPhone, setContactPhone] = useState(settings.contactPhone || '');
  const [contactWhatsApp, setContactWhatsApp] = useState(settings.contactWhatsApp || '');
  const [contactEmail, setContactEmail] = useState(settings.contactEmail || '');
  const [contactWebsite, setContactWebsite] = useState(settings.contactWebsite || '');
  const [contactFacebook, setContactFacebook] = useState(settings.contactFacebook || '');
  const [contactInstagram, setContactInstagram] = useState(settings.contactInstagram || '');
  const [contactYouTube, setContactYouTube] = useState(settings.contactYouTube || '');
  const [contactGoogleMaps, setContactGoogleMaps] = useState(settings.contactGoogleMaps || '');

  // 2. Branding
  const [themeColor, setThemeColor] = useState(settings.themeColor);
  const [appIcon, setAppIcon] = useState(settings.appIcon || '📸');
  const [appIconUrl, setAppIconUrl] = useState(settings.appIconUrl || '');
  const [appIconPreview, setAppIconPreview] = useState<string>(settings.appIconUrl || '');
  const [themeMode, setThemeMode] = useState(settings.themeMode || 'dark');
  const [fontStyle, setFontStyle] = useState(settings.fontStyle || 'serif');
  const [authorizedSignature, setAuthorizedSignature] = useState(settings.authorizedSignature || '');

  // 3. Booking Settings
  const [defaultBookingStatus, setDefaultBookingStatus] = useState(settings.defaultBookingStatus || 'pending');
  const [autoBookingId, setAutoBookingId] = useState(settings.autoBookingId ?? true);
  const [bookingPrefix, setBookingPrefix] = useState(settings.bookingPrefix || 'VG-');
  const [defaultAdvanceAmount, setDefaultAdvanceAmount] = useState(settings.defaultAdvanceAmount ?? 500);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(settings.reminderDaysBefore ?? 3);
  const [packages, setPackages] = useState<string[]>(settings.packages || []);
  const [newPackage, setNewPackage] = useState('');

  // 4. WhatsApp Settings
  const [whatsappBusinessName, setWhatsappBusinessName] = useState(settings.whatsappBusinessName || '');
  const [whatsappTemplateConfirmation, setWhatsappTemplateConfirmation] = useState(settings.whatsappTemplateConfirmation || '');
  const [whatsappTemplatePayment, setWhatsappTemplatePayment] = useState(settings.whatsappTemplatePayment || '');
  const [whatsappTemplateReminder, setWhatsappTemplateReminder] = useState(settings.whatsappTemplateReminder || '');
  const [freelanceWhatsappTemplate, setFreelanceWhatsappTemplate] = useState(settings.freelanceWhatsappTemplate || '');
  const [autoBookingConfirmation, setAutoBookingConfirmation] = useState(settings.autoBookingConfirmation ?? true);
  const [autoPaymentConfirmation, setAutoPaymentConfirmation] = useState(settings.autoPaymentConfirmation ?? true);
  const [autoReminderMessages, setAutoReminderMessages] = useState(settings.autoReminderMessages ?? true);

  // 5. Payment Settings
  const [currencySymbol, setCurrencySymbol] = useState(settings.currencySymbol || '$');
  const [currencyCode, setCurrencyCode] = useState(settings.currencyCode || 'USD');
  const [upiId, setUpiId] = useState(settings.upiId || '');
  const [bankAccountNo, setBankAccountNo] = useState(settings.bankAccountNo || '');
  const [bankIfsc, setBankIfsc] = useState(settings.bankIfsc || '');
  const [bankName, setBankName] = useState(settings.bankName || '');
  const [gstNumber, setGSTNumber] = useState(settings.gstNumber || '');
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || '');
  const [gstPercentage, setGSTPercentage] = useState(settings.gstPercentage ?? 18);
  const [invoiceTerms, setInvoiceTerms] = useState(settings.invoiceTerms || '');

  // 6. Team Settings
  const [photographers, setPhotographers] = useState<string[]>(settings.photographers || []);
  const [cinematographers, setCinematographers] = useState<string[]>(settings.cinematographers || []);
  const [droneOperators, setDroneOperators] = useState<string[]>(settings.droneOperators || []);
  const [teamMembers, setTeamMembers] = useState<any[]>(settings.teamMembers || []);

  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'Photographer' | 'Cinematographer' | 'Drone Operator' | 'Editor' | 'Manager'>('Photographer');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // 7. Backup & Sync Settings
  const [autoSync, setAutoSync] = useState(settings.autoSync ?? true);
  const [isSyncing, setIsSyncing] = useState(false);

  // 8. Account Dialogs
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // 9. About Dialogs
  const [aboutDialogOpen, setAboutDialogOpen] = useState<'privacy' | 'terms' | null>(null);

  // Global UI feedback
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Synchronize form states when settings from context finish loading/changing
  useEffect(() => {
    if (settings) {
      setStudioName(settings.studioName);
      setStudioTagline(settings.studioTagline || '');
      setStudioEmail(settings.studioEmail || '');
      setStudioPhone(settings.studioPhone || '');
      setStudioAddress(settings.studioAddress || '');
      setMobileNumber(settings.mobileNumber || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setWebsite(settings.website || '');
      setOwnerName(settings.ownerName || '');
      setGoogleMapsLocation(settings.googleMapsLocation || '');
      setStudioLogo(settings.studioLogo || '');
      setCoverPhoto(settings.coverPhoto || '');
      setContactPhone(settings.contactPhone || '');
      setContactWhatsApp(settings.contactWhatsApp || '');
      setContactEmail(settings.contactEmail || '');
      setContactWebsite(settings.contactWebsite || '');
      setContactFacebook(settings.contactFacebook || '');
      setContactInstagram(settings.contactInstagram || '');
      setContactYouTube(settings.contactYouTube || '');
      setContactGoogleMaps(settings.contactGoogleMaps || '');
      setThemeColor(settings.themeColor);
      setAppIcon(settings.appIcon || '📸');
      setAppIconUrl(settings.appIconUrl || '');
      setAppIconPreview(settings.appIconUrl || '');
      setThemeMode(settings.themeMode || 'dark');
      setFontStyle(settings.fontStyle || 'serif');
      setAuthorizedSignature(settings.authorizedSignature || '');
      setDefaultBookingStatus(settings.defaultBookingStatus || 'pending');
      setAutoBookingId(settings.autoBookingId ?? true);
      setBookingPrefix(settings.bookingPrefix || 'VG-');
      setDefaultAdvanceAmount(settings.defaultAdvanceAmount ?? 500);
      setReminderDaysBefore(settings.reminderDaysBefore ?? 3);
      setPackages(settings.packages || []);
      setWhatsappBusinessName(settings.whatsappBusinessName || '');
      setWhatsappTemplateConfirmation(settings.whatsappTemplateConfirmation || '');
      setWhatsappTemplatePayment(settings.whatsappTemplatePayment || '');
      setWhatsappTemplateReminder(settings.whatsappTemplateReminder || '');
      setFreelanceWhatsappTemplate(settings.freelanceWhatsappTemplate || '');
      setAutoBookingConfirmation(settings.autoBookingConfirmation ?? true);
      setAutoPaymentConfirmation(settings.autoPaymentConfirmation ?? true);
      setAutoReminderMessages(settings.autoReminderMessages ?? true);
      setCurrencySymbol(settings.currencySymbol || '$');
      setCurrencyCode(settings.currencyCode || 'USD');
      setUpiId(settings.upiId || '');
      setBankAccountNo(settings.bankAccountNo || '');
      setBankIfsc(settings.bankIfsc || '');
      setBankName(settings.bankName || '');
      setGSTNumber(settings.gstNumber || '');
      setInvoicePrefix(settings.invoicePrefix || '');
      setGSTPercentage(settings.gstPercentage ?? 18);
      setInvoiceTerms(settings.invoiceTerms || '');
      setPhotographers(settings.photographers || []);
      setCinematographers(settings.cinematographers || []);
      setDroneOperators(settings.droneOperators || []);
      setTeamMembers(settings.teamMembers || []);
      setAutoSync(settings.autoSync ?? true);
      setTelegramBookingNotifications(settings.telegramBookingNotifications ?? true);
      setTelegramPaymentNotifications(settings.telegramPaymentNotifications ?? true);
      setTelegramReminderNotifications(settings.telegramReminderNotifications ?? true);
      setTelegramAlbumNotifications(settings.telegramAlbumNotifications ?? true);
      setTelegramDeliveryNotifications(settings.telegramDeliveryNotifications ?? true);
      setTelegramDailySummary(settings.telegramDailySummary ?? true);
    }
  }, [settings]);

  // File conversion helpers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudioLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAuthorizedSignature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAppIconPreview(base64);
        setAppIconUrl(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    setAppIconPreview('');
    setAppIconUrl('');
  };

  // List Management Helpers
  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPackage.trim() && !packages.includes(newPackage.trim())) {
      setPackages([...packages, newPackage.trim()]);
      setNewPackage('');
    }
  };

  const handleRemovePackage = (pkg: string) => {
    setPackages(packages.filter(p => p !== pkg));
  };

  // Dynamic Team adding (sync lists of Photographers, Cinematographers, Drone Operators based on role)
  const handleAddTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember = {
      id: Math.random().toString(36).substring(2, 9),
      name: newMemberName.trim(),
      role: newMemberRole,
      phone: newMemberPhone.trim()
    };

    setTeamMembers([...teamMembers, newMember]);

    // Update specialist lists based on role
    if (newMemberRole === 'Photographer' && !photographers.includes(newMember.name)) {
      setPhotographers([...photographers, newMember.name]);
    } else if (newMemberRole === 'Cinematographer' && !cinematographers.includes(newMember.name)) {
      setCinematographers([...cinematographers, newMember.name]);
    } else if (newMemberRole === 'Drone Operator' && !droneOperators.includes(newMember.name)) {
      setDroneOperators([...droneOperators, newMember.name]);
    }

    setNewMemberName('');
    setNewMemberPhone('');
  };

  const handleRemoveTeamMember = (id: string, name: string, role: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id));
    if (role === 'Photographer') {
      setPhotographers(photographers.filter(p => p !== name));
    } else if (role === 'Cinematographer') {
      setCinematographers(c => c.filter(item => item !== name));
    } else if (role === 'Drone Operator') {
      setDroneOperators(d => d.filter(item => item !== name));
    }
  };

  // Sync / Backup / Export / Import Action handlers
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await offlineService.syncAll();
      alert('Synchronization and backup completed successfully!');
    } catch (err) {
      console.error('Manual sync failed:', err);
      alert('Sync failed. Please check internet connection.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = async () => {
    try {
      const bookingsData = await offlineService.getBookings();
      const paymentsData = await offlineService.getPayments();
      const settingsData = await offlineService.getSettings();

      const backup = {
        version: '2.4.0',
        timestamp: Date.now(),
        bookings: bookingsData,
        payments: paymentsData,
        settings: {
          ...settingsData,
          studioName,
          studioTagline,
          studioEmail,
          studioPhone,
          studioAddress,
          themeColor,
          currencySymbol,
          currencyCode,
          photographers,
          packages,
          studioLogo,
          authorizedSignature,
          mobileNumber,
          whatsappNumber,
          website,
          coverPhoto,
          ownerName,
          googleMapsLocation,
          contactPhone,
          contactWhatsApp,
          contactEmail,
          contactWebsite,
          contactFacebook,
          contactInstagram,
          contactYouTube,
          contactGoogleMaps,
          appIcon,
          appIconUrl,
          themeMode,
          fontStyle,
          defaultBookingStatus,
          autoBookingId,
          bookingPrefix,
          defaultAdvanceAmount,
          reminderDaysBefore,
          whatsappBusinessName,
          whatsappTemplateConfirmation,
          whatsappTemplatePayment,
          whatsappTemplateReminder,
          freelanceWhatsappTemplate,
          autoBookingConfirmation,
          autoPaymentConfirmation,
          autoReminderMessages,
          upiId,
          bankAccountNo,
          bankIfsc,
          bankName,
          gstNumber,
          invoicePrefix,
          gstPercentage,
          invoiceTerms,
          cinematographers,
          droneOperators,
          teamMembers,
          autoSync
        }
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const studioSlug = (settings.studioName || 'studio').toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.download = `${studioSlug}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data.');
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);

        if (!backup.bookings || !backup.payments || !backup.settings) {
          alert('Invalid backup file. Missing critical dataset blocks.');
          return;
        }

        // 1. Update brand context/settings
        updateSettings(backup.settings);

        // 2. Restore bookings and payments locally
        for (const b of backup.bookings) {
          await offlineService.addBooking(b);
        }
        for (const p of backup.payments) {
          await offlineService.addPayment(p);
        }

        alert('Business database and brand settings restored successfully. Re-locking suite.');
        window.location.reload();
      } catch (err) {
        console.error('Import failed:', err);
        alert('Failed to parse and restore database. Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  // Secure Password Change Method
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    if (auth.currentUser) {
      try {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordDialogOpen(false), 2000);
      } catch (err: any) {
        console.error('Password change failed:', err);
        setPasswordError(err.message || 'Failed to update credentials.');
      }
    } else {
      setPasswordError('No active authentication session.');
    }
  };

  // Main Save Settings implementation
  const handleSaveAll = () => {
    updateSettings({
      studioName,
      studioTagline,
      studioEmail,
      studioPhone,
      studioAddress,
      themeColor,
      currencySymbol,
      currencyCode,
      photographers,
      packages,
      studioLogo,
      authorizedSignature,
      mobileNumber,
      whatsappNumber,
      website,
      coverPhoto,
      ownerName,
      googleMapsLocation,
      contactPhone,
      contactWhatsApp,
      contactEmail,
      contactWebsite,
      contactFacebook,
      contactInstagram,
      contactYouTube,
      contactGoogleMaps,
      appIcon,
      appIconUrl,
      themeMode,
      fontStyle,
      defaultBookingStatus,
      autoBookingId,
      bookingPrefix,
      defaultAdvanceAmount,
      reminderDaysBefore,
      whatsappBusinessName,
      whatsappTemplateConfirmation,
      whatsappTemplatePayment,
      whatsappTemplateReminder,
      freelanceWhatsappTemplate,
      autoBookingConfirmation,
      autoPaymentConfirmation,
      autoReminderMessages,
      upiId,
      bankAccountNo,
      bankIfsc,
      bankName,
      gstNumber,
      invoicePrefix,
      gstPercentage,
      invoiceTerms,
      cinematographers,
      droneOperators,
      teamMembers,
      autoSync
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to revert brand custom settings back to original luxury defaults?')) {
      resetSettings();
      window.location.reload();
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
      }
    } catch (e) {
      console.error(e);
      setConnectionStatus('error');
    }
  };

  const handleSendTestMessage = async () => {
    setTestMessageStatus('sending');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          botToken: telegramBotToken,
          chatId: telegramChatId
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestMessageStatus('success');
      } else {
        setTestMessageStatus('error');
      }
    } catch (e) {
      console.error(e);
      setTestMessageStatus('error');
    }
  };

  const handleSaveTelegramSettings = async () => {
    setSaveTelegramStatus('saving');
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/telegram/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          enabled: telegramEnabled,
          botToken: telegramBotToken,
          chatId: telegramChatId,
          telegramBookingNotifications,
          telegramPaymentNotifications,
          telegramReminderNotifications,
          telegramAlbumNotifications,
          telegramDeliveryNotifications,
          telegramDailySummary,
        })
      });

      if (response.ok) {
        await updateSettings({
          ...settings,
          telegramEnabled: telegramEnabled,
          telegramBookingNotifications,
          telegramPaymentNotifications,
          telegramReminderNotifications,
          telegramAlbumNotifications,
          telegramDeliveryNotifications,
          telegramDailySummary,
        });
        setSaveTelegramStatus('success');
        setTimeout(() => setSaveTelegramStatus('idle'), 3000);
      } else {
        setSaveTelegramStatus('error');
        setTimeout(() => setSaveTelegramStatus('idle'), 3000);
      }
    } catch (e) {
      console.error(e);
      setSaveTelegramStatus('error');
      setTimeout(() => setSaveTelegramStatus('idle'), 3000);
    }
  };

  // Helper lists for sidebar
  const tabsList = [
    { id: 'profile', label: 'Business Profile', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'branding', label: 'Branding & Aesthetics', icon: <Palette className="w-4 h-4" /> },
    { id: 'bookings', label: 'Booking Settings', icon: <Calendar className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp Automation', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'message_templates', label: 'Message Templates', icon: <FileText className="w-4 h-4" /> },
    { id: 'telegram', label: 'Telegram Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'payments', label: 'Payment & Invoice', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'team', label: 'Team Directory', icon: <Users className="w-4 h-4" /> },
    { id: 'sync', label: 'Backup & Sync', icon: <CloudLightning className="w-4 h-4" /> },
    { id: 'account', label: 'My Account', icon: <User className="w-4 h-4" /> },
    { id: 'about', label: 'About & Support', icon: <HelpCircle className="w-4 h-4" /> }
  ] as const;

  return (
    <Box className="space-y-6">
      {/* Exquisite Luxury Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Box>
          <Typography variant="h5" className="text-gold-gradient font-bold tracking-wider font-serif mb-0.5">
            BUSINESS CONTROL SUITE
          </Typography>
          <Typography variant="caption" className="text-gray-500 uppercase tracking-widest text-[11px] block">
            Configure studio details, WhatsApp automatons, finance frameworks, and sync matrices
          </Typography>
        </Box>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<RotateCcw className="w-4 h-4" />}
            className="border-gray-800 text-gray-400 hover:border-gray-600 flex-1 sm:flex-initial text-xs py-2"
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveAll}
            startIcon={<Save className="w-4 h-4" />}
            className="flex-grow sm:flex-initial text-xs py-2 bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-black"
          >
            {saveSuccess ? 'Suite Locked!' : 'Lock Changes'}
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <Box className="bg-emerald-950/20 border border-emerald-500/30 text-emerald-200 p-4 rounded-lg flex items-center gap-2 animate-pulse">
          <Sparkles className="w-5 h-5 text-[#10B981]" />
          <Typography variant="body2" className="font-semibold text-xs uppercase tracking-widest">
            Corporate database synchronized. Real-time updates push completed.
          </Typography>
        </Box>
      )}

      {/* Main Settings Panel */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* SIDE BAR BUTTONS - Desktop vertical, Mobile horizontal scroll */}
        <div className="lg:w-3/12 w-full flex flex-col gap-1">
          {/* Active Brand Sidebar Banner */}
          <Box className="hidden lg:flex flex-col items-center justify-center p-4 mb-3 border border-[#D4AF37]/15 bg-black/40 rounded-xl">
            {settings.studioLogo ? (
              <img src={settings.studioLogo} alt="Logo" className="h-14 w-14 object-contain bg-white/5 p-0.5 rounded-full border border-[#D4AF37]/20 mb-2" referrerPolicy="no-referrer" />
            ) : (
              <Box className="w-14 h-14 rounded-full border-2 border-[#D4AF37]/40 flex items-center justify-center bg-[#D4AF37]/5 mb-2">
                <Camera className="w-6 h-6 text-[#D4AF37]" />
              </Box>
            )}
            <Typography variant="body2" className="text-gold-gradient font-serif font-bold text-center tracking-wider max-w-full truncate">
              {settings.studioLogo ? settings.studioName : "Asmaul Production"}
            </Typography>
            <Typography variant="caption" className="text-[9px] text-gray-500 uppercase tracking-widest font-mono text-center mt-1">
              Settings Panel
            </Typography>
          </Box>

          {/* Scroll wrapper for mobile compatibility */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 gap-1.5 scrollbar-thin scrollbar-thumb-gray-800">
            {tabsList.map((t) => {
              const isSelected = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37]/20 to-transparent border-l-2 border-[#D4AF37] text-[#D4AF37]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <span className={isSelected ? 'text-[#D4AF37]' : 'text-gray-500'}>
                    {t.icon}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          <Card className="border border-gray-900 bg-black/60 p-4 mt-4 hidden lg:block">
            <div className="flex items-center gap-2 mb-2">
              <Cloud className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cloud Engine Status</span>
            </div>
            <Typography variant="caption" className="text-gray-500 leading-relaxed block text-[11px]">
              Suite operations are stored locally on device and synced instantly across all active logged-in terminals.
            </Typography>
          </Card>
        </div>

        {/* WORKSPACE AREA */}
        <div className="lg:w-9/12 w-full">
          {/* Tab Content Panels */}
          {activeTab === 'profile' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Briefcase className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Studio Business Profile
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TextField
                      fullWidth
                      label="Business / Studio Name"
                      value={studioName}
                      onChange={(e) => setStudioName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Owner / Managing Director Name"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Alexander Sterling"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextField
                      fullWidth
                      label="Studio Tagline / Slogan"
                      value={studioTagline}
                      onChange={(e) => setStudioTagline(e.target.value)}
                      placeholder="e.g. Luxury Wedding Cine & Editorial Productions"
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Business Phone"
                      value={studioPhone}
                      onChange={(e) => setStudioPhone(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Phone className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="WhatsApp Official Number"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Smartphone className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Official Email Address"
                      value={studioEmail}
                      onChange={(e) => setStudioEmail(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Mail className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Studio Website Address"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Globe className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextField
                      fullWidth
                      label="Physical Studio HQ Address"
                      value={studioAddress}
                      onChange={(e) => setStudioAddress(e.target.value)}
                      multiline
                      rows={2}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <TextField
                      fullWidth
                      label="Google Maps Location URL (Embed or Maps Link)"
                      value={googleMapsLocation}
                      onChange={(e) => setGoogleMapsLocation(e.target.value)}
                      placeholder="e.g. https://maps.google.com/..."
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><MapPin className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                </div>

                <Divider className="border-gray-800 my-4" />
                <div className="flex items-center gap-2 pb-2">
                  <Phone className="w-4 h-4 text-[#D4AF37]" />
                  <Typography variant="subtitle2" className="text-white uppercase tracking-wider text-[11px] font-bold">
                    📞 Contact & Social Media
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TextField
                      fullWidth
                      label="Business Phone Number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Phone className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="WhatsApp Number"
                      value={contactWhatsApp}
                      onChange={(e) => setContactWhatsApp(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><MessageSquare className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. contact@asmaulproduction.com"
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Mail className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Website URL"
                      value={contactWebsite}
                      onChange={(e) => setContactWebsite(e.target.value)}
                      placeholder="e.g. https://www.asmaulproduction.com"
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Globe className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Facebook URL"
                      value={contactFacebook}
                      onChange={(e) => setContactFacebook(e.target.value)}
                      placeholder="e.g. https://facebook.com/..."
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Facebook className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Instagram URL"
                      value={contactInstagram}
                      onChange={(e) => setContactInstagram(e.target.value)}
                      placeholder="e.g. https://instagram.com/..."
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Instagram className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="YouTube URL"
                      value={contactYouTube}
                      onChange={(e) => setContactYouTube(e.target.value)}
                      placeholder="e.g. https://youtube.com/..."
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Youtube className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                  <div>
                    <TextField
                      fullWidth
                      label="Google Maps URL"
                      value={contactGoogleMaps}
                      onChange={(e) => setContactGoogleMaps(e.target.value)}
                      placeholder="e.g. https://maps.google.com/..."
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><MapPin className="w-4 h-4 text-[#D4AF37]" /></InputAdornment>
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cover & Logo upload section */}
                <Divider className="border-gray-800 my-4" />
                <Typography variant="subtitle2" className="text-white uppercase tracking-wider text-[11px] font-bold mb-3">
                  Visual Assets Upload
                </Typography>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block">Studio Branding Logo</span>
                    {studioLogo ? (
                      <div className="flex items-center gap-4 p-3 bg-black/40 border border-[#D4AF37]/25 rounded-lg">
                        <img src={studioLogo} alt="Logo" className="h-12 w-12 object-contain bg-white rounded border border-gray-800" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <Button size="small" color="error" variant="text" onClick={() => setStudioLogo('')} className="text-[10px] font-bold uppercase p-0 min-w-0">
                            Change / Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outlined" component="label" className="w-full text-xs border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 py-3 font-bold h-14">
                        Upload Logo Image
                        <input type="file" accept="image/*" hidden onChange={handleLogoChange} />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block">Suite Cover Photo</span>
                    {coverPhoto ? (
                      <div className="flex items-center gap-4 p-3 bg-black/40 border border-[#D4AF37]/25 rounded-lg">
                        <img src={coverPhoto} alt="Cover" className="h-12 w-20 object-cover rounded border border-gray-800" referrerPolicy="no-referrer" />
                        <div className="flex-grow">
                          <Button size="small" color="error" variant="text" onClick={() => setCoverPhoto('')} className="text-[10px] font-bold uppercase p-0 min-w-0">
                            Change / Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outlined" component="label" className="w-full text-xs border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 py-3 font-bold h-14">
                        Upload Cover Photo
                        <input type="file" accept="image/*" hidden onChange={handleCoverChange} />
                      </Button>
                    )}
                  </div>

                  <div className="md:col-span-2 space-y-2 mt-4">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block">🖼 Website / App Icon</span>
                    
                    {appIconPreview ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-black/40 border border-[#D4AF37]/25 rounded-lg">
                        <div className="relative w-16 h-16 rounded-xl border border-[#D4AF37]/20 bg-[#0D0D0C] flex items-center justify-center overflow-hidden">
                          <img src={appIconPreview} alt="App Icon Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-grow space-y-1">
                          <Typography variant="body2" className="text-white font-medium text-xs">
                            Active / Selected Custom Icon Preview
                          </Typography>
                          <Typography variant="caption" className="text-gray-500 block text-[10px]">
                            This custom icon will automatically render in the Browser Tab (Favicon), Home Screen, Splash Screen, and PWA App Icon.
                          </Typography>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="small"
                              component="label"
                              variant="text"
                              className="text-[#D4AF37] hover:bg-[#D4AF37]/10 text-[10px] font-bold uppercase p-0 min-w-0 mr-4"
                            >
                              Change Icon
                              <input type="file" accept="image/*" hidden onChange={handleIconFileChange} />
                            </Button>
                            <Button 
                              size="small" 
                              color="error" 
                              variant="text" 
                              onClick={handleRemoveIcon} 
                              className="text-[10px] font-bold uppercase p-0 min-w-0"
                            >
                              Remove Icon
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                        <Button variant="outlined" component="label" className="flex-grow text-xs border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 py-3 font-bold h-14">
                          Upload Custom App Icon
                          <input type="file" accept="image/*" hidden onChange={handleIconFileChange} />
                        </Button>
                        <div className="flex items-center gap-2 px-3 py-2 bg-black/20 rounded border border-[#D4AF37]/10 text-[11px] text-gray-400">
                          <span className="text-sm">{appIcon}</span>
                          <span>Fallback Icon Emoji (defined in Branding tab)</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Palette className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Aesthetics, Palette & Branding
                  </Typography>
                </div>

                <div className="space-y-4">
                  <Typography variant="caption" className="text-gray-400 block leading-relaxed text-xs">
                    Choose an exquisite luxury theme palette. This changes the colors of badges, buttons, highlights, and borders in real-time.
                  </Typography>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.keys(themeConfigs) as Array<keyof typeof themeConfigs>).map((key) => {
                      const conf = themeConfigs[key];
                      const isSelected = themeColor === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setThemeColor(key)}
                          className={`flex flex-col items-center justify-between p-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'border-[#D4AF37] bg-[#D4AF37]/5 shadow-lg shadow-[#D4AF37]/10'
                              : 'border-gray-800 hover:border-gray-700 bg-black/40 hover:bg-black/60'
                          }`}
                        >
                          <div className="flex gap-1.5 mb-2.5">
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: conf.light }} />
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: conf.primary }} />
                            <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: conf.dark }} />
                          </div>
                          <Typography variant="body2" className={`text-[11px] font-bold uppercase tracking-wider leading-none ${isSelected ? 'text-[#D4AF37]' : 'text-gray-400'}`}>
                            {conf.name}
                          </Typography>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Divider className="border-gray-800" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <TextField
                      select
                      fullWidth
                      label="Active Theme Mode"
                      value={themeMode}
                      onChange={(e) => setThemeMode(e.target.value as 'light' | 'dark')}
                    >
                      <MenuItem value="dark">Immersive Dark</MenuItem>
                      <MenuItem value="light">Crisp Light</MenuItem>
                    </TextField>
                  </div>

                  <div>
                    <TextField
                      select
                      fullWidth
                      label="Workspace Font Family"
                      value={fontStyle}
                      onChange={(e) => setFontStyle(e.target.value as any)}
                    >
                      <MenuItem value="serif">Playfair Display (Serif)</MenuItem>
                      <MenuItem value="sans">Inter (Sans-Serif)</MenuItem>
                      <MenuItem value="mono">JetBrains Mono (Tech)</MenuItem>
                    </TextField>
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Suite App Icon Emblem"
                      value={appIcon}
                      onChange={(e) => setAppIcon(e.target.value)}
                      placeholder="e.g. 📸 or 🌟"
                    />
                  </div>
                </div>

                <Divider className="border-gray-800" />

                <div className="space-y-3">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block">Digital Authorized Signature (for Contract validation)</span>
                  {authorizedSignature ? (
                    <div className="flex items-center gap-4 p-3 bg-black/40 border border-[#D4AF37]/25 rounded-lg max-w-md">
                      <img src={authorizedSignature} alt="Signature" className="h-12 w-32 object-contain bg-white rounded border border-gray-800" referrerPolicy="no-referrer" />
                      <Button size="small" color="error" variant="text" onClick={() => setAuthorizedSignature('')} className="text-[10px] font-bold uppercase p-0 min-w-0">
                        Change / Delete
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outlined" component="label" className="max-w-md w-full text-xs border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 py-3 font-bold h-12">
                      Upload Authorized Signature
                      <input type="file" accept="image/*" hidden onChange={handleSignatureChange} />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'bookings' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Calendar className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Workspace Booking Settings
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TextField
                      select
                      fullWidth
                      label="Default Intake Booking Status"
                      value={defaultBookingStatus}
                      onChange={(e) => setDefaultBookingStatus(e.target.value)}
                    >
                      <MenuItem value="pending">🟡 Pending Verification</MenuItem>
                      <MenuItem value="confirmed">🟢 Confirmed / Locked</MenuItem>
                      <MenuItem value="in progress">🔵 Production In-Progress</MenuItem>
                    </TextField>
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Invoice/Booking Prefix Code"
                      value={bookingPrefix}
                      onChange={(e) => setBookingPrefix(e.target.value)}
                      placeholder="e.g. AP-2026-"
                    />
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      type="number"
                      label="Default Booking Advance Deposit"
                      value={defaultAdvanceAmount}
                      onChange={(e) => setDefaultAdvanceAmount(Number(e.target.value))}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start">{currencySymbol}</InputAdornment>
                        }
                      }}
                    />
                  </div>

                  <div>
                    <TextField
                      select
                      fullWidth
                      label="Automated Client Notification Reminder"
                      value={reminderDaysBefore}
                      onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                    >
                      <MenuItem value={1}>1 Day Before Event</MenuItem>
                      <MenuItem value={3}>3 Days Before Event</MenuItem>
                      <MenuItem value={5}>5 Days Before Event</MenuItem>
                      <MenuItem value={7}>7 Days Before Event</MenuItem>
                    </TextField>
                  </div>

                  <div className="md:col-span-2">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoBookingId}
                          onChange={(e) => setAutoBookingId(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography className="text-xs text-gray-200 font-bold uppercase tracking-wider">
                          Auto-Generate Unique Studio Booking IDs (e.g. AP-2026-003)
                        </Typography>
                      }
                    />
                  </div>
                </div>

                <Divider className="border-gray-800" />

                {/* Service Packages Presets */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest block">Active Studio Packages</span>
                  </div>

                  <form onSubmit={handleAddPackage} className="flex gap-2">
                    <TextField
                      fullWidth
                      size="small"
                      label="New Service Package Name"
                      placeholder="e.g. Ultra Royal Cinematic Gold Suite"
                      value={newPackage}
                      onChange={(e) => setNewPackage(e.target.value)}
                    />
                    <Button type="submit" variant="contained" className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold px-4" aria-label="Add package">
                      <Plus className="w-5 h-5" />
                    </Button>
                  </form>

                  <List className="max-h-48 overflow-y-auto bg-black/40 rounded border border-gray-900/60 p-0 divide-y divide-gray-900">
                    {packages.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-xs">No active packages templates registered</div>
                    ) : (
                      packages.map((pkg) => (
                        <ListItem key={pkg} className="py-2.5 px-4 flex justify-between items-center hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-3">
                            <Layers className="w-4 h-4 text-gray-500" />
                            <span className="text-xs text-gray-200 font-medium">{pkg}</span>
                          </div>
                          <IconButton
                            edge="end"
                            aria-label="delete package"
                            onClick={() => handleRemovePackage(pkg)}
                            className="text-red-500/70 hover:text-red-500"
                            size="small"
                          >
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </ListItem>
                      ))
                    )}
                  </List>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'whatsapp' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Smartphone className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    WhatsApp CRM & Automations
                  </Typography>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <TextField
                    fullWidth
                    label="WhatsApp Business Display Name (Sender Identity)"
                    value={whatsappBusinessName}
                    onChange={(e) => setWhatsappBusinessName(e.target.value)}
                    placeholder="e.g. Asmaul Production"
                  />
                  
                  <div className="space-y-4 pt-2 flex flex-col">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoBookingConfirmation}
                          onChange={(e) => setAutoBookingConfirmation(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography className="text-xs text-gray-200 font-bold uppercase tracking-wider">
                          Auto-prepare confirmation message on intake
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoPaymentConfirmation}
                          onChange={(e) => setAutoPaymentConfirmation(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography className="text-xs text-gray-200 font-bold uppercase tracking-wider">
                          Auto-prepare payment receipt templates on credit logging
                        </Typography>
                      }
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoReminderMessages}
                          onChange={(e) => setAutoReminderMessages(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography className="text-xs text-gray-200 font-bold uppercase tracking-wider">
                          Enable automatic reminder dispatcher alerts
                        </Typography>
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'message_templates' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <FileText className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Message Templates Management
                  </Typography>
                </div>

                <Typography variant="caption" className="text-gray-500 block text-[11px] leading-relaxed mb-4">
                  Customize the automated WhatsApp templates dispatched to clients. Use double curly braces for freelance placeholders and single curly braces for wedding bookings. Click <b>Restore Default</b> to revert individual templates back to their studio standard at any time.
                </Typography>

                <div className="space-y-6">
                  {/* Wedding Confirmation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Typography className="text-xs text-gray-400 font-medium">Wedding Booking Confirmation Template</Typography>
                      <Button 
                        size="small" 
                        onClick={() => setWhatsappTemplateConfirmation('Hi {customer_name}, your booking {booking_id} with Asmaul Production is confirmed! Total amount: {total_amount}. Thank you!')}
                        className="text-[10px] text-[#D4AF37] capitalize min-w-0 p-0 hover:underline"
                        startIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Restore Default
                      </Button>
                    </div>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={whatsappTemplateConfirmation}
                      onChange={(e) => setWhatsappTemplateConfirmation(e.target.value)}
                      placeholder="e.g. Hi {customer_name}, your booking {booking_id}..."
                    />
                    <Typography className="text-[10px] text-gray-500">
                      Placeholders: <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{customer_name}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{booking_id}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{total_amount}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{wedding_date}'}</code>
                    </Typography>
                  </div>

                  <Divider className="border-gray-800" />

                  {/* Wedding Payment Confirmation */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Typography className="text-xs text-gray-400 font-medium">Wedding Payment Confirmation Receipt Template</Typography>
                      <Button 
                        size="small" 
                        onClick={() => setWhatsappTemplatePayment('Hi {customer_name}, we have received your payment of {paid_amount} for booking {booking_id}. Outstanding balance: {outstanding_amount}. Thank you!')}
                        className="text-[10px] text-[#D4AF37] capitalize min-w-0 p-0 hover:underline"
                        startIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Restore Default
                      </Button>
                    </div>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={whatsappTemplatePayment}
                      onChange={(e) => setWhatsappTemplatePayment(e.target.value)}
                      placeholder="e.g. Hi {customer_name}, we have received your payment..."
                    />
                    <Typography className="text-[10px] text-gray-500">
                      Placeholders: <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{customer_name}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{booking_id}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{paid_amount}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{outstanding_amount}'}</code>
                    </Typography>
                  </div>

                  <Divider className="border-gray-800" />

                  {/* Wedding Upcoming Reminder */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Typography className="text-xs text-gray-400 font-medium">Wedding Upcoming Event Alert / Reminder Template</Typography>
                      <Button 
                        size="small" 
                        onClick={() => setWhatsappTemplateReminder('Hi {customer_name}, this is a gentle reminder for your upcoming wedding shoot on {wedding_date}. We look forward to capturing your special day!')}
                        className="text-[10px] text-[#D4AF37] capitalize min-w-0 p-0 hover:underline"
                        startIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Restore Default
                      </Button>
                    </div>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={whatsappTemplateReminder}
                      onChange={(e) => setWhatsappTemplateReminder(e.target.value)}
                      placeholder="e.g. Hi {customer_name}, this is a gentle reminder..."
                    />
                    <Typography className="text-[10px] text-gray-500">
                      Placeholders: <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{customer_name}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{wedding_date}'}</code>
                    </Typography>
                  </div>

                  <Divider className="border-gray-800" />

                  {/* Freelance Jobs Confirmation Template */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Typography className="text-xs text-gray-400 font-medium">Freelance Job Confirmation Dispatcher Template</Typography>
                      <Button 
                        size="small" 
                        onClick={() => setFreelanceWhatsappTemplate('Hello {{Contact Person}},\n\nThank you for booking me as your freelance photographer.\n\nBooking Details:\n\n📅 Event Date:\n{{Event Date}}\n\n🎉 Events:\n{{Event Types}}\n\n📍 Location:\n{{Location}}\n\n💰 Total Amount:\n{{Total Amount}}\n\n💵 Advance:\n{{Advance}}\n\n💳 Due:\n{{Due Amount}}\n\nPlease find your Freelance Booking Confirmation PDF attached.\n\nThank you.\n\nRegards,\n{{Studio Name}}')}
                        className="text-[10px] text-[#D4AF37] capitalize min-w-0 p-0 hover:underline"
                        startIcon={<RotateCcw className="w-3 h-3" />}
                      >
                        Restore Default
                      </Button>
                    </div>
                    <TextField
                      fullWidth
                      multiline
                      rows={10}
                      value={freelanceWhatsappTemplate}
                      onChange={(e) => setFreelanceWhatsappTemplate(e.target.value)}
                      placeholder="Hello {{Contact Person}}..."
                    />
                    <Typography className="text-[10px] text-gray-500">
                      Placeholders: <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Contact Person}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Event Date}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Event Types}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Location}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Total Amount}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Advance}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Due Amount}}'}</code>, <code className="text-[#D4AF37] bg-black/40 px-1 py-0.5 rounded font-mono">{'{{Studio Name}}'}</code>
                    </Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'telegram' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Bell className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    🔔 Telegram Notifications
                  </Typography>
                </div>

                <div className="space-y-6">
                  {/* Toggle */}
                  <FormControlLabel
                    control={
                      <Switch
                        checked={telegramEnabled}
                        onChange={(e) => setTelegramEnabled(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: '#D4AF37' },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#D4AF37' },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" className="text-white font-bold text-xs uppercase tracking-wider">
                          Enable Telegram Notifications
                        </Typography>
                        <Typography variant="caption" className="text-gray-500 text-[10px] block">
                          Receive instant, automated updates on bookings, payments, and reminders
                        </Typography>
                      </Box>
                    }
                  />

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <TextField
                      fullWidth
                      label="Telegram Bot Token"
                      type={showBotToken ? "text" : "password"}
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="e.g. 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      disabled={!telegramEnabled}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowBotToken(!showBotToken)}
                                edge="end"
                                className="text-gray-400 hover:text-white"
                                disabled={!telegramEnabled}
                              >
                                {showBotToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }
                      }}
                      sx={{
                        '& .MuiInputLabel-root': { color: 'gray' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#D4AF37' },
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(212,175,55,0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(212,175,55,0.4)' },
                          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Telegram Chat ID"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="e.g. -100123456789 or 123456789"
                      disabled={!telegramEnabled}
                      sx={{
                        '& .MuiInputLabel-root': { color: 'gray' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#D4AF37' },
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(212,175,55,0.2)' },
                          '&:hover fieldset': { borderColor: 'rgba(212,175,55,0.4)' },
                          '&.Mui-focused fieldset': { borderColor: '#D4AF37' },
                        }
                      }}
                    />
                  </div>

                  {/* Notification Categories */}
                  <div className="border-t border-[#D4AF37]/10 pt-4 space-y-4">
                    <Typography variant="body2" className="text-[#D4AF37] font-bold text-xs uppercase tracking-wider block mb-2">
                      Notification Preferences
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramBookingNotifications}
                            onChange={(e) => setTelegramBookingNotifications(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Booking Notifications
                          </Typography>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramPaymentNotifications}
                            onChange={(e) => setTelegramPaymentNotifications(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Payment Notifications
                          </Typography>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramReminderNotifications}
                            onChange={(e) => setTelegramReminderNotifications(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Reminder Notifications
                          </Typography>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramAlbumNotifications}
                            onChange={(e) => setTelegramAlbumNotifications(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Album Notifications
                          </Typography>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramDeliveryNotifications}
                            onChange={(e) => setTelegramDeliveryNotifications(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Delivery Notifications
                          </Typography>
                        }
                      />

                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={telegramDailySummary}
                            onChange={(e) => setTelegramDailySummary(e.target.checked)}
                            disabled={!telegramEnabled}
                            sx={{
                              color: 'rgba(212,175,55,0.4)',
                              '&.Mui-checked': { color: '#D4AF37' },
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" className="text-white text-xs font-medium">
                            Daily Summary
                          </Typography>
                        }
                      />
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-900 justify-between items-center">
                    <div className="flex gap-3">
                      <Button
                        variant="outlined"
                        onClick={handleTestConnection}
                        disabled={!telegramEnabled || !telegramBotToken || !telegramChatId || connectionStatus === 'testing'}
                        className={`text-xs h-9 uppercase font-bold tracking-wider px-4 ${
                          connectionStatus === 'success' ? 'border-green-500 text-green-400 bg-green-500/10' :
                          connectionStatus === 'error' ? 'border-red-500 text-red-400 bg-red-500/10' :
                          'border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                        }`}
                        sx={{ textTransform: 'none' }}
                      >
                        {connectionStatus === 'testing' ? <CircularProgress size={16} color="inherit" className="mr-2" /> : null}
                        {connectionStatus === 'success' ? '✅ Connected Successfully' :
                         connectionStatus === 'error' ? '❌ Invalid Bot Token / Chat ID' :
                         'Test Connection'}
                      </Button>

                      <Button
                        variant="outlined"
                        onClick={handleSendTestMessage}
                        disabled={!telegramEnabled || !telegramBotToken || !telegramChatId || testMessageStatus === 'sending'}
                        className={`text-xs h-9 uppercase font-bold tracking-wider px-4 ${
                          testMessageStatus === 'success' ? 'border-green-500 text-green-400 bg-green-500/10' :
                          testMessageStatus === 'error' ? 'border-red-500 text-red-400 bg-red-500/10' :
                          'border-gray-800 text-gray-400 hover:border-gray-600'
                        }`}
                        sx={{ textTransform: 'none' }}
                      >
                        {testMessageStatus === 'sending' ? <CircularProgress size={16} color="inherit" className="mr-2" /> : null}
                        {testMessageStatus === 'success' ? '✅ Test Message Sent' :
                         testMessageStatus === 'error' ? '❌ Failed to Send' :
                         'Send Test Message'}
                      </Button>
                    </div>

                    <Button
                      variant="contained"
                      onClick={handleSaveTelegramSettings}
                      disabled={saveTelegramStatus === 'saving'}
                      startIcon={saveTelegramStatus === 'saving' ? <CircularProgress size={14} color="inherit" /> : <Save className="w-4 h-4" />}
                      className={`text-xs h-9 uppercase font-extrabold tracking-widest px-6 shadow-md ${
                        saveTelegramStatus === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        saveTelegramStatus === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        'bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] hover:opacity-90 text-black'
                      }`}
                      sx={{ textTransform: 'none' }}
                    >
                      {saveTelegramStatus === 'saving' ? 'Saving Settings...' :
                       saveTelegramStatus === 'success' ? 'Settings Saved!' :
                       saveTelegramStatus === 'error' ? 'Failed to Save' :
                       'Save Settings'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'payments' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Billing & Banking Matrices
                  </Typography>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <TextField
                      select
                      fullWidth
                      label="ISO Currency Suite"
                      value={currencyCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        setCurrencyCode(code);
                        const symbols: Record<string, string> = {
                          USD: '$', GBP: '£', EUR: '€', INR: '₹', JPY: '¥', AUD: 'A$', CAD: 'C$'
                        };
                        if (symbols[code]) setCurrencySymbol(symbols[code]);
                      }}
                    >
                      <MenuItem value="USD">USD ($)</MenuItem>
                      <MenuItem value="EUR">EUR (€)</MenuItem>
                      <MenuItem value="GBP">GBP (£)</MenuItem>
                      <MenuItem value="INR">INR (₹)</MenuItem>
                      <MenuItem value="JPY">JPY (¥)</MenuItem>
                    </TextField>
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Currency Symbol Matcher"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                    />
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Business UPI Identifier"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. studio@upi"
                    />
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Suite Invoice Number Prefix"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="e.g. INV-2026-"
                    />
                  </div>
                </div>

                <Divider className="border-gray-800" />
                <Typography variant="subtitle2" className="text-white uppercase tracking-wider text-[11px] font-bold">
                  Corporate Bank Registry Accounts
                </Typography>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <TextField
                      fullWidth
                      label="Financial Bank Institution"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Bank of Luxury"
                    />
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Corporate Account Number"
                      value={bankAccountNo}
                      onChange={(e) => setBankAccountNo(e.target.value)}
                      placeholder="e.g. 123456789"
                    />
                  </div>

                  <div>
                    <TextField
                      fullWidth
                      label="Bank routing IFSC Code"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                      placeholder="e.g. SBIN0001234"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <TextField
                      fullWidth
                      label="Default Invoice Terms, Legal & Conditions Notes"
                      multiline
                      rows={3}
                      value={invoiceTerms}
                      onChange={(e) => setInvoiceTerms(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <Users className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Team & Creative Staff Directory
                  </Typography>
                </div>

                <form onSubmit={handleAddTeamMember} className="p-4 bg-black/40 border border-[#D4AF37]/10 rounded-lg space-y-3">
                  <Typography className="text-white text-xs uppercase tracking-widest font-black mb-1">Add Studio Specialist</Typography>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <TextField
                        fullWidth
                        size="small"
                        label="Specialist Name"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="e.g. Christian Dior"
                      />
                    </div>
                    <div>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Creative Specialist Role"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value as any)}
                      >
                        <MenuItem value="Photographer">📷 Lead Photographer</MenuItem>
                        <MenuItem value="Cinematographer">🎥 Lead Cinematographer</MenuItem>
                        <MenuItem value="Drone Operator">✈️ Drone Commander</MenuItem>
                        <MenuItem value="Editor">🖥️ Chief Video Editor</MenuItem>
                        <MenuItem value="Manager">💼 Accounts Manager</MenuItem>
                      </TextField>
                    </div>
                    <div className="flex gap-2">
                      <TextField
                        fullWidth
                        size="small"
                        label="Phone / Mobile Link"
                        value={newMemberPhone}
                        onChange={(e) => setNewMemberPhone(e.target.value)}
                        placeholder="+1 (555) 555-5555"
                      />
                      <Button type="submit" variant="contained" className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold h-10 px-4 min-w-[48px]">
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Directory List of Specialists with assignment tracking */}
                <List className="max-h-[500px] overflow-y-auto bg-black/30 rounded border border-gray-900/60 p-0 divide-y divide-gray-900">
                  {teamMembers.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs">No active staff specialists registered. Add someone above.</div>
                  ) : (
                    teamMembers.map((member) => {
                      // Match assignments in database
                      const assigned = bookings.filter(b => b.assignedFreelancers?.includes(member.name) || (b.type === 'freelancer' && b.photographer === member.name));
                      const isExpanded = expandedMember === member.id;

                      return (
                        <React.Fragment key={member.id}>
                          <ListItem
                            className="py-3 px-4 hover:bg-white/5 transition-colors cursor-pointer flex justify-between items-center"
                            onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                          >
                            <div className="flex items-center gap-3">
                              {member.role === 'Photographer' ? <Camera className="w-4 h-4 text-gray-400" /> :
                               member.role === 'Cinematographer' ? <Video className="w-4 h-4 text-gray-400" /> :
                               member.role === 'Drone Operator' ? <Plane className="w-4 h-4 text-gray-400" /> :
                               <User className="w-4 h-4 text-gray-400" />}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-100 font-bold">{member.name}</span>
                                  <span className="text-[9px] bg-gray-800 text-gray-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    {member.role}
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono block">{member.phone || 'No phone logged'}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Chip
                                label={`${assigned.length} assigned`}
                                size="small"
                                className={`text-[8px] h-4 uppercase tracking-wider font-bold px-1.5 ${
                                  assigned.length > 0 ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-gray-900 text-gray-500'
                                }`}
                              />
                              {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              <IconButton
                                edge="end"
                                aria-label="delete specialist"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTeamMember(member.id, member.name, member.role);
                                }}
                                className="text-red-500/70 hover:text-red-500"
                                size="small"
                              >
                                <Trash2 className="w-4 h-4" />
                              </IconButton>
                            </div>
                          </ListItem>

                          {/* Expanded Assignments list */}
                          {isExpanded && (
                            <div className="bg-black/40 px-4 py-3 border-t border-b border-gray-900/40 space-y-2">
                              <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-widest block border-b border-[#D4AF37]/10 pb-1">
                                Assignment Logs
                              </span>
                              {assigned.length === 0 ? (
                                <div className="text-gray-500 text-xs italic py-1 pl-2">No active assignments located for this specialist.</div>
                              ) : (
                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                  {assigned.map((booking) => (
                                    <div key={booking.id} className="p-3 bg-[#141413] rounded border border-[#D4AF37]/10 flex flex-col space-y-2">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-white font-bold">{booking.clientName}</span>
                                        <span className="text-[10px] font-mono text-gray-400">
                                          {booking.weddingDate.split('-').length === 3 
                                            ? `${booking.weddingDate.split('-')[2]}/${booking.weddingDate.split('-')[1]}/${booking.weddingDate.split('-')[0]}` 
                                            : booking.weddingDate}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center text-[10px] text-gray-500">
                                        <span>Venue: <strong className="text-gray-300">{booking.venue}</strong></span>
                                        <span className="text-[#D4AF37] font-bold uppercase">{booking.status}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </List>
              </CardContent>
            </Card>
          )}

          {activeTab === 'sync' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <CloudLightning className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Backup Operations & Cloud Sync
                  </Typography>
                </div>

                <div className="space-y-4">
                  <Typography variant="body2" className="text-gray-300 text-xs leading-relaxed">
                    {settings.studioName} features an offline-first architecture. It synchronizes automatically in the background. However, you can trigger a manual cloud sync or back up your system offline at any time.
                  </Typography>

                  <div className="p-4 bg-black/40 border border-[#D4AF37]/10 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-0.5">
                      <span className="text-white text-xs font-bold uppercase tracking-wider block">Automatic Real-Time Sync</span>
                      <span className="text-gray-500 text-[11px] block">Upload change logs to secure Firestore database instantly.</span>
                    </div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSync}
                          onChange={(e) => setAutoSync(e.target.checked)}
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </div>
                </div>

                <Divider className="border-gray-800" />

                <div className="space-y-3">
                  <span className="text-white text-xs font-bold uppercase tracking-wider block">Database Actions & Transfers</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="contained"
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      startIcon={isSyncing ? <CircularProgress size={16} /> : <Cloud className="w-4 h-4" />}
                      className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold text-xs py-3"
                    >
                      {isSyncing ? 'Synchronizing Cloud...' : 'Trigger Sync & Backup to Firebase'}
                    </Button>

                    <Button
                      variant="outlined"
                      onClick={handleExportData}
                      startIcon={<Download className="w-4 h-4" />}
                      className="border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs py-3"
                    >
                      Export Full Suite Backup (JSON)
                    </Button>

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<Upload className="w-4 h-4" />}
                      className="border-[#D4AF37]/35 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-xs py-3"
                    >
                      Import & Restore Suite Backup (JSON)
                      <input type="file" accept=".json" hidden onChange={handleImportData} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'account' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <User className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    Account, Authentication & Credentials
                  </Typography>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex flex-col items-center">
                    {/* User profile representation */}
                    <div className="w-20 h-20 bg-gradient-to-tr from-[#D4AF37] to-[#AA7C11] rounded-full flex items-center justify-center border-2 border-black shadow-xl mb-2 text-black font-serif text-3xl font-bold uppercase">
                      {user?.displayName ? user.displayName.slice(0, 2) : (settings.studioName.slice(0, 2).toUpperCase() || 'AP')}
                    </div>
                  </div>

                  <div className="space-y-2 flex-grow text-center md:text-left">
                    <Typography variant="h6" className="text-white font-bold text-sm tracking-wide">
                      {user?.displayName || 'Administrator Account'}
                    </Typography>
                    <Typography variant="body2" className="text-gray-400 text-xs">
                      Registered Email: <strong className="text-gray-200">{user?.email || `admin@${settings.website || 'asmaulproduction.com'}`}</strong>
                    </Typography>
                    <Typography variant="caption" className="text-gray-500 font-bold uppercase tracking-widest block text-[9px]">
                      Access Level: Owner / Managing Director
                    </Typography>
                  </div>
                </div>

                <Divider className="border-gray-800" />

                <div className="space-y-3">
                  <span className="text-white text-xs font-bold uppercase tracking-wider block">OAuth & Login Credentials</span>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="contained"
                      onClick={() => setPasswordDialogOpen(true)}
                      startIcon={<Lock className="w-4 h-4" />}
                      className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs"
                    >
                      Change Security Password
                    </Button>

                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to log out of current terminal?')) {
                          logout();
                        }
                      }}
                      className="bg-red-950 hover:bg-red-900 border border-red-500/20 text-red-100 font-bold text-xs"
                    >
                      Disconnect Terminal (Logout)
                    </Button>
                  </div>

                  <div className="p-3 bg-black/40 border border-gray-900 rounded-lg flex items-center justify-between text-xs text-gray-400">
                    <span>Google Account Sync Status</span>
                    <div className="flex items-center gap-1 text-emerald-400 font-bold uppercase text-[9px] tracking-wider">
                      <Check className="w-3.5 h-3.5" /> Synchronized
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'about' && (
            <Card className="border border-[#D4AF37]/15 shadow-xl bg-[#141413]">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-2 border-b border-[#D4AF37]/10 pb-3">
                  <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
                  <Typography variant="subtitle1" className="font-bold text-white tracking-wider font-serif uppercase text-sm">
                    About Control Suite & Support
                  </Typography>
                </div>

                <div className="flex flex-col items-center py-6 text-center space-y-2">
                  <span className="text-4xl">🔱</span>
                  <Typography className="text-gold-gradient font-serif font-bold text-lg tracking-widest uppercase">{settings.studioName}</Typography>
                  <Typography className="text-gray-400 text-xs font-mono uppercase tracking-widest">Studio Production Suite v2.4.0</Typography>
                  <Typography className="text-gray-600 text-[10px] uppercase">Offline-First Secured Blockchain Sync</Typography>
                </div>

                <Divider className="border-gray-800" />

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outlined"
                    onClick={() => setAboutDialogOpen('privacy')}
                    className="border-gray-800 text-gray-400 hover:border-gray-700 text-xs font-bold"
                  >
                    Privacy Statement
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setAboutDialogOpen('terms')}
                    className="border-gray-800 text-gray-400 hover:border-gray-700 text-xs font-bold"
                  >
                    Terms & Conditions
                  </Button>

                  <Button
                    variant="contained"
                    component="a"
                    href={`mailto:support@${settings.website || 'asmaulproduction.com'}`}
                    className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold text-xs"
                  >
                    Contact Live Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* --- PASSWORD DIALOG --- */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      >
        <div className="bg-[#141413] border border-[#D4AF37]/30 text-white max-w-sm w-full p-6 rounded-lg shadow-xl">
          <Typography variant="h6" className="font-serif font-bold uppercase text-[#D4AF37] text-sm tracking-wider border-b border-gray-900 pb-3 mb-4">
            Update Security Credentials
          </Typography>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-950/20 border border-red-500/20 rounded text-red-200 text-xs">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-200 text-xs">
                Credentials updated successfully. Locking keys.
              </div>
            )}
            
            <TextField
              fullWidth
              type="password"
              label="New Access Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            
            <div className="flex justify-end gap-2 border-t border-gray-900 pt-3 mt-4">
              <Button onClick={() => setPasswordDialogOpen(false)} className="text-gray-400 hover:text-white text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="contained" className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold text-xs">
                Confirm New Keys
              </Button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* --- ABOUT DIALOGS --- */}
      <Dialog
        open={aboutDialogOpen !== null}
        onClose={() => setAboutDialogOpen(null)}
      >
        <div className="bg-[#141413] border border-[#D4AF37]/30 text-white max-w-md w-full p-6 rounded-lg shadow-xl">
          <Typography variant="h6" className="font-serif font-bold uppercase text-[#D4AF37] text-sm tracking-wider border-b border-gray-900 pb-3 mb-4">
            {aboutDialogOpen === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
          </Typography>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2 mb-4">
            {aboutDialogOpen === 'privacy' ? (
              <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                <p className="font-bold text-gray-200">1. Information We Sync</p>
                <p>We sync and backup metadata including Studio names, pricing models, photographers directories, and contract structures exclusively within your secured private cloud sandbox.</p>
                <p className="font-bold text-gray-200">2. Encryption & Local Vault</p>
                <p>All data is secured using standard IndexedDB technology locally on device, backed by secure Firestore databases with custom security roles.</p>
                <p className="font-bold text-gray-200">3. Support Contacts</p>
                <p>For deletion requests or workspace purge orders, please contact {`security@${settings.website || 'asmaulproduction.com'}`}.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                <p className="font-bold text-gray-200">1. Intellectual Ownership</p>
                <p>This software operates under the {settings.studioName} Production License. Re-distribution or source modifications outside verified AI Studio Workspace projects is strictly prohibited.</p>
                <p className="font-bold text-gray-200">2. Real-time Synced Datasets</p>
                <p>Users are responsible for backing up JSON datasets locally if they disable background cloud syncing services.</p>
                <p className="font-bold text-gray-200">3. Operational Integrity</p>
                <p>The platform is provided "as is" with zero-tolerance policy towards fraudulent contract creations or invoice modifications.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end border-t border-gray-900 pt-3">
            <Button onClick={() => setAboutDialogOpen(null)} className="bg-[#D4AF37] hover:bg-[#AA7C11] text-black font-bold text-xs px-4">
              Acknowledge
            </Button>
          </div>
        </div>
      </Dialog>
    </Box>
  );
};
