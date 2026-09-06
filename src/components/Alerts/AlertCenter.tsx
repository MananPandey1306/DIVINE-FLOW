import React, { useState } from 'react';
import { Alert } from '../../types';
import { Bell, CheckCircle, UserCheck, Flame, Shield, Clock, AlertCircle } from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface AlertCenterProps {
  alerts: Alert[];
  onOpenSOSForGate?: (gateId: string) => void;
}

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts, onOpenSOSForGate }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'escalated' | 'resolved'>('active');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'active')   return a.status === 'active' || a.status === 'escalated' || a.status === 'investigating';
    if (filter === 'escalated') return a.status === 'escalated' || a.escalationTier > 1;
    if (filter === 'resolved')  return a.status === 'resolved';
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'active' || a.status === 'escalated').length;

  const handleAcknowledge = (alertId: string) => dataIngestionService.acknowledgeAlert(alertId, 'Duty Officer');
  const handleResolve     = (alertId: string) => dataIngestionService.resolveAlert(alertId, 'Incident Commander');

  const tierLabels = [
    { tier: 1, role: 'Gate Supervisor',                       color: 'var(--cyan)' },
    { tier: 2, role: 'Central Control Room',                   color: 'var(--orange)' },
    { tier: 3, role: 'Emergency Services / Incident Commander', color: 'var(--red)' },
  ];

  const severityColor = (sev: string) => {
    if (sev === 'EMERGENCY' || sev === 'CRITICAL') return 'var(--red)';
    if (sev === 'HIGH') return 'var(--orange)';
    return 'var(--yellow)';
  };

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="panel-icon" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
            <Bell size={15} />
          </div>
          <div>
            <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Alerts & Escalations
              {activeCount > 0 && (
                <span style={{
                  background: 'var(--red)', color: '#fff',
                  fontSize: '10px', fontWeight: 800, padding: '1px 6px',
                  borderRadius: '99px', boxShadow: '0 0 8px rgba(239,68,68,0.4)',
                }}>
                  {activeCount}
                </span>
              )}
            </div>
            <div className="panel-sub">SLA-timed routing matrix</div>
          </div>
        </div>

        <div className="pill-group">
          {(['active', 'escalated', 'resolved', 'all'] as const).map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)} className={`pill${filter === tab ? ' active' : ''}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div style={{ padding: '10px', maxHeight: '460px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <CheckCircle size={28} color="var(--green)" style={{ margin: '0 auto 10px', display: 'block', opacity: 0.7 }} />
            All gates within safe limits.
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const currentTier = tierLabels[alert.escalationTier - 1] || tierLabels[0];
            const sColor = severityColor(alert.severity);

            return (
              <div
                key={alert.id}
                style={{
                  background: 'var(--bg-overlay)',
                  border: `1px solid ${alert.severity === 'EMERGENCY' || alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                  borderLeft: `2px solid ${sColor}`,
                  borderRadius: '8px',
                  padding: '12px',
                  boxShadow: alert.severity === 'EMERGENCY' ? '0 0 16px rgba(236,72,153,0.1)' : undefined,
                }}
              >
                {/* Alert header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span className={`badge badge-${alert.severity.toLowerCase()}`}>{alert.severity}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{alert.gateName}</span>
                    </div>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px', letterSpacing: '-0.01em' }}>
                      {alert.title}
                    </h4>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {/* Metrics */}
                <div style={{
                  display: 'flex', gap: '12px', fontSize: '11px',
                  color: 'var(--text-muted)', marginTop: '8px',
                  padding: '6px 8px', background: 'var(--bg-muted)',
                  borderRadius: '6px',
                }}>
                  <span>Count: <strong style={{ color: 'var(--cyan)' }}>{alert.currentCount}</strong>/{alert.maxCapacity}</span>
                  <span>Density: <strong style={{ color: alert.densityPercentage >= 90 ? 'var(--red)' : 'var(--orange)' }}>{alert.densityPercentage}%</strong></span>
                  <span>Risk: <strong style={{ color: 'var(--text-primary)' }}>{alert.riskScore}/100</strong></span>
                </div>

                {/* Reasons */}
                <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {alert.reasons.slice(0, 2).map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <span style={{ color: 'var(--accent)' }}>·</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Escalation tier + timer */}
                {alert.status !== 'resolved' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)',
                    fontSize: '11px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={11} color={currentTier.color} />
                      <span style={{ color: 'var(--text-muted)' }}>Tier {alert.escalationTier}:</span>
                      <strong style={{ color: currentTier.color }}>{currentTier.role}</strong>
                    </div>
                    {!alert.acknowledged && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '3px',
                        color: alert.escalationTimerRemaining < 10 ? 'var(--red)' : 'var(--yellow)',
                        fontWeight: 700, fontFamily: 'var(--font-mono)',
                      }}>
                        <Clock size={10} />
                        Escalates {alert.escalationTimerRemaining}s
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                  {alert.status === 'resolved' ? (
                    <span style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <CheckCircle size={12} /> Resolved
                    </span>
                  ) : (
                    <>
                      {!alert.acknowledged ? (
                        <button onClick={() => handleAcknowledge(alert.id)} className="btn btn-primary btn-sm" style={{ padding: '4px 10px' }}>
                          <UserCheck size={11} /> Acknowledge
                        </button>
                      ) : (
                        <button onClick={() => handleResolve(alert.id)} className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', color: 'var(--green)' }}>
                          <CheckCircle size={11} /> Resolve
                        </button>
                      )}
                      {onOpenSOSForGate && (
                        <button onClick={() => onOpenSOSForGate(alert.gateId)} className="btn btn-sos btn-sm" style={{ padding: '4px 9px' }}>
                          <Flame size={11} /> SOS
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
