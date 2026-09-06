import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Tv,
  Camera,
  Settings,
  Volume2,
  VolumeX,
  FileText,
  Flame,
  Sparkles,
} from 'lucide-react';
import { VenueConfig, RiskLevel } from '../../types';
import { audioService } from '../../services/audioSynthesizer';

import { dataIngestionService } from '../../services/dataIngestion';

interface NavbarProps {
  currentTab: 'command_center' | 'public_signage' | 'vision_feed';
  setCurrentTab: (tab: 'command_center' | 'public_signage' | 'vision_feed') => void;
  venue: VenueConfig;
  activeAlertCount: number;
  highestRisk: RiskLevel;
  onOpenSetup: () => void;
  onOpenDetectionApi: () => void;
  onOpenBroadcast: () => void;
  onOpenSOS: () => void;
  onOpenIncidentLog: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  venue,
  activeAlertCount,
  highestRisk: _highestRisk,
  onOpenSetup,
  onOpenDetectionApi,
  onOpenBroadcast,
  onOpenSOS,
  onOpenIncidentLog,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(audioService.isEnabled());

  const isAyodhya = venue.id.includes('ayodhya') || venue.id.includes('ram');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    if (next) audioService.unlockFromUserGesture();
    setSoundEnabled(next);
    audioService.setSoundEnabled(next);
  };

  const tabs = [
    { id: 'command_center' as const, icon: ShieldAlert, label: 'Command Center', labelHi: 'कमांड कक्ष' },
    { id: 'public_signage' as const, icon: Tv,           label: 'Pilgrim Signage', labelHi: 'सूचना बोर्ड' },
    { id: 'vision_feed'   as const, icon: Camera,        label: 'AI Vision CCTV',  labelHi: 'नेत्र निगरानी' },
  ];

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '20px' }}>

        {/* ── Logo + Brand + Shrine Switcher ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div style={{
            width: 36,
            height: 36,
            background: '#ffffff',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(109, 40, 217, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            padding: '3px',
            overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="Divine Flow" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}>
            DIVINE FLOW
          </span>

          {/* Minimal Shrine Toggle Capsule */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(109, 40, 217, 0.06)',
            padding: '3px',
            borderRadius: '9999px',
            border: '1px solid rgba(124, 58, 237, 0.18)',
          }}>
            <button
              type="button"
              onClick={() => dataIngestionService.loadPreset('somnath-jyotirlinga-mandir')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: !isAyodhya ? '#7c3aed' : 'transparent',
                color: !isAyodhya ? '#ffffff' : '#64748b',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.18s ease',
              }}
              title="Shri Somnath Jyotirlinga Mandir"
            >
              🔱 SOMNATH
            </button>
            <button
              type="button"
              onClick={() => dataIngestionService.loadPreset('ram-janmabhoomi-ayodhya')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: isAyodhya ? '#7c3aed' : 'transparent',
                color: isAyodhya ? '#ffffff' : '#64748b',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.18s ease',
              }}
              title="Shri Ram Janmabhoomi Mandir, Ayodhya"
            >
              🚩 AYODHYA
            </button>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Nav Dock Switcher ── */}
        <nav className="dock-segment-container">
          {tabs.map(({ id, icon: Icon, label }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                className={`dock-segment-btn ${active ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  position: 'relative',
                  fontSize: '12px',
                  fontWeight: 700,
                }}
              >
                <Icon size={14} />
                {label}
                {id === 'command_center' && activeAlertCount > 0 && (
                  <span style={{
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '9.5px',
                    padding: '0 5px',
                    height: '16px',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)',
                    minWidth: '16px',
                    justifyContent: 'center',
                  }}>
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Minimal Right Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Live indicator badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
          }}>
            <span className="radar-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: '10.5px', color: 'var(--green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              LIVE
            </span>
          </div>

          <button
            onClick={toggleSound}
            className="btn btn-secondary"
            title={soundEnabled ? 'Mute audio' : 'Enable audio'}
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          <button
            onClick={onOpenBroadcast}
            className="btn btn-secondary"
            style={{ fontSize: '11.5px', padding: '5px 12px', minHeight: 32, borderRadius: '8px' }}
          >
            <Radio size={13} />
            PA Broadcast
          </button>

          <button
            onClick={onOpenIncidentLog}
            className="btn btn-secondary"
            title="Incident Audit Logs"
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            <FileText size={14} />
          </button>

          <button
            onClick={onOpenDetectionApi}
            className="btn btn-secondary"
            title="AI Detection Settings"
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            <Sparkles size={14} color="#7c3aed" />
          </button>

          <button
            onClick={onOpenSetup}
            className="btn btn-secondary"
            title="Venue Setup & Gates"
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            <Settings size={14} />
          </button>

          <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 2px' }} />

          <button
            onClick={onOpenSOS}
            className="btn btn-sos"
            style={{ fontSize: '11.5px', padding: '5px 14px', minHeight: 32, borderRadius: '8px', letterSpacing: '0.04em' }}
          >
            <Flame size={13} />
            SOS
          </button>
        </div>
      </div>
    </header>
  );
};
