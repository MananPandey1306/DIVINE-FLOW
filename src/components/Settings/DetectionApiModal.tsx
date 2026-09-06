import React, { useEffect, useState } from 'react';
import { Activity, Bot, Check, Cpu, RefreshCw, Server, X } from 'lucide-react';
import { visionDetector } from '../../services/visionDetector';

interface DetectionApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'cams-pro-detection-api-url';
const DEFAULT_URL = 'http://localhost:8000/api/detect';

export const DetectionApiModal: React.FC<DetectionApiModalProps> = ({ isOpen, onClose }) => {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
    setApiUrl(saved !== null && saved !== undefined ? saved : DEFAULT_URL);
    setTestResult(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const targetUrl = apiUrl.trim();

    if (!targetUrl) {
      setTestResult({ ok: true, message: 'Local Hybrid AI mode selected (in-browser BlazeFace + COCO-SSD)' });
      setTesting(false);
      return;
    }

    try {
      // Test status endpoint or detect endpoint
      const baseStatusUrl = targetUrl.replace(/\/api\/detect\/?$/, '/api/status');
      const response = await fetch(baseStatusUrl, { method: 'GET', headers: { Accept: 'application/json' } }).catch(() => null);

      if (response && response.ok) {
        const data = await response.json().catch(() => null);
        if (data && data.model_loaded) {
          setTestResult({ ok: true, message: `✅ Connected! YOLO Model (${data.model_path || 'active'}) is loaded and ready.` });
        } else {
          setTestResult({ ok: true, message: `✅ Endpoint reachable (${response.status} OK).` });
        }
      } else {
        // Try detect endpoint with empty payload
        const detectResp = await fetch(targetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ width: 640, height: 480 }),
        }).catch((err) => {
          throw err;
        });

        if (detectResp.ok) {
          setTestResult({ ok: true, message: `✅ YOLO Endpoint active (${detectResp.status} OK).` });
        } else {
          setTestResult({ ok: false, message: `⚠️ Server returned HTTP ${detectResp.status}. Please verify endpoint URL.` });
        }
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `❌ Connection failed (${err?.message || 'Server unreachable'}). If testing locally, ensure 'python backend/yolo_crowd_api.py' is running on port 8000.`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    const cleaned = apiUrl.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, cleaned);
    }
    visionDetector.setDetectionApiUrl(cleaned);
    onClose();
  };

  const handleUseBrowserAI = () => {
    setApiUrl('');
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, '');
    }
    visionDetector.setDetectionApiUrl('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '24px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.18)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
              <Bot size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                AI Vision Detection Engine
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Configure your backend YOLO server or use the built-in browser neural engine.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', padding: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={14} color="#60a5fa" />
                Backend YOLO API URL
              </span>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#93c5fd',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {testing ? <RefreshCw size={12} className="spin" /> : <Activity size={12} />}
                Test Connection
              </button>
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000/api/detect (or leave blank for browser AI)"
              style={{
                width: '100%',
                background: '#0f172a',
                color: '#f8fafc',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
          </div>

          {testResult && (
            <div
              style={{
                fontSize: '0.75rem',
                padding: '10px 12px',
                borderRadius: '8px',
                background: testResult.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${testResult.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                color: testResult.ok ? '#34d399' : '#f87171',
              }}
            >
              {testResult.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={handleUseBrowserAI}
              className="btn btn-secondary"
              style={{
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
              }}
            >
              <Cpu size={14} color="#38bdf8" />
              Use Browser AI Engine
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '8px 12px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="btn btn-primary"
                style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Check size={14} />
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
