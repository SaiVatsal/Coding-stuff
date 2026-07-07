import React from 'react';
import { useStore } from '../../store/useStore.js';
import { Landmark } from 'lucide-react';

export default function CostTracker() {
  const store = useStore();

  return (
    <div className="flex items-center justify-between px-2.5 py-1.5 bg-bg-tertiary/40 border border-border-custom rounded-md text-[10px] text-text-secondary select-none font-mono">
      <div className="flex items-center gap-1.5">
        <Landmark size={11} className="text-accent-custom" />
        <span>Session Billing</span>
      </div>
      <div className="flex gap-3">
        <span>Tokens: <strong className="text-text-primary">{store.sessionTokens.toLocaleString()}</strong></span>
        <span>Cost: <strong className="text-success-custom">${store.costThisSession.toFixed(4)}</strong></span>
      </div>
    </div>
  );
}
