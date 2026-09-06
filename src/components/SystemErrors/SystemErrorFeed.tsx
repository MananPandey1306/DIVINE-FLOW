import React from 'react';
import { SystemError } from '../../types';
import { Cpu, Wifi, WifiOff, CheckCircle2 } from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface SystemErrorFeedProps {
  systemErrors: SystemError[];
}

export const SystemErrorFeed: React.FC<SystemErrorFeedProps> = ({ systemErrors }) => {
  const handleResolve = (errId: string) => {
    const found = systemErrors.find((e) => e.id === errId);
    if (found) {
      found.resolved = true;
      dataIngestionService.logIncident(
        'SENSOR_FAIL', 'low',
        `Technical error resolved: ${found.code} on ${found.component}`,
        found.gateId, 'Systems Diagnostic'
      );
    }
  };

  const activeErrors = systemErrors.filter((e) => !e.resolved);

  const severityColor = (sev: string) => {
    if (sev === 'error' || sev === 'fatal') return 'var(--red)';
    if (sev === 'warning') return 'var(--yellow)';
    return 'var(--cyan)';
  };

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="panel-icon" style={{ background: 'rgba(168,85,247,0.12)', color: '#c084fc' }}>
            <Cpu size={15} />
          </div>
          <div>
            <div className="panel-title">System Watchdog</div>
            <div className="panel-sub">Hardware diagnostics & heartbeat</div>
          </div>
        </div>

        {activeErrors.length > 0 ? (
          <span style={{
            background: 'var(--red-light)', color: 'var(--red)',
            border: '1px solid rgba(239,68,68,0.25)',
            fontSize: '11px', fontWeight: 800, padding: '3px 9px',
            borderRadius: '99px',
          }}>
            {activeErrors.length} FAULT{activeErrors.length > 1 ? 'S' : ''}
          </span>
        ) : (
          <span style={{
            background: 'var(--green-light)', color: 'var(--green)',
            border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '11px', fontWeight: 800, padding: '3px 9px',
            borderRadius: '99px',
          }}>
            ALL HEALTHY
          </span>
        )}
      </div>

      {/* Error feed */}
      <div style={{ padding: '10px', maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {systemErrors.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No faults detected. Sensor telemetry nominal.
          </div>
        ) : (
          systemErrors.map((err) => {
            const sColor = severityColor(err.severity);
            return (
              <div
                key={err.id}
                style={{
                  background: 'var(--bg-overlay)',
                  border: `1px solid ${err.resolved ? 'var(--border)' : err.severity === 'error' || err.severity === 'fatal' ? 'rgba(239,68,68,0.25)' : 'var(--border)'}`,
                  borderLeft: `2px solid ${err.resolved ? 'var(--border)' : sColor}`,
                  borderRadius: '7px', padding: '10px',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
                  opacity: err.resolved ? 0.5 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: err.resolved ? 'var(--bg-muted)' : `${sColor}18`,
                      color: err.resolved ? 'var(--text-muted)' : sColor,
                      fontSize: '10px', fontWeight: 700, padding: '1px 5px',
                      borderRadius: '4px', fontFamily: 'var(--font-mono)',
                    }}>
                      {err.code}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {err.component}{err.gateName ? ` · ${err.gateName}` : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{err.message}</p>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '3px', display: 'inline-block' }}>
                    {new Date(err.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {!err.resolved && (
                  <button
                    onClick={() => handleResolve(err.id)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px', whiteSpace: 'nowrap', flexShrink: 0 }}
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
