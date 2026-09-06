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
import { dataIngestionService } from '../../services/dataIngestion';
import {
  Users,
  Clock,
  DoorOpen,
  HeartPulse,
  ShieldAlert,
  Activity,
  Zap,
  AlertTriangle,
  Calendar,
  Mail,
  Download,
  Printer,
  Share2,
} from 'lucide-react';

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
  const [isSurgeSimulated, setIsSurgeSimulated] = useState(false);

  const isAyodhya = venue.id.includes('ayodhya') || venue.id.includes('ram');

  // KPI Calculations
  const totalHeadcount = venue.gates.reduce((sum, g) => sum + g.currentCount, 0);
  const totalMaxCapacity = venue.gates.reduce((sum, g) => sum + g.maxSafeCapacity, 0);
  const overallDensity = Math.round((totalHeadcount / Math.max(1, totalMaxCapacity)) * 100);

  const highRiskGatesCount = venue.gates.filter((g) => {
    const r = riskAssessments.get(g.id);
    return r && (r.riskLevel === 'CRITICAL' || r.riskLevel === 'STAMPEDE_HAZARD' || r.riskLevel === 'HIGH');
  }).length;

  const handleSimulateSurge = () => {
    const next = !isSurgeSimulated;
    setIsSurgeSimulated(next);
    if (venue.gates[0]) {
      dataIngestionService.adjustGateCount(venue.gates[0].id, next ? 1800 : -1800);
    }
  };

  return (
    <div
      style={{
        padding: '24px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        fontFamily: "'Times New Roman', Times, serif",
        background: '#f4f6f9',
        minHeight: 'calc(100vh - 56px)',
      }}
    >
      {/* ── Breadcrumbs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b' }}>
        <span style={{ color: '#00b894', cursor: 'pointer' }}>Home</span>
        <span>/</span>
        <span style={{ color: '#00b894', cursor: 'pointer' }}>Dashboard</span>
        <span>/</span>
        <span style={{ color: '#475569', fontWeight: 600 }}>My Dashboard</span>
      </div>

      {/* ── Welcome Header & Action Buttons ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Welcome back, Commander!
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            You have {alerts.length} new telemetry alerts and 4 active field marshals online.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Date Range Selector Pill */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#334155',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <Calendar size={14} color="#64748b" />
            <span>12/08/2026 - 12/08/2026</span>
          </button>

          {/* Action Toolbar Button Group */}
          <div
            style={{
              display: 'flex',
              background: '#1e293b',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <button style={{ background: 'transparent', border: 'none', color: '#ffffff', padding: '8px 12px', cursor: 'pointer' }} title="Email Report">
              <Mail size={13} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#ffffff', padding: '8px 12px', cursor: 'pointer', borderLeft: '1px solid #334155' }} title="Download Data">
              <Download size={13} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#ffffff', padding: '8px 12px', cursor: 'pointer', borderLeft: '1px solid #334155' }} title="Print Summary">
              <Printer size={13} />
            </button>
            <button style={{ background: 'transparent', border: 'none', color: '#ffffff', padding: '8px 12px', cursor: 'pointer', borderLeft: '1px solid #334155' }} title="Share Link">
              <Share2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* ── ICCC Simulation Engine Status Bar ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: 'rgba(0, 184, 148, 0.12)',
              color: '#00b894',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                ICCC Simulation Engine
              </span>
              <span style={{ fontSize: '10px', background: '#f1f5f9', color: '#64748b', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                Live State
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              All temple corridors & gates operating within safe parameters
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 184, 148, 0.08)',
              border: '1px solid #00b894',
              color: '#00b894',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            <Activity size={13} />
            NORMAL OPERATIONS
          </button>

          <button
            onClick={handleSimulateSurge}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isSurgeSimulated ? '#ef4444' : '#ffffff',
              border: '1px solid #ef4444',
              color: isSurgeSimulated ? '#ffffff' : '#ef4444',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={13} />
            {isSurgeSimulated ? 'SURGE SIMULATED' : 'Simulate Crowd Surge'}
          </button>
        </div>
      </div>

      {/* ── 6 KPI Metric Cards Grid with Colored Bottom Borders ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        {/* 1. Current Visitors (Orange bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #f97316',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              CURRENT VISITORS
            </span>
            <Users size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {totalHeadcount.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              +1.2k in last hr
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Active pilgrims on cam...
          </span>
        </div>

        {/* 2. Avg Wait Time (Yellow/Gold bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #f59e0b',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              AVG WAIT TIME
            </span>
            <Clock size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              16 min
            </span>
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700 }}>
              ↓ -4 min from peak
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Average queue wait ac...
          </span>
        </div>

        {/* 3. Active Gates (Blue bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #0ea5e9',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ACTIVE GATES
            </span>
            <DoorOpen size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {venue.gates.length}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              5%
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Operational entry/exit g...
          </span>
        </div>

        {/* 4. Medical Alerts (Red bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #ef4444',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              MEDICAL ALERTS
            </span>
            <HeartPulse size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
              {alerts.filter((a) => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL').length || 2}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              5%
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Active medical incidents
          </span>
        </div>

        {/* 5. Risk Level (Orange bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #f97316',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              RISK LEVEL
            </span>
            <ShieldAlert size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: highRiskGatesCount > 0 ? '#ef4444' : '#0f172a' }}>
              {highRiskGatesCount > 0 ? 'High' : overallDensity >= 60 ? 'Moderate' : 'Normal'}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              5%
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            Current overall campus...
          </span>
        </div>

        {/* 6. System Health (Teal bottom border) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            borderBottom: '3px solid #00b894',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              SYSTEM HEALTH
            </span>
            <Activity size={15} color="#94a3b8" />
          </div>
          <div style={{ margin: '10px 0 6px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: '#00b894' }}>
              Operational
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
            All subsystems nominal
          </span>
        </div>
      </div>

      {/* ── Section Title: Campus Operational Telemetry ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
        <div style={{ width: 4, height: 18, background: '#00b894', borderRadius: '2px' }} />
        <h2 style={{ fontSize: '13.5px', fontWeight: 800, color: '#334155', letterSpacing: '0.04em', textTransform: 'uppercase', margin: 0 }}>
          CAMPUS OPERATIONAL TELEMETRY
        </h2>
      </div>

      {/* ── Operational Map / Spatial Radar Card ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {isAyodhya ? 'Ram Mandir Operational Campus Map' : 'Somnath Operational Campus Map'}
            </h3>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', margin: 0 }}>
              Click a marker to inspect live capacity, wait estimates and cordon routes
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#64748b' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0ea5e9' }} /> Low
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f59e0b' }} /> Moderate
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f97316' }} /> High
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }} /> Critical
            </span>
          </div>
        </div>

        {/* Spatial Radar Map Embedded */}
        <SpatialVenueMap
          gates={venue.gates}
          riskAssessments={riskAssessments}
          redirections={redirections}
          selectedGateId={selectedGateId}
          onSelectGate={setSelectedGateId}
          onOpenSOSForGate={onOpenSOSForGate}
        />
      </div>

      {/* ── Lower Panels: Gate Queues Grid & Redirections Load Balancer ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
        <GateGrid
          gates={venue.gates}
          riskAssessments={riskAssessments}
          selectedGateId={selectedGateId}
          onSelectGate={setSelectedGateId}
          onOpenSOS={onOpenSOSForGate}
          onOpenBroadcast={onOpenBroadcastForGate}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <RedirectionPanel
            suggestions={redirections}
            venue={venue}
          />
          <AlertCenter
            alerts={alerts}
            onOpenSOSForGate={onOpenSOSForGate}
          />
          <SystemErrorFeed systemErrors={systemErrors} />
        </div>
      </div>
    </div>
  );
};
