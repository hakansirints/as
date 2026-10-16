/**
 * Neşeli Adam Asmaca - Çok Oyunculu Çocuk Oyunu
 * Türkçe Karakter Desteği, Web Audio Efektleri ve Eğlenceli Görseller
 */

// ==========================================
// 1. SES MOTORU (Web Audio API - Sıfır Bağımlılık)
// ==========================================
class SoundEngine {
  constructor() {
    this.audioCtx = null;
    this.enabled = true;
    this.volume = 0.8;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setVolume(level) {
    this.volume = Math.max(0, Math.min(1, level));
  }

  playTone(freq, type = 'sine', duration = 0.15, startDelay = 0, gainLevel = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime + startDelay;
      const effectiveGain = gainLevel * this.volume;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(effectiveGain, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.warn('Audio tone error', e);
    }
  }

  // Harf doğru bilindiğinde neşeli çift ton
  playCorrectLetter() {
    this.playTone(523.25, 'triangle', 0.12, 0, 0.25); // C5
    this.playTone(659.25, 'triangle', 0.2, 0.08, 0.25); // E5
  }

  // Yanlış harfte sempatik ve komik "boing/twang" tonu (Hata sayısına göre değişken ton)
  playWrongLetter(mistakeNumber = 1) {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const startFreq = 220 + (mistakeNumber * 35);
      const endFreq = 85 + (mistakeNumber * 10);

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.28);

      gain.gain.setValueAtTime(0.22 * this.volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.28);

      // İleri hatalarda komik çizgi film yay (spring) efekti ekle
      if (mistakeNumber >= 3) {
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(450 + mistakeNumber * 50, now + 0.06);
        osc2.frequency.exponentialRampToValueAtTime(120, now + 0.32);
        gain2.gain.setValueAtTime(0.18 * this.volume, now + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(this.audioCtx.destination);
        osc2.start(now + 0.06);
        osc2.stop(now + 0.32);
      }
    } catch (e) {}
  }

  // Tıklama / Gıdıklama sesi
  playTickle() {
    this.playTone(650, 'sine', 0.08, 0, 0.15);
    this.playTone(900, 'sine', 0.1, 0.06, 0.18);
  }

  // Tahmin yanlış olup oyuncu elendiğinde
  playEliminated() {
    this.playTone(330, 'square', 0.15, 0, 0.2);
    this.playTone(247, 'square', 0.2, 0.12, 0.2);
    this.playTone(165, 'square', 0.35, 0.26, 0.2);
  }

  // Adam asıldığında (Round Kaybedildi)
  playHangmanLost() {
    this.playTone(300, 'sawtooth', 0.25, 0, 0.25);
    this.playTone(280, 'sawtooth', 0.25, 0.2, 0.25);
    this.playTone(260, 'sawtooth', 0.3, 0.4, 0.25);
    this.playTone(220, 'sawtooth', 0.6, 0.65, 0.3);
  }

  // Kelime bilindiğinde zafer melodisi
  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.25, idx * 0.12, 0.3);
    });
  }

  // İpucu kullanıldığında büyülü şıkırtı sesi
  playHintSparkle() {
    const sparkleNotes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    sparkleNotes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.18, idx * 0.05, 0.22);
    });
  }

  // Süre sayacı tik sesi (Son saniyelerde uyarır)
  playTimerTick() {
    this.playTone(950, 'sine', 0.04, 0, 0.1);
  }

  // Süre dolduğunda komik alarm sesi
  playTimerAlarm() {
    this.playTone(400, 'square', 0.12, 0, 0.18);
    this.playTone(300, 'square', 0.22, 0.12, 0.2);
  }

  // Buton tıklama
  playClick() {
    this.playTone(800, 'sine', 0.05, 0, 0.1);
  }
}

const sounds = new SoundEngine();

// ==========================================
// 1.1. CANLI SESLENDİRME MOTORU (Web Speech API)
// ==========================================
class SpeechEngine {
  constructor() {
    this.synth = (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null;
    this.voices = [];
    this.trVoice = null;
    this.init();
  }

  init() {
    if (!this.synth) return;
    this.loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    this.trVoice = this.voices.find(v => v.lang && (v.lang.startsWith('tr') || v.lang.includes('TR'))) || null;
  }

  speak(text, isBot = false) {
    if (!this.synth || !gameState.settings.voiceEnabled || !sounds.enabled) return;

    try {
      this.synth.cancel();

      // Emojileri, sembolleri ve ünlemleri sadeleştir
      let clean = text
        .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[\u{1F600}-\u{1F64F}\u{1FA00}-\u{1FAFF}]/gu, '')
        .replace(/[0-9+:\/\\#_]+/g, ' ')
        .trim();

      if (!clean) return;

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'tr-TR';
      if (this.trVoice) {
        utterance.voice = this.trVoice;
      }

      const volFactor = gameState.settings.volume / 100;
      utterance.volume = Math.max(0.1, volFactor);

      if (isBot) {
        utterance.pitch = 0.85; // Robotik daha pes
        utterance.rate = 1.0;
      } else {
        utterance.pitch = 1.35; // Sevimli çizgi film tonu
        utterance.rate = 1.08;
      }

      this.synth.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }

  stop() {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
  }
}

const speech = new SpeechEngine();

// ==========================================
// 1.2. OYUN AYARLARI SİSTEMİ (Local Storage Destekli)
// ==========================================
const DEFAULT_SETTINGS = {
  theme: 'light',
  hintsEnabled: true,
  keepTurnOnCorrect: true,
  soundEnabled: true,
  volume: 80,
  voiceEnabled: true,
  timerMode: 0, // 0: Süresiz, 30: 30sn, 60: 60sn
  botDifficulty: 'normal' // 'easy', 'normal', 'smart'
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('aybars_game_settings');
    if (saved) {
      return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(saved));
    }
  } catch (e) {}
  return Object.assign({}, DEFAULT_SETTINGS);
}

function saveSettings(newSettings) {
  gameState.settings = Object.assign({}, gameState.settings, newSettings);
  try {
    localStorage.setItem('aybars_game_settings', JSON.stringify(gameState.settings));
  } catch (e) {}
  applySettings();
}

function applySettings() {
  const s = gameState.settings;

  // 1. Tema Uygula
  document.documentElement.setAttribute('data-theme', s.theme);
  if (DOM.themeIcon) {
    DOM.themeIcon.textContent = (s.theme === 'dark') ? '☀️' : '🌙';
  }
  if (DOM.themeBtnLight && DOM.themeBtnDark) {
    DOM.themeBtnLight.classList.toggle('active', s.theme === 'light');
    DOM.themeBtnDark.classList.toggle('active', s.theme === 'dark');
  }

  // 2. Ses Ayarları Uygula
  sounds.enabled = s.soundEnabled;
  sounds.setVolume(s.volume / 100);
  if (DOM.soundIcon) {
    DOM.soundIcon.textContent = s.soundEnabled ? '🔊' : '🔇';
  }

  // 3. İpucu Butonu Görünürlüğü
  if (DOM.useHintBtn) {
    DOM.useHintBtn.style.display = s.hintsEnabled ? 'inline-flex' : 'none';
  }

  // 4. Ayarlar Modalı Form Elemanlarını Eşitle
  if (DOM.settingHintsToggle) DOM.settingHintsToggle.checked = s.hintsEnabled;
  if (DOM.settingKeepTurnToggle) DOM.settingKeepTurnToggle.checked = s.keepTurnOnCorrect;
  if (DOM.settingSoundToggle) DOM.settingSoundToggle.checked = s.soundEnabled;
  if (DOM.settingVoiceToggle) DOM.settingVoiceToggle.checked = s.voiceEnabled;
  if (DOM.settingVolumeSlider) DOM.settingVolumeSlider.value = s.volume;
  if (DOM.volumeLevelText) DOM.volumeLevelText.textContent = `%${s.volume}`;
  if (DOM.settingTimerSelect) DOM.settingTimerSelect.value = s.timerMode;
  if (DOM.settingBotDiffSelect) DOM.settingBotDiffSelect.value = s.botDifficulty;
}

// ==========================================
// 2. KONFETİ SİSTEMİ (Canvas Üzerinde)
// ==========================================
class ConfettiLauncher {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launch(durationMs = 3000) {
    this.particles = [];
    const colors = ['#ff5252', '#ff9800', '#ffeb3b', '#4caf50', '#00e5ff', '#e040fb'];
    const count = 120;

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * -this.canvas.height * 0.5,
        w: Math.random() * 12 + 6,
        h: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 5 + 3,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10
      });
    }

    if (this.animId) cancelAnimationFrame(this.animId);
    const startTime = performance.now();

    const loop = (time) => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rot * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        this.ctx.restore();
      });

      if (time - startTime < durationMs) {
        this.animId = requestAnimationFrame(loop);
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    };

    this.animId = requestAnimationFrame(loop);
  }
}

// ==========================================
// 3. OYUN SABİTLERİ VE VERİLERİ
// ==========================================
const TURKISH_ALPHABET = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H',
  'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P',
  'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z'
];

const AVATARS = [
  { icon: '🦁', name: 'Aslan' },
  { icon: '🦊', name: 'Tilki' },
  { icon: '🐼', name: 'Panda' },
  { icon: '🐰', name: 'Tavşan' }
];

// SVG Adam Asmaca Parçaları Sırası (Toplam 6 Hata)
const HANGMAN_PARTS = [
  'figureHead',
  'figureBody',
  'figureArmLeft',
  'figureArmRight',
  'figureLegLeft',
  'figureLegRight'
];

