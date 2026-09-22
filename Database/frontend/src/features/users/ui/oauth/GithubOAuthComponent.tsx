import { GithubOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';

import { GITHUB_CLIENT_ID, getOAuthRedirectUri } from '../../../../constants';

export function GithubOAuthComponent() {
  if (!GITHUB_CLIENT_ID) {
    return null;
  }

  const redirectUri = getOAuthRedirectUri();

  const handleGitHubLogin = () => {
    try {
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        state: 'github',
        scope: 'user:email',
      });

      const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

      // Validate URL is properly formed
      new URL(githubAuthUrl);
      window.location.href = githubAuthUrl;
    } catch (error) {
      message.error('Invalid OAuth configuration');
      console.error('GitHub OAuth URL error:', error);
    }
  };

  return (
    <Button icon={<GithubOutlined />} onClick={handleGitHubLogin} className="w-full" size="large">
      Continue with GitHub
    </Button>
  );
}
