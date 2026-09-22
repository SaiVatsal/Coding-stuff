import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ full_name: fullName, phone });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="bg-white p-6 border border-luxury-border space-y-6 max-w-2xl">
      <div className="pb-3 border-b border-luxury-border">
        <h2 className="font-serif text-xl text-luxury-dark font-semibold">Profile Settings</h2>
        <p className="text-xs text-luxury-muted">Update your contact information and preferences</p>
      </div>

      {isSaved && (
        <div className="p-3 bg-luxury-green-light border border-luxury-green/30 text-luxury-green text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile details successfully updated.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Account Email"
          disabled
          value={user?.email || 'customer@nitrohub.in'}
          helperText="Email is linked to your Supabase credentials and cannot be modified."
        />

        <Input
          label="Full Name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Primary Mobile Phone"
          placeholder="e.g. 9876543210"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <div className="pt-2">
          <Button type="submit" variant="primary" size="md">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};
