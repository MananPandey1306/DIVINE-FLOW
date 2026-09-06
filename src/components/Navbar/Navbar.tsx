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
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>

        {/* ── Logo + Brand ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div style={{
            width: 42,
            height: 42,
            background: '#ffffff',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 4px 14px rgba(109, 40, 217, 0.16)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            padding: '3px 5px',
            overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="Divine Flow Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}>
                DIVINE FLOW <span style={{ color: '#6d28d9' }}>AI Command</span>
              </span>
              <span style={{
                fontSize: '10px',
                background: 'rgba(109, 40, 217, 0.08)',
                color: '#6d28d9',
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                AYODHYA DHAM
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
              <span className="radar-dot" style={{ width: 6, height: 6 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {venue.name}
              </span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <span style={{ fontSize: '11px', color: '#6d28d9', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {timeStr} IST
              </span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <span style={{ fontSize: '11px', color: venue.environment.weather === 'rain' ? '#0284c7' : 'var(--green)', fontWeight: 600 }}>
                {venue.environment.weather === 'rain' ? '🌧️ Rain' : '☀️ 27°C'}
              </span>
            </div>
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
                  gap: '7px',
                  position: 'relative',
                }}
              >
                <Icon size={14} />
                {label}
                {id === 'command_center' && activeAlertCount > 0 && (
                  <span style={{
                    background: 'var(--red)',
                    color: '#fff',
                    fontSize: '10px',
                    padding: '0 6px',
                    height: '18px',
                    borderRadius: '9999px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
                    minWidth: '18px',
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

        {/* ── Right Action Controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* AI Agent / YOLO status badge */}
          <button
            onClick={onOpenDetectionApi}
            style={{
              background: 'rgba(109, 40, 217, 0.08)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              color: '#6d28d9',
              borderRadius: '9999px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
            title="Configure YOLO AI Engine"
          >
            <Sparkles size={13} color="#6d28d9" />
            AI Agent
          </button>

          {/* Live indicator badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '9999px',
            background: '#ffffff',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}>
            <span className="radar-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
              LIVE
            </span>
          </div>

          <button onClick={toggleSound} className="btn btn-secondary" title={soundEnabled ? 'Mute audio' : 'Enable audio'} style={{ padding: '6px 10px', minHeight: 34 }}>
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          <button onClick={onOpenBroadcast} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px', minHeight: 34 }}>
            <Radio size={13} />
            PA Broadcast
          </button>

          <button onClick={onOpenIncidentLog} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px', minHeight: 34 }}>
            <FileText size={13} />
            Audit Log
          </button>

          <button onClick={onOpenSetup} className="btn btn-secondary" title="Venue Settings" style={{ padding: '6px 10px', minHeight: 34 }}>
            <Settings size={14} />
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 26, background: 'var(--border)', margin: '0 4px' }} />

          <button
            onClick={onOpenSOS}
            className="btn btn-sos"
            style={{ fontSize: '12px', padding: '6px 16px', minHeight: 34, letterSpacing: '0.04em' }}
          >
            <Flame size={14} />
            SOS
          </button>
        </div>
      </div>
    </header>
  );
};
