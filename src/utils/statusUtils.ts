import { Booking } from '../types';

export const getStatusLabel = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'Confirmed';
    case 'completed':
      return 'Completed';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'In Progress';
    case 'cancelled':
      return 'Cancelled';
    case 'pending':
    default:
      return 'Pending';
  }
};

export const getStatusChipColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      // Confirmed = Yellow (#EAB308) with Black text
      return '!bg-[#EAB308] !text-black !border-transparent !rounded-full font-bold';
    case 'completed':
      // Completed = Green (#22C55E) with White text
      return '!bg-[#22C55E] !text-white !border-transparent !rounded-full font-bold';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      // In Progress = Blue (#3B82F6) with White text
      return '!bg-[#3B82F6] !text-white !border-transparent !rounded-full font-bold';
    case 'cancelled':
      // Cancelled = Red (#EF4444) with White text
      return '!bg-[#EF4444] !text-white !border-transparent !rounded-full font-bold';
    case 'pending':
    default:
      // Pending = Gray (#9CA3AF) with White text
      return '!bg-[#9CA3AF] !text-white !border-transparent !rounded-full font-bold';
  }
};

export const getStatusDotColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'bg-[#EAB308]';
    case 'completed':
      return 'bg-[#22C55E]';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'bg-[#3B82F6]';
    case 'cancelled':
      return 'bg-[#EF4444]';
    case 'pending':
    default:
      return 'bg-[#9CA3AF]';
  }
};

export const getStatusTextColor = (status: Booking['status'] | string): string => {
  switch (status) {
    case 'confirmed':
      return 'text-[#EAB308]';
    case 'completed':
      return 'text-[#22C55E]';
    case 'in_progress':
    case 'in-progress':
    case 'in progress':
      return 'text-[#3B82F6]';
    case 'cancelled':
      return 'text-[#EF4444]';
    case 'pending':
    default:
      return 'text-[#9CA3AF]';
  }
};
