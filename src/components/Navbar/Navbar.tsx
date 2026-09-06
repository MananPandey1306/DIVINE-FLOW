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

  return (
    <header className="app-header" style={{
      background: 'rgba(7, 13, 29, 0.9)',
      borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '12px 24px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 20px rgba(245, 158, 11, 0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Logo & Ayodhya Dham Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            padding: '9px 12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px rgba(245, 158, 11, 0.5)',
            color: '#070d1d',
            fontWeight: 900,
            fontSize: '1.2rem',
          }}>
            🏹
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                श्री राम जन्मभूमि <span style={{ color: '#fbbf24', fontWeight: 900 }}>कमांड सेंटर</span>
              </h1>
              <span style={{
                fontSize: '0.68rem',
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                fontWeight: 800,
                fontFamily: 'var(--font-mono)',
              }}>
                AYODHYA DHAM
              </span>
              <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.2)' }}>|</span>
              <span style={{ fontSize: '0.88rem', color: '#cbd5e1', fontWeight: 700 }}>{venue.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
              <span className="radar-dot" style={{ width: '6px', height: '6px', backgroundColor: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>🚩 Teerth Kshetra Trust</span>
              <span>•</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#00d2ff', fontWeight: 600 }}>{timeStr} IST</span>
              <span>•</span>
              <span style={{ color: venue.environment.weather === 'rain' ? '#60a5fa' : '#34d399', fontWeight: 600 }}>
                {venue.environment.weather === 'rain' ? '🌧️ Monsoon Rain Rush' : '☀️ Clear (27°C)'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(13, 22, 42, 0.85)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)',
        }}>
          <button
            onClick={() => setCurrentTab('command_center')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: currentTab === 'command_center' ? 'linear-gradient(135deg, #d97706, #b45309)' : 'transparent',
              color: currentTab === 'command_center' ? '#ffffff' : '#94a3b8',
              boxShadow: currentTab === 'command_center' ? '0 4px 15px rgba(217, 119, 6, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <ShieldAlert size={15} />
            Command Center (कमांड कक्ष)
            {activeAlertCount > 0 && (
              <span style={{
                background: '#ff2a5f',
                color: '#fff',
                fontSize: '0.68rem',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontWeight: 800,
                boxShadow: '0 0 10px rgba(255, 42, 95, 0.6)',
              }}>
                {activeAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('public_signage')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: currentTab === 'public_signage' ? 'linear-gradient(135deg, #059669, #047857)' : 'transparent',
              color: currentTab === 'public_signage' ? '#ffffff' : '#94a3b8',
              boxShadow: currentTab === 'public_signage' ? '0 4px 15px rgba(5, 150, 105, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Tv size={15} />
            Pilgrim Signage (श्रद्धालु सूचना बोर्ड)
          </button>

          <button
            onClick={() => setCurrentTab('vision_feed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              borderRadius: '9px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: currentTab === 'vision_feed' ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'transparent',
              color: currentTab === 'vision_feed' ? '#ffffff' : '#94a3b8',
              boxShadow: currentTab === 'vision_feed' ? '0 4px 15px rgba(124, 58, 237, 0.4)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <Camera size={15} />
            AI Vision CCTV (नेत्र निगरानी)
          </button>
        </div>

        {/* Action Buttons & Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          
          {/* Audio Mute Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute PA Chime & Announcements' : 'Enable PA Chime & Announcements'}
            className="btn btn-secondary"
            style={{ padding: '8px' }}
          >
            {soundEnabled ? <Volume2 size={16} color="#10b981" /> : <VolumeX size={16} color="#94a3b8" />}
          </button>

          {/* Quick Broadcast Button */}
          <button
            onClick={onOpenBroadcast}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '8px 14px', background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
          >
            <Radio size={14} />
            PA Broadcast (उद्घोषणा)
          </button>

          {/* Incident Log Button */}
          <button
            onClick={onOpenIncidentLog}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '8px 14px' }}
            title="View Incident Audit Trail"
          >
            <FileText size={14} />
            Audit Log
          </button>

          {/* Setup / Config Wizard */}
          <button
            onClick={onOpenSetup}
            className="btn btn-secondary"
            style={{ padding: '8px' }}
            title="Configure Venue & Gates"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={onOpenDetectionApi}
            className="btn btn-secondary"
            style={{ padding: '8px' }}
            title="Configure YOLO-CROWD detection API"
          >
            <Bot size={16} />
          </button>

          {/* One-Tap Emergency SOS Button */}
          <button
            onClick={onOpenSOS}
            className="btn btn-sos"
            style={{
              padding: '8px 18px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Flame size={16} />
            SOS DISPATCH (आपातकालीन)
          </button>

        </div>
      </div>

    </header>
  );
};
