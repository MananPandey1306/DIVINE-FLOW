import React, { useState } from 'react';
import { Gate, RiskAssessment } from '../../types';
import { GateCard } from './GateCard';
import { Grid, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';

interface GateGridProps {
  gates: Gate[];
  riskAssessments: Map<string, RiskAssessment>;
  selectedGateId: string | null;
  onSelectGate: (gateId: string | null) => void;
  onOpenSOS: (gateId: string) => void;
  onOpenBroadcast: (gateId: string) => void;
}

export const GateGrid: React.FC<GateGridProps> = ({
  gates,
  riskAssessments,
  selectedGateId,
  onSelectGate,
  onOpenSOS,
  onOpenBroadcast,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'entry' | 'exit' | 'critical' | 'chokepoints'>('all');

  const filteredGates = gates.filter((gate) => {
    const risk = riskAssessments.get(gate.id);
    if (filterType === 'entry') return gate.gateType === 'entry' || gate.gateType === 'both';
    if (filterType === 'exit') return gate.gateType === 'exit' || gate.gateType === 'both';
    if (filterType === 'critical') {
      const density = (gate.currentCount / Math.max(1, gate.maxSafeCapacity)) * 100;
      return (
        density >= 75 ||
        (risk && (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'STAMPEDE_HAZARD' || risk.riskLevel === 'HIGH'))
      );
    }
    if (filterType === 'chokepoints') return gate.isChokepoint;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Grid Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(0, 210, 255, 0.15)',
            padding: '6px',
            borderRadius: '8px',
            color: '#00d2ff',
          }}>
            <Grid size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.01em' }}>
              Live Gate Telemetry Matrix
            </h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {gates.length} calibrated nodes streaming real-time density
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: 'rgba(13, 22, 42, 0.85)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}>
          {[
            { id: 'all', label: 'All Gates' },
            { id: 'entry', label: 'Ingress' },
            { id: 'exit', label: 'Egress' },
            { id: 'critical', label: '⚠️ High Risk' },
            { id: 'chokepoints', label: '🚧 Chokepoints' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              style={{
                background: filterType === f.id ? 'rgba(0, 210, 255, 0.2)' : 'transparent',
                color: filterType === f.id ? '#00d2ff' : '#94a3b8',
                border: filterType === f.id ? '1px solid rgba(0, 210, 255, 0.4)' : '1px solid transparent',
                borderRadius: '7px',
                padding: '5px 12px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Gate Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
        gap: '16px',
      }}>
        {filteredGates.map((gate) => (
          <GateCard
            key={gate.id}
            gate={gate}
            risk={riskAssessments.get(gate.id)}
            isSelected={selectedGateId === gate.id}
            onSelect={() => onSelectGate(selectedGateId === gate.id ? null : gate.id)}
            onOpenSOS={onOpenSOS}
            onOpenBroadcast={onOpenBroadcast}
          />
        ))}
      </div>
    </div>
  );
};
