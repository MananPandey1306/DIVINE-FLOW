import React, { useEffect, useState } from 'react';
import { Bot, Check, Server, X } from 'lucide-react';
import { visionDetector } from '../../services/visionDetector';

interface DetectionApiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'cams-pro-detection-api-url';
const DEFAULT_URL = 'http://localhost:8000/api/detect';

export const DetectionApiModal: React.FC<DetectionApiModalProps> = ({ isOpen, onClose }) => {
  const [apiUrl, setApiUrl] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const saved = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : '';
    const nextUrl = saved || DEFAULT_URL;
    setApiUrl(nextUrl);
    visionDetector.setDetectionApiUrl(nextUrl);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const cleaned = apiUrl.trim();
    const nextUrl = cleaned || DEFAULT_URL;
    setApiUrl(nextUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextUrl);
    }
    visionDetector.setDetectionApiUrl(nextUrl);
    setStatus('YOLO-CROWD API is active.');
    setTimeout(() => onClose(), 350);
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
                YOLO-CROWD Detection API
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Use your backend model endpoint for crowd counting instead of the browser-only detector.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', padding: '14px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
              <Server size={14} color="#60a5fa" />
              API URL
            </label>
            <input
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000/api/detect"
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

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              Expected response: {"{ count, density, detections }"}
            </div>
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
                Save API
              </button>
            </div>
          </div>

          {status && (
            <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
