import React from 'react';
import { Gate, RiskAssessment, RedirectionSuggestion, BroadcastMessage, VenueConfig } from '../../types';
import {
  Tv,
  ArrowRight,
  ArrowLeft,
  Clock,
  Volume2,
  Compass,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface PublicSignageViewProps {
  venue: VenueConfig;
  gates: Gate[];
  riskAssessments: Map<string, RiskAssessment>;
  redirections: RedirectionSuggestion[];
  broadcasts: BroadcastMessage[];
}

export const PublicSignageView: React.FC<PublicSignageViewProps> = ({
  venue,
  gates,
  riskAssessments,
  redirections,
  broadcasts,
}) => {
  const activeRedirection = redirections.find((r) => r.status === 'active' || r.status === 'approved');
  const activeBroadcast = broadcasts.find((b) => b.active && b.channels.includes('signage'));

  return (
    <div style={{
      minHeight: 'calc(100vh - 75px)',
      background: 'radial-gradient(circle at 50% 10%, #161a33 0%, #040711 100%)',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
    }}>
      {/* Top Banner: Digital Display Header with Saffron Accents */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(20, 30, 65, 0.95), rgba(30, 45, 90, 0.75))',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: '20px',
        padding: '22px 30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '18px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 35px rgba(245, 158, 11, 0.15)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            padding: '14px',
            borderRadius: '16px',
            color: '#070d1d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.5)',
            fontSize: '1.4rem',
            fontWeight: 900,
          }}>
            🚩
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="radar-dot" style={{ width: '8px', height: '8px', backgroundColor: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                श्री राम जन्मभूमि तीर्थ क्षेत्र • LIVE PILGRIM WAYFINDING
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em', marginTop: '2px', fontFamily: 'var(--font-display)' }}>
              {venue.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            background: 'rgba(7, 13, 29, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '10px 20px',
            borderRadius: '12px',
            textAlign: 'right',
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>दर्शन प्रतीक्षा समय (Wait Time)</span>
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)', display: 'block' }}>
              ~18 MINS
            </span>
          </div>

          <div style={{
            background: 'rgba(7, 13, 29, 0.85)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            padding: '10px 20px',
            borderRadius: '12px',
            textAlign: 'right',
          }}>
            <span style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>दर्शन स्थिति (Darshan Status)</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24', display: 'block' }}>
              🟢 सुगम दर्शन चालू (OPEN)
            </span>
          </div>
        </div>
      </div>

      {/* Active Broadcast Announcement Ticker */}
      {activeBroadcast && (
        <div style={{
          background: activeBroadcast.priority === 'emergency'
            ? 'linear-gradient(135deg, #ff2a5f, #991b1b)'
            : activeBroadcast.priority === 'urgent'
            ? 'linear-gradient(135deg, #f59e0b, #b45309)'
            : 'linear-gradient(135deg, #0284c7, #0369a1)',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: '#ffffff',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          animation: activeBroadcast.priority !== 'routine' ? 'danger-flash 1.6s infinite ease-in-out' : 'none',
        }}>
          <div style={{ background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '12px' }}>
            <Volume2 size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.95 }}>
              🚩 तीर्थ उद्घोषणा • {activeBroadcast.targetGateName.toUpperCase()}
            </span>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px', letterSpacing: '-0.01em' }}>
              {activeBroadcast.message}
            </p>
          </div>
        </div>
      )}

      {/* Prominent Active Redirection & Flow Load Balancer Banner */}
      {redirections.filter((r) => r.status !== 'dismissed').length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(99, 102, 241, 0.12))',
          border: '2px solid #fbbf24',
          borderRadius: '18px',
          padding: '22px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          boxShadow: '0 0 35px rgba(245, 158, 11, 0.35)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#030712',
                padding: '12px',
                borderRadius: '14px',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.6)',
              }}>
                <Compass size={32} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  सुगम दर्शन डायवर्जन प्रवाह (DYNAMIC CROWD FLOW ROUTING)
                </span>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#f8fafc', marginTop: '2px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                  उपलब्धता अनुसार गेट प्रवाह निर्देशित (Crowd Flow Directed As Per Availability)
                </h2>
              </div>
            </div>
            <span style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.82rem',
              letterSpacing: '0.04em',
            }}>
              🟢 LIVE LOAD BALANCED
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
            {redirections.filter((r) => r.status !== 'dismissed').map((r) => (
              <div
                key={r.id}
                style={{
                  background: 'rgba(7, 13, 29, 0.9)',
                  border: '1px solid rgba(52, 211, 153, 0.4)',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  flex: '1 1 300px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#ef4444', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem' }}>
                    {r.sourceGateName}
                  </span>
                  <ArrowRight size={16} color="#34d399" />
                  <span style={{ background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, fontSize: '0.82rem' }}>
                    {r.targetGateName}
                  </span>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: '0.8rem' }}>
                  <strong style={{ color: '#34d399' }}>{100 - r.targetDensity}% उपलब्ध</strong>
                  <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>~{r.estimatedWalkingMinutes} min (~{r.distanceMeters}m)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Wayfinding Gates Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '22px',
      }}>
        {gates.map((gate, idx) => {
          const density = Math.round((gate.currentCount / Math.max(1, gate.maxSafeCapacity)) * 100);
          const risk = riskAssessments.get(gate.id);
          const isCrowded = density >= 75 || risk?.riskLevel === 'CRITICAL' || risk?.riskLevel === 'STAMPEDE_HAZARD';
          const isModerate = density >= 55 && !isCrowded;

          const estWaitMin = isCrowded ? Math.round(25 + (density - 75) * 0.5) : isModerate ? Math.round(10 + (density - 55) * 0.4) : Math.max(2, Math.round(density * 0.1));

          return (
            <div
              key={gate.id}
              style={{
                background: isCrowded
                  ? 'linear-gradient(135deg, rgba(255, 42, 95, 0.14), rgba(15, 25, 50, 0.85))'
                  : 'linear-gradient(135deg, rgba(18, 28, 60, 0.8), rgba(25, 40, 85, 0.65))',
                border: isCrowded ? '2px solid rgba(255, 42, 95, 0.6)' : '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isCrowded ? '0 0 30px rgba(255, 42, 95, 0.3)' : '0 8px 30px rgba(0,0,0,0.4)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div>
                {/* Gate Code & Status Tag */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    background: isCrowded ? '#ff2a5f' : isModerate ? '#f59e0b' : '#10b981',
                    color: '#ffffff',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    fontWeight: 900,
                    fontSize: '1rem',
                    fontFamily: 'var(--font-mono)',
                    boxShadow: `0 0 15px ${isCrowded ? 'rgba(255, 42, 95, 0.5)' : 'rgba(16, 185, 129, 0.4)'}`,
                  }}>
                    {gate.code}
                  </span>

                  <span style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    color: isCrowded ? '#ff6b8b' : isModerate ? '#fbbf24' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}>
                    {isCrowded ? '🚫 अत्यधिक भीड़ (HEAVY RUSH)' : isModerate ? '⚠️ सामान्य कतार (MODERATE)' : '✅ सुगम व तीव्र प्रवेश (FAST)'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#f8fafc', marginTop: '16px', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>
                  {gate.name}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '4px', fontWeight: 600 }}>
                  परिसर क्षेत्र: {gate.zone} • {gate.gateType === 'entry' ? 'प्रवेश मार्ग (Ingress)' : gate.gateType === 'exit' ? 'निकास मार्ग (Egress)' : 'द्विपक्षीय मार्ग (Both)'}
                </p>

                {/* Wait Time & Capacity Meter */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '18px',
                  padding: '12px 18px',
                  background: 'rgba(7, 13, 29, 0.75)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>अनुमानित दर्शन प्रतीक्षा</span>
                    <strong style={{ fontSize: '1.35rem', color: isCrowded ? '#ff2a5f' : '#f8fafc', fontFamily: 'var(--font-mono)', fontWeight: 900 }}>
                      ~{estWaitMin} मिनट
                    </strong>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', fontWeight: 700 }}>कतार घनत्व (Load)</span>
                    <strong style={{ fontSize: '1.25rem', color: isCrowded ? '#ff2a5f' : isModerate ? '#f59e0b' : '#34d399', fontWeight: 900, fontFamily: 'var(--font-mono)' }}>
                      {density}%
                    </strong>
                  </div>
                </div>
              </div>

              {/* Wayfinding Footer Action */}
              <div style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.84rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                  {idx % 2 === 0 ? <ArrowRight size={18} color="#fbbf24" /> : <ArrowLeft size={18} color="#fbbf24" />}
                  {gate.code} दर्शन संकेतकों का पालन करें
                </span>

                {isCrowded && (
                  <span style={{ fontSize: '0.78rem', color: '#ff6b8b', fontWeight: 800 }}>
                    वैकल्पिक मार्ग सुझाया गया
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