// ==========================================
// 3.1. ÇOCUK KELİME SÖZLÜĞÜ (Robot & Öneri Sistemi)
// ==========================================
const KID_WORDS_DICTIONARY = [
  // Hayvanlar 🦁
  { word: 'ASLAN', category: 'Hayvanlar 🦁' },
  { word: 'KAPLAN', category: 'Hayvanlar 🦁' },
  { word: 'ZÜRAFA', category: 'Hayvanlar 🦁' },
  { word: 'MAYMUN', category: 'Hayvanlar 🦁' },
  { word: 'FİL', category: 'Hayvanlar 🦁' },
  { word: 'KÖPEK', category: 'Hayvanlar 🦁' },
  { word: 'KEDİ', category: 'Hayvanlar 🦁' },
  { word: 'KAPLUMBAĞA', category: 'Hayvanlar 🦁' },
  { word: 'TAVŞAN', category: 'Hayvanlar 🦁' },
  { word: 'PENGUEN', category: 'Hayvanlar 🦁' },
  { word: 'YUNUS', category: 'Hayvanlar 🦁' },
  { word: 'BALİNA', category: 'Hayvanlar 🦁' },
  { word: 'PAPAĞAN', category: 'Hayvanlar 🦁' },
  { word: 'SİNCAP', category: 'Hayvanlar 🦁' },
  { word: 'TİLKİ', category: 'Hayvanlar 🦁' },
  { word: 'AYI', category: 'Hayvanlar 🦁' },
  { word: 'KURBAĞA', category: 'Hayvanlar 🦁' },
  { word: 'KARTAL', category: 'Hayvanlar 🦁' },
  { word: 'GEYİK', category: 'Hayvanlar 🦁' },
  { word: 'KANGURU', category: 'Hayvanlar 🦁' },
  { word: 'ZEBRA', category: 'Hayvanlar 🦁' },
  { word: 'KUNDUZ', category: 'Hayvanlar 🦁' },
  { word: 'KİRPİ', category: 'Hayvanlar 🦁' },
  { word: 'KOALA', category: 'Hayvanlar 🦁' },

  // Meyveler & Yiyecekler 🍎
  { word: 'ELMA', category: 'Meyve & Sebze 🍎' },
  { word: 'ARMUT', category: 'Meyve & Sebze 🍎' },
  { word: 'ÇİLEK', category: 'Meyve & Sebze 🍎' },
  { word: 'MUZ', category: 'Meyve & Sebze 🍎' },
  { word: 'KARPUZ', category: 'Meyve & Sebze 🍎' },
  { word: 'KAVUN', category: 'Meyve & Sebze 🍎' },
  { word: 'PORTAKAL', category: 'Meyve & Sebze 🍎' },
  { word: 'MANDALİNA', category: 'Meyve & Sebze 🍎' },
  { word: 'KİVİ', category: 'Meyve & Sebze 🍎' },
  { word: 'ANANAS', category: 'Meyve & Sebze 🍎' },
  { word: 'KİRAZ', category: 'Meyve & Sebze 🍎' },
  { word: 'ŞEFTALİ', category: 'Meyve & Sebze 🍎' },
  { word: 'DONDURMA', category: 'Meyve & Sebze 🍎' },
  { word: 'PİZZA', category: 'Meyve & Sebze 🍎' },
  { word: 'MAKARNA', category: 'Meyve & Sebze 🍎' },
  { word: 'ÇİKOLATA', category: 'Meyve & Sebze 🍎' },
  { word: 'KURABİYE', category: 'Meyve & Sebze 🍎' },
  { word: 'LİMON', category: 'Meyve & Sebze 🍎' },
  { word: 'HAVUÇ', category: 'Meyve & Sebze 🍎' },
  { word: 'PATATES', category: 'Meyve & Sebze 🍎' },

  // Eşya & Taşıt & Alet 🪑
  { word: 'ARABA', category: 'Eşya & Alet 🪑' },
  { word: 'UÇAK', category: 'Eşya & Alet 🪑' },
  { word: 'GEMİ', category: 'Eşya & Alet 🪑' },
  { word: 'TREN', category: 'Eşya & Alet 🪑' },
  { word: 'BİSİKLET', category: 'Eşya & Alet 🪑' },
  { word: 'HELİKOPTER', category: 'Eşya & Alet 🪑' },
  { word: 'ROKET', category: 'Eşya & Alet 🪑' },
  { word: 'TRAKTÖR', category: 'Eşya & Alet 🪑' },
  { word: 'İTFAİYE', category: 'Eşya & Alet 🪑' },
  { word: 'AMBULANS', category: 'Eşya & Alet 🪑' },
  { word: 'DENİZALTI', category: 'Eşya & Alet 🪑' },
  { word: 'OTOBÜS', category: 'Eşya & Alet 🪑' },
  { word: 'KAMYON', category: 'Eşya & Alet 🪑' },
  { word: 'KAYKAY', category: 'Eşya & Alet 🪑' },
  { word: 'PATEN', category: 'Eşya & Alet 🪑' },
  { word: 'KALEM', category: 'Eşya & Alet 🪑' },
  { word: 'DEFTER', category: 'Eşya & Alet 🪑' },
  { word: 'KİTAP', category: 'Eşya & Alet 🪑' },
  { word: 'SİLGİ', category: 'Eşya & Alet 🪑' },
  { word: 'BOYAMA', category: 'Eşya & Alet 🪑' },
  { word: 'OYUNCAK', category: 'Eşya & Alet 🪑' },
  { word: 'BALON', category: 'Eşya & Alet 🪑' },
  { word: 'UÇURTMA', category: 'Eşya & Alet 🪑' },
  { word: 'BİLGİSAYAR', category: 'Eşya & Alet 🪑' },
  { word: 'GÖZLÜK', category: 'Eşya & Alet 🪑' },
  { word: 'SAAT', category: 'Eşya & Alet 🪑' },
  { word: 'TELEVİZYON', category: 'Eşya & Alet 🪑' },
  { word: 'GİTAR', category: 'Eşya & Alet 🪑' },
  { word: 'PİYANO', category: 'Eşya & Alet 🪑' },

  // Şehirler & Doğa 🌍
  { word: 'İSTANBUL', category: 'Şehirler 🌍' },
  { word: 'ANKARA', category: 'Şehirler 🌍' },
  { word: 'İZMİR', category: 'Şehirler 🌍' },
  { word: 'BURSA', category: 'Şehirler 🌍' },
  { word: 'ANTALYA', category: 'Şehirler 🌍' },
  { word: 'TRABZON', category: 'Şehirler 🌍' },
  { word: 'GÜNEŞ', category: 'Şehirler 🌍' },
  { word: 'DÜNYA', category: 'Şehirler 🌍' },
  { word: 'YILDIZ', category: 'Şehirler 🌍' },
  { word: 'GEZEGEN', category: 'Şehirler 🌍' },
  { word: 'GÖKKUŞAĞI', category: 'Şehirler 🌍' },
  { word: 'BULUT', category: 'Şehirler 🌍' },
  { word: 'YAĞMUR', category: 'Şehirler 🌍' },
  { word: 'ORMAN', category: 'Şehirler 🌍' },
  { word: 'DENİZ', category: 'Şehirler 🌍' },

  // Meslekler 👨‍🍳
  { word: 'DOKTOR', category: 'Meslekler 👨‍🍳' },
  { word: 'ÖĞRETMEN', category: 'Meslekler 👨‍🍳' },
  { word: 'ASTRONOT', category: 'Meslekler 👨‍🍳' },
  { word: 'PİLOT', category: 'Meslekler 👨‍🍳' },
  { word: 'KAPTAN', category: 'Meslekler 👨‍🍳' },
  { word: 'AŞÇI', category: 'Meslekler 👨‍🍳' },
  { word: 'RESSAM', category: 'Meslekler 👨‍🍳' },
  { word: 'MÜZİSYEN', category: 'Meslekler 👨‍🍳' },
  { word: 'İTFAİYECİ', category: 'Meslekler 👨‍🍳' },
  { word: 'POLİS', category: 'Meslekler 👨‍🍳' },
  { word: 'MÜHENDİS', category: 'Meslekler 👨‍🍳' },
  { word: 'ÇİFTÇİ', category: 'Meslekler 👨‍🍳' },
  { word: 'DİŞÇİ', category: 'Meslekler 👨‍🍳' },
  { word: 'FUTBOLCU', category: 'Meslekler 👨‍🍳' }
];

function getRandomBotWord() {
  const index = Math.floor(Math.random() * KID_WORDS_DICTIONARY.length);
  return KID_WORDS_DICTIONARY[index];
}

// ==========================================
// 4. OYUN DURUMU (Game State)
// ==========================================
const gameState = {
  playerCount: 3,
  isVsBot: false,
  isBotExecuting: false,
  botThinkingTimer: null,
  settings: loadSettings(),
  turnTimerInterval: null,
  turnSecondsLeft: 0,
  players: [], // { id, name, avatar, score, isEliminatedThisRound, isBot, hintsRemaining }
  roundNumber: 1,
  wordMasterIndex: 0,
  currentGuesserIndex: 0,
  secretWord: '',
  secretWordHint: '',
  guessedLetters: new Set(),
  mistakes: 0,
  maxMistakes: 6,
  isRoundActive: false,
  roundPointsRecord: {} // playerId -> { letters: 0, fullGuess: 0, masterBonus: 0 }
};

