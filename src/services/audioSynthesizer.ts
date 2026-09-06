// Audio & Speech Synthesizer — Vityarthi Crowd Management PA System
// Voice: female, warm English announcer only

class AudioSynthesizer {
  private audioCtx: AudioContext | null = null;
  private soundEnabled = true;
  private isSpeaking = false;
  private audioUnlocked = false;
  private pendingAnnouncement: { hindiText: string; englishText: string; playToneFirst: boolean } | null = null;
  private speechTimer: number | null = null;

  private hindiVoice: SpeechSynthesisVoice | null = null;
  private englishVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;

  constructor() {
    if ('speechSynthesis' in window) {
      const load = () => this.loadVoices();
      window.speechSynthesis.onvoiceschanged = load;
      setTimeout(load, 300);
    }
  }

  private chooseVoice(langPrefix: string): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;

    const all = window.speechSynthesis.getVoices();
    const matching = all.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase()));
    if (!matching.length) return null;

    const female = matching.filter((voice) => /female|woman|girl|zira|hazel|samantha|susan|sonia|raveena|lekha|heera|kalpana|priya|ananya|aria|jenny|danielle/i.test(voice.name));
    const natural = matching.filter((voice) => /google|natural|neural|premium|voice/i.test(voice.name));
    const preferred = female.length ? female : natural.length ? natural : matching;

    if (langPrefix === 'hi') {
      return preferred.find((voice) => voice.lang.toLowerCase() === 'hi-in') || preferred[0];
    }

    return preferred.find((voice) => voice.lang.toLowerCase() === 'en-in') || preferred.find((voice) => voice.lang.toLowerCase().startsWith('en')) || preferred[0];
  }

  private loadVoices() {
    if (!('speechSynthesis' in window)) return;

    const all = window.speechSynthesis.getVoices();
    if (!all.length) return;

    this.voicesLoaded = true;
    this.hindiVoice = this.chooseVoice('hi');
    this.englishVoice = this.chooseVoice('en');

    if (this.hindiVoice || this.englishVoice) {
      console.log(`🎙️ PA Voice selected — Hindi: ${this.hindiVoice?.name ?? 'none'} | English: ${this.englishVoice?.name ?? 'none'}`);
    }
  }

  private ensureVoices() {
    if (!this.voicesLoaded) this.loadVoices();
  }

  // Public API

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (!enabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      if (this.speechTimer) window.clearTimeout(this.speechTimer);
      this.speechTimer = null;
      this.isSpeaking = false;
    }
  }

  public isEnabled(): boolean { return this.soundEnabled; }

  /** Call from a button click to satisfy browser autoplay policy for future PA alerts. */
  public unlockFromUserGesture() {
    if (!this.soundEnabled) return;
    this.audioUnlocked = true;
    const context = this.getAudioContext();
    if (context?.state === 'suspended') void context.resume();
    const pending = this.pendingAnnouncement;
    this.pendingAnnouncement = null;
    if (pending) this.speakBilingual(pending.hindiText, pending.englishText, pending.playToneFirst);
  }

  private getAudioContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  // Tones & Alerts

  /** Pleasant 2-tone PA chime (airport/railway style) */
  public playChime() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const play = (freq: number, t: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + t);
        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.65);
      };
      play(587.33, 0);    // D5
      play(880.00, 0.28); // A5
    } catch (e) { console.warn('Chime failed', e); }
  }

  /** 3-tone urgent warning for high-density threshold breaches */
  public playUrgentAlert() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [0, 0.18, 0.36].forEach((offset, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(i === 1 ? 950 : 750, now + offset);
        gain.gain.setValueAtTime(0.25, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.16);
      });
    } catch (e) { console.warn('Alert failed', e); }
  }

  private getPreferredSpeechText(hindiText: string, englishText: string) {
    const hi = (hindiText || '').trim();
    const en = (englishText || '').trim();
    const hasHindi = /[\u0900-\u097F]/.test(hi) || /[\u0900-\u097F]/.test(en);

    if (hasHindi && hi) {
      return { text: hi, lang: 'hi-IN' as const, voice: this.hindiVoice ?? this.englishVoice ?? null };
    }

    if (en) {
      return { text: en, lang: 'en-IN' as const, voice: this.englishVoice ?? this.hindiVoice ?? null };
    }

    return null;
  }

  private getSarvamConfig() {
    const env = (import.meta as any).env ?? {};
    return {
      apiKey: (env.VITE_SARVAM_API_KEY ?? '').trim(),
      endpoint: (env.VITE_SARVAM_TTS_URL ?? 'https://api.sarvam.ai/text-to-speech').trim(),
    };
  }

  private async speakViaSarvam(text: string, lang: 'hi-IN' | 'en-IN') {
    const { apiKey, endpoint } = this.getSarvamConfig();
    if (!apiKey || !endpoint) return false;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'audio/*, application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey,
          'api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          target_language_code: lang,
          speaker: lang === 'hi-IN' ? 'anushka' : 'vidya',
          model: 'bulbul-v2',
          voice: lang === 'hi-IN' ? 'anushka' : 'vidya',
          format: 'wav',
          pitch: 0.0,
          pace: 1.0,
          loudness: 1.0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Sarvam TTS failed (${response.status}): ${errorText.slice(0, 200)}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.startsWith('audio/')) {
        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.volume = 1;
        await audio.play();
        return true;
      }

      const payload = await response.json().catch(() => null) as any;
      const audioUrl = payload?.audio_url ?? payload?.audioUrl ?? payload?.url ?? payload?.output_url ?? payload?.outputUrl;
      const base64Audio = payload?.audio_base64 ?? payload?.audioBase64 ?? payload?.audio_b64 ?? payload?.base64;

      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.volume = 1;
        await audio.play();
        return true;
      }

      if (base64Audio) {
        const binary = atob(base64Audio.replace(/^data:audio\/\w+;base64,/, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.volume = 1;
        await audio.play();
        return true;
      }

      return false;
    } catch (error) {
      console.warn('Sarvam text-to-speech failed, falling back to browser voice:', error);
      return false;
    }
  }

  /** Siren sweep for emergency dispatches */
  public playSosAlarm() {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.3);
      osc.frequency.linearRampToValueAtTime(600, now + 0.6);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.9);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.2);
    } catch (e) { console.warn('SOS audio failed', e); }
  }

  // Speech

  /**
   * Speaks a single Hindi-first announcement with a polished metro-style tone.
   * Falls back to English if Hindi text is not available.
   */
  public speakBilingual(hindiText: string, englishText: string, playToneFirst = true) {
   if (!this.soundEnabled) return;
   if (!this.audioUnlocked) {
     this.pendingAnnouncement = { hindiText: hindiText || '', englishText: englishText || '', playToneFirst };
     return;
   }

   const speechTarget = this.getPreferredSpeechText(hindiText, englishText);
   if (!speechTarget) return;

   this.ensureVoices();
   if (playToneFirst) this.playChime();

   const delay = playToneFirst ? 900 : 0;
   if (this.speechTimer) window.clearTimeout(this.speechTimer);

   this.speechTimer = window.setTimeout(async () => {
     this.speechTimer = null;
     try {
       const usedSarvam = await this.speakViaSarvam(speechTarget.text, speechTarget.lang);
       if (usedSarvam) return;

       if (!('speechSynthesis' in window)) return;
       window.speechSynthesis.cancel();
       this.isSpeaking = true;

       const utterance = new SpeechSynthesisUtterance(speechTarget.text);
       utterance.lang = speechTarget.lang;
       utterance.rate = speechTarget.lang === 'hi-IN' ? 0.96 : 1.0;
       utterance.pitch = speechTarget.lang === 'hi-IN' ? 1.08 : 1.06;
       utterance.volume = 1;
       utterance.voice = speechTarget.voice ?? null;

       utterance.onend = () => { this.isSpeaking = false; };
       utterance.onerror = () => { this.isSpeaking = false; };

       window.speechSynthesis.speak(utterance);
     } catch (e) {
       this.isSpeaking = false;
       console.warn('Speech synthesis failed:', e);
     }
   }, delay);
  }

  /**
   * Legacy single-text announcement — prefers Hindi for a professional public-address tone.
   */
  public speakAnnouncement(text: string, playToneFirst = true) {
   if (!this.soundEnabled || !('speechSynthesis' in window)) return;
   this.ensureVoices();

   const cleanText = (text || '')
     .replace(/\[[A-Z]+\]\s*/g, '')
     .replace(/\s+/g, ' ')
     .trim();

   const hasHindi = /[\u0900-\u097F]/.test(cleanText);
   const hindiText = hasHindi
     ? cleanText
     : (cleanText
         .replace(/Attention all devotees\.?/gi, 'सभी भक्तों और दर्शनार्थियों को ध्यान दें')
         .replace(/Attention please\.?/gi, 'कृपया ध्यान दें')
         .replace(/please/gi, 'कृपया')
         .replace(/Please/gi, 'कृपया')
         .replace(/for smooth and faster darshan/gi, 'सुगम और तेज़ दर्शन के लिए')
         .replace(/Gate\s*(\d+)/gi, 'गेट $1')
         .replace(/towards/gi, 'की ओर')
         .replace(/queue/gi, 'कतार')
         .replace(/keep moving forward/gi, 'आगे बढ़ते रहें')
         .replace(/do not stop/gi, 'रुकें नहीं')
         .replace(/crowding/gi, 'भीड़')
         .replace(/overcrowded/gi, 'अत्यधिक भीड़')
         .replace(/proceed/gi, 'प्रस्थान करें')
         .replace(/clear the path/gi, 'मार्ग साफ करें')
         .replace(/medical/gi, 'चिकित्सा')
         .replace(/security/gi, 'सुरक्षा')
         .replace(/emergency/gi, 'आपातकाल')
         .replace(/warning/gi, 'चेतावनी')
         .replace(/exit/gi, 'निकास')
         .replace(/entry/gi, 'प्रवेश')
         .replace(/please use/gi, 'कृपया उपयोग करें')
         .trim() || 'कृपया ध्यान दें, यह एक महत्वपूर्ण सूचना है');

   const englishText = cleanText || 'Attention please. This is an important announcement.';

   this.speakBilingual(hindiText, englishText, playToneFirst);
  }
}

export const audioService = new AudioSynthesizer();
