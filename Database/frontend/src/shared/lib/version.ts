export function parseGitHubTag(tagName: string): string {
  return tagName.trim().replace(/^v/, '');
}

export function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map((part) => parseInt(part, 10) || 0);
  const bParts = b.split('.').map((part) => parseInt(part, 10) || 0);

  for (let i = 0; i < 3; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0);

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}