// ==========================================
// 5. DOM ELEMENTLERİ
// ==========================================
const DOM = {
  // Ekranlar
  setupScreen: document.getElementById('setupScreen'),
  secretWordScreen: document.getElementById('secretWordScreen'),
  gameBoardScreen: document.getElementById('gameBoardScreen'),

  // Giriş Ekranı
  playerCountBtns: document.querySelectorAll('.count-btn'),
  playerInputsList: document.getElementById('playerInputsList'),
  startSetupBtn: document.getElementById('startSetupBtn'),
  openSettingsFromSetupBtn: document.getElementById('openSettingsFromSetupBtn'),

  // Gizli Kelime Ekranı
  wordMasterNameDisplay: document.getElementById('wordMasterNameDisplay'),
  secretWordInput: document.getElementById('secretWordInput'),
  toggleWordVisibilityBtn: document.getElementById('toggleWordVisibilityBtn'),
  secretWordHint: document.getElementById('secretWordHint'),
  categoryPills: document.querySelectorAll('.pill-btn'),
  confirmWordBtn: document.getElementById('confirmWordBtn'),
  randomWordSuggestBtn: document.getElementById('randomWordSuggestBtn'),
  letBotPickWordBtn: document.getElementById('letBotPickWordBtn'),

  // Oyun Tahtası
  currentRoundNumber: document.getElementById('currentRoundNumber'),
  currentMasterTag: document.getElementById('currentMasterTag'),
  playersStatusList: document.getElementById('playersStatusList'),
  turnAnnouncementBox: document.getElementById('turnAnnouncementBox'),
  activeGuesserAvatar: document.getElementById('activeGuesserAvatar'),
  activeGuesserName: document.getElementById('activeGuesserName'),
  livesRemainingBadge: document.getElementById('livesRemainingBadge'),
  categoryBadgeContainer: document.getElementById('categoryBadgeContainer'),
  currentCategoryText: document.getElementById('currentCategoryText'),
  wordLettersContainer: document.getElementById('wordLettersContainer'),
  turkishKeyboard: document.getElementById('turkishKeyboard'),
  openGuessModalBtn: document.getElementById('openGuessModalBtn'),
  endGameEarlyBtn: document.getElementById('endGameEarlyBtn'),

  // Harf İpucu ve Süre Sayacı
  useHintBtn: document.getElementById('useHintBtn'),
  currentGuesserHintBadge: document.getElementById('currentGuesserHintBadge'),
  turnTimerContainer: document.getElementById('turnTimerContainer'),
  turnTimerSeconds: document.getElementById('turnTimerSeconds'),
  turnTimerProgressBar: document.getElementById('turnTimerProgressBar'),

  // Asmaca Karakteri ve Görsel Elementleri
  hangmanSvg: document.getElementById('hangmanSvg'),
  hangmanCharacter: document.getElementById('hangmanCharacter'),
  gallowRope: document.getElementById('gallowRope'),
  hangmanBubble: document.getElementById('hangmanBubble'),
  hangmanBubbleText: document.getElementById('hangmanBubbleText'),
  figureHat: document.getElementById('figureHat'),
  hatPropeller: document.getElementById('hatPropeller'),
  figureHead: document.getElementById('figureHead'),
  figureBody: document.getElementById('figureBody'),
  figureArmLeft: document.getElementById('figureArmLeft'),
  figureArmRight: document.getElementById('figureArmRight'),
  figureLegLeft: document.getElementById('figureLegLeft'),
  figureLegRight: document.getElementById('figureLegRight'),
  eyebrowLeft: document.getElementById('eyebrowLeft'),
  eyebrowRight: document.getElementById('eyebrowRight'),
  eyesNormal: document.getElementById('eyesNormal'),
  eyesDead: document.getElementById('eyesDead'),
  eyeLeft: document.getElementById('eyeLeft'),
  eyeRight: document.getElementById('eyeRight'),
  mouthNormal: document.getElementById('mouthNormal'),
  mouthWorried: document.getElementById('mouthWorried'),
  mouthOpen: document.getElementById('mouthOpen'),
  mouthDead: document.getElementById('mouthDead'),
  sweatDrops: document.getElementById('sweatDrops'),
  dizzyStars: document.getElementById('dizzyStars'),

  // Kelime Tahmin Modalı
  guessWordModal: document.getElementById('guessWordModal'),
  modalGuesserName: document.getElementById('modalGuesserName'),
  fullWordGuessInput: document.getElementById('fullWordGuessInput'),
  submitFullWordGuessBtn: document.getElementById('submitFullWordGuessBtn'),
  cancelGuessBtn: document.getElementById('cancelGuessBtn'),
  closeGuessModalBtn: document.getElementById('closeGuessModalBtn'),

  // Tur Sonu Modalı
  roundEndModal: document.getElementById('roundEndModal'),
  roundEndIcon: document.getElementById('roundEndIcon'),
  roundEndTitle: document.getElementById('roundEndTitle'),
  roundEndMessage: document.getElementById('roundEndMessage'),
  revealedSecretWord: document.getElementById('revealedSecretWord'),
  pointsEarnedList: document.getElementById('pointsEarnedList'),
  nextRoundBtn: document.getElementById('nextRoundBtn'),
  viewFinalScoresBtn: document.getElementById('viewFinalScoresBtn'),

  // Oyun Sonu Modalı
  gameOverModal: document.getElementById('gameOverModal'),
  podiumContainer: document.getElementById('podiumContainer'),
  finalScoreTable: document.getElementById('finalScoreTable'),
  restartGameBtn: document.getElementById('restartGameBtn'),

  // Ayarlar Modalı
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn'),
  themeBtnLight: document.getElementById('themeBtnLight'),
  themeBtnDark: document.getElementById('themeBtnDark'),
  settingHintsToggle: document.getElementById('settingHintsToggle'),
  settingKeepTurnToggle: document.getElementById('settingKeepTurnToggle'),
  settingSoundToggle: document.getElementById('settingSoundToggle'),
  settingVolumeSlider: document.getElementById('settingVolumeSlider'),
  volumeLevelText: document.getElementById('volumeLevelText'),
  settingVoiceToggle: document.getElementById('settingVoiceToggle'),
  settingTimerSelect: document.getElementById('settingTimerSelect'),
  settingBotDiffSelect: document.getElementById('settingBotDiffSelect'),
  playSampleCallumBtn: document.getElementById('playSampleCallumBtn'),
  playSampleLiamBtn: document.getElementById('playSampleLiamBtn'),
  playSampleJessicaBtn: document.getElementById('playSampleJessicaBtn'),

  // Üst Çubuk & Genel & Ses & Ekran
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeIcon'),
  settingsToggleBtn: document.getElementById('settingsToggleBtn'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  soundIcon: document.getElementById('soundIcon'),
  fullscreenToggleBtn: document.getElementById('fullscreenToggleBtn'),
  fullscreenIcon: document.getElementById('fullscreenIcon'),
  rotateDeviceTip: document.getElementById('rotateDeviceTip'),
  closeRotateTipBtn: document.getElementById('closeRotateTipBtn'),
  gameToast: document.getElementById('gameToast'),
  confettiCanvas: document.getElementById('confettiCanvas')
};

const confetti = new ConfettiLauncher(DOM.confettiCanvas);

// ==========================================
// 6. YARDIMCI FONKSİYONLAR (Türkçe Uyumlu)
// ==========================================
function toTurkishUpper(str) {
  if (!str) return '';
  return str.toLocaleUpperCase('tr-TR');
}

function showToast(message, duration = 2500) {
  DOM.gameToast.textContent = message;
  DOM.gameToast.classList.add('show');
  setTimeout(() => {
    DOM.gameToast.classList.remove('show');
  }, duration);
}

function switchScreen(screenKey) {
  DOM.setupScreen.classList.remove('active');
  DOM.secretWordScreen.classList.remove('active');
  DOM.gameBoardScreen.classList.remove('active');

  if (screenKey === 'setup') DOM.setupScreen.classList.add('active');
  if (screenKey === 'secret') DOM.secretWordScreen.classList.add('active');
  if (screenKey === 'game') DOM.gameBoardScreen.classList.add('active');
}

// ==========================================
// 7. GİRİŞ EKRANI (Setup) İŞLEMLERİ
// ==========================================
function renderPlayerInputs() {
  DOM.playerInputsList.innerHTML = '';

  if (gameState.isVsBot) {
    // 1. Oyuncu: Aybars
    const rowUser = document.createElement('div');
    rowUser.className = 'player-input-row';
    rowUser.innerHTML = `
      <span class="player-avatar-badge" title="Aslan">🦁</span>
      <input type="text" id="player_name_0" placeholder="Aybars" maxlength="15" value="Aybars">
    `;
    const input0 = rowUser.querySelector('input');
    input0.addEventListener('focus', () => {
      if (input0.value === 'Aybars') input0.value = '';
    });
    input0.addEventListener('click', () => {
      if (input0.value === 'Aybars') input0.value = '';
    });
    input0.addEventListener('blur', () => {
      if (input0.value.trim() === '') input0.value = 'Aybars';
    });
    DOM.playerInputsList.appendChild(rowUser);

    // 2. Oyuncu: Robot Bilgisayar
    const rowBot = document.createElement('div');
    rowBot.className = 'player-input-row';
    rowBot.innerHTML = `
      <span class="player-avatar-badge" title="Robot Bilgisayar">🤖</span>
      <input type="text" id="player_name_1" class="bot-input" value="Robot Bilgisayar 🤖" readonly>
    `;
    DOM.playerInputsList.appendChild(rowBot);

    // Bilgilendirme Kutusu
    const hintBox = document.createElement('div');
    hintBox.className = 'vs-bot-hint';
    hintBox.innerHTML = `🤖 <strong>Robot'a Karşı Modu:</strong> Sen ve Robot karşılıklı oynarsınız! İlk kelimeyi Robot tutar, sen tahmin edersin! 🎈`;
    DOM.playerInputsList.appendChild(hintBox);
    return;
  }

  // Çok Oyunculu Mod
  for (let i = 0; i < gameState.playerCount; i++) {
    const avatar = AVATARS[i % AVATARS.length];
    const defaultName = `${i + 1}. Oyuncu`;

    const row = document.createElement('div');
    row.className = 'player-input-row';
    row.innerHTML = `
      <span class="player-avatar-badge" title="${avatar.name}">${avatar.icon}</span>
      <input type="text" id="player_name_${i}" placeholder="${defaultName}" maxlength="15" value="${defaultName}">
    `;

    const input = row.querySelector('input');

    // Metin kutusuna tıklanınca/odaklanılınca varsayılan isim içeriği (1. Oyuncu vb.) otomatik silinsin
    input.addEventListener('focus', () => {
      if (input.value === defaultName) {
        input.value = '';
      }
    });

    input.addEventListener('click', () => {
      if (input.value === defaultName) {
        input.value = '';
      }
    });

    // Kullanıcı herhangi bir isim girmeden boş bırakıp çıkarsa varsayılan isim geri gelsin
    input.addEventListener('blur', () => {
      if (input.value.trim() === '') {
        input.value = defaultName;
      }
    });

    DOM.playerInputsList.appendChild(row);
  }
}

// Oyuncu sayısı seçimi butonları dinleyicisi
DOM.playerCountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sounds.playClick();
    DOM.playerCountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const count = parseInt(btn.dataset.count, 10);
    if (count === 1) {
      gameState.isVsBot = true;
      gameState.playerCount = 1;
    } else {
      gameState.isVsBot = false;
      gameState.playerCount = count;
    }
    renderPlayerInputs();
  });
});

// "Hadi Başlayalım!" Butonu
DOM.startSetupBtn.addEventListener('click', () => {
  sounds.playClick();
  gameState.players = [];

  if (gameState.isVsBot) {
    const input0 = document.getElementById('player_name_0');
    let name0 = input0 ? input0.value.trim() : '';
    if (!name0) name0 = 'Aybars';

    gameState.players.push({
      id: 0,
      name: name0,
      avatar: '🦁',
      score: 0,
      isEliminatedThisRound: false,
      isBot: false,
      hintsRemaining: gameState.settings.hintsEnabled ? 1 : 0
    });

    gameState.players.push({
      id: 1,
      name: 'Robot Bilgisayar 🤖',
      avatar: '🤖',
      score: 0,
      isEliminatedThisRound: false,
      isBot: true,
      hintsRemaining: 0
    });

    // 1. Turda kelimeyi Robot tutsun ki Aybars doğrudan oynamaya başlasın!
    gameState.wordMasterIndex = 1;
    gameState.roundNumber = 1;
    setupSecretWordRound();
    return;
  }

  for (let i = 0; i < gameState.playerCount; i++) {
    const input = document.getElementById(`player_name_${i}`);
    let name = input ? input.value.trim() : '';
    if (!name) name = `${i + 1}. Oyuncu`;

    gameState.players.push({
      id: i,
      name: name,
      avatar: AVATARS[i % AVATARS.length].icon,
      score: 0,
      isEliminatedThisRound: false,
      isBot: false,
      hintsRemaining: gameState.settings.hintsEnabled ? 1 : 0
    });
  }

  // 3. KURAL: Rastgele bir kişiden başla
  gameState.wordMasterIndex = Math.floor(Math.random() * gameState.players.length);
  gameState.roundNumber = 1;

  setupSecretWordRound();
});

// ==========================================
// 8. GİZLİ KELİME BELİRLEME EKRANI (Word Master)
// ==========================================
function setupSecretWordRound() {
  const master = gameState.players[gameState.wordMasterIndex];

  // Eğer Robot'a Karşı modundaysak ve kelimeyi tutan Robot ise:
  // Robot doğrudan sözlükten rastgele kelime seçer ve oyunu başlatır!
  if (gameState.isVsBot && master.isBot) {
    const pick = getRandomBotWord();
    gameState.secretWord = pick.word;
    gameState.secretWordHint = pick.category;
    showToast(`🤖 Robot bir kelime seçti (${pick.category})! Hadi tahmin et Aybars! 🎈`, 3000);
    startRound();
    return;
  }

  DOM.wordMasterNameDisplay.textContent = `${master.avatar} ${master.name}`;

  DOM.secretWordInput.value = '';
  DOM.secretWordInput.type = 'password';
  DOM.toggleWordVisibilityBtn.textContent = '👁️';
  DOM.secretWordHint.value = '';
  DOM.categoryPills.forEach(p => p.classList.remove('active'));

  // Yardımcı butonların görünürlüğü
  if (gameState.isVsBot) {
    if (DOM.letBotPickWordBtn) DOM.letBotPickWordBtn.style.display = 'inline-flex';
  } else {
    if (DOM.letBotPickWordBtn) DOM.letBotPickWordBtn.style.display = 'none';
  }

  switchScreen('secret');
}

// Şifre Göster/Gizle
DOM.toggleWordVisibilityBtn.addEventListener('click', () => {
  sounds.playClick();
  if (DOM.secretWordInput.type === 'password') {
    DOM.secretWordInput.type = 'text';
    DOM.toggleWordVisibilityBtn.textContent = '🙈';
  } else {
    DOM.secretWordInput.type = 'password';
    DOM.toggleWordVisibilityBtn.textContent = '👁️';
  }
});

// Hızlı Kategori Hapları
DOM.categoryPills.forEach(pill => {
  pill.addEventListener('click', () => {
    sounds.playClick();
    DOM.categoryPills.forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    DOM.secretWordHint.value = pill.dataset.cat;
  });
});

// Rastgele Kelime Öner Butonu
if (DOM.randomWordSuggestBtn) {
  DOM.randomWordSuggestBtn.addEventListener('click', () => {
    sounds.playClick();
    const pick = getRandomBotWord();
    DOM.secretWordInput.value = pick.word;
    DOM.secretWordInput.type = 'text';
    DOM.toggleWordVisibilityBtn.textContent = '🙈';
    DOM.secretWordHint.value = pick.category;

    DOM.categoryPills.forEach(p => {
      p.classList.remove('active');
      if (p.dataset.cat === pick.category) {
        p.classList.add('active');
      }
    });

    showToast(`🎲 Rastgele Kelime: ${pick.word} (${pick.category})`, 2500);
  });
}

// "Kelimeyi Robot Tutsun" Butonu (Aybars'ın kelime yazmak istemediğinde tıklayabileceği buton)
if (DOM.letBotPickWordBtn) {
  DOM.letBotPickWordBtn.addEventListener('click', () => {
    sounds.playClick();
    gameState.wordMasterIndex = 1; // Robot index
    setupSecretWordRound();
  });
}

// Kelimeyi Onayla ve Oyunu Başlat
DOM.confirmWordBtn.addEventListener('click', () => {
  sounds.playClick();
  const rawWord = DOM.secretWordInput.value.trim();
  const upperWord = toTurkishUpper(rawWord);

  // Yalnızca Türkçe harfler ve boşluklara izin ver
  const cleanWord = upperWord.replace(/[^ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ ]/g, '').trim();

  if (!cleanWord || cleanWord.length < 2) {
    showToast('⚠️ Lütfen en az 2 harfli geçerli bir Türkçe kelime girin!');
    return;
  }

  gameState.secretWord = cleanWord;
  gameState.secretWordHint = DOM.secretWordHint.value.trim() || 'Genel';
  startRound();
});

