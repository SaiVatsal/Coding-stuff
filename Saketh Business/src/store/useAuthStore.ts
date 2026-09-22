import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, UserRole, Address } from '../types';

interface AuthStore {
  user: UserProfile | null;
  isAuthenticated: boolean;
  addresses: Address[];
  login: (email: string, role?: UserRole, name?: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  addAddress: (address: Omit<Address, 'id'>) => Address;
  updateAddress: (id: string, address: Partial<Address>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const DEFAULT_ADDRESSES: Address[] = [
  {
    id: 'addr-default-1',
    recipient_name: 'Priya Sharma',
    phone: '9876543210',
    address_line1: 'A-402, Palm Meadows, Varthur Main Road',
    address_line2: 'Near Forum Value Mall',
    landmark: 'Opposite Shell Fuel Station',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560066',
    is_default: true,
  },
];

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: {
        id: 'usr-customer-1',
        email: 'priya.sharma@example.com',
        full_name: 'Priya Sharma',
        phone: '9876543210',
        role: 'customer',
        created_at: '2025-01-10T00:00:00Z',
      },
      isAuthenticated: true,
      addresses: DEFAULT_ADDRESSES,

      login: (email, role = 'customer', name = 'Customer') => {
        const newUser: UserProfile = {
          id: role.includes('admin') ? 'usr-admin-1' : `usr-${Date.now()}`,
          email,
          full_name: role.includes('admin') ? 'Admin Master' : name,
          role,
          created_at: new Date().toISOString(),
        };

        set({
          user: newUser,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      updateProfile: (updated) => {
        const { user } = get();
        if (!user) return;
        set({
          user: {
            ...user,
            ...updated,
            updated_at: new Date().toISOString(),
          },
        });
      },

      addAddress: (newAddr) => {
        const id = `addr-${Date.now()}`;
        const addressWithId: Address = {
          ...newAddr,
          id,
        };

        const current = get().addresses;
        if (addressWithId.is_default || current.length === 0) {
          addressWithId.is_default = true;
          set({
            addresses: [...current.map((a) => ({ ...a, is_default: false })), addressWithId],
          });
        } else {
          set({
            addresses: [...current, addressWithId],
          });
        }
        return addressWithId;
      },

      updateAddress: (id, updated) => {
        set((state) => ({
          addresses: state.addresses.map((a) => {
            if (a.id === id) {
              return { ...a, ...updated };
            }
            if (updated.is_default) {
              return { ...a, is_default: false };
            }
            return a;
          }),
        }));
      },

      deleteAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.filter((a) => a.id !== id),
        }));
      },

      setDefaultAddress: (id) => {
        set((state) => ({
          addresses: state.addresses.map((a) => ({
            ...a,
            is_default: a.id === id,
          })),
        }));
      },
    }),
    {
      name: 'nitro_hub_auth_v1',
    }
  )
);
