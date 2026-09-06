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
  Bot,
  Activity,
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

        {/* ── Logo + Title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #5b6af5, #3b4dd4)',
            borderRadius: '9px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 0 16px rgba(91,106,245,0.4)',
          }}>
            🏹
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: '15px', fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.02em',
              }}>
                श्री राम <span style={{ color: '#5b6af5' }}>Command</span>
              </span>
              <span style={{
                fontSize: '10px', background: 'rgba(91,106,245,0.15)',
                color: '#7c87f7', padding: '1px 7px', borderRadius: '99px',
                border: '1px solid rgba(91,106,245,0.3)', fontWeight: 700,
                fontFamily: 'var(--font-mono)',
              }}>
                AYODHYA DHAM
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span className="radar-dot" style={{ width: 5, height: 5 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {venue.name}
              </span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <span style={{ fontSize: '11px', color: '#5b6af5', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                {timeStr} IST
              </span>
              <span style={{ color: 'var(--text-faint)' }}>·</span>
              <span style={{ fontSize: '11px', color: venue.environment.weather === 'rain' ? '#60a5fa' : 'var(--green)', fontWeight: 600 }}>
                {venue.environment.weather === 'rain' ? '🌧️ Rain' : '☀️ 27°C'}
              </span>
            </div>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Nav Tabs ── */}
        <nav style={{
          display: 'flex', gap: '2px',
          background: 'var(--bg-overlay)',
          padding: '3px', borderRadius: '10px',
          border: '1px solid var(--border)',
        }}>
          {tabs.map(({ id, icon: Icon, label }) => {
            const active = currentTab === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentTab(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px', borderRadius: '8px',
                  border: active ? '1px solid var(--border-md)' : '1px solid transparent',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: active ? 'var(--bg-subtle)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <Icon size={14} />
                {label}
                {id === 'command_center' && activeAlertCount > 0 && (
                  <span style={{
                    background: 'var(--red)', color: '#fff',
                    fontSize: '10px', padding: '0 5px', height: '16px',
                    borderRadius: '99px', fontWeight: 800,
                    display: 'flex', alignItems: 'center',
                    boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                    minWidth: '16px', justifyContent: 'center',
                  }}>
                    {activeAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Right Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

          {/* Live pulse indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'var(--bg-overlay)', border: '1px solid var(--border)',
          }}>
            <span className="radar-dot" style={{ width: 5, height: 5 }} />
            <span style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              LIVE
            </span>
          </div>

          <button onClick={toggleSound} className="btn btn-secondary" title={soundEnabled ? 'Mute alerts' : 'Enable alerts'} style={{ padding: '6px 10px', minHeight: 32 }}>
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          <button onClick={onOpenBroadcast} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', minHeight: 32 }}>
            <Radio size={13} />
            PA Broadcast
          </button>

          <button onClick={onOpenIncidentLog} className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 12px', minHeight: 32 }}>
            <FileText size={13} />
            Audit Log
          </button>

          <button onClick={onOpenSetup} className="btn btn-secondary" title="Configure Venue" style={{ padding: '6px 10px', minHeight: 32 }}>
            <Settings size={14} />
          </button>

          <button onClick={onOpenDetectionApi} className="btn btn-secondary" title="YOLO Detection API" style={{ padding: '6px 10px', minHeight: 32 }}>
            <Bot size={14} />
          </button>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 4px' }} />

          <button
            onClick={onOpenSOS}
            className="btn btn-sos"
            style={{ fontSize: '12px', padding: '6px 14px', minHeight: 32, letterSpacing: '0.04em' }}
          >
            <Flame size={13} />
            SOS
          </button>
        </div>
      </div>
    </header>
  );
};