// ==========================================
// 9. TUR BAŞLATMA VE OYUN TAHTASI
// ==========================================
function startRound() {
  gameState.guessedLetters = new Set();
  gameState.mistakes = 0;
  gameState.isRoundActive = true;

  if (gameState.botThinkingTimer) {
    clearTimeout(gameState.botThinkingTimer);
    gameState.botThinkingTimer = null;
  }
  speech.stop();
  stopTurnTimer();

  // Tüm oyuncuların elenme durumunu, ipucu hakkını ve puan geçmişini sıfırla
  gameState.roundPointsRecord = {};
  gameState.players.forEach(p => {
    p.isEliminatedThisRound = false;
    p.hintsRemaining = gameState.settings.hintsEnabled ? 1 : 0;
    gameState.roundPointsRecord[p.id] = { letters: 0, fullGuess: 0, masterBonus: 0 };
  });

  // İlk tahminciyi belirle (Kelimeyi koyan kişiden sonraki kişi)
  gameState.currentGuesserIndex = getNextActiveGuesserIndex(gameState.wordMasterIndex);

  // Arayüzü güncelle
  DOM.currentRoundNumber.textContent = gameState.roundNumber;
  const master = gameState.players[gameState.wordMasterIndex];
  DOM.currentMasterTag.textContent = `👑 ${master.avatar} ${master.name}`;
  DOM.currentCategoryText.textContent = gameState.secretWordHint;

  resetHangmanSvg();
  renderWordBoxes();
  renderKeyboard();
  updateScoreboardUI();
  updateTurnAnnouncementUI();
  updateHintButtonUI();
  startTurnTimer();

  switchScreen('game');

  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  if (currentGuesser.isBot) {
    showToast(`🎮 Tur Başladı! Sıra ${currentGuesser.name}'de! Robot düşünüyor... 🤖`);
    scheduleBotGuess(1400);
  } else {
    showToast(`🎮 Tur Başladı! Sıra ${currentGuesser.name}'de!`);
  }
}

// Sıradaki aktif tahminciyi bulur (Kelimeyi tutan kişi ve elenenler hariç)
function getNextActiveGuesserIndex(fromIndex) {
  const n = gameState.players.length;
  for (let step = 1; step <= n; step++) {
    const candidateIdx = (fromIndex + step) % n;
    // Oynatan kişi hariç ve bu tur elenmemiş olmalı
    if (candidateIdx !== gameState.wordMasterIndex && !gameState.players[candidateIdx].isEliminatedThisRound) {
      return candidateIdx;
    }
  }
  return -1; // Aktif tahminci kalmadı!
}

// Skor Tablosu Şeridi
function updateScoreboardUI() {
  DOM.playersStatusList.innerHTML = '';

  gameState.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-status-card';

    const isMaster = (p.id === gameState.wordMasterIndex);
    const isActive = (p.id === gameState.currentGuesserIndex && !isMaster && !p.isEliminatedThisRound);

    if (isMaster) card.classList.add('is-master');
    if (isActive) card.classList.add('active-guesser');
    if (p.isEliminatedThisRound) card.classList.add('is-eliminated');

    card.innerHTML = `
      <span class="avatar">${p.avatar}</span>
      <div class="info">
        <span class="p-name">${p.name} ${isMaster ? '👑' : ''}</span>
        <span class="p-score">${p.score} Puan</span>
      </div>
    `;
    DOM.playersStatusList.appendChild(card);
  });
}

// Sıradaki Tahminci Duyuru Kutusu
function updateTurnAnnouncementUI() {
  if (gameState.currentGuesserIndex === -1) {
    DOM.turnAnnouncementBox.style.display = 'none';
    updateHintButtonUI();
    return;
  }

  DOM.turnAnnouncementBox.style.display = 'flex';
  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  DOM.activeGuesserAvatar.textContent = currentGuesser.avatar;

  if (currentGuesser.isBot) {
    DOM.activeGuesserName.textContent = `${currentGuesser.name} (Düşünüyor... ⚙️)`;
    DOM.openGuessModalBtn.disabled = true;
    DOM.openGuessModalBtn.style.opacity = '0.5';
    DOM.openGuessModalBtn.style.pointerEvents = 'none';
  } else {
    DOM.activeGuesserName.textContent = currentGuesser.name;
    DOM.openGuessModalBtn.disabled = false;
    DOM.openGuessModalBtn.style.opacity = '1';
    DOM.openGuessModalBtn.style.pointerEvents = 'auto';
  }

  updateHintButtonUI();
}

// İpucu Butonu Durumunu Güncelle
function updateHintButtonUI() {
  if (!DOM.useHintBtn) return;
  if (!gameState.settings.hintsEnabled) {
    DOM.useHintBtn.style.display = 'none';
    return;
  }
  DOM.useHintBtn.style.display = 'inline-flex';

  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  if (!currentGuesser || currentGuesser.isBot || !gameState.isRoundActive) {
    DOM.useHintBtn.disabled = true;
    DOM.useHintBtn.style.opacity = '0.5';
    DOM.useHintBtn.style.pointerEvents = 'none';
    if (DOM.currentGuesserHintBadge) DOM.currentGuesserHintBadge.textContent = '0';
    return;
  }

  const rem = currentGuesser.hintsRemaining !== undefined ? currentGuesser.hintsRemaining : 1;
  if (DOM.currentGuesserHintBadge) DOM.currentGuesserHintBadge.textContent = rem;

  if (rem > 0) {
    DOM.useHintBtn.disabled = false;
    DOM.useHintBtn.style.opacity = '1';
    DOM.useHintBtn.style.pointerEvents = 'auto';
  } else {
    DOM.useHintBtn.disabled = true;
    DOM.useHintBtn.style.opacity = '0.5';
    DOM.useHintBtn.style.pointerEvents = 'none';
  }
}

// ==========================================
// 9.1. SÜRE SAYACI SİSTEMİ (Turn Timer)
// ==========================================
function stopTurnTimer() {
  if (gameState.turnTimerInterval) {
    clearInterval(gameState.turnTimerInterval);
    gameState.turnTimerInterval = null;
  }
  if (DOM.turnTimerContainer) {
    DOM.turnTimerContainer.classList.remove('urgent');
  }
}

function startTurnTimer() {
  stopTurnTimer();
  const timerSeconds = parseInt(gameState.settings.timerMode, 10);
  if (!timerSeconds || timerSeconds <= 0) {
    if (DOM.turnTimerContainer) DOM.turnTimerContainer.style.display = 'none';
    return;
  }

  if (DOM.turnTimerContainer) {
    DOM.turnTimerContainer.style.display = 'block';
    DOM.turnTimerContainer.classList.remove('urgent');
  }

  gameState.turnSecondsLeft = timerSeconds;
  updateTimerDisplay(timerSeconds, timerSeconds);

  gameState.turnTimerInterval = setInterval(() => {
    if (!gameState.isRoundActive) {
      stopTurnTimer();
      return;
    }

    gameState.turnSecondsLeft--;
    updateTimerDisplay(gameState.turnSecondsLeft, timerSeconds);

    if (gameState.turnSecondsLeft <= 5 && gameState.turnSecondsLeft > 0) {
      if (DOM.turnTimerContainer) DOM.turnTimerContainer.classList.add('urgent');
      sounds.playTimerTick();
    }

    if (gameState.turnSecondsLeft <= 0) {
      stopTurnTimer();
      handleTurnTimeout();
    }
  }, 1000);
}

function updateTimerDisplay(remaining, max) {
  if (DOM.turnTimerSeconds) {
    DOM.turnTimerSeconds.textContent = Math.max(0, remaining);
  }
  if (DOM.turnTimerProgressBar) {
    const pct = Math.max(0, Math.min(100, (remaining / max) * 100));
    DOM.turnTimerProgressBar.style.width = `${pct}%`;
  }
}

function handleTurnTimeout() {
  if (!gameState.isRoundActive) return;
  sounds.playTimerAlarm();
  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  showToast(`⏰ Süre Doldu! ${currentGuesser ? currentGuesser.name : ''} sırasını kaçırdı! ⏳`, 2500);

  const timeoutQuotes = HANGMAN_QUOTES.timeUp || [
    "Tik tak tik tak! Zaman doldu, sıra geçti! ⏳",
    "Süre bitti arkadaşım, saat tıkır tıkır işliyor! ⏰",
    "Uyuya kaldınız galiba, kum saati boşaldı! 🏖️"
  ];
  const q = timeoutQuotes[Math.floor(Math.random() * timeoutQuotes.length)];
  triggerHangmanSpeech(q, 2800);

  advanceTurn();
}

// Kelime Harf Kutularını Çiz
function renderWordBoxes() {
  DOM.wordLettersContainer.innerHTML = '';

  for (let i = 0; i < gameState.secretWord.length; i++) {
    const char = gameState.secretWord[i];
    const box = document.createElement('div');

    if (char === ' ') {
      box.className = 'letter-box space-box';
      box.textContent = ' ';
    } else {
      box.className = 'letter-box';
      box.id = `letter_box_${i}`;
      if (gameState.guessedLetters.has(char)) {
        box.textContent = char;
        box.classList.add('revealed');
      } else {
        box.textContent = '';
      }
    }
    DOM.wordLettersContainer.appendChild(box);
  }
}

// Sanal Klavyeyi Çiz
function renderKeyboard() {
  DOM.turkishKeyboard.innerHTML = '';

  TURKISH_ALPHABET.forEach(letter => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'key-btn';
    btn.textContent = letter;
    btn.id = `key_${letter}`;

    if (gameState.guessedLetters.has(letter)) {
      btn.disabled = true;
      if (gameState.secretWord.includes(letter)) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('wrong');
      }
    }

    btn.addEventListener('click', () => {
      handleLetterGuess(letter);
    });

    DOM.turkishKeyboard.appendChild(btn);
  });
}

// ==========================================
// 10. HARF TAHMİNİ İŞLEME
// ==========================================
function handleLetterGuess(letter) {
  if (!gameState.isRoundActive || gameState.guessedLetters.has(letter)) return;

  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  // Eğer sıradaki tahminci robot ise ve bu çağrı robot fonksiyonundan gelmiyorsa engelle
  if (currentGuesser?.isBot && !gameState.isBotExecuting) return;

  gameState.guessedLetters.add(letter);

  // Klavye butonunu güncelle
  const btn = document.getElementById(`key_${letter}`);
  if (btn) btn.disabled = true;

  if (gameState.secretWord.includes(letter)) {
    // DOĞRU HARF
    if (btn) btn.classList.add('correct');
    sounds.playCorrectLetter();
    triggerHangmanHappyReaction();

    // Kaç adet bulunduğunu hesapla
    let count = 0;
    for (let char of gameState.secretWord) {
      if (char === letter) count++;
    }

    // 6. KURAL: Bildikleri her harften 10 puan kazanır
    const pts = count * 10;
    currentGuesser.score += pts;
    gameState.roundPointsRecord[currentGuesser.id].letters += pts;

    renderWordBoxes();
    updateScoreboardUI();

    if (currentGuesser.isBot) {
      showToast(`🤖 Robot "${letter}" harfini bildi! (+${pts} Puan)`, 2000);
    } else {
      if (gameState.settings.keepTurnOnCorrect) {
        showToast(`👏 ${currentGuesser.name} "${letter}" harfini bildi! (+${pts} Puan) Doğru bildiğin için sıra sende kaldı! 🎯`, 3000);
      } else {
        showToast(`👏 ${currentGuesser.name} "${letter}" harfini bildi! (+${pts} Puan)`, 2200);
      }
    }

    // Kelimenin tamamı açıldı mı kontrol et
    if (isWordFullyRevealed()) {
      // Kelimeyi tamamlayan oyuncuya 50 bonus puan
      currentGuesser.score += 50;
      gameState.roundPointsRecord[currentGuesser.id].fullGuess += 50;
      updateScoreboardUI();
      handleRoundVictory(currentGuesser, 'kelime_tamamlandi');
      return;
    }

    if (gameState.settings.keepTurnOnCorrect) {
      // Harfi doğru bilen tekrar tahmin hakkı elde eder (Sıra devredilmez, oyuncuda kalır)
      updateTurnAnnouncementUI();
      DOM.turnAnnouncementBox.classList.remove('pulse-glow');
      void DOM.turnAnnouncementBox.offsetWidth;
      DOM.turnAnnouncementBox.classList.add('pulse-glow');

      // Sayacı sıfırla ve yeniden başlat
      startTurnTimer();

      // Eğer robot doğru bildiyse ve tur devam ediyorsa bir sonraki robot tahminini planla
      if (currentGuesser.isBot && gameState.isRoundActive) {
        scheduleBotGuess(1400);
      }
    } else {
      // Kural: Doğru bilse bile sıra bir sonraki oyuncuya geçer
      advanceTurn();
    }
  } else {
    // YANLIŞ HARF
    if (btn) btn.classList.add('wrong');

    gameState.mistakes++;
    drawHangmanPart(gameState.mistakes);
    DOM.livesRemainingBadge.textContent = `${gameState.maxMistakes - gameState.mistakes} / ${gameState.maxMistakes}`;

    sounds.playWrongLetter(gameState.mistakes);
    triggerHangmanMistakeReaction(gameState.mistakes);

    if (currentGuesser.isBot) {
      showToast(`❌ Robot "${letter}" harfini bilemedi!`);
    } else {
      showToast(`❌ "${letter}" harfi kelimede yok!`);
    }

    // 7. KURAL: Eğer adam asılırsa
    if (gameState.mistakes >= gameState.maxMistakes) {
      handleHangmanCompleted();
      return;
    }

    // Sıra bir sonraki oyuncuya geçer
    advanceTurn();
  }
}

