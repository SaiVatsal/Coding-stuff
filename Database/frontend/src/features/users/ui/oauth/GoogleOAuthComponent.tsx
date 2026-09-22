import { GoogleOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';

import { GOOGLE_CLIENT_ID, getOAuthRedirectUri } from '../../../../constants';

export function GoogleOAuthComponent() {
  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  const redirectUri = getOAuthRedirectUri();

  const handleGoogleLogin = () => {
    try {
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: 'google',
      });

      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // Validate URL is properly formed
      new URL(googleAuthUrl);
      window.location.href = googleAuthUrl;
    } catch (error) {
      message.error('Invalid OAuth configuration');
      console.error('Google OAuth URL error:', error);
    }
  };

  return (
    <Button icon={<GoogleOutlined />} onClick={handleGoogleLogin} className="w-full" size="large">
      Continue with Google
    </Button>
  );
}
