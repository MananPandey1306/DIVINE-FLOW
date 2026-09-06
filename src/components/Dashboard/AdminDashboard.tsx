import React, { useState } from 'react';
import {
  VenueConfig,
  RiskAssessment,
  Alert,
  SystemError,
  RedirectionSuggestion,
  BroadcastMessage,
} from '../../types';
import { SpatialVenueMap } from '../Map/SpatialVenueMap';
import { GateGrid } from '../GateMatrix/GateGrid';
import { AlertCenter } from '../Alerts/AlertCenter';
import { RedirectionPanel } from '../Redirection/RedirectionPanel';
import { SystemErrorFeed } from '../SystemErrors/SystemErrorFeed';
import { Users, Activity, AlertTriangle, Compass, ShieldCheck, Zap } from 'lucide-react';

interface AdminDashboardProps {
  venue: VenueConfig;
  riskAssessments: Map<string, RiskAssessment>;
  alerts: Alert[];
  systemErrors: SystemError[];
  redirections: RedirectionSuggestion[];
  broadcasts: BroadcastMessage[];
  onOpenSOSForGate: (gateId: string) => void;
  onOpenBroadcastForGate: (gateId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  venue,
  riskAssessments,
  alerts,
  systemErrors,
  redirections,
  broadcasts,
  onOpenSOSForGate,
  onOpenBroadcastForGate,
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  // Summary KPI Calculations
  const totalHeadcount = venue.gates.reduce((sum, g) => sum + g.currentCount, 0);
  const totalMaxCapacity = venue.gates.reduce((sum, g) => sum + g.maxSafeCapacity, 0);
  const overallDensity = Math.round((totalHeadcount / Math.max(1, totalMaxCapacity)) * 100);

  const highRiskGatesCount = venue.gates.filter((g) => {
    const r = riskAssessments.get(g.id);
    return r && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'STAMPEDE_HAZARD' || r.riskLevel === 'HIGH');
  }).length;

  const activeAlertsCount = alerts.filter((a) => a.status === 'active' || a.status === 'escalated').length;
  const activeRedirectionsCount = redirections.filter((r) => r.status === 'active' || r.status === 'suggested').length;

  return (
    <div className="dashboard-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* High-Tech KPI Metric Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {/* Total Venue Headcount */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              VENUE LIVE FOOTFALL
            </span>
            <div style={{ background: 'rgba(0, 210, 255, 0.15)', padding: '6px', borderRadius: '8px', color: '#00d2ff' }}>
              <Users size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {totalHeadcount.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              / {totalMaxCapacity.toLocaleString()} max
            </span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
            ⚡ Real-time Multi-Gate Ingestion Active
          </div>
        </div>

        {/* Global Density % */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              AGGREGATE DENSITY
            </span>
            <div style={{ background: overallDensity >= 80 ? 'rgba(255, 42, 95, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px', color: overallDensity >= 80 ? '#ff2a5f' : '#10b981' }}>
              <Activity size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
              color: overallDensity >= 80 ? '#ff2a5f' : overallDensity >= 60 ? '#f59e0b' : '#34d399',
            }}>
              {overallDensity}%
            </span>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
              {overallDensity >= 80 ? 'HIGH SURGE RISK' : overallDensity >= 60 ? 'STEADY FLOW' : 'OPTIMAL COMFORT'}
            </span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
            {venue.environment.weather === 'rain' ? '🌧️ Wet Weather Multiplier +14%' : '☀️ Weather Normal'}
          </div>
        </div>

        {/* High Risk Gates */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              HIGH ALERT ZONES
            </span>
            <div style={{ background: highRiskGatesCount > 0 ? 'rgba(255, 42, 95, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '6px', borderRadius: '8px', color: highRiskGatesCount > 0 ? '#ff2a5f' : '#10b981' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '-0.02em',
              color: highRiskGatesCount > 0 ? '#ff2a5f' : '#34d399',
            }}>
              {highRiskGatesCount} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {venue.gates.length}</span>
            </span>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
              {highRiskGatesCount > 0 ? 'Action Required' : 'All Clear'}
            </span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.72rem', color: highRiskGatesCount > 0 ? '#ff6b8b' : '#34d399', fontWeight: 600 }}>
            {highRiskGatesCount > 0 ? '⚠️ Barrier marshals alerted' : '✓ Standard Gate Monitoring'}
          </div>
        </div>

        {/* Active Redirections */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              CROWD DIVERSIONS
            </span>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '6px', borderRadius: '8px', color: '#818cf8' }}>
              <Compass size={16} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#00d2ff', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}>
              {activeRedirectionsCount}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#cbd5e1', fontWeight: 600 }}>
              {venue.autoRedirectionEnabled ? 'Autopilot Active' : 'Manual Queue'}
            </span>
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.72rem', color: '#818cf8', fontWeight: 600 }}>
            {venue.hysteresisSeconds}s Anti-thrashing buffer hold
          </div>
        </div>
      </div>

      {/* Main Dual-Column Command Center Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 420px',
        gap: '22px',
      }}>
        {/* Left Column: Spatial Map & Gate Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <SpatialVenueMap
            gates={venue.gates}
            riskAssessments={riskAssessments}
            redirections={redirections}
            selectedGateId={selectedGateId}
            onSelectGate={setSelectedGateId}
            onOpenSOSForGate={onOpenSOSForGate}
          />

          <GateGrid
            gates={venue.gates}
            riskAssessments={riskAssessments}
            selectedGateId={selectedGateId}
            onSelectGate={setSelectedGateId}
            onOpenSOS={onOpenSOSForGate}
            onOpenBroadcast={onOpenBroadcastForGate}
          />
        </div>

        {/* Right Column: Alerts, Redirections & System Error Feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <AlertCenter
            alerts={alerts}
            onOpenSOSForGate={onOpenSOSForGate}
          />

          <RedirectionPanel
            suggestions={redirections}
            venue={venue}
          />

          <SystemErrorFeed
            systemErrors={systemErrors}
          />
        </div>
      </div>
    </div>
  );
};
