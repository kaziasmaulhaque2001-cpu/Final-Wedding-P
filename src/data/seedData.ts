import { Booking, Payment } from '../types';
import { offlineService } from '../services/offlineService';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const SEED_BOOKINGS: Booking[] = [
  {
    id: 'b_1',
    clientName: 'Isabella & Theodore',
    clientEmail: 'isabella.theo@gmail.com',
    clientPhone: '(555) 019-2834',
    weddingDate: '2026-08-15',
    venue: 'The Grand Chateau, Napa Valley',
    packageName: 'Imperial Gold Cinematic',
    totalAmount: 7500,
    paidAmount: 5000,
    status: 'confirmed',
    type: 'production',
    photographer: 'Alexander Sterling (Lead)',
    notes: 'Requires 3 cameras, pre-wedding aerial drone coverage, and deluxe velvet photobook.',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'b_2',
    clientName: 'Victoria & Christian',
    clientEmail: 'victoria.c@elegance.com',
    clientPhone: '(555) 043-9821',
    weddingDate: '2026-09-02',
    venue: 'Biltmore Estate, Asheville',
    packageName: 'Royal Velvet & Frame',
    totalAmount: 9200,
    paidAmount: 9200,
    status: 'completed',
    type: 'production',
    photographer: 'Alexander Sterling (Lead)',
    notes: 'Completed shoot. Highlights film and full album delivered.',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'b_3',
    clientName: 'Evelyn & Marcus',
    clientEmail: 'evelyn.marcus@gmail.com',
    clientPhone: '(555) 088-3412',
    weddingDate: '2026-10-10',
    venue: 'Plaza Hotel Grand Ballroom, NYC',
    packageName: 'Grand Diamond Cinematic',
    totalAmount: 12500,
    paidAmount: 4000,
    status: 'confirmed',
    type: 'production',
    photographer: 'Alexander Sterling (Lead)',
    notes: 'Rehearsal dinner coverage requested. Multi-day shoot.',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'b_4',
    clientName: 'Sophia & Julian',
    clientEmail: 'sophia.julian@weddingwire.com',
    clientPhone: '(555) 012-7744',
    weddingDate: '2026-08-28',
    venue: 'SaddlePeak Mountain Lodge, Malibu',
    packageName: 'Golden Sunset Collection',
    totalAmount: 5800,
    paidAmount: 2000,
    status: 'confirmed',
    type: 'freelancer',
    photographer: 'Marcus Vane (Freelance)',
    notes: 'Sunset ceremony. Freelancer contracted for 8 hours.',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    freelancerRate: 1500,
  },
  {
    id: 'b_5',
    clientName: 'Diana & Arthur',
    clientEmail: 'diana.arthur@romance.net',
    clientPhone: '(555) 039-4455',
    weddingDate: '2026-11-22',
    venue: 'Rosewood Mansion on Turtle Creek, Dallas',
    packageName: 'Classic Emerald Session',
    totalAmount: 4800,
    paidAmount: 1200,
    status: 'pending',
    type: 'freelancer',
    photographer: 'Elena Rostova (Freelance)',
    notes: 'Awaiting formal contract signing. Scheduled for 6 hours coverage.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    freelancerRate: 1200,
  },
  {
    id: 'b_6',
    clientName: 'Camilla & Lucas',
    clientEmail: 'camilla.l@gmail.com',
    clientPhone: '(555) 077-8899',
    weddingDate: '2026-07-25',
    venue: 'The Breakers, Palm Beach',
    packageName: 'Oceanic Prestige Package',
    totalAmount: 8500,
    paidAmount: 0,
    status: 'pending',
    type: 'production',
    photographer: 'Alexander Sterling (Lead)',
    notes: 'Urgent coordination required. Coastal beach shoot.',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  }
];

export const SEED_PAYMENTS: Payment[] = [
  {
    id: 'p_1',
    bookingId: 'b_1',
    clientName: 'Isabella & Theodore',
    amount: 3000,
    date: '2026-06-15',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    notes: 'Initial retainer deposit.',
    createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_2',
    bookingId: 'b_1',
    clientName: 'Isabella & Theodore',
    amount: 2000,
    date: '2026-07-05',
    paymentMethod: 'Credit Card',
    status: 'completed',
    notes: 'Second installment payment.',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_3',
    bookingId: 'b_2',
    clientName: 'Victoria & Christian',
    amount: 5000,
    date: '2026-05-10',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    notes: 'Booking deposit retainer.',
    createdAt: Date.now() - 55 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_4',
    bookingId: 'b_2',
    clientName: 'Victoria & Christian',
    amount: 4200,
    date: '2026-08-01',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    notes: 'Final balance settlement.',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_5',
    bookingId: 'b_3',
    clientName: 'Evelyn & Marcus',
    amount: 4000,
    date: '2026-07-01',
    paymentMethod: 'Bank Transfer',
    status: 'completed',
    notes: 'Premium retainer deposit.',
    createdAt: Date.now() - 9 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_6',
    bookingId: 'b_4',
    clientName: 'Sophia & Julian',
    amount: 2000,
    date: '2026-06-28',
    paymentMethod: 'PayPal',
    status: 'completed',
    notes: 'Retainer payment.',
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'p_7',
    bookingId: 'b_5',
    clientName: 'Diana & Arthur',
    amount: 1200,
    date: '2026-07-08',
    paymentMethod: 'Cash',
    status: 'completed',
    notes: 'Initial booking retainer.',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  }
];

export async function seedDatabaseIfEmpty() {
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const initKey = `vowsgold_db_initialized_${currentUser.uid}`;

  // If already initialized on this client, NEVER seed again
  if (localStorage.getItem(initKey) === 'true') {
    console.log('Database already initialized. Skipping seed.');
    return;
  }
  
  // If user is online and authenticated, check Firestore first to prevent overwriting/re-seeding existing accounts
  if (navigator.onLine) {
    try {
      const bookingsCol = collection(db, 'bookings');
      const q = query(bookingsCol, where('userId', '==', currentUser.uid));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        console.log('User has existing bookings in Firestore. Skipping seed.');
        localStorage.setItem(initKey, 'true');
        // Make sure our local DB gets synced by pulling
        await offlineService.syncAll();
        return;
      }
    } catch (error) {
      console.error('Error checking Firestore for seed database:', error);
      // If we are authenticated and online but checking fails, safety first: skip seeding to avoid corrupting remote data.
      return;
    }
  }

  const currentBookings = await offlineService.getBookings();
  if (currentBookings.length === 0) {
    console.log('IndexedDB and Firestore are empty, seeding beautiful luxury photography data...');
    
    // Save all bookings
    for (const booking of SEED_BOOKINGS) {
      await offlineService.addBooking(booking);
    }

    // Save all payments
    for (const payment of SEED_PAYMENTS) {
      await offlineService.addPayment(payment);
    }
    
    console.log('Seeding finished successfully!');
  }
  
  // Mark as initialized so we never seed again
  localStorage.setItem(initKey, 'true');
}
