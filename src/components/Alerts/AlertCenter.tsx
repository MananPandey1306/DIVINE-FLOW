import React, { useState } from 'react';
import { Alert } from '../../types';
import {
  Bell,
  CheckCircle,
  UserCheck,
  Flame,
  Shield,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface AlertCenterProps {
  alerts: Alert[];
  onOpenSOSForGate?: (gateId: string) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts, onOpenSOSForGate }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'escalated' | 'resolved'>('active');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'active') return a.status === 'active' || a.status === 'escalated' || a.status === 'investigating';
    if (filter === 'escalated') return a.status === 'escalated' || a.escalationTier > 1;
    if (filter === 'resolved') return a.status === 'resolved';
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'active' || a.status === 'escalated').length;

  const handleAcknowledge = (alertId: string) => {
    dataIngestionService.acknowledgeAlert(alertId, 'Duty Officer');
  };

  const handleResolve = (alertId: string) => {
    dataIngestionService.resolveAlert(alertId, 'Incident Commander');
  };

  const tierLabels = [
    { tier: 1, role: 'Gate Supervisor', color: '#00d2ff' },
    { tier: 2, role: 'Central Control Room', color: '#ff6b2c' },
    { tier: 3, role: 'Emergency Services / Incident Commander', color: '#ff2a5f' },
  ];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(255, 107, 44, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#ff6b2c',
          }}>
            <Bell size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              Threshold Alerts & Escalations
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              SLA timed routing matrix
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeCount > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #ff2a5f, #dc2626)',
              color: '#fff',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '3px 9px',
              borderRadius: '9999px',
              boxShadow: '0 0 12px rgba(255, 42, 95, 0.5)',
            }}>
              {activeCount} ACTIVE
            </span>
          )}

          {/* Filter tabs */}
          <div style={{
            display: 'flex',
            gap: '2px',
            background: 'rgba(7, 13, 29, 0.8)',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            {(['active', 'escalated', 'resolved', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  background: filter === tab ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                  color: filter === tab ? '#00d2ff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div style={{
        padding: '14px',
        overflowY: 'auto',
        maxHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {filteredAlerts.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem',
          }}>
            <CheckCircle size={32} color="#10b981" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.8 }} />
            No active threshold breaches. All gates operating within safe limits.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const currentTier = tierLabels[alert.escalationTier - 1] || tierLabels[0];

            return (
              <div
                key={alert.id}
                style={{
                  background: alert.severity === 'EMERGENCY'
                    ? 'rgba(236, 72, 153, 0.12)'
                    : alert.severity === 'CRITICAL'
                    ? 'rgba(255, 42, 95, 0.1)'
                    : 'rgba(22, 36, 68, 0.6)',
                  border: `1px solid ${
                    alert.severity === 'EMERGENCY'
                      ? 'rgba(236, 72, 153, 0.6)'
                      : alert.severity === 'CRITICAL'
                      ? 'rgba(255, 42, 95, 0.5)'
                      : 'rgba(255, 107, 44, 0.35)'
                  }`,
                  borderRadius: '12px',
                  padding: '14px',
                  boxShadow: alert.severity === 'EMERGENCY' ? '0 0 20px rgba(236, 72, 153, 0.25)' : 'none',
                }}
              >
                {/* Alert Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge badge-${alert.severity.toLowerCase()}`}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                        {alert.gateName}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f1f5f9', marginTop: '4px' }}>
                      {alert.title}
                    </h4>
                  </div>

                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Density & Metrics */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.78rem',
                  color: '#cbd5e1',
                  marginTop: '8px',
                  padding: '6px 10px',
                  background: 'rgba(7, 13, 29, 0.6)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}>
                  <span>Headcount: <strong style={{ color: '#00d2ff' }}>{alert.currentCount}</strong> / {alert.maxCapacity}</span>
                  <span>Density: <strong style={{ color: alert.densityPercentage >= 90 ? '#ff2a5f' : '#ff6b2c' }}>{alert.densityPercentage}%</strong></span>
                  <span>Risk: <strong style={{ color: '#f8fafc' }}>{alert.riskScore}/100</strong></span>
                </div>

                {/* Reason Contributing Factors */}
                <div style={{ marginTop: '8px', fontSize: '0.74rem', color: '#94a3b8' }}>
                  {alert.reasons.slice(0, 2).map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
                      <span style={{ color: '#00d2ff' }}>•</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Escalation Tier & SLA Countdown */}
                {alert.status !== 'resolved' && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    fontSize: '0.74rem',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Shield size={13} color={currentTier.color} />
                      <span style={{ color: '#cbd5e1' }}>Escalation Tier {alert.escalationTier}:</span>
                      <strong style={{ color: currentTier.color }}>{currentTier.role}</strong>
                    </div>

                    {!alert.acknowledged && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: alert.escalationTimerRemaining < 10 ? '#ff2a5f' : '#f59e0b',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                      }}>
                        <Clock size={12} />
                        Escalates in {alert.escalationTimerRemaining}s
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '12px',
                }}>
                  {alert.status === 'resolved' ? (
                    <span style={{ fontSize: '0.74rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <CheckCircle size={14} /> Resolved
                    </span>
                  ) : (
                    <>
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => handleAcknowledge(alert.id)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '4px 12px' }}
                        >
                          <UserCheck size={13} />
                          Acknowledge
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResolve(alert.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 12px', color: '#34d399' }}
                        >
                          <CheckCircle size={13} />
                          Mark Resolved
                        </button>
                      )}

                      {onOpenSOSForGate && (
                        <button
                          onClick={() => onOpenSOSForGate(alert.gateId)}
                          className="btn btn-sos btn-sm"
                          style={{ padding: '4px 10px' }}
                          title="Trigger Emergency SOS for this gate"
                        >
                          <Flame size={13} />
                          SOS
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
