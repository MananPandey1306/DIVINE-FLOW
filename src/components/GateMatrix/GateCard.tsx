import React, { useState } from 'react';
import { Gate, RiskAssessment } from '../../types';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Radio,
  Wifi,
  WifiOff,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface GateCardProps {
  gate: Gate;
  risk: RiskAssessment | undefined;
  isSelected: boolean;
  onSelect: () => void;
  onOpenSOS: (gateId: string) => void;
  onOpenBroadcast: (gateId: string) => void;
}

export const GateCard: React.FC<GateCardProps> = ({
  gate,
  risk,
  isSelected,
  onSelect,
  onOpenSOS,
  onOpenBroadcast,
}) => {
  const [showFactors, setShowFactors] = useState(false);

  const density = Math.round((gate.currentCount / Math.max(1, gate.maxSafeCapacity)) * 100);
  const riskLevel = risk?.riskLevel || 'NORMAL';

  let tierClass = 'card-tier-normal';
  let accentColor = 'var(--green)';

  if (riskLevel === 'STAMPEDE_HAZARD') { tierClass = 'card-tier-stampede'; accentColor = 'var(--pink)'; }
  else if (riskLevel === 'CRITICAL')   { tierClass = 'card-tier-critical';  accentColor = 'var(--red)'; }
  else if (riskLevel === 'HIGH')       { tierClass = 'card-tier-high';      accentColor = 'var(--orange)'; }
  else if (riskLevel === 'MODERATE')   { tierClass = 'card-tier-moderate';  accentColor = 'var(--yellow)'; }

  const handleTally = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    dataIngestionService.adjustGateCount(gate.id, delta);
  };

  const handleToggleSensor = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataIngestionService.toggleGateSensor(gate.id);
  };

  // Circular gauge
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, density) / 100) * circumference;

  const densityBarColor =
    density >= 95 ? 'linear-gradient(90deg,var(--orange),var(--red),var(--pink))'
    : density >= 80 ? 'linear-gradient(90deg,var(--yellow),var(--red))'
    : density >= 60 ? 'linear-gradient(90deg,var(--yellow),var(--orange))'
    : 'linear-gradient(90deg,var(--accent),var(--green))';

  return (
    <div
      onClick={onSelect}
      className={`${tierClass}`}
      style={{
        background: isSelected ? 'var(--bg-overlay)' : 'var(--bg-raised)',
        border: isSelected ? `1px solid var(--accent)` : '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.15s ease',
        boxShadow: isSelected ? '0 0 0 1px var(--accent), 0 4px 20px rgba(91,106,245,0.2)' : undefined,
      }}
    >
      {/* Header row: code + name + gauge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: 'var(--bg-overlay)', color: 'var(--cyan)',
              fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '11px',
              padding: '2px 6px', borderRadius: '5px',
              border: '1px solid rgba(34,211,238,0.2)',
            }}>
              {gate.code}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{gate.zone}</span>
          </div>
          <h3 style={{
            fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)',
            marginTop: '5px', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {gate.name}
          </h3>
        </div>

        {/* Circular gauge */}
        <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
          <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="24" cy="24" r={radius} stroke="var(--bg-overlay)" strokeWidth="4" fill="transparent" />
            <circle
              cx="24" cy="24" r={radius}
              stroke={accentColor} strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 800,
            fontFamily: 'var(--font-mono)', color: accentColor,
          }}>
            {density}%
          </div>
        </div>
      </div>

      {/* Count + density bar */}
      <div style={{ marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontSize: '22px', fontWeight: 800,
              fontFamily: 'var(--font-display)', color: 'var(--text-primary)',
              letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              {gate.currentCount.toLocaleString()}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              / {gate.maxSafeCapacity.toLocaleString()}
            </span>
          </div>
          <span className={`badge badge-${riskLevel.toLowerCase()}`}>
            {riskLevel === 'STAMPEDE_HAZARD' ? '🚨 STAMPEDE' : riskLevel}
          </span>
        </div>
        <div className="density-bar-track">
          <div className="density-bar-fill" style={{ width: `${Math.min(100, density)}%`, background: densityBarColor }} />
        </div>
      </div>

      {/* Trend + sensor row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: '8px', padding: '5px 8px',
        background: 'var(--bg-overlay)', borderRadius: '7px',
        border: '1px solid var(--border)', fontSize: '11px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {risk?.trend === 'surging' ? <TrendingUp size={12} color="var(--red)" /> :
           risk?.trend === 'increasing' ? <TrendingUp size={12} color="var(--orange)" /> :
           risk?.trend === 'decreasing' ? <TrendingDown size={12} color="var(--green)" /> :
           <Minus size={12} color="var(--text-muted)" />}
          <span style={{
            fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: risk?.trend === 'surging' ? 'var(--red)' : risk?.trend === 'increasing' ? 'var(--orange)' : 'var(--text-secondary)',
          }}>
            {(risk?.trend || 'STABLE').toUpperCase()}
            {' '}
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>
              ({risk?.velocityPerMin && risk.velocityPerMin > 0 ? `+${risk.velocityPerMin}` : risk?.velocityPerMin || 0}/m)
            </span>
          </span>
        </div>

        <button
          onClick={handleToggleSensor}
          style={{
            display: 'flex', alignItems: 'center', gap: '3px',
            background: 'transparent', border: 'none',
            color: gate.sensorStatus === 'online' ? 'var(--green)' : 'var(--red)',
            cursor: 'pointer', fontSize: '11px', fontWeight: 700,
          }}
        >
          {gate.sensorStatus === 'online' ? <Wifi size={11} /> : <WifiOff size={11} />}
          {gate.sensorStatus.toUpperCase()}
        </button>
      </div>

      {/* Demographic tags */}
      {(gate.demographics.elderlyRatio > 0.15 || gate.demographics.childrenRatio > 0.1 || gate.demographics.pwdRatio > 0.03 || gate.isChokepoint) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
          {gate.demographics.elderlyRatio > 0.15 && (
            <span style={{ fontSize: '10px', background: 'rgba(168,85,247,0.12)', color: '#c084fc', padding: '2px 6px', borderRadius: '5px', border: '1px solid rgba(168,85,247,0.2)', fontWeight: 600 }}>
              🧓 {Math.round(gate.demographics.elderlyRatio * 100)}% Elderly
            </span>
          )}
          {gate.demographics.childrenRatio > 0.1 && (
            <span style={{ fontSize: '10px', background: 'rgba(234,179,8,0.12)', color: '#facc15', padding: '2px 6px', borderRadius: '5px', border: '1px solid rgba(234,179,8,0.2)', fontWeight: 600 }}>
              🧒 {Math.round(gate.demographics.childrenRatio * 100)}% Children
            </span>
          )}
          {gate.demographics.pwdRatio > 0.03 && (
            <span style={{ fontSize: '10px', background: 'var(--cyan-light)', color: 'var(--cyan)', padding: '2px 6px', borderRadius: '5px', border: '1px solid rgba(34,211,238,0.2)', fontWeight: 600 }}>
              ♿ {Math.round(gate.demographics.pwdRatio * 100)}% PwD
            </span>
          )}
          {gate.isChokepoint && (
            <span style={{ fontSize: '10px', background: 'var(--red-light)', color: 'var(--red)', padding: '2px 6px', borderRadius: '5px', border: '1px solid rgba(239,68,68,0.25)', fontWeight: 700 }}>
              ⚠ Chokepoint
            </span>
          )}
        </div>
      )}

      {/* Risk factors accordion */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowFactors(!showFactors); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', background: 'var(--bg-overlay)',
            border: '1px solid var(--border)', borderRadius: '6px',
            padding: '5px 8px', color: 'var(--text-muted)',
            fontSize: '11px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Info size={11} color="var(--accent)" />
            Risk factors ({risk?.factors.length || 0})
          </span>
          {showFactors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {showFactors && risk && (
          <div style={{
            marginTop: '5px', padding: '8px',
            background: 'var(--bg-base)', borderRadius: '6px',
            border: '1px solid var(--border)', fontSize: '11px',
          }}>
            {risk.factors.map((f, idx) => (
              <div key={idx} style={{ marginBottom: '5px', paddingBottom: '5px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 700 }}>
                  <span>{f.name}</span>
                  <span style={{ color: f.score > 15 ? 'var(--red)' : 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>+{f.score}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: '1px' }}>{f.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Tally + SOS/Broadcast */}
      <div style={{
        marginTop: '10px', paddingTop: '10px',
        borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
      }}>
        <div style={{ display: 'flex', gap: '3px' }}>
          {[+20, +50, -20].map((delta) => (
            <button
              key={delta}
              onClick={(e) => handleTally(e, delta)}
              className="btn btn-secondary btn-sm"
              style={{ padding: '2px 7px', fontSize: '11px' }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenBroadcast(gate.id); }}
            className="btn btn-secondary btn-sm"
            title={`Broadcast to ${gate.code}`}
            style={{ padding: '4px 8px' }}
          >
            <Radio size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenSOS(gate.id); }}
            className="btn btn-sos btn-sm"
            style={{ padding: '4px 9px' }}
          >
            <Flame size={12} />
            SOS
          </button>
        </div>
      </div>
    </div>
  );
};
