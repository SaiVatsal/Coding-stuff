import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SEO } from '../../components/common/SEO';

const signupSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFormData = z.infer<typeof signupSchema>;

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      login(data.email, 'customer', data.full_name);
      navigate('/account/orders');
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <SEO title="Create Account — Nitro Hub" />

      <div className="text-center space-y-2">
        <span className="font-brand font-bold text-xl tracking-[0.2em] text-luxury-dark">
          NITRO HUB
        </span>
        <h1 className="font-serif text-3xl text-luxury-dark font-medium">Join Nitro Hub</h1>
        <p className="text-xs text-luxury-muted">
          Create an account for personalized tracking, wishlist sync, and private drops
        </p>
      </div>

      <div className="bg-white p-8 border border-luxury-border shadow-soft space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name *"
            placeholder="e.g. Priya Sharma"
            leftIcon={<User className="w-4 h-4" />}
            error={errors.full_name?.message}
            {...register('full_name')}
          />

          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="10-Digit Mobile Number *"
            placeholder="e.g. 9876543210"
            leftIcon={<Phone className="w-4 h-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Password *"
            type="password"
            placeholder="At least 6 characters"
            leftIcon={<Lock className="w-4 h-4" />}
            error={errors.password?.message}
            {...register('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-lift mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="pt-4 border-t border-luxury-border text-center text-xs text-luxury-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-luxury-dark hover:text-luxury-accent">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
