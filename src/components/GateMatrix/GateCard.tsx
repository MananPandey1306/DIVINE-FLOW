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
  Shield,
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
  let accentColor = '#10b981';

  if (riskLevel === 'STAMPEDE_HAZARD') {
    tierClass = 'card-tier-stampede';
    accentColor = '#ec4899';
  } else if (riskLevel === 'CRITICAL') {
    tierClass = 'card-tier-critical';
    accentColor = '#ff2a5f';
  } else if (riskLevel === 'HIGH') {
    tierClass = 'card-tier-high';
    accentColor = '#ff6b2c';
  } else if (riskLevel === 'MODERATE') {
    tierClass = 'card-tier-moderate';
    accentColor = '#f59e0b';
  }

  const handleTally = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    dataIngestionService.adjustGateCount(gate.id, delta);
  };

  const handleToggleSensor = (e: React.MouseEvent) => {
    e.stopPropagation();
    dataIngestionService.toggleGateSensor(gate.id);
  };

  // Circular Gauge Calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, density) / 100) * circumference;

  return (
    <div
      onClick={onSelect}
      className={`glass-panel glass-panel-hover ${tierClass}`}
      style={{
        padding: '18px',
        cursor: 'pointer',
        position: 'relative',
        background: isSelected ? 'rgba(20, 35, 70, 0.9)' : 'rgba(15, 25, 50, 0.65)',
        border: isSelected ? '1px solid #00d2ff' : '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: isSelected ? '0 0 25px rgba(0, 210, 255, 0.35)' : 'none',
      }}
    >
      {/* Top Header: Code, Name, Circular Radial Gauge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: 'rgba(0, 210, 255, 0.15)',
              color: '#00d2ff',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              fontSize: '0.8rem',
              padding: '2px 7px',
              borderRadius: '6px',
              border: '1px solid rgba(0, 210, 255, 0.3)',
            }}>
              {gate.code}
            </span>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>{gate.zone}</span>
          </div>
          
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', marginTop: '6px', letterSpacing: '-0.01em' }}>
            {gate.name}
          </h3>
        </div>

        {/* Circular SVG Radial Meter */}
        <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
          <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              stroke={accentColor}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-mono)',
            color: accentColor,
          }}>
            {density}%
          </div>
        </div>
      </div>

      {/* Headcount Numbers & Linear Bar */}
      <div style={{ marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              {gate.currentCount.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
              / {gate.maxSafeCapacity.toLocaleString()} cap
            </span>
          </div>

          <span className={`badge badge-${riskLevel.toLowerCase()}`}>
            {riskLevel === 'STAMPEDE_HAZARD' ? '🚨 STAMPEDE' : riskLevel}
          </span>
        </div>

        {/* Modern Linear Gradient Density Bar */}
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: '999px',
          overflow: 'hidden',
          marginTop: '8px',
        }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, density)}%`,
              background: density >= 95
                ? 'linear-gradient(90deg, #ff6b2c, #ff2a5f, #ec4899)'
                : density >= 80
                ? 'linear-gradient(90deg, #f59e0b, #ff2a5f)'
                : density >= 60
                ? 'linear-gradient(90deg, #10b981, #f59e0b)'
                : 'linear-gradient(90deg, #00d2ff, #10b981)',
              boxShadow: `0 0 10px ${accentColor}`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Trend & Sensor Telemetry Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '12px',
        padding: '7px 10px',
        background: 'rgba(7, 13, 29, 0.6)',
        borderRadius: '8px',
        fontSize: '0.74rem',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        {/* Trend Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {risk?.trend === 'surging' ? (
            <TrendingUp size={14} color="#ff2a5f" />
          ) : risk?.trend === 'increasing' ? (
            <TrendingUp size={14} color="#ff6b2c" />
          ) : risk?.trend === 'decreasing' ? (
            <TrendingDown size={14} color="#10b981" />
          ) : (
            <Minus size={14} color="#94a3b8" />
          )}
          <span style={{
            fontWeight: 700,
            color: risk?.trend === 'surging' ? '#ff2a5f' : risk?.trend === 'increasing' ? '#fb923c' : '#cbd5e1',
          }}>
            {risk?.trend?.toUpperCase()} ({risk?.velocityPerMin && risk.velocityPerMin > 0 ? `+${risk.velocityPerMin}` : risk?.velocityPerMin || 0}/m)
          </span>
        </div>

        {/* Sensor Status Toggle */}
        <button
          onClick={handleToggleSensor}
          title={gate.sensorStatus === 'online' ? 'Sensor Online (Click to simulate sensor disconnect)' : 'Sensor Offline (Click to restore)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: gate.sensorStatus === 'online' ? '#34d399' : '#ff2a5f',
            cursor: 'pointer',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          {gate.sensorStatus === 'online' ? <Wifi size={13} /> : <WifiOff size={13} />}
          {gate.sensorStatus.toUpperCase()}
        </button>
      </div>

      {/* Demographic & Vulnerability Tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
        {gate.demographics.elderlyRatio > 0.15 && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(168, 85, 247, 0.3)', fontWeight: 600 }}>
            🧓 {Math.round(gate.demographics.elderlyRatio * 100)}% Elderly
          </span>
        )}
        {gate.demographics.childrenRatio > 0.1 && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(234, 179, 8, 0.3)', fontWeight: 600 }}>
            🧒 {Math.round(gate.demographics.childrenRatio * 100)}% Children
          </span>
        )}
        {gate.demographics.pwdRatio > 0.03 && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(0, 210, 255, 0.3)', fontWeight: 600 }}>
            ♿ {Math.round(gate.demographics.pwdRatio * 100)}% PwD
          </span>
        )}
        {gate.isChokepoint && (
          <span style={{ fontSize: '0.7rem', background: 'rgba(255, 42, 95, 0.15)', color: '#ff6b8b', padding: '2px 7px', borderRadius: '5px', border: '1px solid rgba(255, 42, 95, 0.35)', fontWeight: 700 }}>
            ⚠️ Chokepoint
          </span>
        )}
      </div>

      {/* Factor Breakdown Accordion Toggle */}
      <div style={{ marginTop: '10px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFactors(!showFactors);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            background: 'rgba(22, 36, 68, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '7px',
            padding: '6px 9px',
            color: '#94a3b8',
            fontSize: '0.72rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Info size={12} color="#00d2ff" />
            Risk Factors Breakdown ({risk?.factors.length || 0})
          </span>
          {showFactors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFactors && risk && (
          <div style={{
            marginTop: '6px',
            padding: '10px',
            background: 'rgba(7, 13, 29, 0.9)',
            borderRadius: '8px',
            border: '1px solid var(--border-glass)',
            fontSize: '0.72rem',
          }}>
            {risk.factors.map((f, idx) => (
              <div key={idx} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f1f5f9', fontWeight: 700 }}>
                  <span>{f.name}</span>
                  <span style={{ color: f.score > 15 ? '#ff2a5f' : '#00d2ff', fontFamily: 'var(--font-mono)' }}>+{f.score} pts</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.68rem', marginTop: '2px' }}>{f.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Footer: Manual Tally & Quick SOS/Broadcast Buttons */}
      <div style={{
        marginTop: '14px',
        paddingTop: '10px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '6px',
      }}>
        {/* Manual Tally Buttons */}
        <div style={{ display: 'flex', gap: '3px' }}>
          <button
            onClick={(e) => handleTally(e, 20)}
            title="Manual Tally +20"
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 7px', fontSize: '0.7rem', fontWeight: 700 }}
          >
            +20
          </button>
          <button
            onClick={(e) => handleTally(e, 50)}
            title="Manual Tally +50"
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 7px', fontSize: '0.7rem', fontWeight: 700 }}
          >
            +50
          </button>
          <button
            onClick={(e) => handleTally(e, -20)}
            title="Manual Tally -20"
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 7px', fontSize: '0.7rem', fontWeight: 700 }}
          >
            -20
          </button>
        </div>

        {/* SOS & Broadcast Trigger */}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenBroadcast(gate.id);
            }}
            title={`Send Broadcast to ${gate.code}`}
            className="btn btn-secondary btn-sm"
            style={{ padding: '5px 9px' }}
          >
            <Radio size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSOS(gate.id);
            }}
            title={`One-Tap SOS at ${gate.code}`}
            className="btn btn-sos btn-sm"
            style={{ padding: '5px 10px' }}
          >
            <Flame size={13} />
            SOS
          </button>
        </div>
      </div>
    </div>
  );
};
