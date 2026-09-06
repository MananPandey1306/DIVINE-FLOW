import React, { useState } from 'react';
import { VenueConfig, Gate, GateType, SensorType } from '../../types';
import {
  Settings,
  X,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Sparkles,
  MapPin,
  Shield,
  Layers,
} from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';
import { VENUE_PRESETS } from '../../data/presets';

interface VenueSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVenue: VenueConfig;
}

export const VenueSetupModal: React.FC<VenueSetupModalProps> = ({
  isOpen,
  onClose,
  currentVenue,
}) => {
  const [venueData, setVenueData] = useState<VenueConfig>(() => JSON.parse(JSON.stringify(currentVenue)));
  const [activeTab, setActiveTab] = useState<'general' | 'gates' | 'policies'>('general');

  if (!isOpen) return null;

  const handleAddGate = () => {
    const nextIdx = venueData.gates.length + 1;
    const newGate: Gate = {
      id: `gate-custom-${Date.now()}`,
      name: `Gate ${nextIdx} - Custom Access Point`,
      code: `G-0${nextIdx}`,
      zone: 'Outer Concourse',
      location: {
        x: Math.round(20 + Math.random() * 60),
        y: Math.round(20 + Math.random() * 60),
        zone: 'Outer Concourse',
      },
      maxSafeCapacity: 50,
      currentCount: 50,
      gateType: 'both',
      sensorType: 'camera_ai',
      sensorStatus: 'online',
      lastHeartbeat: Date.now(),
      isChokepoint: false,
      demographics: { elderlyRatio: 0.15, childrenRatio: 0.1, pwdRatio: 0.03 },
      history: [],
      inflowRate: 80,
      outflowRate: 50,
    };

    setVenueData({
      ...venueData,
      gates: [...venueData.gates, newGate],
    });
  };

  const handleRemoveGate = (gateId: string) => {
    setVenueData({
      ...venueData,
      gates: venueData.gates.filter((g) => g.id !== gateId),
    });
  };

  const handleUpdateGate = (gateId: string, updates: Partial<Gate>) => {
    setVenueData({
      ...venueData,
      gates: venueData.gates.map((g) => (g.id === gateId ? { ...g, ...updates } : g)),
    });
  };

  const handleSave = () => {
    dataIngestionService.setVenue(venueData);
    dataIngestionService.logIncident('CONFIG_CHANGE', 'low', `Venue configuration updated: ${venueData.name} (${venueData.gates.length} gates)`, undefined, 'Admin Setup Wizard');
    onClose();
  };

  const handlePresetSelect = (presetId: string) => {
    const found = VENUE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setVenueData(JSON.parse(JSON.stringify(found)));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', padding: '24px' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.15)',
              padding: '8px',
              borderRadius: '8px',
              color: '#38bdf8',
            }}>
              <Settings size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                Venue & Gate Calibration Wizard
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Define safe capacity baselines, spatial coordinates, sensor types & alert thresholds
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Wizard Subtabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '10px',
          marginBottom: '16px',
        }}>
          {[
            { id: 'general', label: '1. Venue Details & Footfall' },
            { id: 'gates', label: `2. Gate Nodes (${venueData.gates.length})` },
            { id: 'policies', label: '3. Redirection & SLA Policies' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                border: activeTab === tab.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: General Venue Details */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
            }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                <Sparkles size={14} color="#eab308" />
                Quick Load Standard Venue Preset:
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {VENUE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetSelect(p.id)}
                    style={{
                      background: venueData.id === p.id ? 'rgba(56, 189, 248, 0.3)' : 'rgba(15, 23, 42, 0.8)',
                      color: venueData.id === p.id ? '#38bdf8' : '#cbd5e1',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📍 {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Venue Name:
                </label>
                <input
                  type="text"
                  value={venueData.name}
                  onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Venue Category / Event Type:
                </label>
                <select
                  value={venueData.venueType}
                  onChange={(e) => setVenueData({ ...venueData, venueType: e.target.value as any })}
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                >
                  <option value="Religious Gathering">Religious Gathering / Pilgrimage</option>
                  <option value="Sports Stadium">Sports Stadium / Arena</option>
                  <option value="Exhibition & Convention">Exhibition & Convention Center</option>
                  <option value="Music Concert">Music Concert / Festival</option>
                  <option value="Transit Hub">Transit Hub / Rail Station</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Expected Total Footfall:
                </label>
                <input
                  type="number"
                  value={venueData.environment.expectedTotalFootfall}
                  onChange={(e) =>
                    setVenueData({
                      ...venueData,
                      environment: { ...venueData.environment, expectedTotalFootfall: parseInt(e.target.value) || 0 },
                    })
                  }
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Event Start Time:
                </label>
                <input
                  type="time"
                  value={venueData.environment.eventStartTime}
                  onChange={(e) =>
                    setVenueData({
                      ...venueData,
                      environment: { ...venueData.environment, eventStartTime: e.target.value },
                    })
                  }
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                  Event End Time:
                </label>
                <input
                  type="time"
                  value={venueData.environment.eventEndTime}
                  onChange={(e) =>
                    setVenueData({
                      ...venueData,
                      environment: { ...venueData.environment, eventEndTime: e.target.value },
                    })
                  }
                  style={{
                    width: '100%',
                    background: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
                Venue Profile Description:
              </label>
              <textarea
                rows={2}
                value={venueData.description}
                onChange={(e) => setVenueData({ ...venueData, description: e.target.value })}
                style={{
                  width: '100%',
                  background: '#1e293b',
                  color: '#f8fafc',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Gates Configuration */}
        {activeTab === 'gates' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                Configure individual gate capacity, chokepoints & sensor feeds:
              </span>
              <button onClick={handleAddGate} className="btn btn-primary btn-sm">
                <Plus size={14} /> Add New Gate
              </button>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {venueData.gates.map((gate, idx) => (
                <div
                  key={gate.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#38bdf8', color: '#0f172a', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={gate.name}
                        onChange={(e) => handleUpdateGate(gate.id, { name: e.target.value })}
                        style={{
                          background: '#0f172a',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          width: '260px',
                        }}
                      />
                    </div>

                    <button
                      onClick={() => handleRemoveGate(gate.id)}
                      disabled={venueData.gates.length <= 2}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: venueData.gates.length <= 2 ? '#475569' : '#ef4444',
                        cursor: venueData.gates.length <= 2 ? 'not-allowed' : 'pointer',
                        padding: '4px',
                      }}
                      title="Remove Gate"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '0.75rem' }}>
                    <div>
                      <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Sensor Ingest:</label>
                      <select
                        value={gate.sensorType}
                        onChange={(e) => handleUpdateGate(gate.id, { sensorType: e.target.value as SensorType })}
                        style={{
                          width: '100%',
                          background: '#0f172a',
                          color: '#f8fafc',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          fontSize: '0.78rem',
                        }}
                      >
                        <option value="camera_ai">CCTV AI Vision</option>
                        <option value="smart_turnstile">Smart Turnstile</option>
                        <option value="laser_beam">Laser Beam Counter</option>
                        <option value="manual_tally">Manual Clicker</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Chokepoint:</label>
                      <button
                        type="button"
                        onClick={() => handleUpdateGate(gate.id, { isChokepoint: !gate.isChokepoint })}
                        style={{
                          width: '100%',
                          background: gate.isChokepoint ? 'rgba(239, 68, 68, 0.25)' : 'rgba(15, 23, 42, 0.8)',
                          color: gate.isChokepoint ? '#f87171' : '#94a3b8',
                          border: gate.isChokepoint ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '6px',
                          padding: '4px 6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {gate.isChokepoint ? '⚠️ Bottleneck' : 'Standard'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Redirection & SLA Policies */}
        {activeTab === 'policies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                Hysteresis & Anti-Thrashing Delay
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>
                Prevents rapid redirection "ping-ponging" by enforcing a mandatory minimum hold duration before altering diversion signage.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={venueData.hysteresisSeconds}
                  onChange={(e) => setVenueData({ ...venueData, hysteresisSeconds: parseInt(e.target.value) || 20 })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {venueData.hysteresisSeconds} Seconds
                </span>
              </div>
            </div>

            <div style={{
              background: 'rgba(30, 41, 59, 0.6)',
              padding: '14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
            }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                Alert SLA Escalation Window
              </h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '10px' }}>
                If an alert is unacknowledged by gate supervisors within this SLA, it automatically escalates to Control Room & Incident Commanders.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="15"
                  max="120"
                  value={venueData.escalationSlaSeconds}
                  onChange={(e) => setVenueData({ ...venueData, escalationSlaSeconds: parseInt(e.target.value) || 45 })}
                  style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f97316', fontFamily: 'var(--font-mono)' }}>
                  {venueData.escalationSlaSeconds} Seconds
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '20px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>

          <button type="button" onClick={handleSave} className="btn btn-primary" style={{ padding: '8px 22px' }}>
            <Save size={15} /> Apply & Save Venue Calibration
          </button>
        </div>
      </div>
    </div>
  );
};
