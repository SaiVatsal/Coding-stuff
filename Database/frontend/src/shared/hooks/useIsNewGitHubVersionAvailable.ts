import { useEffect, useState } from 'react';

import { APP_VERSION } from '../../constants';
import { compareVersions, parseGitHubTag } from '../lib';

const GITHUB_RELEASES_API = 'https://api.github.com/repos/databasus/databasus/releases/latest';
const CACHE_KEY = 'githubLatestVersion';
const CACHE_TTL_MS = 15 * 60 * 1000;

interface CachedVersion {
  version: string;
  fetchedAt: number;
}

function readCachedVersion(): string | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const cached = JSON.parse(raw) as CachedVersion;

    if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.version;
    }

    return null;
  } catch {
    return null;
  }
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json' },
    });

    if (!response.ok) {
      return null;
    }

    const release = (await response.json()) as { tag_name?: string };
    if (!release.tag_name) {
      return null;
    }

    const version = parseGitHubTag(release.tag_name);

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ version, fetchedAt: Date.now() } satisfies CachedVersion),
    );

    return version;
  } catch {
    return null;
  }
}

export function useIsNewGitHubVersionAvailable(): boolean {
  const [latestVersion, setLatestVersion] = useState<string | null>(null);

  useEffect(() => {
    if (APP_VERSION === 'dev') {
      return;
    }

    const cachedVersion = readCachedVersion();
    if (cachedVersion) {
      setLatestVersion(cachedVersion);
      return;
    }

    let isActive = true;

    fetchLatestVersion().then((version) => {
      if (isActive && version) {
        setLatestVersion(version);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return latestVersion !== null && compareVersions(latestVersion, APP_VERSION) > 0;
}
