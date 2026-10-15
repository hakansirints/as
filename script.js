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

  playTone(freq, type = 'sine', duration = 0.15, startDelay = 0, gainLevel = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      const now = this.audioCtx.currentTime + startDelay;

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainLevel, now);
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

      gain.gain.setValueAtTime(0.22, now);
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
        gain2.gain.setValueAtTime(0.18, now + 0.06);
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

  // Buton tıklama
  playClick() {
    this.playTone(800, 'sine', 0.05, 0, 0.1);
  }
}

const sounds = new SoundEngine();

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
// 4. OYUN DURUMU (Game State)
// ==========================================
const gameState = {
  playerCount: 3,
  players: [], // { id, name, avatar, score, isEliminatedThisRound }
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

  // Gizli Kelime Ekranı
  wordMasterNameDisplay: document.getElementById('wordMasterNameDisplay'),
  secretWordInput: document.getElementById('secretWordInput'),
  toggleWordVisibilityBtn: document.getElementById('toggleWordVisibilityBtn'),
  secretWordHint: document.getElementById('secretWordHint'),
  categoryPills: document.querySelectorAll('.pill-btn'),
  confirmWordBtn: document.getElementById('confirmWordBtn'),

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

  // Genel & Ses & Ekran
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
  for (let i = 0; i < gameState.playerCount; i++) {
    const avatar = AVATARS[i % AVATARS.length];
    const defaultName = `${i + 1}. Oyuncu`;

    const row = document.createElement('div');
    row.className = 'player-input-row';
    row.innerHTML = `
      <span class="player-avatar-badge" title="${avatar.name}">${avatar.icon}</span>
      <input type="text" id="player_name_${i}" placeholder="${defaultName}" maxlength="15" value="${defaultName}">
    `;
    DOM.playerInputsList.appendChild(row);
  }
}

// Oyuncu sayısı seçimi butonları dinleyicisi
DOM.playerCountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sounds.playClick();
    DOM.playerCountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    gameState.playerCount = parseInt(btn.dataset.count, 10);
    renderPlayerInputs();
  });
});

