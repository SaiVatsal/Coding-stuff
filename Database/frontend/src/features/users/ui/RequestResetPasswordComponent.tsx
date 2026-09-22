import { Button, Input } from 'antd';
import { type JSX, useState } from 'react';

import { useCloudflareTurnstile } from '../../../shared/hooks/useCloudflareTurnstile';

import { userApi } from '../../../entity/users';
import { StringUtils } from '../../../shared/lib';
import { FormValidator } from '../../../shared/lib/FormValidator';
import { CloudflareTurnstileWidget } from '../../../shared/ui/CloudflareTurnstileWidget';

interface RequestResetPasswordComponentProps {
  onSwitchToSignIn?: () => void;
  onSwitchToResetPassword?: (email: string) => void;
}

export function RequestResetPasswordComponent({
  onSwitchToSignIn,
  onSwitchToResetPassword,
}: RequestResetPasswordComponentProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [isEmailError, setEmailError] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { token, containerRef, resetCloudflareTurnstile } = useCloudflareTurnstile();

  const validateEmail = (): boolean => {
    if (!email) {
      setEmailError(true);
      return false;
    }

    if (!FormValidator.isValidEmail(email)) {
      setEmailError(true);
      return false;
    }

    return true;
  };

  const onSendCode = async () => {
    setError('');
    setSuccessMessage('');

    if (validateEmail()) {
      setLoading(true);

      try {
        const response = await userApi.sendResetPasswordCode({
          email,
          cloudflareTurnstileToken: token,
        });
        setSuccessMessage(response.message);

        // After successful code send, switch to reset password form
        setTimeout(() => {
          if (onSwitchToResetPassword) {
            onSwitchToResetPassword(email);
          }
        }, 2000);
      } catch (e) {
        setError(StringUtils.capitalizeFirstLetter((e as Error).message));
        resetCloudflareTurnstile();
      }

      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[300px]">
      <div className="mb-5 text-center text-2xl font-bold">Reset password</div>

      <div className="mb-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Enter your email address and we&apos;ll send you a reset code.
      </div>

      <div className="my-1 text-xs font-semibold">Your email</div>
      <Input
        placeholder="your@email.com"
        value={email}
        onChange={(e) => {
          setEmailError(false);
          setEmail(e.currentTarget.value.trim().toLowerCase());
        }}
        status={isEmailError ? 'error' : undefined}
        type="email"
        onPressEnter={() => {
          onSendCode();
        }}
      />

      <div className="mt-3" />

      <CloudflareTurnstileWidget containerRef={containerRef} />

      <Button
        disabled={isLoading}
        loading={isLoading}
        className="w-full"
        onClick={() => {
          onSendCode();
        }}
        type="primary"
      >
        Send reset code
      </Button>

      {error && (
        <div className="mt-3 flex justify-center text-center text-sm text-red-600">{error}</div>
      )}

      {successMessage && (
        <div className="mt-3 flex justify-center text-center text-sm text-green-600">
          {successMessage}
        </div>
      )}

      {onSwitchToSignIn && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:!text-blue-500"
          >
            Sign in
          </button>
        </div>
      )}
    </div>
  );
}
