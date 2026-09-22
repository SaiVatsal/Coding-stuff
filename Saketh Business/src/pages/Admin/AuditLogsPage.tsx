import React, { useState } from 'react';
import { Shield, Search, History } from 'lucide-react';
import { nitroDataService } from '../../lib/supabase/service';
import { Input } from '../../components/common/Input';
import { Badge } from '../../components/common/Badge';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(() => nitroDataService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.user_email && l.user_email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-luxury-border">
        <h1 className="font-serif text-2xl sm:text-3xl text-luxury-dark font-semibold">
          Security & Admin Audit Logs
        </h1>
        <p className="text-xs text-luxury-muted">
          Immutable event log of all admin modifications, price adjustments, and status changes
        </p>
      </div>

      <div className="bg-white p-4 border border-luxury-border flex items-center justify-between shadow-soft">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search by action, entity, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <div className="text-xs text-luxury-muted">
          Total Events: <strong>{logs.length}</strong>
        </div>
      </div>

      <div className="bg-white border border-luxury-border overflow-x-auto shadow-soft">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="bg-luxury-bg-subtle border-b border-luxury-border text-luxury-muted uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Admin Operator</th>
              <th className="p-3.5">Action Event</th>
              <th className="p-3.5">Entity / Record</th>
              <th className="p-3.5">Audit Metadata</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-luxury-border">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-luxury-bg-subtle/50 transition-colors">
                <td className="p-3.5 text-luxury-muted whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </td>
                <td className="p-3.5">
                  <div className="font-semibold text-luxury-dark">{log.user_email || 'System'}</div>
                  <div className="text-[10px] text-luxury-muted font-mono">{log.ip_address}</div>
                </td>
                <td className="p-3.5">
                  <Badge variant="bestseller">{log.action}</Badge>
                </td>
                <td className="p-3.5 font-mono text-[11px] text-luxury-muted">
                  <div className="text-luxury-dark font-medium capitalize">{log.entity_type}</div>
                  <div className="text-[10px]">{log.entity_id}</div>
                </td>
                <td className="p-3.5 text-luxury-muted">
                  <pre className="text-[10px] bg-luxury-bg-subtle p-1.5 border border-luxury-border/60 max-w-xs overflow-x-auto">
                    {JSON.stringify(log.new_values, null, 1)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
