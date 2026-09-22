import React, { useState } from 'react';
import { Users, Search, ShoppingBag, Mail, Phone, Calendar } from 'lucide-react';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';

interface CustomerMetric {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  ordersCount: number;
  lifetimeSpend: number;
  lastOrderDate: string;
  joinedDate: string;
}

const SEED_CUSTOMERS: CustomerMetric[] = [
  {
    id: 'c-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 98765 43210',
    city: 'Bengaluru, Karnataka',
    ordersCount: 4,
    lifetimeSpend: 11492,
    lastOrderDate: '2025-02-18',
    joinedDate: '2024-11-10',
  },
  {
    id: 'c-2',
    name: 'Arjun Verma',
    email: 'arjun.verma@example.com',
    phone: '+91 98112 23344',
    city: 'Mumbai, Maharashtra',
    ordersCount: 2,
    lifetimeSpend: 4798,
    lastOrderDate: '2025-02-23',
    joinedDate: '2025-01-05',
  },
  {
    id: 'c-3',
    name: 'Ananya Raghavan',
    email: 'ananya.r@example.com',
    phone: '+91 94441 89012',
    city: 'Chennai, Tamil Nadu',
    ordersCount: 3,
    lifetimeSpend: 6897,
    lastOrderDate: '2025-02-15',
    joinedDate: '2024-12-01',
  },
  {
    id: 'c-4',
    name: 'Devika Sen',
    email: 'devika.sen@example.com',
    phone: '+91 98300 12345',
    city: 'Kolkata, West Bengal',
    ordersCount: 1,
    lifetimeSpend: 1999,
    lastOrderDate: '2025-02-01',
    joinedDate: '2025-01-28',
  },
  {
    id: 'c-5',
    name: 'Rohan Mathur',
    email: 'rohan.m@example.com',
    phone: '+91 99800 54321',
    city: 'Bengaluru, Karnataka',
    ordersCount: 3,
    lifetimeSpend: 7497,
    lastOrderDate: '2025-02-10',
    joinedDate: '2024-10-15',
  },
];

export const CustomersList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = SEED_CUSTOMERS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-luxury-border flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
            Customer Directory
          </h1>
          <p className="text-xs text-luxury-muted">
            Customer order frequency, lifetime revenue contribution, and location metrics
          </p>
        </div>
      </div>

      <div className="bg-white p-4 border border-luxury-border flex items-center justify-between shadow-soft">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search customers by name, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-luxury-muted">
          Total Patrons: <strong>{SEED_CUSTOMERS.length}</strong>
        </div>
      </div>

      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Customer Name</th>
              <th className="p-3.5">Contact Details</th>
              <th className="p-3.5">Location</th>
              <th className="p-3.5 text-center">Orders</th>
              <th className="p-3.5 text-right">Lifetime Spend (₹)</th>
              <th className="p-3.5">Last Order</th>
              <th className="p-3.5">Joined Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                <td className="p-3.5">
                  <div className="font-serif font-semibold text-luxury-dark text-sm">{c.name}</div>
                  <Badge variant="verified" className="mt-0.5">Verified Patron</Badge>
                </td>

                <td className="p-3.5 text-luxury-muted">
                  <div className="text-luxury-dark font-medium">{c.email}</div>
                  <div className="text-[11px]">{c.phone}</div>
                </td>

                <td className="p-3.5 text-luxury-muted">{c.city}</td>

                <td className="p-3.5 text-center font-bold text-luxury-dark">
                  {c.ordersCount}
                </td>

                <td className="p-3.5 text-right font-serif font-bold text-luxury-green text-sm">
                  ₹{c.lifetimeSpend.toLocaleString('en-IN')}
                </td>

                <td className="p-3.5 text-luxury-muted whitespace-nowrap">
                  {new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>

                <td className="p-3.5 text-luxury-muted whitespace-nowrap">
                  {new Date(c.joinedDate).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