// Sırayı bir sonraki aktif tahminciye devret
function advanceTurn() {
  stopTurnTimer();
  const nextGuesser = getNextActiveGuesserIndex(gameState.currentGuesserIndex);
  if (nextGuesser === -1) {
    // Herkes elendiyse
    handleAllGuessersEliminated();
    return;
  }
  gameState.currentGuesserIndex = nextGuesser;
  updateScoreboardUI();
  updateTurnAnnouncementUI();
  startTurnTimer();

  // Sıradaki tahminci robot ise tahminini planla
  if (gameState.players[gameState.currentGuesserIndex]?.isBot && gameState.isRoundActive) {
    scheduleBotGuess(1300);
  }
}

// ==========================================
// 10.1. ROBOT YAPAY ZEKA TAHMİN SİSTEMİ
// ==========================================
function scheduleBotGuess(delayMs = 1200) {
  if (gameState.botThinkingTimer) {
    clearTimeout(gameState.botThinkingTimer);
    gameState.botThinkingTimer = null;
  }

  gameState.botThinkingTimer = setTimeout(() => {
    if (!gameState.isRoundActive) return;
    const currentGuesser = gameState.players[gameState.currentGuesserIndex];
    if (!currentGuesser || !currentGuesser.isBot) return;

    performBotGuess();
  }, delayMs);
}