// "Hadi Başlayalım!" Butonu
DOM.startSetupBtn.addEventListener('click', () => {
  sounds.playClick();
  gameState.players = [];

  for (let i = 0; i < gameState.playerCount; i++) {
    const input = document.getElementById(`player_name_${i}`);
    let name = input ? input.value.trim() : '';
    if (!name) name = `${i + 1}. Oyuncu`;

    gameState.players.push({
      id: i,
      name: name,
      avatar: AVATARS[i % AVATARS.length].icon,
      score: 0,
      isEliminatedThisRound: false
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
  DOM.wordMasterNameDisplay.textContent = `${master.avatar} ${master.name}`;

  DOM.secretWordInput.value = '';
  DOM.secretWordInput.type = 'password';
  DOM.toggleWordVisibilityBtn.textContent = '👁️';
  DOM.secretWordHint.value = '';
  DOM.categoryPills.forEach(p => p.classList.remove('active'));

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

  // Tüm oyuncuların elenme durumunu ve puan geçmişini sıfırla
  gameState.roundPointsRecord = {};
  gameState.players.forEach(p => {
    p.isEliminatedThisRound = false;
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

  switchScreen('game');
  showToast(`🎮 Tur Başladı! Sıra ${gameState.players[gameState.currentGuesserIndex].name}'de!`);
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
    return;
  }

  DOM.turnAnnouncementBox.style.display = 'flex';
  const currentGuesser = gameState.players[gameState.currentGuesserIndex];
  DOM.activeGuesserAvatar.textContent = currentGuesser.avatar;
  DOM.activeGuesserName.textContent = currentGuesser.name;
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
    showToast(`👏 ${currentGuesser.name} "${letter}" harfini bildi! (+${pts} Puan) Doğru bildiğin için sıra sende kaldı! 🎯`, 3000);

    // Kelimenin tamamı açıldı mı kontrol et
    if (isWordFullyRevealed()) {
      // Kelimeyi tamamlayan oyuncuya 50 bonus puan
      currentGuesser.score += 50;
      gameState.roundPointsRecord[currentGuesser.id].fullGuess += 50;
      updateScoreboardUI();
      handleRoundVictory(currentGuesser, 'kelime_tamamlandi');
      return;
    }

    // Harfi doğru bilen tekrar tahmin hakkı elde eder (Sıra devredilmez, oyuncuda kalır)
    updateTurnAnnouncementUI();
    DOM.turnAnnouncementBox.classList.remove('pulse-glow');
    void DOM.turnAnnouncementBox.offsetWidth;
    DOM.turnAnnouncementBox.classList.add('pulse-glow');
  } else {
    // YANLIŞ HARF
    if (btn) btn.classList.add('wrong');

    gameState.mistakes++;
    drawHangmanPart(gameState.mistakes);
    DOM.livesRemainingBadge.textContent = `${gameState.maxMistakes - gameState.mistakes} / ${gameState.maxMistakes}`;

    sounds.playWrongLetter(gameState.mistakes);
    triggerHangmanMistakeReaction(gameState.mistakes);

    showToast(`❌ "${letter}" harfi kelimede yok!`);

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
  const nextGuesser = getNextActiveGuesserIndex(gameState.currentGuesserIndex);
  if (nextGuesser === -1) {
    // Herkes elendiyse
    handleAllGuessersEliminated();
    return;
  }
  gameState.currentGuesserIndex = nextGuesser;
  updateScoreboardUI();
  updateTurnAnnouncementUI();
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

    // Kalan aktif tahminci var mı?
    const nextGuesser = getNextActiveGuesserIndex(gameState.currentGuesserIndex);
    if (nextGuesser === -1) {
      // Kimse kalmadı! Kelimeyi oynatan kişi kazanır
      handleAllGuessersEliminated();
    } else {
      gameState.currentGuesserIndex = nextGuesser;
      updateScoreboardUI();
      updateTurnAnnouncementUI();
    }
  }
});

// ==========================================
// 12. KOMİK ASILAN ADAM TEPKİLERİ VE ANİMASYONLARI
// ==========================================

const HANGMAN_QUOTES = {
  mistake1: [
    "Ayy! İlk hatada beni mi çağırdınız?! 😅",
    "Merhaba! Lütfen nazik olun, ben daha çok yeniyim! 🎩",
    "Hop! Dikkatli seçin, burası biraz rüzgarlı! 🧐",
    "Kafam çıktı piyasaya, aman dikkat! 🎪"
  ],
  mistake2: [
    "Hop noluyo?! Gömleğim kırıştı yahu! 👔",
    "Karnım guruldadı, bari bir sesli harf bilin! 🙈",
    "Bir ürperti geldi... Lütfen yanlış basmayın! 🥶",
    "Gövdem geldi ama kalbim pır pır ediyor! 💓"
  ],
  mistake3: [
    "İmdat! Sol kolum havada kaldı! 🙋‍♂️",
    "Harflere dikkat! Koluma kramp girecek! 😱",
    "Bu harf hiç olmadı ama yaa! 🤦‍♂️",
    "Sol kolumla el sallıyorum: Kurtarın beni! 🚩"
  ],
  mistake4: [
    "Bari iki kolumu birden bağlamasaydınız! 👐",
    "Annemi istiyorum! Yanlış basmayın artık! 📢",
    "Kollarımla alkışlayamıyorum bile yahu! 🥺",
    "Eyvah eyvah, iki kolum da havalarda! 🤷‍♂️"
  ],
  mistake5: [
    "Tir tir titriyorum! Tek bir canım kaldı! 🚨🦵",
    "Ayaklarım yerden kesildi, nefes alamıyorum! 😱",
    "Son şansınız! Lütfen kelimeyi kurtarın! 🆘",
    "Bacaklarım zangır zangır titriyor, bir harf daha bitti! ⚡"
  ],
  mistake6: [
    "Gözlerim fırıldak oldu! Yıldızları sayıyorum... ⭐💫",
    "Ben dedim o harf değil diye! Ruhum uçtu... 👻",
    "Olamazzz! Helvam fıstıklı olsun bari! 🍯😵",
    "Asıldım gittim! Görüşürüz öbür dünyada! 🎪😵"
  ],
  correct: [
    "Oh be! Rahat bir nefes aldım! 🥳",
    "Harikasın! Böyle devam et! 🌟",
    "Süper harf! Kurtuluyorum galiba! 🎈",
    "Helal olsun, işte beklediğim harf! 👏",
    "Kalbim ferahladı, yaşasın! 💖"
  ],
  gasp: [
    "Aman tanrım! O kelime hiç olmadı! 😱",
    "Eyvah, büyük risk aldın ve elendin! 💥",
    "Cesurcaydı ama maalesef yanlış! 🙈"
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

function triggerHangmanSpeech(text, duration = 2800) {
  if (!DOM.hangmanBubble || !DOM.hangmanBubbleText) return;

  if (hangmanSpeechTimer) {
    clearTimeout(hangmanSpeechTimer);
    hangmanSpeechTimer = null;
  }

  DOM.hangmanBubbleText.textContent = text;
  DOM.hangmanBubble.classList.remove('active');
  void DOM.hangmanBubble.offsetWidth; // Reflow tetikle
  DOM.hangmanBubble.classList.add('active');

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
// 16. İLK BAŞLATMA
// ==========================================
renderPlayerInputs();
checkOrientationTip();


