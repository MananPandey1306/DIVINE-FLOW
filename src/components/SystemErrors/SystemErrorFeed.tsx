import React from 'react';
import { SystemError } from '../../types';
import { Cpu, Wifi, WifiOff } from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface SystemErrorFeedProps {
  systemErrors: SystemError[];
}

export const SystemErrorFeed: React.FC<SystemErrorFeedProps> = ({ systemErrors }) => {
  const handleResolve = (errId: string) => {
    const found = systemErrors.find((e) => e.id === errId);
    if (found) {
      found.resolved = true;
      dataIngestionService.logIncident('SENSOR_FAIL', 'low', `Technical error resolved: ${found.code} on ${found.component}`, found.gateId, 'Systems Diagnostic');
    }
  };

  const activeErrors = systemErrors.filter((e) => !e.resolved);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(168, 85, 247, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#c084fc',
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              System Anomaly & Watchdog
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Hardware diagnostics & heartbeat
            </p>
          </div>
        </div>

        {activeErrors.length > 0 ? (
          <span style={{
            background: 'rgba(255, 42, 95, 0.2)',
            color: '#ff6b8b',
            border: '1px solid rgba(255, 42, 95, 0.45)',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '9999px',
            boxShadow: '0 0 10px rgba(255, 42, 95, 0.3)',
          }}>
            {activeErrors.length} FAULT{activeErrors.length > 1 ? 'S' : ''}
          </span>
        ) : (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 9px',
            borderRadius: '9999px',
          }}>
            ALL SENSORS HEALTHY
          </span>
        )}
      </div>

      {/* Feed List */}
      <div style={{
        padding: '14px',
        maxHeight: '260px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        {systemErrors.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
            No technical faults detected. Sensor telemetry streaming smoothly.
          </div>
        ) : (
          systemErrors.map((err) => {
            let badgeBg = 'rgba(0, 210, 255, 0.15)';
            let badgeColor = '#00d2ff';
            if (err.severity === 'error' || err.severity === 'fatal') {
              badgeBg = 'rgba(255, 42, 95, 0.2)';
              badgeColor = '#ff6b8b';
            } else if (err.severity === 'warning') {
              badgeBg = 'rgba(245, 158, 11, 0.2)';
              badgeColor = '#fbbf24';
            }

            return (
              <div
                key={err.id}
                style={{
                  background: err.resolved ? 'rgba(7, 13, 29, 0.4)' : 'rgba(22, 36, 68, 0.6)',
                  border: `1px solid ${err.resolved ? 'rgba(255, 255, 255, 0.04)' : err.severity === 'error' ? 'rgba(255, 42, 95, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '10px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  opacity: err.resolved ? 0.6 : 1,
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: badgeBg,
                      color: badgeColor,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '5px',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {err.code}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9' }}>
                      {err.component} {err.gateName ? `• ${err.gateName}` : ''}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: '5px' }}>
                    {err.message}
                  </p>

                  <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '4px', display: 'inline-block' }}>
                    {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {!err.resolved && (
                  <button
                    onClick={() => handleResolve(err.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.7rem', padding: '3px 9px', whiteSpace: 'nowrap' }}
                  >
                    Resolve
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