function performBotGuess() {
  // Henüz tahmin edilmemiş harfleri bul
  const unrevealedLetters = TURKISH_ALPHABET.filter(l => !gameState.guessedLetters.has(l));
  if (unrevealedLetters.length === 0) return;

  // Gizli kelimede olup henüz tahmin edilmemiş harfler
  const secretChars = Array.from(new Set(gameState.secretWord.split('').filter(c => c !== ' ')));
  const unrevealedSecretChars = secretChars.filter(c => !gameState.guessedLetters.has(c));

  // Türkçe harf frekansı (çocuk kelimelerine göre)
  const TURKISH_FREQ = [
    'A', 'E', 'İ', 'N', 'R', 'L', 'I', 'D', 'K', 'M',
    'U', 'Y', 'T', 'S', 'B', 'O', 'Ü', 'Ş', 'Z', 'G',
    'Ç', 'H', 'P', 'C', 'V', 'Ö', 'Ğ', 'F', 'J'
  ];

  let chosenLetter = null;

  // Robot zorluk seviyesine göre akıllı tahmin olasılığı
  let smartProb = 0.65;
  if (gameState.settings.botDifficulty === 'easy') {
    smartProb = 0.35;
  } else if (gameState.settings.botDifficulty === 'smart') {
    smartProb = 0.90;
  }
  const isSmartMove = Math.random() < smartProb;

  if (isSmartMove && unrevealedSecretChars.length > 0) {
    // Gizli harflerden birini seç
    chosenLetter = unrevealedSecretChars[Math.floor(Math.random() * unrevealedSecretChars.length)];
  } else {
    // Yaygın frekanstaki harflerden veya rastgele unrevealed harflerden seç
    const availableFreqLetters = TURKISH_FREQ.filter(l => unrevealedLetters.includes(l));
    if (availableFreqLetters.length > 0 && Math.random() < 0.5) {
      const topFreq = availableFreqLetters.slice(0, Math.min(8, availableFreqLetters.length));
      chosenLetter = topFreq[Math.floor(Math.random() * topFreq.length)];
    } else {
      chosenLetter = unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
    }
  }

  if (!chosenLetter) {
    chosenLetter = unrevealedLetters[0];
  }

  // Robot konuşma baloncuğu
  const quotes = [
    `Bip-bop! Devrelerim "${chosenLetter}" harfini söylüyor! 🤖`,
    `Analiz tamam! Harfim: "${chosenLetter}"! ⚙️`,
    `Acaba içinde "${chosenLetter}" var mı? Merak ettim! 🔍`,
    `Robotik tahminim: "${chosenLetter}"! 🤖⚡`,
    `Hesaplamalar yapıldı! "${chosenLetter}" harfine basıyorum! 🦾`
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  triggerHangmanSpeech(quote, 2200, true);

  // Harf tahminini çalıştır
  gameState.isBotExecuting = true;
  handleLetterGuess(chosenLetter);
  gameState.isBotExecuting = false;
}

// Kelimenin tüm harfleri bilindi mi?
function isWordFullyRevealed() {
  for (let char of gameState.secretWord) {
    if (char !== ' ' && !gameState.guessedLetters.has(char)) {
      return false;
    }
  }
  return true;
}

// ==========================================
// 11. TAM KELİME TAHMİN ETME (Tahmin Hakkı)
// ==========================================
DOM.openGuessModalBtn.addEventListener('click', () => {
  sounds.playClick();
  if (!gameState.isRoundActive) return;

  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  if (currentGuesser?.isBot) return;

  DOM.modalGuesserName.textContent = `${currentGuesser.avatar} ${currentGuesser.name}`;
  DOM.fullWordGuessInput.value = '';
  DOM.guessWordModal.classList.add('active');
  setTimeout(() => DOM.fullWordGuessInput.focus(), 150);
});

function closeGuessModal() {
  DOM.guessWordModal.classList.remove('active');
}

DOM.cancelGuessBtn.addEventListener('click', closeGuessModal);
DOM.closeGuessModalBtn.addEventListener('click', closeGuessModal);

// Tam Kelime Tahminini Gönder
DOM.submitFullWordGuessBtn.addEventListener('click', () => {
  sounds.playClick();
  const guess = toTurkishUpper(DOM.fullWordGuessInput.value.trim());
  if (!guess) {
    showToast('⚠️ Lütfen bir kelime yazın!');
    return;
  }

  closeGuessModal();
  const currentGuesser = gameState.players[gameState.currentGuesserIndex];

  if (guess === gameState.secretWord) {
    // 6. KURAL: Doğru tahmin ederse 50 puan kazanır
    currentGuesser.score += 50;
    gameState.roundPointsRecord[currentGuesser.id].fullGuess += 50;
    updateScoreboardUI();

    // Tüm harfleri aç
    for (let char of gameState.secretWord) {
      if (char !== ' ') gameState.guessedLetters.add(char);
    }
    renderWordBoxes();

    handleRoundVictory(currentGuesser, 'dogru_tahmin');
  } else {
    // 6. KURAL: Tahmin hakkını kullanıp bilemeyen kişi o turdan ELENİR!
    currentGuesser.isEliminatedThisRound = true;
    sounds.playEliminated();
    triggerHangmanGaspReaction(currentGuesser.name);
    showToast(`💥 ${currentGuesser.name} yanlış tahmin etti ("${guess}") ve bu tur elendi!`, 3500);

    updateScoreboardUI();

    // Sırayı devret
    advanceTurn();
  }
});

// ==========================================
// 11.1. HARF İPUCU KULLANMA
// ==========================================
if (DOM.useHintBtn) {
  DOM.useHintBtn.addEventListener('click', () => {
    sounds.playClick();
    if (!gameState.isRoundActive) return;

    const currentGuesser = gameState.players[gameState.currentGuesserIndex];
    if (!currentGuesser || currentGuesser.isBot) return;

    if (!gameState.settings.hintsEnabled) {
      showToast('⚠️ İpucu hakkı ayarlarda kapalı!');
      return;
    }

    if ((currentGuesser.hintsRemaining || 0) <= 0) {
      showToast('⚠️ Bu tur için ipucu hakkını zaten kullandın!');
      return;
    }

    // Kelimede henüz açılmamış olan gizli harfleri bul
    const secretChars = Array.from(new Set(gameState.secretWord.split('').filter(c => c !== ' ')));
    const unrevealedSecretChars = secretChars.filter(c => !gameState.guessedLetters.has(c));

    if (unrevealedSecretChars.length === 0) {
      showToast('Açılacak gizli harf kalmadı!');
      return;
    }

    // Bir gizli harf seç ve ipucu hakkını tüket
    const hintLetter = unrevealedSecretChars[Math.floor(Math.random() * unrevealedSecretChars.length)];
    currentGuesser.hintsRemaining = 0;
    updateHintButtonUI();

    sounds.playHintSparkle();

    const hintQuotes = HANGMAN_QUOTES.hint || [
      `Sihirli ipucu geldi! "${hintLetter}" harfi açıldı! ✨`,
      `Gözlerimi kapattım ve "${hintLetter}" harfini hediye ettim! 🎁`,
      `Bir ipucu fısıldıyorum: "${hintLetter}"! Hadi bakalım! 🪄`
    ];
    const hq = hintQuotes[Math.floor(Math.random() * hintQuotes.length)];
    triggerHangmanSpeech(hq, 2800);

    showToast(`✨ İpucu kullanıldı! "${hintLetter}" harfi açıldı!`, 2500);

    // Seçilen harfi oyna
    handleLetterGuess(hintLetter);
  });
}

// ==========================================
// 12. KOMİK ASILAN ADAM TEPKİLERİ VE ANİMASYONLARI
// ==========================================

const HANGMAN_QUOTES = {
  mistake1: [
    "Ayy! İlk hatada beni mi çağırdınız?! 😅",
    "Merhaba! Lütfen nazik olun, ben daha çok yeniyim! 🎩",
    "Hop! Dikkatli seçin, burası biraz rüzgarlı! 🧐",
    "Kafam çıktı piyasaya, aman dikkat! 🎪",
    "Pervanem dönmeye başladı, başım dönüyor! 🚁",
    "Biri bana şapka takmış, çok da yakışmış ama harfi bilemediniz! 👒",
    "Daha ilk harften yanıldık mı yani? Şaka yapıyorsunuz! 😂",
    "Eyvah! Havada asılı kalmak hiç tarzım değil! 🌤️",
    "Ben buraların yabancısıyım, beni erken asmayın lütfen! 🥺",
    "Ooo merhaba çocuklar! Doğru harfleri seçin de çay içelim! ☕"
  ],
  mistake2: [
    "Hop noluyo?! Gömleğim kırıştı yahu! 👔",
    "Karnım guruldadı, bari bir sesli harf bilin! 🙈",
    "Bir ürperti geldi... Lütfen yanlış basmayın! 🥶",
    "Gövdem geldi ama kalbim pır pır ediyor! 💓",
    "Papyonumu taktım ama düğüne değil darağacına gidiyorum galiba! 🎀",
    "Tişörtümün çizgileri titremekten dalgalandı! 🌊",
    "Acıktım valla, pizza ısmarlayan yok mu? 🍕",
    "Bakın kalbim küt küt atıyor, hissediyorum! 💓",
    "Lütfen A, E falan deneyin, ne bileyim ipucuna bakın! 📢",
    "Bedenim oluştu ama ruhum firar etmek üzere! 🏃‍♂️"
  ],
  mistake3: [
    "İmdat! Sol kolum havada kaldı! 🙋‍♂️",
    "Harflere dikkat! Koluma kramp girecek! 😱",
    "Bu harf hiç olmadı ama yaa! 🤦‍♂️",
    "Sol kolumla el sallıyorum: Kurtarın beni! 🚩",
    "Sarı eldivenim çok şık ama havada dondu kaldı! 🧤",
    "Aaa kolum çıktı! Şimdi burnumu kaşıyabilirim en azından! 👃",
    "Yanlış harf seçme festivali mi var bugün? 🎪",
    "Sol kolumla size kocaman bir sıfır çiziyorum, bilemediniz! ⭕",
    "Kolumu indirin lütfen, çok yoruldum! 😫",
    "Anneee! Bu çocuklar beni asıyor galiba! 📢"
  ],
  mistake4: [
    "Bari iki kolumu birden bağlamasaydınız! 👐",
    "Annemi istiyorum! Yanlış basmayın artık! 📢",
    "Kollarımla alkışlayamıyorum bile yahu! 🥺",
    "Eyvah eyvah, iki kolum da havalarda! 🤷‍♂️",
    "İki kolumla kuş gibi uçacağım şimdi, kanatlanıyorum! 🦅",
    "Teslim oluyorum polis amca! Ben bir şey yapmadım! 👮",
    "Sarılmak istesem sarılamam, bu ne biçim vaziyet! 🫂",
    "Harf klavyesine bir büyü yapılmış olmalı, her şey ters gidiyor! 🪄",
    "Eller yukarı, bu bir soygundur! Harflerimi çaldınız! 🤠",
    "İki kolum da sepet oldu, sallanıp duruyorum! 🧺"
  ],
  mistake5: [
    "Tir tir titriyorum! Tek bir canım kaldı! 🚨",
    "Ayaklarım yerden kesildi, nefes alamıyorum! 😱",
    "Son şansınız! Lütfen kelimeyi kurtarın! 🆘",
    "Bacaklarım zangır zangır titriyor, bir harf daha bitti! ⚡",
    "Tek bacakla bale yapıyorum, bakın kuğu gölü balem! 🩰",
    "Ter damlalarım sel oldu, yüzme bilen var mı?! 🏊‍♂️",
    "Gözünüzü seveyim doğru harfe basın, son durağa geldik! 🛑",
    "Aklınızı başınıza toplayın çocuklar, uçurumun kenarındayız! 🧗",
    "Sol bacağım uyuştu, ayakkabım yere değmiyor! 👟",
    "Alarm! Kırmızı alarm! Bir hata daha olursa helvamı yersiniz! 🔔"
  ],
  mistake6: [
    "Gözlerim fırıldak oldu! Yıldızları sayıyorum... ⭐💫",
    "Ben dedim o harf değil diye! Ruhum uçtu... 👻",
    "Olamazzz! Helvam fıstıklı olsun bari! 🍯😵",
    "Asıldım gittim! Görüşürüz öbür dünyada! 🎪😵",
    "Bayıldım galiba... Biri bana limon koklatsın! 🍋",
    "Elveda tatlı hayat, elveda güzel Türkçemiz! 🎭",
    "Pervanem durdu, şalterler kapandı... Bip! 🔌",
    "Yıldızlar etrafımda halay çekiyor, ne güzelmiş burası! 🌟",
    "Size küstüm, bir dahaki sefere daha iyi oynayın! 🙈",
    "Gözlerim çarpı çarpı oldu, game over! 👾"
  ],
  correct: [
    "Oh be! Rahat bir nefes aldım! 🥳",
    "Harikasın! Böyle devam et! 🌟",
    "Süper harf! Kurtuluyorum galiba! 🎈",
    "Helal olsun, işte beklediğim harf! 👏",
    "Kalbim ferahladı, yaşasın! 💖",
    "Aferin sana! Zekana hayran kaldım! 🧠✨",
    "İşte bu! Adım adım özgürlüğe! 🕊️",
    "Harikasınız çocuklar, şapkam bile sevindi! 🎩",
    "Bingo! İşte aradığımız harf tam da buydu! 🎯",
    "Korkularım uçtu gitti, yaşasın! 🌈"
  ],
  hint: [
    "Sihirli bir kuş kulağıma ipucu fısıldadı! ✨",
    "Dayanamadım bir harfi hediye ettim, hadi iyisiniz! 🎁",
    "İşte beklediğiniz kurtarıcı harf parıldadı! 🌟",
    "Biraz yardımın kimseye zararı olmaz, işte harf! 🪄",
    "Gözlerimi kapattım ve gizli bir harfi açıverdim! 🪄"
  ],
  timeUp: [
    "Tik tak tik tak! Zaman doldu, sıra geçti! ⏳",
    "Süre bitti arkadaşım, saat tıkır tıkır işliyor! ⏰",
    "Uyuya kaldınız galiba, kum saati boşaldı! 🏖️",
    "Zaman su gibi aktı! Bir dahaki tura daha hızlı ol! 🏃‍♂️💨"
  ],
  gasp: [
    "Aman tanrım! O kelime hiç olmadı! 😱",
    "Eyvah, büyük risk aldın ve elendin! 💥",
    "Cesurcaydı ama maalesef yanlış! 🙈",
    "Bütün şansını tek kelimede harcadın ve elendin! 🛸"
  ],
  tickle: [
    "Hehe gıdıklama beni! 😂",
    "Hey dokunma oraya, çok huylanıyorum! 😜",
    "Dur dur güldürme, harflere odaklanın! 😆",
    "Beni bırak da kelimeyi tahmin et! 🎈",
    "Gıdık gıdık! Haha yapma! 🪶"
  ]
};

let hangmanSpeechTimer = null;
let hangmanReactionTimer = null;

function triggerHangmanSpeech(text, duration = 2800, isBot = false) {
  if (!DOM.hangmanBubble || !DOM.hangmanBubbleText) return;

  if (hangmanSpeechTimer) {
    clearTimeout(hangmanSpeechTimer);
    hangmanSpeechTimer = null;
  }

  DOM.hangmanBubbleText.textContent = text;
  DOM.hangmanBubble.classList.remove('active');
  void DOM.hangmanBubble.offsetWidth; // Reflow tetikle
  DOM.hangmanBubble.classList.add('active');

  // Canlı Türkçe Seslendirme (Web Speech API)
  speech.speak(text, isBot);

  hangmanSpeechTimer = setTimeout(() => {
    if (DOM.hangmanBubble) DOM.hangmanBubble.classList.remove('active');
  }, duration);
}

function clearHangmanReactionClasses() {
  if (!DOM.hangmanCharacter) return;
  DOM.hangmanCharacter.classList.remove('react-shock', 'react-severe', 'react-happy', 'react-tickle', 'dead-slump');
  if (DOM.figureHead) DOM.figureHead.classList.remove('panicking');
  if (DOM.figureArmLeft) DOM.figureArmLeft.classList.remove('flailing');
  if (DOM.figureArmRight) DOM.figureArmRight.classList.remove('flailing');
  if (DOM.figureLegLeft) DOM.figureLegLeft.classList.remove('kicking');
  if (DOM.figureLegRight) DOM.figureLegRight.classList.remove('kicking');
  if (DOM.hatPropeller) DOM.hatPropeller.classList.remove('fast-spin');
  if (DOM.sweatDrops) DOM.sweatDrops.classList.remove('active');
  if (DOM.gallowRope) DOM.gallowRope.classList.remove('springing');
}

function triggerHangmanMistakeReaction(mistakeCount) {
  if (!DOM.hangmanCharacter) return;

  clearHangmanReactionClasses();
  if (hangmanReactionTimer) clearTimeout(hangmanReactionTimer);

  void DOM.hangmanCharacter.offsetWidth; // Reflow

  // Karakterin hata aşamasına göre yüz ifadesini ve uzuv tepkilerini güncelle
  if (mistakeCount === 1) {
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'block';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
    if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
    if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';
    if (DOM.eyesNormal) DOM.eyesNormal.style.display = 'block';
    if (DOM.eyesDead) DOM.eyesDead.style.display = 'none';

    DOM.hangmanCharacter.classList.add('react-shock');
    if (DOM.figureHead) DOM.figureHead.classList.add('panicking');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');
    if (DOM.gallowRope) DOM.gallowRope.classList.add('springing');
  } else if (mistakeCount === 2) {
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'block';
    if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
    if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';

    DOM.hangmanCharacter.classList.add('react-shock');
    if (DOM.figureHead) DOM.figureHead.classList.add('panicking');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');
    if (DOM.gallowRope) DOM.gallowRope.classList.add('springing');
  } else if (mistakeCount === 3) {
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'block';
    if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
    if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';

    DOM.hangmanCharacter.classList.add('react-shock');
    if (DOM.figureHead) DOM.figureHead.classList.add('panicking');
    if (DOM.figureArmLeft) DOM.figureArmLeft.classList.add('flailing');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');
    if (DOM.gallowRope) DOM.gallowRope.classList.add('springing');
  } else if (mistakeCount === 4) {
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
    if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'block';
    if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';

    DOM.hangmanCharacter.classList.add('react-shock');
    if (DOM.figureHead) DOM.figureHead.classList.add('panicking');
    if (DOM.figureArmLeft) DOM.figureArmLeft.classList.add('flailing');
    if (DOM.figureArmRight) DOM.figureArmRight.classList.add('flailing');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');
    if (DOM.gallowRope) DOM.gallowRope.classList.add('springing');
  } else if (mistakeCount === 5) {
    // Büyük Panik! 5. Hata
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
    if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'block';
    if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';

    DOM.hangmanCharacter.classList.add('react-severe');
    if (DOM.figureHead) DOM.figureHead.classList.add('panicking');
    if (DOM.figureArmLeft) DOM.figureArmLeft.classList.add('flailing');
    if (DOM.figureArmRight) DOM.figureArmRight.classList.add('flailing');
    if (DOM.figureLegLeft) DOM.figureLegLeft.classList.add('kicking');
    if (DOM.sweatDrops) DOM.sweatDrops.classList.add('active');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');
    if (DOM.gallowRope) DOM.gallowRope.classList.add('springing');
  } else if (mistakeCount >= 6) {
    // 6. Hata: Adam Asıldı
    setHangmanDeadFace();
    DOM.hangmanCharacter.classList.add('dead-slump');
    if (DOM.figureArmLeft) DOM.figureArmLeft.classList.remove('flailing');
    if (DOM.figureArmRight) DOM.figureArmRight.classList.remove('flailing');
    if (DOM.figureLegLeft) DOM.figureLegLeft.classList.remove('kicking');
    if (DOM.figureLegRight) DOM.figureLegRight.classList.remove('kicking');
    if (DOM.figureHead) DOM.figureHead.classList.remove('panicking');
    if (DOM.hatPropeller) DOM.hatPropeller.classList.remove('fast-spin');
    if (DOM.dizzyStars) {
      DOM.dizzyStars.style.display = 'block';
      DOM.dizzyStars.classList.add('spinning');
    }
  }

  // Rastgele komik replik seç
  const quoteKey = `mistake${Math.min(mistakeCount, 6)}`;
  const quotesList = HANGMAN_QUOTES[quoteKey] || HANGMAN_QUOTES.mistake1;
  const quote = quotesList[Math.floor(Math.random() * quotesList.length)];
  triggerHangmanSpeech(quote, 3000);

  // Animasyon süresi bitince sakinleş (eğer henüz asılmadıysa)
  if (mistakeCount < 6) {
    hangmanReactionTimer = setTimeout(() => {
      clearHangmanReactionClasses();
    }, 1300);
  }
}

function triggerHangmanHappyReaction() {
  if (!DOM.hangmanCharacter) return;
  clearHangmanReactionClasses();
  if (hangmanReactionTimer) clearTimeout(hangmanReactionTimer);

  void DOM.hangmanCharacter.offsetWidth;
  DOM.hangmanCharacter.classList.add('react-happy');
  if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');

  // Yüzü sevimli gülümsemeye al
  if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'block';
  if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
  if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
  if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';

  const quotes = HANGMAN_QUOTES.correct;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  triggerHangmanSpeech(quote, 2400);

  hangmanReactionTimer = setTimeout(() => {
    clearHangmanReactionClasses();
  }, 1000);
}

function triggerHangmanTickleReaction() {
  if (!DOM.hangmanCharacter) return;
  sounds.playTickle();
  clearHangmanReactionClasses();
  if (hangmanReactionTimer) clearTimeout(hangmanReactionTimer);

  void DOM.hangmanCharacter.offsetWidth;
  DOM.hangmanCharacter.classList.add('react-tickle');
  if (DOM.hatPropeller) DOM.hatPropeller.classList.add('fast-spin');

  const quotes = HANGMAN_QUOTES.tickle;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  triggerHangmanSpeech(quote, 2200);

  hangmanReactionTimer = setTimeout(() => {
    clearHangmanReactionClasses();
  }, 700);
}

function triggerHangmanGaspReaction(playerName) {
  if (!DOM.hangmanCharacter) return;
  clearHangmanReactionClasses();
  if (hangmanReactionTimer) clearTimeout(hangmanReactionTimer);

  void DOM.hangmanCharacter.offsetWidth;
  DOM.hangmanCharacter.classList.add('react-severe');
  if (DOM.mouthOpen) {
    if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
    if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
    DOM.mouthOpen.style.display = 'block';
  }

  const quotes = HANGMAN_QUOTES.gasp;
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  triggerHangmanSpeech(`😱 ${playerName}: ${quote}`, 3200);

  hangmanReactionTimer = setTimeout(() => {
    clearHangmanReactionClasses();
  }, 1300);
}

function resetHangmanSvg() {
  HANGMAN_PARTS.forEach(partId => {
    const el = document.getElementById(partId);
    if (el) el.style.opacity = '0';
  });

  DOM.livesRemainingBadge.textContent = `${gameState.maxMistakes} / ${gameState.maxMistakes}`;

  clearHangmanReactionClasses();
  if (hangmanSpeechTimer) {
    clearTimeout(hangmanSpeechTimer);
    hangmanSpeechTimer = null;
  }
  if (DOM.hangmanBubble) DOM.hangmanBubble.classList.remove('active');

  // Yüz ifadesini ve durumları normale döndür
  if (DOM.eyesDead) DOM.eyesDead.style.display = 'none';
  if (DOM.eyesNormal) DOM.eyesNormal.style.display = 'block';
  if (DOM.eyeLeft) DOM.eyeLeft.style.display = 'block';
  if (DOM.eyeRight) DOM.eyeRight.style.display = 'block';
  if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'block';
  if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
  if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
  if (DOM.mouthDead) DOM.mouthDead.style.display = 'none';
  if (DOM.dizzyStars) {
    DOM.dizzyStars.style.display = 'none';
    DOM.dizzyStars.classList.remove('spinning');
  }
  if (DOM.sweatDrops) DOM.sweatDrops.classList.remove('active');
}

function drawHangmanPart(mistakeNumber) {
  const partIndex = mistakeNumber - 1;
  if (partIndex >= 0 && partIndex < HANGMAN_PARTS.length) {
    const el = document.getElementById(HANGMAN_PARTS[partIndex]);
    if (el) el.style.opacity = '1';
  }
}

function setHangmanDeadFace() {
  if (DOM.eyesDead) DOM.eyesDead.style.display = 'block';
  if (DOM.eyesNormal) DOM.eyesNormal.style.display = 'none';
  if (DOM.mouthDead) DOM.mouthDead.style.display = 'block';
  if (DOM.mouthNormal) DOM.mouthNormal.style.display = 'none';
  if (DOM.mouthWorried) DOM.mouthWorried.style.display = 'none';
  if (DOM.mouthOpen) DOM.mouthOpen.style.display = 'none';
  if (DOM.dizzyStars) {
    DOM.dizzyStars.style.display = 'block';
    DOM.dizzyStars.classList.add('spinning');
  }
}

// ==========================================
// 13. TUR SONU SENARYOLARI
// ==========================================

// Durum A: Bir oyuncu kelimeyi bildi / bitirdi
function handleRoundVictory(winnerPlayer, reason) {
  gameState.isRoundActive = false;
  stopTurnTimer();
  speech.stop();
  sounds.playVictory();
  confetti.launch(3500);

  DOM.roundEndIcon.textContent = '🎉🏆';
  DOM.roundEndTitle.textContent = 'Harika! Kelime Bulundu!';
  
  if (reason === 'dogru_tahmin') {
    DOM.roundEndMessage.innerHTML = `<strong>${winnerPlayer.avatar} ${winnerPlayer.name}</strong> tam kelimeyi doğru tahmin etti ve <strong>+50 Puan</strong> kazandı! 🌟`;
  } else {
    DOM.roundEndMessage.innerHTML = `<strong>${winnerPlayer.avatar} ${winnerPlayer.name}</strong> son harfi bularak kelimeyi tamamladı ve <strong>+50 Puan</strong> bonus kazandı! 🌟`;
  }

  showRoundEndSummaryModal();
}

// Durum B: 7. KURAL - Kimse bilemeden adam asılırsa
function handleHangmanCompleted() {
  gameState.isRoundActive = false;
  stopTurnTimer();
  speech.stop();
  setHangmanDeadFace();
  sounds.playHangmanLost();

  const master = gameState.players[gameState.wordMasterIndex];
  // 6. ve 7. KURAL: Oynatan kişi 100 puan kazanır
  master.score += 100;
  gameState.roundPointsRecord[master.id].masterBonus += 100;

  DOM.roundEndIcon.textContent = '😵🎪';
  DOM.roundEndTitle.textContent = 'Eyvah! Adam Asıldı!';
  DOM.roundEndMessage.innerHTML = `Kimse kelimeyi bulamadı!<br>Kelimeyi gizleyen <strong>${master.avatar} ${master.name} 100 Puan</strong> kazandı! 👑`;

  showRoundEndSummaryModal();
}

// Durum C: Tüm tahminciler elendiyse
function handleAllGuessersEliminated() {
  gameState.isRoundActive = false;
  stopTurnTimer();
  speech.stop();
  sounds.playHangmanLost();

  const master = gameState.players[gameState.wordMasterIndex];
  // 6. KURAL: Oynatan kişi 100 puan kazanır
  master.score += 100;
  gameState.roundPointsRecord[master.id].masterBonus += 100;

  DOM.roundEndIcon.textContent = '💥👑';
  DOM.roundEndTitle.textContent = 'Bütün Tahminciler Elendi!';
  DOM.roundEndMessage.innerHTML = `Herkes yanlış tahmin hakkı kullandı ve elendi!<br>Kelimeyi koruyan <strong>${master.avatar} ${master.name} 100 Puan</strong> kazandı! 🌟`;

  showRoundEndSummaryModal();
}

// Tur Sonu Özet Modalı
function showRoundEndSummaryModal() {
  DOM.revealedSecretWord.textContent = gameState.secretWord;
  DOM.pointsEarnedList.innerHTML = '';

  gameState.players.forEach(p => {
    const rec = gameState.roundPointsRecord[p.id] || { letters: 0, fullGuess: 0, masterBonus: 0 };
    const roundTotal = rec.letters + rec.fullGuess + rec.masterBonus;

    let details = [];
    if (rec.letters > 0) details.push(`Harflerden: +${rec.letters}`);
    if (rec.fullGuess > 0) details.push(`Doğru Tahmin: +${rec.fullGuess}`);
    if (rec.masterBonus > 0) details.push(`Kelime Tutucu Bonusu: +${rec.masterBonus}`);

    const detailText = details.length > 0 ? `(${details.join(', ')})` : '(Bu tur puan alamadı)';

    const li = document.createElement('li');
    li.innerHTML = `
      <span>${p.avatar} <strong>${p.name}</strong> <small style="color:#64748b">${detailText}</small></span>
      <span class="p-pts">+${roundTotal} ➔ Toplam: ${p.score}</span>
    `;
    DOM.pointsEarnedList.appendChild(li);
  });

  DOM.roundEndModal.classList.add('active');
}

// Sonraki Tura Geç Butonu (3. Kural: Sıra ile kişiler değişecek)
DOM.nextRoundBtn.addEventListener('click', () => {
  sounds.playClick();
  DOM.roundEndModal.classList.remove('active');

  // Sıradaki kelime tutucuya geç
  gameState.wordMasterIndex = (gameState.wordMasterIndex + 1) % gameState.players.length;
  gameState.roundNumber++;

  setupSecretWordRound();
});

// ==========================================
// 14. OYUN SONU VE ŞAMPİYONLUK KÜRSÜSÜ
// ==========================================
function showFinalGameOver() {
  DOM.roundEndModal.classList.remove('active');
  sounds.playVictory();
  confetti.launch(5000);

  // Oyuncuları puana göre sırala
  const sorted = [...gameState.players].sort((a, b) => b.score - a.score);

  // Kürsü Kutularını Doldur
  DOM.podiumContainer.innerHTML = '';

  // 2. Sıra (Solda)
  if (sorted[1]) {
    DOM.podiumContainer.appendChild(createPodiumNode(sorted[1], '2', 'second-place'));
  }
  // 1. Sıra (Ortada en yüksek)
  if (sorted[0]) {
    DOM.podiumContainer.appendChild(createPodiumNode(sorted[0], '1 👑', 'first-place'));
  }
  // 3. Sıra (Sağda)
  if (sorted[2]) {
    DOM.podiumContainer.appendChild(createPodiumNode(sorted[2], '3', 'third-place'));
  }

  // Tüm Oyuncuların Tablosu
  DOM.finalScoreTable.innerHTML = '';
  sorted.forEach((p, idx) => {
    const row = document.createElement('div');
    row.className = 'final-score-row';
    row.innerHTML = `
      <span><strong>#${idx + 1}</strong> ${p.avatar} ${p.name}</span>
      <span><strong>${p.score}</strong> Puan</span>
    `;
    DOM.finalScoreTable.appendChild(row);
  });

  DOM.gameOverModal.classList.add('active');
}

function createPodiumNode(player, rankLabel, cssClass) {
  const div = document.createElement('div');
  div.className = `podium-place ${cssClass}`;
  div.innerHTML = `
    <span class="podium-avatar">${player.avatar}</span>
    <span class="podium-name">${player.name}</span>
    <div class="podium-block">
      <span>${rankLabel}</span>
      <span class="podium-score">${player.score} P</span>
    </div>
  `;
  return div;
}

DOM.viewFinalScoresBtn.addEventListener('click', () => {
  sounds.playClick();
  showFinalGameOver();
});

DOM.endGameEarlyBtn.addEventListener('click', () => {
  sounds.playClick();
  if (confirm('Oyunu bitirip şampiyonluk kürsüsünü görmek istiyor musunuz?')) {
    showFinalGameOver();
  }
});

// Yeniden Oyna Butonu
DOM.restartGameBtn.addEventListener('click', () => {
  sounds.playClick();
  DOM.gameOverModal.classList.remove('active');
  if (gameState.botThinkingTimer) {
    clearTimeout(gameState.botThinkingTimer);
    gameState.botThinkingTimer = null;
  }
  switchScreen('setup');
});

// ==========================================
// 15. SES, TAM EKRAN & ETKİLEŞİMLER
// ==========================================
DOM.soundToggleBtn.addEventListener('click', () => {
  const isEnabled = sounds.toggle();
  DOM.soundIcon.textContent = isEnabled ? '🔊' : '🔇';
  showToast(isEnabled ? 'Ses Açıldı 🔊' : 'Ses Kapatıldı 🔇');
});

// Tam Ekran (Mobil/Tablet için)
DOM.fullscreenToggleBtn.addEventListener('click', () => {
  sounds.playClick();
  if (!document.fullscreenElement) {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
    DOM.fullscreenIcon.textContent = '🗗';
    showToast('Tam Ekrana Geçildi 📱');
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    }
    DOM.fullscreenIcon.textContent = '⛶';
    showToast('Tam Ekrandan Çıkıldı');
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    DOM.fullscreenIcon.textContent = '🗗';
  } else {
    DOM.fullscreenIcon.textContent = '⛶';
  }
});

