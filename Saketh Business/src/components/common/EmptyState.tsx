import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 max-w-md mx-auto">
      {icon && <div className="mb-4 text-luxury-muted/70">{icon}</div>}
      <h3 className="font-serif text-xl text-luxury-dark mb-2">{title}</h3>
      <p className="text-sm text-luxury-muted mb-6 leading-relaxed">{description}</p>
      {actionText && (
        actionHref ? (
          <Link to={actionHref}>
            <Button variant="primary">{actionText}</Button>
          </Link>
        ) : (
          <Button variant="primary" onClick={onAction}>
            {actionText}
          </Button>
        )
      )}
    </div>
  );
};
