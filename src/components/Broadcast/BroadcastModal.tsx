import React, { useState } from 'react';
import { Gate } from '../../types';
import { Radio, X, Send, Volume2, Tv, Smartphone, MessageSquare } from 'lucide-react';
import { dataIngestionService } from '../../services/dataIngestion';
import { audioService } from '../../services/audioSynthesizer';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  gates: Gate[];
  defaultGateId?: string | null;
}

const AYODHYA_BROADCAST_TEMPLATES = [
  {
    title: '🚩 Crowd diversion on Gate 2 -> Gate 3',
    message: 'सभी भक्तों को ध्यान दें: गेट 2 पर अत्यधिक भीड़ है। सुगम और तेज़ दर्शन के लिए कृपया गेट 3, जन्मभूमि मार्ग की ओर प्रस्थान करें।',
    messageEn: 'Attention all devotees: Gate 2 is experiencing heavy crowding. For smooth and faster darshan, please proceed towards Gate 3, Janmabhoomi Path.',
    priority: 'urgent',
  },
  {
    title: '🚶‍♂️ Queue pace control',
    message: 'सभी भक्तों से अनुरोध है कि कतार में आगे बढ़ते रहें और दर्शन पथ पर रुकें नहीं।',
    messageEn: 'All devotees are kindly requested to keep moving forward in the queue and not stop on the darshan path.',
    priority: 'routine',
  },
  {
    title: '🧓 Senior and divyangjan priority lane',
    message: 'वरिष्ठ नागरिकों और दिव्यांग भक्तों के लिए विशेष परिचारिक मार्ग तथा व्हीलचेयर सुविधा, धर्म मार्ग, गेट 5 पर उपलब्ध है।',
    messageEn: 'Senior citizens and differently-abled devotees are requested to use the special accessible lane and wheelchair facility at Dharm Path, Gate 5.',
    priority: 'routine',
  },
  {
    title: '🚪 Post-Aarti exit guidance',
    message: 'आरती दर्शन समाप्त हो चुका है। कृपया रामकोट उत्तर गेट, गेट 6 और सरयू मार्ग से निकास करें। प्रसाद काउंटर आगे उपलब्ध है।',
    messageEn: 'Aarti darshan has concluded. Please use the Ramkot North Gate, Gate 6, and Saryu Marg for exit. Prasad counter is available ahead.',
    priority: 'routine',
  },
  {
    title: '🚨 Clear pathway for emergency teams',
    message: 'तत्काल सूचना: कृपया चिकित्सा और सुरक्षा दलों के लिए केंद्रीय जन्मभूमि मार्ग को तुरंत साफ करें।',
    messageEn: 'Urgent notice: Please immediately clear the central Janmabhoomi Path for medical and security teams.',
    priority: 'emergency',
  },
  {
    title: '👶 Lost and found assistance',
    message: 'यदि आप अपने परिवार से अलग हो गए हैं, तो कृपया Sugreev Kila पर स्थित केंद्रीय लॉट एंड फाउंड सहायता केंद्र से संपर्क करें।',
    messageEn: 'If you have been separated from your family, please contact the central Lost and Found Help Centre located at Sugreev Kila.',
    priority: 'routine',
  },
];