// Mobil Dikey Ekranda Yatay Tavsiyesi
function checkOrientationTip() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const isSmall = window.innerWidth <= 600;
  if (isPortrait && isSmall && !sessionStorage.getItem('rotate_tip_dismissed')) {
    DOM.rotateDeviceTip.classList.add('show-tip');
  } else {
    DOM.rotateDeviceTip.classList.remove('show-tip');
  }
}

DOM.closeRotateTipBtn.addEventListener('click', () => {
  DOM.rotateDeviceTip.classList.remove('show-tip');
  sessionStorage.setItem('rotate_tip_dismissed', 'true');
});

window.addEventListener('resize', checkOrientationTip);
window.addEventListener('orientationchange', checkOrientationTip);

// Fiziksel Klavyeden Harf Basma Desteği
window.addEventListener('keydown', (e) => {
  // Modal açıkken veya gizli kelime ekranındayken klavye harflerini doğrudan oyuna gönderme
  if (DOM.guessWordModal.classList.contains('active') ||
      DOM.roundEndModal.classList.contains('active') ||
      DOM.gameOverModal.classList.contains('active') ||
      DOM.secretWordScreen.classList.contains('active') ||
      DOM.setupScreen.classList.contains('active')) {
    // Enter tuşuna basıldığında modalları tetikleme kolaylığı
    if (e.key === 'Enter') {
      if (DOM.guessWordModal.classList.contains('active')) {
        DOM.submitFullWordGuessBtn.click();
      } else if (DOM.secretWordScreen.classList.contains('active')) {
        DOM.confirmWordBtn.click();
      }
    }
    return;
  }

  const pressedChar = toTurkishUpper(e.key);
  if (TURKISH_ALPHABET.includes(pressedChar)) {
    if (gameState.players[gameState.currentGuesserIndex]?.isBot) return;
    handleLetterGuess(pressedChar);
  }
});

