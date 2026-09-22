import React, { useState } from 'react';
import { Star, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Review } from '../../types';

export const ReviewsModeration: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>(() => nitroDataService.getAdminReviews());

  const handleToggleApproval = (id: string) => {
    nitroDataService.toggleReviewApproval(id);
    setReviews(nitroDataService.getAdminReviews());
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Customer Reviews & Moderation
        </h1>
        <p className="text-xs text-luxury-muted">
          Moderate verified buyer feedback, ratings, and testimonials
        </p>
      </div>

      <div className="bg-white border border-luxury-border divide-y divide-luxury-border shadow-soft">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-luxury-gold">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= rev.rating
                          ? 'fill-luxury-gold text-luxury-gold'
                          : 'text-luxury-border'
                      }`}
                    />
                  ))}
                </div>
                {rev.is_verified_purchase && (
                  <Badge variant="verified">Verified Buyer</Badge>
                )}
                <span className="text-xs font-semibold text-luxury-dark">{rev.user_name}</span>
                <span className="text-[11px] text-luxury-muted">
                  {new Date(rev.created_at).toLocaleDateString('en-IN')}
                </span>
              </div>

              {rev.title && (
                <h4 className="font-serif text-sm font-semibold text-luxury-dark">{rev.title}</h4>
              )}

              <p className="text-xs text-luxury-text leading-relaxed max-w-2xl">{rev.comment}</p>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => handleToggleApproval(rev.id)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border transition-colors ${
                  rev.is_approved
                    ? 'bg-luxury-green-light text-luxury-green border-luxury-green/30 hover:bg-luxury-bg-hover'
                    : 'bg-luxury-dark text-white border-luxury-dark'
                }`}
              >
                {rev.is_approved ? 'Approved (Live)' : 'Approve Review'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
