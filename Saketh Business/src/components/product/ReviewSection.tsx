import React, { useState } from 'react';
import { Star, CheckCircle, MessageSquarePlus } from 'lucide-react';
import { Review } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { nitroDataService } from '../../lib/supabase/service';
import { useAuthStore } from '../../store/useAuthStore';

export interface ReviewSectionProps {
  productId: string;
  ratingAvg: number;
  reviewCount: number;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({
  productId,
  ratingAvg,
  reviewCount,
}) => {
  const [reviews, setReviews] = useState<Review[]>(() =>
    nitroDataService.getReviewsForProduct(productId)
  );
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { user, isAuthenticated } = useAuthStore();

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const created = nitroDataService.addReview({
      product_id: productId,
      user_id: user?.id || 'usr-guest',
      user_name: user?.full_name || 'Verified Buyer',
      rating: newRating,
      title: newTitle.trim() || undefined,
      comment: newComment.trim(),
      is_verified_purchase: true,
    });

    setReviews([created, ...reviews]);
    setIsSubmitted(true);
    setIsAddingReview(false);
    setNewTitle('');
    setNewComment('');
    setNewRating(5);
  };

  // Histogram calculation
  const totalReviews = reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
    percentage:
      totalReviews > 0
        ? (reviews.filter((r) => r.rating === stars).length / totalReviews) * 100
        : 0,
  }));

  return (
    <div className="space-y-8 text-luxury-text">
      {/* Review Header & Rating Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-8 border-b border-luxury-border">
        {/* Left: Overall Score */}
        <div className="md:col-span-4 flex flex-col items-center md:items-start justify-center">
          <div className="font-serif text-5xl font-bold text-luxury-dark">
            {ratingAvg.toFixed(1)}
          </div>
          <div className="flex items-center space-x-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(ratingAvg)
                    ? 'fill-luxury-gold text-luxury-gold'
                    : 'text-luxury-border'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-luxury-muted">
            Based on {reviewCount || totalReviews} verified customer reviews
          </p>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            leftIcon={<MessageSquarePlus className="w-3.5 h-3.5" />}
            onClick={() => setIsAddingReview(!isAddingReview)}
          >
            {isAddingReview ? 'Cancel Review' : 'Write a Review'}
          </Button>
        </div>

        {/* Right: Star Histogram */}
        <div className="md:col-span-8 space-y-2 flex flex-col justify-center">
          {ratingCounts.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center space-x-3 text-xs">
              <span className="w-12 text-luxury-muted font-medium">{stars} Stars</span>
              <div className="flex-1 h-2 bg-luxury-border overflow-hidden">
                <div
                  className="h-full bg-luxury-gold transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-luxury-muted text-[11px]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Write Review Form */}
      {isAddingReview && (
        <form
          onSubmit={handleReviewSubmit}
          className="p-6 bg-luxury-bg-subtle border border-luxury-border space-y-4 animate-fade-in"
        >
          <h4 className="font-serif text-base text-luxury-dark font-semibold">
            Share Your Experience
          </h4>

          {/* Star selector */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
              Your Rating *
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setNewRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= newRating
                        ? 'fill-luxury-gold text-luxury-gold'
                        : 'text-luxury-border-dark'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Review Title (Optional)"
            placeholder="e.g. Exceptional fabric quality and drape"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-luxury-muted mb-1.5">
              Your Review *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tell other customers about the fabric, sizing, comfort, and construction..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-luxury-border text-xs text-luxury-text focus:outline-none focus:border-luxury-dark rounded-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingReview(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Review
            </Button>
          </div>
        </form>
      )}

      {isSubmitted && (
        <div className="p-4 bg-luxury-green-light border border-luxury-green/30 text-luxury-green text-xs font-medium flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>Thank you! Your verified review has been published.</span>
        </div>
      )}

      {/* Review List */}
      <div className="space-y-6 divide-y divide-luxury-border/60">
        {reviews.length === 0 ? (
          <p className="text-xs text-luxury-muted italic py-4">
            No reviews yet for this style. Be the first to share your thoughts!
          </p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
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
                    <span className="inline-flex items-center text-[10px] text-luxury-green font-semibold tracking-wider uppercase bg-luxury-green-light px-1.5 py-0.5 border border-luxury-green/20">
                      <CheckCircle className="w-2.5 h-2.5 mr-1" />
                      <span>Verified Buyer</span>
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-luxury-muted">
                  {new Date(rev.created_at).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {rev.title && (
                <h5 className="font-serif text-sm font-semibold text-luxury-dark">
                  {rev.title}
                </h5>
              )}

              <p className="text-xs text-luxury-text leading-relaxed">{rev.comment}</p>

              <div className="text-[11px] text-luxury-muted pt-1">
                By <span className="font-medium text-luxury-dark">{rev.user_name}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
