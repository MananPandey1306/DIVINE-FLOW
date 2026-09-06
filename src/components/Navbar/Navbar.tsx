import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  Tv,
  Camera,
  Settings,
  Volume2,
  VolumeX,
  Bell,
  Flame,
  ChevronDown,
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
  onOpenDetectionApi: _onOpenDetectionApi,
  onOpenBroadcast,
  onOpenSOS,
  onOpenIncidentLog,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(audioService.isEnabled());

  const isAyodhya = venue.id.includes('ayodhya') || venue.id.includes('ram');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
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
    { id: 'command_center' as const, icon: ShieldAlert, label: 'Command Center' },
    { id: 'public_signage' as const, icon: Tv,           label: 'Pilgrim Signage' },
    { id: 'vision_feed'   as const, icon: Camera,        label: 'AI Vision CCTV' },
  ];

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '16px' }}>

        {/* ── Brand Logo & Title ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: 34,
            height: 34,
            background: '#ffffff',
            borderRadius: '9px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            border: '1px solid rgba(0,0,0,0.08)',
            padding: '2px',
            overflow: 'hidden',
          }}>
            <img src="/logo.png" alt="Divine Flow" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              DivineFlow
            </span>
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: '#0d9488',
            }}>
              Admin
            </span>
          </div>

          {/* Minimal Shrine Switcher */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(0,0,0,0.04)',
            padding: '2px',
            borderRadius: '9999px',
            border: '1px solid rgba(0,0,0,0.06)',
            marginLeft: '6px',
          }}>
            <button
              type="button"
              onClick={() => dataIngestionService.loadPreset('somnath-jyotirlinga-mandir')}
              style={{
                padding: '2px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: !isAyodhya ? '#0d9488' : 'transparent',
                color: !isAyodhya ? '#ffffff' : '#64748b',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease',
              }}
              title="Shri Somnath Jyotirlinga Mandir"
            >
              🔱 SOMNATH
            </button>
            <button
              type="button"
              onClick={() => dataIngestionService.loadPreset('ram-janmabhoomi-ayodhya')}
              style={{
                padding: '2px 8px',
                fontSize: '10.5px',
                fontWeight: 700,
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                background: isAyodhya ? '#0d9488' : 'transparent',
                color: isAyodhya ? '#ffffff' : '#64748b',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease',
              }}
              title="Shri Ram Janmabhoomi Mandir, Ayodhya"
            >
              🚩 AYODHYA
            </button>
          </div>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Nav Dock Segmented Tabs ── */}
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

        {/* ── Right Controls & Live Time ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Live Date-Time Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 14px',
            borderRadius: '9999px',
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            fontSize: '11.5px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
          }}>
            <span className="radar-dot" style={{ width: 6, height: 6, backgroundColor: '#0d9488' }} />
            <strong style={{ color: 'var(--text-primary)' }}>{timeStr}</strong>
            <span style={{ color: 'var(--text-faint)' }}>·</span>
            <span style={{ color: 'var(--text-muted)' }}>{dateStr}</span>
          </div>

          {/* Notifications Icon Button */}
          <button
            onClick={onOpenIncidentLog}
            className="btn btn-secondary"
            title="Active Notifications & Incident Logs"
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px', position: 'relative' }}
          >
            <Bell size={14} />
            {activeAlertCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#0d9488',
              }} />
            )}
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleSound}
            className="btn btn-secondary"
            title={soundEnabled ? 'Mute audio' : 'Enable audio'}
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {/* PA Broadcast Button */}
          <button
            onClick={onOpenBroadcast}
            className="btn btn-secondary"
            title="Public Address Broadcast"
            style={{ fontSize: '11.5px', padding: '5px 11px', minHeight: 32, borderRadius: '8px', gap: '5px' }}
          >
            <Radio size={13} />
            Broadcast
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSetup}
            className="btn btn-secondary"
            title="Venue Setup & Gates"
            style={{ padding: '6px 9px', minHeight: 32, borderRadius: '8px' }}
          >
            <Settings size={14} />
          </button>

          {/* SOS Trigger Button */}
          <button
            onClick={onOpenSOS}
            className="btn btn-sos"
            style={{ fontSize: '11px', padding: '5px 12px', minHeight: 32, borderRadius: '8px', letterSpacing: '0.04em' }}
          >
            <Flame size={13} />
            SOS
          </button>

          {/* Commander Profile Chip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingLeft: '6px',
            borderLeft: '1px solid var(--border)',
            cursor: 'pointer',
          }}
          onClick={onOpenSetup}
          >
            <div style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #0d9488, #059669)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 800,
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
            }}>
              AD
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Admin Commander
              </span>
              <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
                {isAyodhya ? 'Ayodhya ICCC' : 'Somnath ICCC'}
              </span>
            </div>
            <ChevronDown size={12} color="var(--text-muted)" />
          </div>
        </div>
      </div>
    </header>
  );
};
