import React, { useState, useEffect } from 'react';
import {
  Bell,
  Maximize2,
  Globe,
  Grid,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { VenueConfig, RiskLevel } from '../../types';
import { audioService } from '../../services/audioSynthesizer';

interface NavbarProps {
  currentTab: 'command_center' | 'public_signage' | 'vision_feed';
  setCurrentTab: (tab: 'command_center' | 'public_signage' | 'vision_feed') => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
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
  currentTab: _currentTab,
  setCurrentTab: _setCurrentTab,
  language,
  setLanguage,
  venue,
  activeAlertCount,
  highestRisk: _highestRisk,
  onOpenSetup,
  onOpenDetectionApi: _onOpenDetectionApi,
  onOpenBroadcast: _onOpenBroadcast,
  onOpenSOS: _onOpenSOS,
  onOpenIncidentLog,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(audioService.isEnabled());
  const [langMenuOpen, setLangMenuOpen] = useState(false);

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

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header
      style={{
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '14px',
        fontFamily: "'Times New Roman', Times, serif",
        position: 'sticky',
        top: 0,
        zIndex: 90,
      }}
    >
      {/* ── Live Date-Time Capsule ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 14px',
          borderRadius: '9999px',
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          fontSize: '12px',
          color: '#334155',
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00b894' }} />
        <strong style={{ color: '#0f172a', fontWeight: 700 }}>{timeStr}</strong>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span style={{ color: '#64748b' }}>{dateStr}</span>
      </div>

      {/* ── Notification Bell with active dot ── */}
      <button
        onClick={onOpenIncidentLog}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'transparent',
          border: 'none',
          color: '#475569',
          cursor: 'pointer',
          padding: '6px 8px',
          borderRadius: '8px',
          fontSize: '12.5px',
          fontWeight: 600,
          position: 'relative',
        }}
        title="Notifications & Incident Logs"
      >
        <Bell size={15} />
        <span>Notification</span>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: '#00b894',
            display: 'inline-block',
          }}
        />
      </button>

      {/* ── Action Icons (Fullscreen, Globe, Grid, Theme) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
        <button
          onClick={handleToggleFullscreen}
          style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '6px', cursor: 'pointer' }}
          title="Toggle Fullscreen"
        >
          <Maximize2 size={14} />
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            style={{
              background: langMenuOpen ? 'rgba(0, 184, 148, 0.15)' : 'transparent',
              border: 'none',
              color: langMenuOpen ? '#00b894' : '#64748b',
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
            }}
            title="Language / Locale Selection"
          >
            <Globe size={14} />
            <span>{language === 'hi' ? 'हिन्दी' : 'EN'}</span>
          </button>

          {langMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 1000,
                minWidth: '120px',
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => {
                  setLanguage('en');
                  setLangMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: language === 'en' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: language === 'en' ? 700 : 500,
                  color: language === 'en' ? '#00b894' : '#334155',
                  cursor: 'pointer',
                }}
              >
                English (EN)
              </button>
              <button
                onClick={() => {
                  setLanguage('hi');
                  setLangMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: language === 'hi' ? '#f1f5f9' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: language === 'hi' ? 700 : 500,
                  color: language === 'hi' ? '#00b894' : '#334155',
                  cursor: 'pointer',
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                हिन्दी (Hindi)
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onOpenSetup}
          style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '6px', cursor: 'pointer' }}
          title="App Grid & Modules"
        >
          <Grid size={14} />
        </button>

        <button
          onClick={toggleSound}
          style={{ background: 'transparent', border: 'none', color: '#64748b', padding: '6px', cursor: 'pointer' }}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          <Moon size={14} />
        </button>
      </div>

      {/* ── Commander Profile Chip ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          paddingLeft: '10px',
          borderLeft: '1px solid #e2e8f0',
          cursor: 'pointer',
        }}
        onClick={onOpenSetup}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: '#00b894',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 800,
          }}
        >
          AD
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
            Admin Commander
          </span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>
            {isAyodhya ? 'Ayodhya ICCC' : 'Somnath ICCC'}
          </span>
        </div>
        <ChevronDown size={13} color="#64748b" />
      </div>
    </header>
  );
};
