import React, { createContext, useContext, useState, useEffect } from 'react';
import { offlineService } from '../services/offlineService';

export interface BrandSettings {
  studioName: string;
  studioTagline: string;
  themeColor: 'gold' | 'emerald' | 'sapphire' | 'amethyst' | 'rose' | 'silver' | 'crimson';
  currencySymbol: string;
  currencyCode: string;
  photographers: string[];
  packages: string[];
  studioEmail: string;
  studioPhone: string;
  studioAddress: string;
  userId?: string;
  updatedAt?: number;
  studioLogo?: string;
  authorizedSignature?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  website?: string;

  // NEW Business Profile Fields
  coverPhoto?: string;
  ownerName?: string;
  googleMapsLocation?: string;

  // NEW Branding Fields
  appIcon?: string;
  appIconUrl?: string;
  themeMode?: 'light' | 'dark';
  fontStyle?: 'serif' | 'sans' | 'mono';

  // NEW Booking Settings
  defaultBookingStatus?: string;
  autoBookingId?: boolean;
  bookingPrefix?: string;
  defaultAdvanceAmount?: number;
  reminderDaysBefore?: number;

  // NEW WhatsApp Settings
  whatsappBusinessName?: string;
  whatsappTemplateConfirmation?: string;
  whatsappTemplatePayment?: string;
  whatsappTemplateReminder?: string;
  autoBookingConfirmation?: boolean;
  autoPaymentConfirmation?: boolean;
  autoReminderMessages?: boolean;

  // NEW Payment Settings
  upiId?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  gstNumber?: string;
  invoicePrefix?: string;
  gstPercentage?: number;
  invoiceTerms?: string;

  // NEW Team Settings lists
  cinematographers?: string[];
  droneOperators?: string[];
  teamMembers?: { id: string; name: string; role: 'Photographer' | 'Cinematographer' | 'Drone Operator' | 'Editor' | 'Manager'; phone?: string }[];

  // NEW Backup & Sync Settings
  autoSync?: boolean;

  // NEW Telegram Settings
  telegramEnabled?: boolean;
  telegramBookingNotifications?: boolean;
  telegramPaymentNotifications?: boolean;
  telegramReminderNotifications?: boolean;
  telegramAlbumNotifications?: boolean;
  telegramDeliveryNotifications?: boolean;
  telegramDailySummary?: boolean;

  // NEW Contact & Social Media Fields
  contactPhone?: string;
  contactWhatsApp?: string;
  contactEmail?: string;
  contactWebsite?: string;
  contactFacebook?: string;
  contactInstagram?: string;
  contactYouTube?: string;
  contactGoogleMaps?: string;
}

export const themeConfigs = {
  crimson: {
    light: '#FF6B6B',
    primary: '#E50914',
    dark: '#5C0606',
    shadow: 'rgba(229, 9, 20, 0.25)',
    name: 'Crimson Noir (Red/Black)'
  },
  gold: {
    light: '#FFFDF0',
    primary: '#D4AF37',
    dark: '#AA7C11',
    shadow: 'rgba(212, 175, 55, 0.2)',
    name: 'Champagne Gold'
  },
  emerald: {
    light: '#E6F4EA',
    primary: '#10B981',
    dark: '#059669',
    shadow: 'rgba(16, 185, 129, 0.2)',
    name: 'Emerald Forest'
  },
  sapphire: {
    light: '#E8F0FE',
    primary: '#3B82F6',
    dark: '#2563EB',
    shadow: 'rgba(59, 130, 246, 0.2)',
    name: 'Sapphire Ocean'
  },
  amethyst: {
    light: '#F3E8FF',
    primary: '#9333EA',
    dark: '#7E22CE',
    shadow: 'rgba(147, 51, 234, 0.2)',
    name: 'Amethyst Nights'
  },
  rose: {
    light: '#FFE4E6',
    primary: '#F43F5E',
    dark: '#E11D48',
    shadow: 'rgba(244, 63, 94, 0.2)',
    name: 'Rose Velvet'
  },
  silver: {
    light: '#F3F4F6',
    primary: '#9CA3AF',
    dark: '#4B5563',
    shadow: 'rgba(156, 163, 175, 0.2)',
    name: 'Sterling Silver'
  }
};

interface BrandContextType {
  settings: BrandSettings;
  updateSettings: (newSettings: Partial<BrandSettings>) => void;
  resetSettings: () => void;
  formatCurrency: (val: number) => string;
}

