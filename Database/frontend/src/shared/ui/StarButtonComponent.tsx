import { useEffect, useState } from 'react';

const StarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export function StarButtonComponent() {
  const [starCount, setStarCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStarCount = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/databasus/databasus');
      if (response.ok) {
        const data = (await response.json()) as { stargazers_count: number };
        setStarCount(data.stargazers_count);
      }
    } catch (error) {
      console.error('Failed to fetch GitHub star count:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStarCount();
  }, []);

  return (
    <a
      href="https://github.com/databasus/databasus"
      target="_blank"
      rel="noopener noreferrer"
      className="flex cursor-pointer items-center rounded-md border !border-gray-200 !bg-white text-sm !text-gray-700 transition-colors hover:!bg-gray-50 dark:!border-gray-600 dark:!bg-gray-700 dark:!text-gray-200 dark:hover:!bg-gray-600"
      aria-label="Star databasus/databasus on GitHub"
    >
      <div className="flex items-center gap-2 border-r border-gray-200 px-2.5 py-1 !text-black dark:border-gray-600 dark:!text-white">
        <StarIcon />
        <span>Star on GitHub</span>
      </div>

      {!isLoading && starCount !== null && (
        <span className="px-2.5 py-1 !text-black dark:!text-white">
          {starCount.toLocaleString()}
        </span>
      )}
    </a>
  );
}
