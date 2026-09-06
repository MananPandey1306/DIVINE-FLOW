import React, { useState } from 'react';
import { IncidentRecord } from '../../types';
import {
  FileText,
  X,
  Download,
  Search,
  Filter,
  Flame,
  Radio,
  Compass,
  AlertTriangle,
  Cpu,
  Settings,
} from 'lucide-react';

interface IncidentLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: IncidentRecord[];
}

export const IncidentLogModal: React.FC<IncidentLogModalProps> = ({
  isOpen,
  onClose,
  incidents,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  const filtered = incidents.filter((inc) => {
    if (filterType !== 'all' && inc.type !== filterType) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        inc.title.toLowerCase().includes(q) ||
        inc.details.toLowerCase().includes(q) ||
        inc.performedBy.toLowerCase().includes(q) ||
        (inc.gateName && inc.gateName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const exportCSV = () => {
    const headers = ['Timestamp', 'Type', 'Severity', 'Gate', 'Title', 'PerformedBy'];
    const rows = filtered.map((i) => [
      new Date(i.timestamp).toISOString(),
      i.type,
      i.severity,
      `"${i.gateName || 'N/A'}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.performedBy}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CAMS_Incident_Audit_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const jsonContent = JSON.stringify(filtered, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CAMS_Incident_Audit_Log_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeIcon = (type: IncidentRecord['type']) => {
    switch (type) {
      case 'SOS':
        return <Flame size={14} color="#ef4444" />;
      case 'BROADCAST':
        return <Radio size={14} color="#38bdf8" />;
      case 'REDIRECTION':
        return <Compass size={14} color="#34d399" />;
      case 'SENSOR_FAIL':
        return <Cpu size={14} color="#a855f7" />;
      case 'CONFIG_CHANGE':
        return <Settings size={14} color="#eab308" />;
      case 'ALERT':
      default:
        return <AlertTriangle size={14} color="#f97316" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '850px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '8px',
              borderRadius: '8px',
              color: '#38bdf8',
            }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Incident Audit Trail & Compliance Log
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Chronological record of all crowd alerts, SOS triggers, broadcasts and admin overrides
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#1e293b',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            padding: '6px 12px',
          }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search incidents by keyword, gate, officer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Types</option>
            <option value="ALERT">⚠️ Alerts</option>
            <option value="SOS">🚨 SOS Dispatches</option>
            <option value="REDIRECTION">🧭 Redirections</option>
            <option value="BROADCAST">📢 Broadcasts</option>
            <option value="OVERRIDE">✍️ Overrides</option>
            <option value="SENSOR_FAIL">⚙️ Sensor Faults</option>
          </select>

          <button onClick={exportCSV} className="btn btn-secondary btn-sm" style={{ gap: '5px' }}>
            <Download size={13} /> Export CSV
          </button>
          <button onClick={exportJSON} className="btn btn-secondary btn-sm" style={{ gap: '5px' }}>
            <Download size={13} /> Export JSON
          </button>
        </div>

        {/* Incidents Table / List */}
        <div style={{
          maxHeight: '440px',
          overflowY: 'auto',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.6)',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              No matching incident logs found.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(30, 41, 59, 0.8)', color: '#94a3b8', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '10px 14px' }}>Time</th>
                  <th style={{ padding: '10px 14px' }}>Type</th>
                  <th style={{ padding: '10px 14px' }}>Event Summary</th>
                  <th style={{ padding: '10px 14px' }}>Gate</th>
                  <th style={{ padding: '10px 14px' }}>Actor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => (
                  <tr key={inc.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600, color: '#f8fafc' }}>
                        {getTypeIcon(inc.type)}
                        {inc.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#cbd5e1', maxWidth: '320px' }}>
                      {inc.title}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#38bdf8', whiteSpace: 'nowrap' }}>
                      {inc.gateName || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {inc.performedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Showing {filtered.length} of {incidents.length} total logged events
          </span>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