const defaultSettings: BrandSettings = {
  studioName: 'Asmaul Production',
  studioTagline: 'Cine & Editorial Productions',
  themeColor: 'gold',
  currencySymbol: '₹',
  currencyCode: 'INR',
  photographers: [
    'Asmaul Haque',
    'Rohan Sharma',
    'Arijit Sen',
    'Sneha Paul'
  ],
  packages: [
    'Premium Wedding Cine Suite',
    'Pre-Wedding Love Story',
    'Royal Cinematic Editorial',
    'Custom Elite Package'
  ],
  studioEmail: 'contact@asmaulproduction.com',
  studioPhone: '+91 98765 43210',
  studioAddress: 'Kolkata, West Bengal, India',
  studioLogo: '',
  authorizedSignature: '',
  mobileNumber: '+91 98765 43210',
  whatsappNumber: '+91 98765 43210',
  website: 'www.asmaulproduction.com',

  // Defaults for new fields
  coverPhoto: '',
  ownerName: 'Asmaul Haque',
  googleMapsLocation: 'https://maps.google.com',
  appIcon: '📸',
  appIconUrl: '',
  themeMode: 'dark',
  fontStyle: 'serif',
  defaultBookingStatus: 'pending',
  autoBookingId: true,
  bookingPrefix: 'AP-',
  defaultAdvanceAmount: 10000,
  reminderDaysBefore: 3,
  whatsappBusinessName: 'Asmaul Production',
  whatsappTemplateConfirmation: 'Hi {customer_name}, your booking {booking_id} with Asmaul Production is confirmed! Total amount: {total_amount}. Thank you!',
  whatsappTemplatePayment: 'Hi {customer_name}, we have received your payment of {paid_amount} for booking {booking_id}. Outstanding balance: {outstanding_amount}. Thank you!',
  whatsappTemplateReminder: 'Hi {customer_name}, this is a gentle reminder for your upcoming wedding shoot on {wedding_date}. We look forward to capturing your special day!',
  autoBookingConfirmation: true,
  autoPaymentConfirmation: true,
  autoReminderMessages: true,
  upiId: 'asmaul@upi',
  bankAccountNo: '9876543210',
  bankIfsc: 'BARB0ASMAUL',
  bankName: 'State Bank of India',
  gstNumber: '',
  invoicePrefix: 'INV-2026-',
  gstPercentage: 0,
  invoiceTerms: '1. Advance payment is non-refundable. 2. Remaining balance is due on the day of the event. 3. RAW files will be delivered within 2 weeks.',
  cinematographers: [
    'Marcus Thorne',
    'Evelyn Brooks'
  ],
  droneOperators: [
    'Derek Wright',
    'Liam Foster'
  ],
  teamMembers: [
    { id: '1', name: 'Asmaul Haque', role: 'Photographer', phone: '+91 98765 43210' },
    { id: '2', name: 'Rohan Sharma', role: 'Photographer', phone: '+91 98765 43211' },
    { id: '3', name: 'Marcus Thorne', role: 'Cinematographer', phone: '+91 98765 43212' },
    { id: '4', name: 'Derek Wright', role: 'Drone Operator', phone: '+91 98765 43213' }
  ],
  autoSync: true,
  telegramEnabled: false,
  telegramBookingNotifications: true,
  telegramPaymentNotifications: true,
  telegramReminderNotifications: true,
  telegramAlbumNotifications: true,
  telegramDeliveryNotifications: true,
  telegramDailySummary: true,
  contactPhone: '+91 98765 43210',
  contactWhatsApp: '+91 98765 43210',
  contactEmail: 'contact@asmaulproduction.com',
  contactWebsite: 'https://www.asmaulproduction.com',
  contactFacebook: 'https://facebook.com/asmaulproduction',
  contactInstagram: 'https://instagram.com/asmaulproduction',
  contactYouTube: 'https://youtube.com/asmaulproduction',
  contactGoogleMaps: 'https://maps.google.com'
};

