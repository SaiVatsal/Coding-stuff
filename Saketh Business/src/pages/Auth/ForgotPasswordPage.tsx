import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { SEO } from '../../components/common/SEO';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 600);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-8">
      <SEO title="Forgot Password — Nitro Hub" />

      <div className="text-center space-y-2">
        <h1 className="font-serif text-3xl text-luxury-dark font-medium">Reset Password</h1>
        <p className="text-xs text-luxury-muted">
          Enter your registered email to receive a secure password reset link
        </p>
      </div>

      <div className="bg-white p-8 border border-luxury-border shadow-soft space-y-6">
        {isSubmitted ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-luxury-green mx-auto" />
            <h3 className="font-serif text-lg font-semibold text-luxury-dark">
              Reset Link Dispatched
            </h3>
            <p className="text-xs text-luxury-muted leading-relaxed">
              If an account exists with <strong>{email}</strong>, you will receive instructions to reset your password shortly.
            </p>
            <Link to="/login" className="inline-block pt-2">
              <Button variant="secondary" size="sm">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Account Email *"
              type="email"
              required
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Send Reset Link
            </Button>
          </form>
        )}

        <div className="pt-4 border-t border-luxury-border text-center">
          <Link
            to="/login"
            className="text-xs text-luxury-muted hover:text-luxury-dark font-medium inline-flex items-center"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Return to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
