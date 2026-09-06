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
import { Users, Activity, AlertTriangle, Compass, TrendingUp, Zap } from 'lucide-react';

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

  // KPI Calculations
  const totalHeadcount = venue.gates.reduce((sum, g) => sum + g.currentCount, 0);
  const totalMaxCapacity = venue.gates.reduce((sum, g) => sum + g.maxSafeCapacity, 0);
  const overallDensity = Math.round((totalHeadcount / Math.max(1, totalMaxCapacity)) * 100);

  const highRiskGatesCount = venue.gates.filter((g) => {
    const r = riskAssessments.get(g.id);
    return r && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'STAMPEDE_HAZARD' || r.riskLevel === 'HIGH');
  }).length;

  const activeAlertsCount = alerts.filter((a) => a.status === 'active' || a.status === 'escalated').length;
  const activeRedirectionsCount = redirections.filter((r) => r.status === 'active' || r.status === 'suggested').length;

  const densityColor = overallDensity >= 80 ? 'var(--red)' : overallDensity >= 60 ? 'var(--yellow)' : 'var(--green)';
  const densityLabel = overallDensity >= 80 ? 'HIGH SURGE' : overallDensity >= 60 ? 'STEADY' : 'OPTIMAL';

  const kpis = [
    {
      label: 'LIVE FOOTFALL',
      value: totalHeadcount.toLocaleString(),
      sub: `/ ${totalMaxCapacity.toLocaleString()} max`,
      meta: '⚡ Multi-gate ingestion active',
      metaColor: 'var(--accent)',
      icon: Users,
      iconBg: 'rgba(91,106,245,0.15)',
      iconColor: '#5b6af5',
    },
    {
      label: 'AGGREGATE DENSITY',
      value: `${overallDensity}%`,
      sub: densityLabel,
      meta: venue.environment.weather === 'rain' ? '🌧️ Wet weather +14%' : '☀️ Weather nominal',
      metaColor: 'var(--text-muted)',
      icon: Activity,
      iconBg: overallDensity >= 80 ? 'var(--red-light)' : 'var(--green-light)',
      iconColor: densityColor,
      valueColor: densityColor,
    },
    {
      label: 'HIGH ALERT ZONES',
      value: `${highRiskGatesCount}`,
      sub: `/ ${venue.gates.length} gates`,
      meta: highRiskGatesCount > 0 ? '⚠️ Barrier marshals alerted' : '✓ Standard monitoring',
      metaColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
      icon: AlertTriangle,
      iconBg: highRiskGatesCount > 0 ? 'var(--red-light)' : 'var(--green-light)',
      iconColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
      valueColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
    },
    {
      label: 'CROWD DIVERSIONS',
      value: `${activeRedirectionsCount}`,
      sub: venue.autoRedirectionEnabled ? 'Autopilot ON' : 'Manual mode',
      meta: `${venue.hysteresisSeconds}s anti-thrash buffer`,
      metaColor: 'var(--text-muted)',
      icon: Compass,
      iconBg: 'rgba(34,211,238,0.12)',
      iconColor: 'var(--cyan)',
    },
  ];

  return (
    <div
      className="dashboard-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
    >
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0,
          }}>
            Operations Command
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {venue.name} · Real-time crowd intelligence dashboard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '8px',
            background: 'var(--green-light)', border: '1px solid rgba(16,185,129,0.2)',
            fontSize: '11px', fontWeight: 700, color: 'var(--green)',
            fontFamily: 'var(--font-mono)',
          }}>
            <Zap size={10} /> LIVE STREAM
          </span>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: 30, height: 30, borderRadius: '8px',
                  background: kpi.iconBg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: kpi.iconColor,
                }}>
                  <Icon size={14} />
                </div>
              </div>

              {/* Value */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{
                  fontSize: '28px', fontWeight: 800,
                  fontFamily: 'var(--font-display)', letterSpacing: '-0.03em',
                  color: kpi.valueColor || 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {kpi.value}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {kpi.sub}
                </span>
              </div>

              {/* Progress bar (density only) */}
              {kpi.label === 'AGGREGATE DENSITY' && (
                <div className="density-bar-track" style={{ marginTop: '10px' }}>
                  <div
                    className="density-bar-fill"
                    style={{
                      width: `${overallDensity}%`,
                      background: overallDensity >= 80
                        ? 'linear-gradient(90deg, var(--orange), var(--red))'
                        : overallDensity >= 60
                        ? 'linear-gradient(90deg, var(--yellow), var(--orange))'
                        : 'linear-gradient(90deg, var(--accent), var(--green))',
                    }}
                  />
                </div>
              )}

              {/* Meta */}
              <div style={{ fontSize: '11px', color: kpi.metaColor, fontWeight: 600, marginTop: '8px' }}>
                {kpi.meta}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gap: '16px',
      }}>
        {/* Left: Map + Gate Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
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

        {/* Right: Feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