const generateEmojiIcon = (emoji: string, size: number = 192): string => {
  if (typeof window === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const radius = size / 2;
  ctx.beginPath();
  ctx.arc(radius, radius, radius - 4, 0, 2 * Math.PI);
  ctx.fillStyle = '#0D0D0C';
  ctx.fill();
  
  ctx.lineWidth = size * 0.03;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  ctx.font = `${size * 0.55}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, radius, radius + (size * 0.04));

  return canvas.toDataURL('image/png');
};

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export const BrandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<BrandSettings>(() => {
    const saved = localStorage.getItem('asmaul_production_brand_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = { ...defaultSettings, ...parsed, themeColor: 'gold' as const };
        if (!merged.packages || merged.packages.length === 0) {
          merged.packages = [...defaultSettings.packages];
        }
        if (!merged.photographers || merged.photographers.length === 0) {
          merged.photographers = [...defaultSettings.photographers];
        }
        if (!merged.cinematographers || merged.cinematographers.length === 0) {
          merged.cinematographers = [...defaultSettings.cinematographers];
        }
        if (!merged.droneOperators || merged.droneOperators.length === 0) {
          merged.droneOperators = [...defaultSettings.droneOperators];
        }
        if (!merged.teamMembers || merged.teamMembers.length === 0) {
          merged.teamMembers = [...defaultSettings.teamMembers];
        }
        return merged;
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Sync settings with IndexedDB / Firestore reactive listeners
  useEffect(() => {
    let active = true;

    const loadSettingsFromDB = async () => {
      try {
        const idbSettings = await offlineService.getSettings();
        if (idbSettings && active) {
          setSettings(prev => {
            const localUpdated = prev.updatedAt || 0;
            const remoteUpdated = idbSettings.updatedAt || 0;
            if (remoteUpdated > localUpdated) {
              const merged = { ...defaultSettings, ...idbSettings, themeColor: 'gold' as const };
              if (!merged.packages || merged.packages.length === 0) {
                merged.packages = [...defaultSettings.packages];
              }
              if (!merged.photographers || merged.photographers.length === 0) {
                merged.photographers = [...defaultSettings.photographers];
              }
              if (!merged.cinematographers || merged.cinematographers.length === 0) {
                merged.cinematographers = [...defaultSettings.cinematographers];
              }
              if (!merged.droneOperators || merged.droneOperators.length === 0) {
                merged.droneOperators = [...defaultSettings.droneOperators];
              }
              if (!merged.teamMembers || merged.teamMembers.length === 0) {
                merged.teamMembers = [...defaultSettings.teamMembers];
              }
              return merged;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error('Error loading brand settings from IndexedDB:', err);
      }
    };

    loadSettingsFromDB();

    const unsubscribe = offlineService.subscribe(() => {
      loadSettingsFromDB();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('asmaul_production_brand_settings', JSON.stringify(settings));
    
    // Apply dynamic theme properties to document element
    const config = themeConfigs[settings.themeColor] || themeConfigs.gold;
    const root = document.documentElement;
    root.style.setProperty('--color-gold-light', config.light);
    root.style.setProperty('--color-gold', config.primary);
    root.style.setProperty('--color-gold-dark', config.dark);
    root.style.setProperty('--color-gold-shadow', config.shadow);
    
    // Dynamically update document title
    document.title = `${settings.studioName} | Contract & Ledger Management`;

    // Dynamically update favicon, apple touch icon and PWA manifest
    const buster = settings.updatedAt ? `?v=${settings.updatedAt}` : '';
    const iconUrl = settings.appIconUrl 
      ? (settings.appIconUrl.startsWith('data:') ? settings.appIconUrl : `${settings.appIconUrl}${buster}`)
      : generateEmojiIcon(settings.appIcon || '📸', 192);
    const largeIconUrl = settings.appIconUrl 
      ? (settings.appIconUrl.startsWith('data:') ? settings.appIconUrl : `${settings.appIconUrl}${buster}`)
      : generateEmojiIcon(settings.appIcon || '📸', 512);

    let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement;
    let shortcutIconLink = document.querySelector("link[rel='shortcut icon']") as HTMLLinkElement;
    let appleTouchIconLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;

    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      faviconLink.sizes = '192x192';
      document.head.appendChild(faviconLink);
    }
    if (!shortcutIconLink) {
      shortcutIconLink = document.createElement('link');
      shortcutIconLink.rel = 'shortcut icon';
      shortcutIconLink.type = 'image/png';
      document.head.appendChild(shortcutIconLink);
    }
    if (!appleTouchIconLink) {
      appleTouchIconLink = document.createElement('link');
      appleTouchIconLink.rel = 'apple-touch-icon';
      appleTouchIconLink.sizes = '512x512';
      document.head.appendChild(appleTouchIconLink);
    }

    faviconLink.href = iconUrl;
    shortcutIconLink.href = iconUrl;
    appleTouchIconLink.href = largeIconUrl;

    const manifestObj = {
      short_name: settings.studioName,
      name: settings.studioName,
      icons: [
        {
          src: iconUrl,
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: largeIconUrl,
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ],
      start_url: ".",
      background_color: "#0D0D0C",
      theme_color: "#D4AF37",
      display: "standalone",
      orientation: "portrait"
    };

    const stringManifest = JSON.stringify(manifestObj);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    const oldManifestURL = manifestLink?.getAttribute('data-dynamic-manifest');

    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }

    manifestLink.href = manifestURL;
    manifestLink.setAttribute('data-dynamic-manifest', manifestURL);

    if (oldManifestURL) {
      URL.revokeObjectURL(oldManifestURL);
    }

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [settings]);

  const updateSettings = (newSettings: Partial<BrandSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings, updatedAt: Date.now() };
      localStorage.setItem('asmaul_production_brand_settings', JSON.stringify(updated));
      offlineService.saveSettings(updated).catch(err => {
        console.error('Error saving brand settings in updateSettings:', err);
      });
      return updated;
    });
  };

  const resetSettings = () => {
    const updated = { ...defaultSettings, updatedAt: Date.now() };
    localStorage.setItem('asmaul_production_brand_settings', JSON.stringify(updated));
    offlineService.saveSettings(updated).catch(err => {
      console.error('Error saving brand settings in resetSettings:', err);
    });
    setSettings(updated);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currencyCode,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <BrandContext.Provider value={{ settings, updateSettings, resetSettings, formatCurrency }}>
      {children}
    </BrandContext.Provider>
  );
};

export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};
