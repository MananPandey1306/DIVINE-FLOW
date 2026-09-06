import React, { useState } from 'react';
import { RedirectionSuggestion, VenueConfig } from '../../types';
import { Compass, ArrowRight, Radio, Clock, CheckCircle, X, Zap } from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface RedirectionPanelProps {
  suggestions: RedirectionSuggestion[];
  venue: VenueConfig;
}

export const RedirectionPanel: React.FC<RedirectionPanelProps> = ({ suggestions, venue }) => {
  const [autoRedirection, setAutoRedirection] = useState(venue.autoRedirectionEnabled);

  const toggleAutoRedirection = () => {
    const next = !autoRedirection;
    setAutoRedirection(next);
    venue.autoRedirectionEnabled = next;
    dataIngestionService.logIncident(
      'CONFIG_CHANGE', 'low',
      `Auto-Redirection mode switched to ${next ? 'AUTOPILOT' : 'MANUAL APPROVAL'}`,
      undefined, 'Admin Panel'
    );
  };

  const handleApprove  = (id: string) => dataIngestionService.approveRedirection(id, false);
  const handleDismiss  = (id: string) => dataIngestionService.dismissRedirection(id);

  const activeSuggestions = suggestions.filter((s) => s.status !== 'dismissed');

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="panel-icon" style={{ background: 'var(--cyan-light)', color: 'var(--cyan)' }}>
            <Compass size={15} />
          </div>
          <div>
            <div className="panel-title">Crowd Redirection & Flow Matrix</div>
            <div className="panel-sub">Live gate-to-gate diversion as per availability</div>
          </div>
        </div>

        <button
          onClick={toggleAutoRedirection}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            background: autoRedirection ? 'var(--green-light)' : 'var(--bg-muted)',
            color: autoRedirection ? 'var(--green)' : 'var(--text-muted)',
            border: `1px solid ${autoRedirection ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            borderRadius: '99px', padding: '4px 12px',
            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: autoRedirection ? '0 0 10px rgba(16,185,129,0.2)' : 'none',
          }}
        >
          <Zap size={11} />
          {autoRedirection ? 'AUTOPILOT' : 'MANUAL'}
        </button>
      </div>

      {/* Suggestions */}
      <div style={{ padding: '10px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeSuggestions.length === 0 ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            <Compass size={26} color="var(--cyan)" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.6 }} />
            Gate densities are well-distributed. All gates operating with normal ingress.
          </div>
        ) : (
          activeSuggestions.map((sugg) => (
            <div
              key={sugg.id}
              style={{
                background: sugg.status === 'active' ? 'rgba(34,211,238,0.06)' : 'var(--bg-overlay)',
                border: `1px solid ${sugg.status === 'active' ? 'rgba(34,211,238,0.25)' : 'var(--border)'}`,
                borderRadius: '8px', padding: '12px',
              }}
            >
              {/* Route */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: 'var(--red)',
                    background: 'var(--red-light)', border: '1px solid rgba(239,68,68,0.2)',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>
                    FLOW: {sugg.sourceGateName} ({sugg.sourceDensity}% FULL)
                  </span>
                  <ArrowRight size={12} color="var(--cyan)" />
                  <span style={{
                    fontSize: '11px', fontWeight: 700, color: 'var(--green)',
                    background: 'var(--green-light)', border: '1px solid rgba(16,185,129,0.2)',
                    padding: '2px 7px', borderRadius: '5px',
                  }}>
                    {sugg.targetGateName} ({100 - sugg.targetDensity}% AVAILABLE)
                  </span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: 'var(--cyan)',
                  background: 'var(--cyan-light)', border: '1px solid rgba(34,211,238,0.2)',
                  padding: '2px 7px', borderRadius: '5px',
                }}>
                  +{100 - sugg.targetDensity}% Avail
                </span>
              </div>

              {/* Metrics row */}
              <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px', flexWrap: 'wrap' }}>
                <span>🚶 {sugg.distanceMeters}m walk (~{sugg.estimatedWalkingMinutes} min)</span>
                <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{sugg.recommendedRoute}</span>
              </div>

              {/* Hold timer + live status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={10} color="var(--yellow)" />
                  Hold: <strong>{sugg.stabilityHoldSecRemaining}s</strong>
                </div>
                {sugg.status === 'active' && (
                  <span style={{ color: 'var(--green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <CheckCircle size={10} /> BROADCASTING
                  </span>
                )}
              </div>

              {/* Approve / Dismiss */}
              {sugg.status !== 'active' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => handleDismiss(sugg.id)} className="btn btn-secondary btn-sm">
                    <X size={11} /> Dismiss
                  </button>
                  <button onClick={() => handleApprove(sugg.id)} className="btn btn-primary btn-sm">
                    <Radio size={11} /> Approve & Broadcast
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
