import React, { useState } from 'react';
import { Gate, RiskAssessment } from '../../types';
import { GateCard } from './GateCard';
import { LayoutGrid } from 'lucide-react';

interface GateGridProps {
  gates: Gate[];
  riskAssessments: Map<string, RiskAssessment>;
  selectedGateId: string | null;
  onSelectGate: (gateId: string | null) => void;
  onOpenSOS: (gateId: string) => void;
  onOpenBroadcast: (gateId: string) => void;
}

const FILTERS = [
  { id: 'all',         label: 'All' },
  { id: 'entry',       label: 'Entry' },
  { id: 'exit',        label: 'Exit' },
  { id: 'critical',   label: '⚠ High Risk' },
  { id: 'chokepoints', label: '🚧 Chokepoints' },
] as const;

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
      return (density >= 75 || (risk && (risk.riskLevel === 'CRITICAL' || risk.riskLevel === 'STAMPEDE_HAZARD' || risk.riskLevel === 'HIGH')));
    }
    if (filterType === 'chokepoints') return gate.isChokepoint;
    return true;
  });

  return (
    <div className="glass-panel">
      {/* Header */}
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="panel-icon" style={{ background: 'rgba(91,106,245,0.12)', color: '#5b6af5' }}>
            <LayoutGrid size={15} />
          </div>
          <div>
            <div className="panel-title">Gate Telemetry Matrix</div>
            <div className="panel-sub">{gates.length} nodes · real-time density stream</div>
          </div>
        </div>

        {/* Filter pills */}
        <div className="pill-group">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`pill${filterType === f.id ? ' active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Gate Cards Grid */}
      <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: '10px' }}>
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
        {filteredGates.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No gates match this filter.
          </div>
        )}
      </div>
    </div>
  );
};
