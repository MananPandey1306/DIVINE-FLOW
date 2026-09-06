import React, { useState } from 'react';
import { Gate, SOSDispatch } from '../../types';
import {
  Flame,
  X,
  PhoneCall,
  Shield,
  Activity,
  MapPin,
  Users,
} from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  gates: Gate[];
  targetGateId?: string | null;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  gates,
  targetGateId,
}) => {
  const [selectedGateId, setSelectedGateId] = useState<string>(targetGateId || (gates[0]?.id ?? ''));
  const [emergencyType, setEmergencyType] = useState<SOSDispatch['emergencyType']>('stampede_risk');
  const [notes, setNotes] = useState('');
  const [units, setUnits] = useState<string[]>([
    'CRPF / PAC Temple Security Quick Response',
    'Ayodhya Emergency Ambulance #03',
    'Janmabhoomi Path Barrier Marshals',
  ]);

  if (!isOpen) return null;

  const currentGate = gates.find((g) => g.id === selectedGateId) || gates[0];
  const density = currentGate ? Math.round((currentGate.currentCount / currentGate.maxSafeCapacity) * 100) : 0;

  const toggleUnit = (unitName: string) => {
    if (units.includes(unitName)) {
      setUnits(units.filter((u) => u !== unitName));
    } else {
      setUnits([...units, unitName]);
    }
  };

  const handleDispatch = () => {
    if (!currentGate) return;

    dataIngestionService.triggerSOS(
      currentGate.id,
      emergencyType,
      notes.trim() || 'Immediate tactical pilgrimage emergency response summoned from Ayodhya Central Command.',
      units,
      'Ayodhya Incident Commander'
    );

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          padding: '24px',
          border: '1px solid rgba(255, 42, 95, 0.6)',
          boxShadow: '0 0 50px rgba(255, 42, 95, 0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ff2a5f, #991b1b)',
              padding: '10px',
              borderRadius: '12px',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(255, 42, 95, 0.5)',
            }}>
              <Flame size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                श्री राम जन्मभूमि आपातकालीन SOS डिस्पैच
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#ff6b8b' }}>
                Instant deployment of PAC, CRPF, SDRF, Medical & Quick Response Units
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Target Gate Selector & Auto-Attached Telemetry */}
        <div style={{
          background: 'rgba(22, 36, 68, 0.8)',
          border: '1px solid var(--border-glass-bright)',
          borderRadius: '12px',
          padding: '14px',
          marginBottom: '16px',
        }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#fbbf24', display: 'block', marginBottom: '6px' }}>
            Select Incident Gate / Corridor Location:
          </label>
          <select
            value={selectedGateId}
            onChange={(e) => setSelectedGateId(e.target.value)}
            style={{
              width: '100%',
              background: '#070d1d',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '9px 12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              outline: 'none',
              marginBottom: '10px',
            }}
          >
            {gates.map((g) => (
              <option key={g.id} value={g.id}>
                📍 {g.name} ({g.code}) — {g.zone}
              </option>
            ))}
          </select>

          {/* Auto Attached Telemetry HUD */}
          {currentGate && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              background: 'rgba(7, 13, 29, 0.8)',
              padding: '10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
            }}>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Live Pilgrim Count:</span>
                <strong style={{ color: '#00d2ff', fontSize: '0.85rem' }}>{currentGate.currentCount} Devotees</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Capacity Load:</span>
                <strong style={{ color: density >= 85 ? '#ff2a5f' : '#f59e0b', fontSize: '0.85rem' }}>{density}% ({currentGate.maxSafeCapacity} max)</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', display: 'block' }}>Ayodhya GPS:</span>
                <strong style={{ color: '#fbbf24', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  {currentGate.location.gps ? `${currentGate.location.gps.lat}, ${currentGate.location.gps.lng}` : `X:${currentGate.location.x}% Y:${currentGate.location.y}%`}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Type Selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>
            Emergency Classification (आपातकालीन प्रकार):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { id: 'stampede_risk', label: '🚨 Stampede / Crowd Surge (भीड़ दबाव)' },
              { id: 'medical_critical', label: '🚑 Medical / Heatstroke (चिकित्सा सहायता)' },
              { id: 'barricade_breach', label: '🚧 Barricade Breach (बैरिकेड अवरोध)' },
              { id: 'lost_child', label: '👶 Lost Child / Elder (खोया-पाया सहायता)' },
              { id: 'fire_smoke', label: '🚒 Fire / Deepotsav Hazard (अग्नि सुरक्षा)' },
              { id: 'security_threat', label: '👮 Security Alert (सुरक्षा चेतावनी)' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setEmergencyType(t.id as any)}
                style={{
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: emergencyType === t.id ? 'rgba(255, 42, 95, 0.25)' : 'rgba(22, 36, 68, 0.6)',
                  border: emergencyType === t.id ? '1px solid #ff2a5f' : '1px solid rgba(255, 255, 255, 0.08)',
                  color: emergencyType === t.id ? '#ff85a1' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Units to Dispatch */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Deploy Rapid Response Teams:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              'CRPF / PAC Temple Security Quick Response',
              'Ayodhya Emergency Ambulance #03',
              'Janmabhoomi Path Barrier Marshals',
              'SDRF Saryu Water Patrol',
              'Lost & Found Family Booth Marshals',
            ].map((u) => {
              const active = units.includes(u);
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => toggleUnit(u)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    background: active ? 'rgba(255, 42, 95, 0.2)' : 'rgba(22, 36, 68, 0.6)',
                    color: active ? '#ff85a1' : '#94a3b8',
                    border: active ? '1px solid rgba(255, 42, 95, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {active ? '✓ ' : '+ '} {u}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dispatch Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Tactical Notes & Ground Instructions:
          </label>
          <textarea
            rows={2}
            placeholder="Situation details (e.g. Surge at Hanuman Garhi archway. Deploy PAC marshals and open Janmabhoomi bypass immediately)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              background: '#070d1d',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.82rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            className="btn btn-sos"
            style={{ fontSize: '0.88rem', padding: '10px 24px' }}
          >
            <Flame size={18} />
            CONFIRM AYODHYA SOS DISPATCH
          </button>
        </div>
      </div>
    </div>
  );
};