// Asılan Adam Maskotuna Tıklayınca Gıdıklama / Komik Tepki
if (DOM.hangmanCharacter) {
  DOM.hangmanCharacter.addEventListener('click', () => {
    if (gameState.isRoundActive) {
      triggerHangmanTickleReaction();
    }
  });
}

// ==========================================
// 15. BEYAZ KART HARF VE KELİME ARKA PLAN EFEKTİ (SADECE GİRİŞ KARTINDA)
// ==========================================
function initCardLetterBackgrounds() {
  // Arka plan animasyonu sadece giriş sayfasındaki kartta (#setupScreen) olsun, oyun ekranında olmasın
  const setupCard = document.getElementById('setupScreen');
  if (!setupCard) return;

  // Diğer kartlarda (özellikle oyun oynanan kartta) varsa tamamen kaldır
  document.querySelectorAll('.card-letters-watermark').forEach(el => el.remove());

  const glyphData = [
    // 1. Satır
    { text: 'A', size: 30, rot: -12, top: 7, left: 6, dur: 5.8, delay: -1.2, anim: 'glyphGlow1', color: '#6366f1' },
    { text: 'KELİME', size: 14, rot: 7, top: 6, left: 28, dur: 7.4, delay: -3.8, anim: 'glyphGlow2', color: '#ec4899' },
    { text: 'Z', size: 28, rot: 15, top: 8, left: 64, dur: 6.2, delay: -0.6, anim: 'glyphGlow3', color: '#f59e0b' },
    { text: 'OYUN', size: 14, rot: -8, top: 9, left: 86, dur: 8.5, delay: -4.2, anim: 'glyphGlow4', color: '#10b981' },

    // 2. Satır
    { text: 'B', size: 24, rot: 10, top: 27, left: 14, dur: 6.9, delay: -2.1, anim: 'glyphGlow2', color: '#06b6d4' },
    { text: 'Ç', size: 32, rot: -16, top: 25, left: 44, dur: 5.5, delay: -4.0, anim: 'glyphGlow1', color: '#8b5cf6' },
    { text: 'TAHMİN', size: 13, rot: 6, top: 28, left: 74, dur: 7.8, delay: -1.5, anim: 'glyphGlow3', color: '#f43f5e' },

    // 3. Satır
    { text: 'HARF', size: 14, rot: -11, top: 48, left: 6, dur: 8.1, delay: -5.3, anim: 'glyphGlow4', color: '#f59e0b' },
    { text: 'K', size: 28, rot: 14, top: 47, left: 26, dur: 6.3, delay: -2.9, anim: 'glyphGlow3', color: '#3b82f6' },
    { text: 'Ğ', size: 25, rot: 12, top: 46, left: 56, dur: 7.2, delay: -3.7, anim: 'glyphGlow1', color: '#10b981' },
    { text: 'M', size: 30, rot: -14, top: 49, left: 84, dur: 6.0, delay: -0.8, anim: 'glyphGlow2', color: '#ec4899' },

    // 4. Satır
    { text: 'BİLGİ', size: 13, rot: -6, top: 68, left: 10, dur: 7.7, delay: -3.4, anim: 'glyphGlow3', color: '#6366f1' },
    { text: 'Ş', size: 28, rot: 16, top: 67, left: 38, dur: 6.5, delay: -1.7, anim: 'glyphGlow2', color: '#f59e0b' },
    { text: 'NEŞE', size: 14, rot: 8, top: 70, left: 68, dur: 8.6, delay: -6.1, anim: 'glyphGlow4', color: '#06b6d4' },
    { text: 'P', size: 22, rot: -10, top: 69, left: 90, dur: 5.7, delay: -2.4, anim: 'glyphGlow1', color: '#8b5cf6' },

    // 5. Satır
    { text: 'D', size: 25, rot: -8, top: 88, left: 8, dur: 6.8, delay: -2.6, anim: 'glyphGlow2', color: '#f43f5e' },
    { text: 'BUL', size: 14, rot: 12, top: 89, left: 32, dur: 7.3, delay: -4.5, anim: 'glyphGlow3', color: '#10b981' },
    { text: 'Ü', size: 26, rot: -15, top: 86, left: 58, dur: 5.9, delay: -1.3, anim: 'glyphGlow1', color: '#6366f1' },
    { text: 'PUAN', size: 13, rot: 7, top: 88, left: 82, dur: 8.2, delay: -3.1, anim: 'glyphGlow4', color: '#f59e0b' }
  ];

  const watermark = document.createElement('div');
  watermark.className = 'card-letters-watermark';
  watermark.setAttribute('aria-hidden', 'true');

  glyphData.forEach(item => {
    const span = document.createElement('span');
    span.className = 'card-bg-glyph';
    span.textContent = item.text;
    span.style.fontSize = `${item.size}px`;
    span.style.top = `${item.top}%`;
    span.style.left = `${item.left}%`;
    span.style.setProperty('--rot', `${item.rot}deg`);
    span.style.setProperty('--accent-color', item.color);
    span.style.animation = `${item.anim} ${item.dur}s ease-in-out infinite alternate`;
    span.style.animationDelay = `${item.delay}s`;

    watermark.appendChild(span);
  });

  setupCard.prepend(watermark);

  // Sadece giriş ekranı açıkken rastgele bir harf veya kelimenin saydamlığını ve belirginliğini yükselt
  setInterval(() => {
    if (!setupCard.classList.contains('active')) return;

    const glyphs = setupCard.querySelectorAll('.card-bg-glyph');
    if (!glyphs.length) return;

    const randomIndex = Math.floor(Math.random() * glyphs.length);
    const chosenGlyph = glyphs[randomIndex];

    chosenGlyph.classList.add('spotlight');
    setTimeout(() => {
      chosenGlyph.classList.remove('spotlight');
    }, 2200);
  }, 2600);
}

// ==========================================
// 15.1. AYARLAR MENÜSÜ & TEMA YÖNETİMİ
// ==========================================

function openSettingsModal() {
  sounds.playClick();
  applySettings(); // Form elemanlarını mevcut ayarlarla senkronize et
  if (DOM.settingsModal) {
    DOM.settingsModal.classList.add('active');
  }
}

function closeSettingsModal() {
  if (DOM.settingsModal) {
    DOM.settingsModal.classList.remove('active');
  }
}

// Ayarlar modalını açma butonları
if (DOM.settingsToggleBtn) {
  DOM.settingsToggleBtn.addEventListener('click', openSettingsModal);
}
if (DOM.openSettingsFromSetupBtn) {
  DOM.openSettingsFromSetupBtn.addEventListener('click', openSettingsModal);
}
if (DOM.closeSettingsModalBtn) {
  DOM.closeSettingsModalBtn.addEventListener('click', () => {
    sounds.playClick();
    closeSettingsModal();
  });
}

// Modal dışına tıklayınca kapatma
if (DOM.settingsModal) {
  DOM.settingsModal.addEventListener('click', (e) => {
    if (e.target === DOM.settingsModal) {
      closeSettingsModal();
    }
  });
}

// Üst Bar Hızlı Tema Butonu (Gündüz / Gece)
if (DOM.themeToggleBtn) {
  DOM.themeToggleBtn.addEventListener('click', () => {
    sounds.playClick();
    const currentTheme = gameState.settings.theme;
    const nextTheme = (currentTheme === 'dark') ? 'light' : 'dark';
    saveSettings({ theme: nextTheme });
    showToast(nextTheme === 'dark' ? '🌙 Karanlık Mod Açıldı' : '☀️ Aydınlık Mod Açıldı', 2000);
  });
}

// Ayarlar Modalındaki Tema Seçenek Butonları
if (DOM.themeBtnLight && DOM.themeBtnDark) {
  DOM.themeBtnLight.addEventListener('click', () => {
    sounds.playClick();
    DOM.themeBtnLight.classList.add('active');
    DOM.themeBtnDark.classList.remove('active');
    document.documentElement.setAttribute('data-theme', 'light');
    if (DOM.themeIcon) DOM.themeIcon.textContent = '🌙';
  });

  DOM.themeBtnDark.addEventListener('click', () => {
    sounds.playClick();
    DOM.themeBtnDark.classList.add('active');
    DOM.themeBtnLight.classList.remove('active');
    document.documentElement.setAttribute('data-theme', 'dark');
    if (DOM.themeIcon) DOM.themeIcon.textContent = '☀️';
  });
}

// Ses Seviyesi Slider'ı Canlı Tepki
if (DOM.settingVolumeSlider) {
  DOM.settingVolumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (DOM.volumeLevelText) DOM.volumeLevelText.textContent = `%${val}`;
    sounds.setVolume(val / 100);
  });
}

// Ayarları Kaydet Butonu
if (DOM.saveSettingsBtn) {
  DOM.saveSettingsBtn.addEventListener('click', () => {
    sounds.playClick();
    const chosenTheme = DOM.themeBtnDark?.classList.contains('active') ? 'dark' : 'light';
    const hints = DOM.settingHintsToggle ? DOM.settingHintsToggle.checked : true;
    const keepTurn = DOM.settingKeepTurnToggle ? DOM.settingKeepTurnToggle.checked : true;
    const soundOn = DOM.settingSoundToggle ? DOM.settingSoundToggle.checked : true;
    const vol = DOM.settingVolumeSlider ? parseInt(DOM.settingVolumeSlider.value, 10) : 80;
    const voiceOn = DOM.settingVoiceToggle ? DOM.settingVoiceToggle.checked : true;
    const timer = DOM.settingTimerSelect ? parseInt(DOM.settingTimerSelect.value, 10) : 0;
    const botDiff = DOM.settingBotDiffSelect ? DOM.settingBotDiffSelect.value : 'normal';

    saveSettings({
      theme: chosenTheme,
      hintsEnabled: hints,
      keepTurnOnCorrect: keepTurn,
      soundEnabled: soundOn,
      volume: vol,
      voiceEnabled: voiceOn,
      timerMode: timer,
      botDifficulty: botDiff
    });

    closeSettingsModal();
    showToast('✨ Ayarlar kaydedildi!', 2200);
  });
}

// ElevenLabs Örnek Sesleri Dinleme Butonları
if (DOM.playSampleCallumBtn) {
  DOM.playSampleCallumBtn.addEventListener('click', () => {
    speech.stop();
    const audio = new Audio('audio/test_callum.mp3');
    audio.volume = gameState.settings.volume / 100;
    audio.play().catch(e => console.warn(e));
    showToast('🎭 Callum: "Hop noluyor?! Gömleğim kırıştı yahu!"', 3000);
  });
}

if (DOM.playSampleLiamBtn) {
  DOM.playSampleLiamBtn.addEventListener('click', () => {
    speech.stop();
    const audio = new Audio('audio/test_liam.mp3');
    audio.volume = gameState.settings.volume / 100;
    audio.play().catch(e => console.warn(e));
    showToast('⚡ Liam: "Hop noluyor?! Gömleğim kırıştı yahu!"', 3000);
  });
}

if (DOM.playSampleJessicaBtn) {
  DOM.playSampleJessicaBtn.addEventListener('click', () => {
    speech.stop();
    const audio = new Audio('audio/test_jessica.mp3');
    audio.volume = gameState.settings.volume / 100;
    audio.play().catch(e => console.warn(e));
    showToast('👧 Jessica: "Hop noluyor?! Gömleğim kırıştı yahu!"', 3000);
  });
}

// ==========================================
// 16. İLK BAŞLATMA
// ==========================================
applySettings();
renderPlayerInputs();
checkOrientationTip();
initCardLetterBackgrounds();



