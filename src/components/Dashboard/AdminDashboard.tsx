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
import { Users, Activity, AlertTriangle, Compass, Sparkles, ArrowRight, Shield, Zap } from 'lucide-react';

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
  broadcasts: _broadcasts,
  onOpenSOSForGate,
  onOpenBroadcastForGate,
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);
  const [promptQuery, setPromptQuery] = useState('');

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
  const densityLabel = overallDensity >= 80 ? 'SURGE HAZARD' : overallDensity >= 60 ? 'STEADY' : 'OPTIMAL';

  const kpis = [
    {
      label: 'LIVE FOOTFALL',
      value: totalHeadcount.toLocaleString(),
      sub: `/ ${totalMaxCapacity.toLocaleString()} safe cap`,
      meta: '⚡ Multi-gate ingestion active',
      metaColor: '#c084fc',
      icon: Users,
      iconBg: 'rgba(124, 58, 237, 0.2)',
      iconColor: '#c084fc',
    },
    {
      label: 'AGGREGATE DENSITY',
      value: `${overallDensity}%`,
      sub: densityLabel,
      meta: venue.environment.weather === 'rain' ? '🌧️ Wet surface factor +14%' : '☀️ Weather nominal',
      metaColor: 'var(--text-muted)',
      icon: Activity,
      iconBg: overallDensity >= 80 ? 'var(--red-light)' : 'var(--green-light)',
      iconColor: densityColor,
      valueColor: densityColor,
    },
    {
      label: 'HIGH RISK ZONES',
      value: `${highRiskGatesCount}`,
      sub: `/ ${venue.gates.length} gates`,
      meta: highRiskGatesCount > 0 ? '⚠️ Barrier marshals alerted' : '✓ Standard safety protocol',
      metaColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
      icon: AlertTriangle,
      iconBg: highRiskGatesCount > 0 ? 'var(--red-light)' : 'var(--green-light)',
      iconColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
      valueColor: highRiskGatesCount > 0 ? 'var(--red)' : 'var(--green)',
    },
    {
      label: 'CROWD DIVERSIONS',
      value: `${activeRedirectionsCount}`,
      sub: venue.autoRedirectionEnabled ? 'AI Autopilot ON' : 'Manual mode',
      meta: `${venue.hysteresisSeconds}s anti-thrash buffer`,
      metaColor: 'var(--text-muted)',
      icon: Compass,
      iconBg: 'rgba(56, 189, 248, 0.16)',
      iconColor: 'var(--cyan)',
    },
  ];

  const isAyodhya = venue.id.includes('ayodhya') || venue.id.includes('ram');

  const suggestionChips = isAyodhya
    ? [
        '⚡ Reroute Janmabhoomi Path to Sugriva Fort',
        '📢 Broadcast darshan queue advisory',
        '🚨 Monitor Ram Path Bottleneck',
        '🤖 Auto-balance safe gate capacity',
      ]
    : [
        '⚡ Reroute Digvijay Dwar to Sardar Patel Marg',
        '📢 Broadcast darshan queue advisory',
        '🚨 Monitor Samudra Darshan Bottleneck',
        '🤖 Auto-balance safe gate capacity',
      ];

  const handleChipClick = (chip: string) => {
    setPromptQuery(chip);
  };

  return (
    <div
      className="dashboard-page"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
    >
      {/* ── Hostinger AI-Style Hero Section ── */}
      <section style={{ textAlign: 'center', padding: '16px 0 8px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          padding: '4px 14px',
          borderRadius: '9999px',
          background: 'rgba(124, 58, 237, 0.18)',
          border: '1px solid rgba(168, 85, 247, 0.35)',
          color: '#e9d5ff',
          fontSize: '12px',
          fontWeight: 700,
          marginBottom: '14px',
        }}>
          <Sparkles size={13} color="#c084fc" />
          Autonomous Crowd Safety Intelligence
        </div>

        <h1 className="hero-headline">
          Your pilgrims, protected.<br />
          <span className="hero-headline-gradient">Divine Flow AI handles the rest.</span>
        </h1>

        <p className="hero-subtitle">
          Real-time crowd intelligence, spatial load balancing, and autonomous shrine safety.
        </p>

        {/* Pill Prompt Bar */}
        <div className="pill-search-container">
          <input
            type="text"
            className="pill-search-input"
            value={promptQuery}
            onChange={(e) => setPromptQuery(e.target.value)}
            placeholder="Ask AI Command: e.g. Reroute Gate 2 surge or broadcast safety notice..."
          />
          <button
            type="button"
            className="pill-search-btn"
            onClick={() => {
              if (promptQuery.toLowerCase().includes('broadcast')) {
                onOpenBroadcastForGate(venue.gates[0]?.id || 'g-01');
              } else if (promptQuery.toLowerCase().includes('reroute') || promptQuery.toLowerCase().includes('surge')) {
                setSelectedGateId('g-01');
              }
            }}
          >
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="pill-chips-group">
          {suggestionChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="pill-chip"
              onClick={() => handleChipClick(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      </section>

      {/* ── Purple Highlight Banner Card (Hostinger style) ── */}
      <div className="purple-banner-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ background: 'rgba(255, 255, 255, 0.22)', padding: '2px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.04em' }}>
              AUTONOMOUS AGENT ACTIVE
            </span>
            <span style={{ fontSize: '12px', opacity: 0.9 }}>
              100% Neural Processing Active
            </span>
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            Multi-Tier Vision: BlazeFace + COCO-SSD + YOLOv8 Ensemble
          </h3>
          <p style={{ fontSize: '13px', opacity: 0.88, margin: 0, lineHeight: 1.5 }}>
            Automated head counting, density gradient mapping, and micro-movement vector tracking running at sub-50ms latency.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => onOpenBroadcastForGate(venue.gates[0]?.id || 'g-01')}
            className="btn btn-white"
            style={{ padding: '8px 18px', fontSize: '13px' }}
          >
            Deploy AI Broadcast
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
      }}>
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {kpi.label}
                </span>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  background: kpi.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: kpi.iconColor,
                }}>
                  <Icon size={16} />
                </div>
              </div>

              {/* Value */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.03em',
                  color: kpi.valueColor || 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  {kpi.value}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {kpi.sub}
                </span>
              </div>

              {/* Progress bar (density only) */}
              {kpi.label === 'AGGREGATE DENSITY' && (
                <div style={{
                  marginTop: '12px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${overallDensity}%`,
                      background: overallDensity >= 80
                        ? 'linear-gradient(90deg, var(--orange), var(--red))'
                        : overallDensity >= 60
                        ? 'linear-gradient(90deg, var(--yellow), var(--orange))'
                        : 'linear-gradient(90deg, #7c3aed, var(--green))',
                      borderRadius: '9999px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              )}

              {/* Meta */}
              <div style={{ fontSize: '11px', color: kpi.metaColor, fontWeight: 600, marginTop: '10px' }}>
                {kpi.meta}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Operations Grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 420px',
        gap: '20px',
      }}>
        {/* Left: Map + Gate Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