export const BroadcastModal: React.FC<BroadcastModalProps> = ({
  isOpen,
  onClose,
  gates,
  defaultGateId,
}) => {
  const [targetGateId, setTargetGateId] = useState<string>(defaultGateId || 'all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');       // Hindi message shown to staff and signage
  const [messageEn, setMessageEn] = useState('');   // English fallback for non-Hindi rendering
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [channels, setChannels] = useState<('signage' | 'pa_audio' | 'ground_app' | 'sms')[]>([
    'signage',
    'pa_audio',
    'ground_app',
  ]);

  if (!isOpen) return null;

  const toggleChannel = (ch: 'signage' | 'pa_audio' | 'ground_app' | 'sms') => {
    if (channels.includes(ch)) {
      setChannels(channels.filter((c) => c !== ch));
    } else {
      setChannels([...channels, ch]);
    }
  };

  const handleApplyTemplate = (tmpl: typeof AYODHYA_BROADCAST_TEMPLATES[0]) => {
    setTitle(tmpl.title);
    setMessage(tmpl.message);
    setMessageEn((tmpl as any).messageEn || '');
    setPriority(tmpl.priority as any);
  };

  const handlePreviewVoice = () => {
    const hindiText = (message || '').trim();
    const englishText = (messageEn || hindiText || '').trim();
    if (hindiText || englishText) {
      audioService.unlockFromUserGesture();
      audioService.speakBilingual(hindiText, englishText, true);
    }
  };

  const handleSend = () => {
    const hindiText = (message || '').trim();
    const englishText = (messageEn || hindiText || '').trim();
    if (!hindiText && !englishText) return;
    if (channels.includes('pa_audio')) audioService.unlockFromUserGesture();

    const targetGate = targetGateId === 'all' ? null : gates.find((g) => g.id === targetGateId);
    const targetName = targetGate ? targetGate.name : 'Ayodhya Complex Wide';

    dataIngestionService.sendBroadcast(
      title.trim() || 'Ayodhya Pilgrimage Public Announcement',
      hindiText || englishText,
      targetGateId,
      targetName,
      channels,
      priority,
      'Ayodhya Control Room Dispatcher'
    );

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.2)',
              padding: '8px',
              borderRadius: '8px',
              color: '#fbbf24',
            }}>
              <Radio size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                Ayodhya Public Announcement Console
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Dispatch audio announcements to all Ayodhya PA towers, digital signage and staff radios.
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Templates */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', display: 'block', marginBottom: '6px' }}>
            🚩 Ayodhya Pilgrimage Quick Templates:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {AYODHYA_BROADCAST_TEMPLATES.map((tmpl, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                style={{
                  background: 'rgba(22, 36, 68, 0.8)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.73rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        </div>

        {/* Target Gate */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Target Gate / Corridor:
          </label>
          <select
            value={targetGateId}
            onChange={(e) => setTargetGateId(e.target.value)}
            style={{
              width: '100%',
              background: '#162444',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
            }}
          >
            <option value="all">📢 All Ayodhya Mandir Corridors & Public Signage (समस्त परिसर)</option>
            {gates.map((g) => (
              <option key={g.id} value={g.id}>
                📍 {g.name} ({g.code}) — {g.zone}
              </option>
            ))}
          </select>
        </div>

        {/* Message Title & Text */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
            Announcement Headline:
          </label>
          <input
            type="text"
            placeholder="e.g. Crowd management update"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', background: '#162444', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.85rem', outline: 'none', marginBottom: '10px' }}
          />

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00d2ff', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              🎙️ Hindi announcement (metro-style voice output)
            </label>
            <textarea
              rows={4}
              placeholder="सभी भक्तों को ध्यान दें: कृपया गेट 3 की ओर प्रस्थान करें।"
              value={message}
              onChange={(e) => {
                const value = e.target.value;
                setMessage(value);
                setMessageEn(value);
              }}
              style={{ width: '100%', background: '#162444', color: '#f8fafc', border: '1px solid rgba(0,210,255,0.35)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.83rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '5px' }}>
            💡 Audio is spoken in Hindi with a clear metro-style public-address tone.
          </div>
        </div>


        {/* Priority & Channels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Priority Level:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['routine', 'urgent', 'emergency'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderRadius: '6px',
                    border: priority === p ? '1px solid currentColor' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: priority === p
                      ? p === 'emergency' ? 'rgba(255, 42, 95, 0.25)' : p === 'urgent' ? 'rgba(255, 107, 44, 0.25)' : 'rgba(245, 158, 11, 0.25)'
                      : 'rgba(22, 36, 68, 0.6)',
                    color: p === 'emergency' ? '#ff6b8b' : p === 'urgent' ? '#fb923c' : '#fbbf24',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Distribution Channels:
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'signage', label: 'Signage', icon: Tv },
                { id: 'pa_audio', label: 'PA Audio', icon: Volume2 },
                { id: 'ground_app', label: 'PAC/Security App', icon: Smartphone },
                { id: 'sms', label: 'SMS Blast', icon: MessageSquare },
              ].map((c) => {
                const Icon = c.icon;
                const active = channels.includes(c.id as any);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleChannel(c.id as any)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '5px 9px',
                      borderRadius: '6px',
                      background: active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(22, 36, 68, 0.6)',
                      color: active ? '#fbbf24' : '#94a3b8',
                      border: active ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                      fontSize: '0.73rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={13} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-glass)' }}>
          <button
            type="button"
            onClick={handlePreviewVoice}
            disabled={!((message || messageEn || '').trim())}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem' }}
          >
            <Volume2 size={15} color="#fbbf24" />
            Test Voice Synthesizer
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={!((message || messageEn || '').trim())}
              className="btn btn-primary"
              style={{ fontSize: '0.8rem', background: 'linear-gradient(135deg, #d97706, #b45309)', borderColor: '#f59e0b' }}
            >
              <Send size={15} />
              Broadcast Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
