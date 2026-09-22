import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Shield, ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SEO } from '../../components/common/SEO';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/account/orders';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Check if admin login
      if (data.email.toLowerCase().includes('admin')) {
        login(data.email, 'super_admin', 'Admin Master');
        navigate('/admin/dashboard');
      } else {
        login(data.email, 'customer', 'Priya Sharma');
        navigate(from);
      }
    }, 600);
  };

  // Quick fill demo accounts
  const fillCustomerDemo = () => {
    setValue('email', 'priya.sharma@example.com');
    setValue('password', 'password123');
  };

  const fillAdminDemo = () => {
    setValue('email', 'admin@nitrohub.in');
    setValue('password', 'adminsecret123');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <SEO title="Sign In — Nitro Hub" />

      <div className="text-center space-y-2">
        <span className="font-brand font-bold text-xl tracking-[0.2em] text-luxury-dark">
          NITRO HUB
        </span>
        <h1 className="font-serif text-3xl text-luxury-dark font-medium">Welcome Back</h1>
        <p className="text-xs text-luxury-muted">
          Sign in to access your orders, wishlist, and saved addresses
        </p>
      </div>

      <div className="bg-white p-8 border border-luxury-border shadow-soft space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail className="w-4 h-4" />}
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted">
                Password *
              </label>
              <Link
                to="/forgot-password"
                className="text-[11px] text-luxury-accent hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full shadow-lift mt-2"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Account
          </Button>
        </form>

        <div className="pt-4 border-t border-luxury-border text-center text-xs text-luxury-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="font-semibold text-luxury-dark hover:text-luxury-accent">
            Create Account
          </Link>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="pt-4 border-t border-luxury-border/60 space-y-2">
          <div className="text-[10px] uppercase font-semibold text-luxury-muted tracking-widest text-center">
            Quick Fill Demo Credentials
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillCustomerDemo}
              className="py-1.5 px-2 bg-luxury-bg-subtle text-[11px] text-luxury-dark hover:bg-luxury-bg-hover border border-luxury-border font-medium transition-colors"
            >
              Customer Demo
            </button>
            <button
              type="button"
              onClick={fillAdminDemo}
              className="py-1.5 px-2 bg-luxury-dark text-[11px] text-luxury-gold hover:bg-luxury-charcoal border border-luxury-dark font-medium transition-colors flex items-center justify-center space-x-1"
            >
              <Shield className="w-3 h-3" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
