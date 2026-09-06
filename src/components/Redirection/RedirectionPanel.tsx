import React, { useState } from 'react';
import { RedirectionSuggestion, VenueConfig } from '../../types';
import {
  Compass,
  ArrowRight,
  Radio,
  Clock,
  CheckCircle,
  X,
  Zap,
  Shield,
} from 'lucide-react';
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
      'CONFIG_CHANGE',
      'low',
      `Auto-Redirection mode switched to ${next ? 'AUTOPILOT' : 'MANUAL APPROVAL'}`,
      undefined,
      'Admin Panel'
    );
  };

  const handleApprove = (suggId: string) => {
    dataIngestionService.approveRedirection(suggId, false);
  };

  const handleDismiss = (suggId: string) => {
    dataIngestionService.dismissRedirection(suggId);
  };

  const activeSuggestions = suggestions.filter((s) => s.status !== 'dismissed');

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
            background: 'rgba(0, 210, 255, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#00d2ff',
          }}>
            <Compass size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
              Automated Crowd Redirection
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Anti-hysteresis load balancer
            </p>
          </div>
        </div>

        {/* Autopilot Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={toggleAutoRedirection}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: autoRedirection ? 'rgba(16, 185, 129, 0.2)' : 'rgba(22, 36, 68, 0.7)',
              color: autoRedirection ? '#34d399' : '#94a3b8',
              border: autoRedirection ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '0.74rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: autoRedirection ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Zap size={13} color={autoRedirection ? '#34d399' : '#94a3b8'} />
            {autoRedirection ? 'AUTOPILOT ON' : 'MANUAL APPROVAL'}
          </button>
        </div>
      </div>

      {/* Suggestion Cards Container */}
      <div style={{
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
      }}>
        {activeSuggestions.length === 0 ? (
          <div style={{
            padding: '30px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem',
          }}>
            <Shield size={28} color="#00d2ff" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.7 }} />
            No active congestion imbalance. Gate densities are well-distributed.
          </div>
        ) : (
          activeSuggestions.map((sugg) => (
            <div
              key={sugg.id}
              style={{
                background: sugg.status === 'active' ? 'rgba(0, 210, 255, 0.1)' : 'rgba(22, 36, 68, 0.6)',
                border: sugg.status === 'active' ? '1px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '14px',
                boxShadow: sugg.status === 'active' ? '0 0 20px rgba(0, 210, 255, 0.2)' : 'none',
              }}
            >
              {/* Route Heading */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#ff6b8b',
                    background: 'rgba(255, 42, 95, 0.15)',
                    border: '1px solid rgba(255, 42, 95, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}>
                    {sugg.sourceGateName} ({sugg.sourceDensity}%)
                  </span>
                  
                  <ArrowRight size={14} color="#00d2ff" />

                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                  }}>
                    {sugg.targetGateName} ({sugg.targetDensity}%)
                  </span>
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#00d2ff',
                  background: 'rgba(0, 210, 255, 0.15)',
                  border: '1px solid rgba(0, 210, 255, 0.3)',
                  padding: '2px 7px',
                  borderRadius: '6px',
                }}>
                  -{sugg.densityDelta}% Load
                </span>
              </div>

              {/* Walking Metrics & Route Recommendation */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.76rem',
                color: '#cbd5e1',
                marginTop: '10px',
              }}>
                <span>Distance: <strong>{sugg.distanceMeters}m</strong></span>
                <span>Est. Walk: <strong>~{sugg.estimatedWalkingMinutes} min</strong></span>
                <span style={{ color: '#00d2ff' }}>{sugg.recommendedRoute}</span>
              </div>

              {/* Hysteresis Stability Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '10px',
                fontSize: '0.72rem',
                color: '#94a3b8',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={12} color="#f59e0b" />
                  <span>Anti-thrashing hold: <strong>{sugg.stabilityHoldSecRemaining}s</strong></span>
                </div>

                {sugg.status === 'active' && (
                  <span style={{ color: '#34d399', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} /> BROADCASTING LIVE
                  </span>
                )}
              </div>

              {/* Approval Actions */}
              {sugg.status !== 'active' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  marginTop: '12px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <button
                    onClick={() => handleDismiss(sugg.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    <X size={12} />
                    Dismiss
                  </button>

                  <button
                    onClick={() => handleApprove(sugg.id)}
                    className="btn btn-primary btn-sm"
                  >
                    <Radio size={12} />
                    Approve & Broadcast
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
