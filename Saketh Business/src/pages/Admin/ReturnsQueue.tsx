import React, { useState } from 'react';
import { RotateCcw, CheckCircle, XCircle, DollarSign, PackageCheck, AlertCircle } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ReturnRequest } from '../../types';

export const ReturnsQueue: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRequest[]>(() => nitroDataService.getReturns());

  const handleUpdateStatus = (id: string, status: ReturnRequest['status']) => {
    nitroDataService.updateReturnStatus(id, status);
    setReturns(nitroDataService.getReturns());
  };

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Customer Returns & Razorpay Refunds
        </h1>
        <p className="text-xs text-luxury-muted">
          Inspect returned garments, verify quality conditions, and authorize gateway refunds
        </p>
      </div>

      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        {returns.length === 0 ? (
          <div className="p-12 text-center text-xs text-luxury-muted space-y-2">
            <RotateCcw className="w-8 h-8 mx-auto text-luxury-faint" />
            <p>No open return or refund requests.</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
                <th className="p-3.5">Return ID</th>
                <th className="p-3.5">Order Ref</th>
                <th className="p-3.5">Garment & Reason</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5 text-right">Refund Amount (₹)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-luxury-border">
              {returns.map((ret) => (
                <tr key={ret.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                  <td className="p-3.5 font-mono text-[11px] text-luxury-dark">
                    {ret.id}
                  </td>
                  <td className="p-3.5 font-medium text-luxury-dark">
                    {ret.order_number}
                  </td>
                  <td className="p-3.5 space-y-0.5">
                    <div className="font-semibold text-luxury-dark">{ret.product_name}</div>
                    <div className="text-[11px] text-luxury-muted capitalize">
                      Reason: {ret.reason.replace(/_/g, ' ')}
                    </div>
                  </td>
                  <td className="p-3.5 text-luxury-muted">{ret.user_email}</td>
                  <td className="p-3.5 text-right font-serif font-bold text-luxury-dark">
                    ₹{ret.refund_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center">
                    <Badge variant={ret.status === 'refunded' ? 'verified' : 'sale'}>
                      {ret.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-3.5 text-right space-x-2 whitespace-nowrap">
                    {ret.status === 'requested' && (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleUpdateStatus(ret.id, 'approved')}
                        >
                          Approve Pickup
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUpdateStatus(ret.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {ret.status === 'approved' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        leftIcon={<PackageCheck className="w-3 h-3" />}
                        onClick={() => handleUpdateStatus(ret.id, 'item_received')}
                      >
                        Mark Received
                      </Button>
                    )}

                    {ret.status === 'item_received' && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<DollarSign className="w-3 h-3 text-luxury-gold" />}
                        onClick={() => handleUpdateStatus(ret.id, 'refunded')}
                      >
                        Process Refund
                      </Button>
                    )}

                    {ret.status === 'refunded' && (
                      <span className="text-[11px] font-bold text-luxury-green">✓ Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
