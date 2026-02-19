import { useState, useEffect, useCallback, useRef } from "react";

const WORDS = [
  "FLAME","BRAVE","CRANE","GHOST","CHESS","DRINK","FROST","GLIDE","BLAZE","CRISP",
  "EVERY","HUMID","IRONY","LEMON","MERCY","OPTIC","PRISM","QUIRK","RAVEN","STALK",
  "TROVE","VIVID","WALTZ","BENCH","CIVIC","DEPOT","EPOCH","FAITH","HINGE","INDEX",
  "JEWEL","KNACK","LODGE","NIECE","OXIDE","PIXEL","RELIC","SAVOR","THORN","UMBRA",
  "VOICE","WRATH","EXPEL","YEARN","CLAMP","DOUBT","ELBOW","FLOCK","GROAN","HAVOC",
  "IDIOM","KNELT","LYRIC","MOURN","NOTCH","OTTER","QUEST","ROBIN","SNARE","VIGOR",
  "WINCE","EXILE","ABBEY","BRAWL","CHASM","DELTA","EMBER","FETCH","HOUND","IGLOO",
  "KHAKI","LUNAR","MOTIF","NICHE","SWAMP","JOUST","ALBUM","DEBUT","FROZE","HARSH",
  "INFER","MAXIM","NASAL","PERKY","CRAVE","DAUNT","ENVY","FROTH","GLOOM","HASTE",
  "INEPT","JAUNT","KNAVE","LUSTY","MIRTH","NEWSY","OVERT","PLUCK","RASPY","SLICK",
];

const KEY_ROWS = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["ENTER","Z","X","C","V","B","N","M","⌫"],
];

function getTileState(guess, answer, col) {
  const letter = guess[col];
  if (!letter) return "empty";
  if (answer[col] === letter) return "correct";
  const ansArr = answer.split("");
  const gArr = guess.split("");
  const usedByCorrect = ansArr.map((a, i) => a === gArr[i]);
  const remaining = ansArr.filter((_, i) => !usedByCorrect[i]);
  const alreadyCounted = gArr.slice(0, col).filter((g, i) => g === letter && ansArr[i] !== letter).length;
  if (remaining.filter(a => a === letter).length > alreadyCounted) return "present";
  return "absent";
}

function getKeyState(k, guesses, answer) {
  let s = "unused";
  for (const g of guesses) {
    for (let i = 0; i < g.length; i++) {
      if (g[i] === k) {
        if (answer[i] === k) return "correct";
        if (answer.includes(k)) s = "present";
        else if (s === "unused") s = "absent";
      }
    }
  }
  return s;
}

const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Nunito:wght@400;600;700;800;900&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --cream: #fdf6e3;
  --warm-white: #fffdf5;
  --amber: #e8a020;
  --amber-dark: #c47d00;
  --scarlet: #d42b2b;
  --scarlet-dark: #a01e1e;
  --green: #2a9d58;
  --green-dark: #1d7040;
  --felt-green: #1a6b3c;
  --felt-bg: #2c4a2e;
  --gold: #f0c040;
  --panel: #3a2a1a;
  --panel-light: #4e3a24;
  --text-dark: #2a1a08;
  --text-mid: #6b4e2a;
  --shadow: rgba(30,15,5,0.35);
}

body { background: var(--panel); font-family: 'Nunito', sans-serif; }

.app {
  min-height: 100vh;
  background: #002139;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding-bottom: 40px;
}

/* Studio light rays from top */
.app::before {
  content: '';
  position: absolute;
  top: -60px; left: 50%;
  transform: translateX(-50%);
  width: 900px; height: 500px;
  background:
    conic-gradient(from 85deg at 50% 0%,
      transparent 0deg,
      rgba(255,220,100,0.06) 5deg,
      transparent 10deg,
      rgba(255,220,100,0.04) 15deg,
      transparent 20deg,
      rgba(255,200,80,0.05) 25deg,
      transparent 30deg
    );
  pointer-events: none;
}

/* Grain overlay */
.grain {
  position: fixed; inset: 0;
  opacity: 0.35;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 100;
  mix-blend-mode: overlay;
}

/* ── HEADER ── */
.header {
  width: 100%;
  max-width: 520px;
  padding: 32px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.studio-lights {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.bulb {
  width: 12px; height: 12px;
  border-radius: 50%;
  position: relative;
}
.bulb::after {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  opacity: 0.5;
}
.bulb-r { background: #ff4444; box-shadow: 0 0 8px 3px rgba(255,50,50,0.8), 0 0 20px rgba(255,50,50,0.4); }
.bulb-r::after { box-shadow: 0 0 12px 6px rgba(255,50,50,0.3); }
.bulb-a { background: #ffb820; box-shadow: 0 0 8px 3px rgba(255,180,20,0.8), 0 0 20px rgba(255,180,20,0.4); }
.bulb-a::after { box-shadow: 0 0 12px 6px rgba(255,180,20,0.3); }
.bulb-g { background: #44ff88; box-shadow: 0 0 8px 3px rgba(50,255,100,0.8), 0 0 20px rgba(50,255,100,0.4); }
.bulb-g::after { box-shadow: 0 0 12px 6px rgba(50,255,100,0.3); }

@keyframes bulbFlicker {
  0%,100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.6; }
  94% { opacity: 1; }
  96% { opacity: 0.7; }
  97% { opacity: 1; }
}
.bulb-r { animation: bulbFlicker 7s ease-in-out infinite; }
.bulb-a { animation: bulbFlicker 11s ease-in-out 2s infinite; }
.bulb-g { animation: bulbFlicker 9s ease-in-out 4s infinite; }

.logo-wrap {
  background: linear-gradient(160deg, #8b1a1a, #5a0f0f);
  border-radius: 16px;
  padding: 14px 44px 12px;
  position: relative;
  box-shadow:
    0 0 0 3px #c43030,
    0 0 0 6px rgba(180,30,30,0.3),
    0 8px 32px rgba(180,20,20,0.5),
    0 2px 0 rgba(255,255,255,0.06) inset,
    0 -2px 0 rgba(0,0,0,0.3) inset;
  margin-bottom: 8px;
}

.logo-wrap::before {
  content: '';
  position: absolute;
  top: 0; left: 20px; right: 20px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,200,150,0.4), transparent);
}

.logo {
  font-family: 'Alfa Slab One', serif;
  font-size: 72px;
  line-height: 1;
  letter-spacing: 0.08em;
  color: var(--gold);
  text-shadow:
    0 2px 0 #8b5e00,
    0 4px 0 rgba(0,0,0,0.4),
    0 0 30px rgba(240,192,64,0.6),
    0 0 80px rgba(240,192,64,0.2);
  position: relative;
}

.logo-tagline {
  font-size: 9.5px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  text-align: center;
  margin-bottom: 20px;
}

/* ── SCOREBOARD ── */
.scoreboard {
  display: flex;
  gap: 2px;
  background: rgba(0,0,0,0.4);
  border: 1px solid rgba(255,200,80,0.15);
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 18px;
}

.score-cell {
  padding: 10px 20px;
  text-align: center;
  background: rgba(255,255,255,0.025);
  flex: 1;
}
.score-cell + .score-cell {
  border-left: 1px solid rgba(255,200,80,0.1);
}

.score-num {
  font-family: 'Alfa Slab One', serif;
  font-size: 30px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 0 14px rgba(240,192,64,0.5);
}

.score-label {
  font-size: 8.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255,220,120,0.35);
  margin-top: 3px;
}

/* ── TOAST ── */
.toast-area {
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.toast {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 18px;
  border-radius: 30px;
  animation: toastIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
}
@keyframes toastIn {
  from { opacity:0; transform: scale(0.8) translateY(-4px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}

.toast-error   { background: rgba(180,30,30,0.25); color: #ff8888; border: 1px solid rgba(180,30,30,0.4); }
.toast-success { background: rgba(40,160,80,0.2); color: #60e090; border: 1px solid rgba(40,160,80,0.35); }
.toast-info    { background: rgba(240,192,64,0.12); color: #f0c040; border: 1px solid rgba(240,192,64,0.25); }
.toast-fail    { background: rgba(180,80,20,0.2); color: #ff9944; border: 1px solid rgba(180,80,20,0.35); }

/* ── GRID ── */
.grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid-row {
  display: flex;
  gap: 6px;
}

@keyframes rowShake {
  0%,100% { transform: translateX(0); }
  15% { transform: translateX(-9px); }
  30% { transform: translateX(9px); }
  45% { transform: translateX(-6px); }
  60% { transform: translateX(6px); }
  75% { transform: translateX(-3px); }
}
.row-shake { animation: rowShake 0.4s ease; }

/* TILE BASE */
.tile {
  width: 62px;
  height: 62px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Alfa Slab One', serif;
  font-size: 34px;
  line-height: 1;
  position: relative;
  cursor: default;
  user-select: none;
}

/* Tile states */
.t-empty {
  background: rgba(255,255,255,0.035);
  border: 2px solid rgba(255,200,100,0.1);
  color: transparent;
}

.t-blank-active {
  background: rgba(255,255,255,0.04);
  border: 2px dashed rgba(240,192,64,0.2);
  color: transparent;
}

.t-typed {
  background: rgba(255,245,220,0.08);
  border: 2px solid rgba(240,192,64,0.5);
  color: var(--gold);
  text-shadow: 0 0 10px rgba(240,192,64,0.4);
  box-shadow: 0 0 0 1px rgba(240,192,64,0.15) inset;
}

.t-pending {
  background: rgba(255,245,220,0.06);
  border: 2px solid rgba(255,200,100,0.2);
  color: rgba(255,230,150,0.7);
}

/* The revealed first-letter tile — blue felt board */
.t-revealed {
  background: linear-gradient(160deg, #1e5fa8, #103d78);
  border: 2px solid #2a7ad0;
  color: #fff;
  font-size: 36px;
  box-shadow:
    0 4px 0 #0c2d58,
    0 0 18px rgba(30,95,168,0.6),
    0 1px 0 rgba(255,255,255,0.15) inset;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

/* Correct — green felt */
.t-correct {
  background: linear-gradient(160deg, #2ab868, #1a8048);
  border: 2px solid #33d478;
  color: #fff;
  box-shadow:
    0 4px 0 #0e5228,
    0 0 20px rgba(42,184,104,0.55),
    0 1px 0 rgba(255,255,255,0.2) inset;
  text-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

/* Present — amber/orange */
.t-present {
  background: linear-gradient(160deg, #e8a020, #b87010);
  border: 2px solid #f8c040;
  color: #fff;
  box-shadow:
    0 4px 0 #7a4800,
    0 0 20px rgba(232,160,32,0.55),
    0 1px 0 rgba(255,255,255,0.2) inset;
  text-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

/* Absent — dark felt */
.t-absent {
  background: linear-gradient(160deg, #2a2218, #1e1810);
  border: 2px solid rgba(255,200,100,0.08);
  color: rgba(255,200,100,0.2);
  box-shadow: 0 3px 0 rgba(0,0,0,0.4);
}

/* Animations */
@keyframes tileFlip {
  0%   { transform: rotateX(0deg); filter: brightness(1); }
  48%  { transform: rotateX(-90deg); filter: brightness(0.5); }
  52%  { transform: rotateX(-90deg); filter: brightness(0.5); }
  100% { transform: rotateX(0deg); filter: brightness(1); }
}
@keyframes tilePop {
  0%   { transform: scale(1); }
  35%  { transform: scale(1.16); }
  70%  { transform: scale(0.94); }
  100% { transform: scale(1); }
}
@keyframes tileWin {
  0%   { transform: translateY(0) scale(1); }
  30%  { transform: translateY(-20px) scale(1.05); }
  55%  { transform: translateY(-8px) scale(1.02); }
  75%  { transform: translateY(-15px) scale(1.04); }
  90%  { transform: translateY(-4px) scale(1.01); }
  100% { transform: translateY(0) scale(1); }
}

.tile-flip { animation: tileFlip 0.45s ease both; }
.tile-pop  { animation: tilePop 0.12s ease; }
.tile-win  { animation: tileWin 0.6s cubic-bezier(0.36,0.07,0.19,0.97) both; }

/* ── LEGEND ── */
.legend {
  display: flex;
  gap: 20px;
  margin: 16px 0 14px;
  align-items: center;
}

.leg-item {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255,200,100,0.3);
}

.leg-swatch {
  width: 14px; height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
}

/* ── KEYBOARD ── */
.keyboard {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  max-width: 420px;
  padding: 0 8px;
}

.key-row {
  display: flex;
  gap: 5px;
  justify-content: center;
}

.key {
  height: 54px;
  flex: 1;
  min-width: 28px;
  max-width: 36px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.08s, filter 0.1s;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  letter-spacing: 0.01em;
}
.key:active { transform: scale(0.88) translateY(2px); }
.key-wide {
  max-width: 52px;
  font-size: 10px;
  letter-spacing: -0.02em;
  font-weight: 800;
}

.k-unused {
  background: linear-gradient(160deg, #3a2e1e, #2c2214);
  color: rgba(255,220,140,0.7);
  box-shadow: 0 3px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,200,100,0.08);
  border: 1px solid rgba(255,200,100,0.1);
}
.k-unused:hover { filter: brightness(1.15); }

.k-correct {
  background: linear-gradient(160deg, #2ab868, #1a8048);
  color: #fff;
  box-shadow: 0 3px 0 #0e5228, 0 0 12px rgba(42,184,104,0.35);
  border: 1px solid #33d478;
}
.k-present {
  background: linear-gradient(160deg, #e8a020, #b87010);
  color: #fff;
  box-shadow: 0 3px 0 #7a4800, 0 0 12px rgba(232,160,32,0.35);
  border: 1px solid #f8c040;
}
.k-absent {
  background: #18140c;
  color: rgba(255,200,100,0.18);
  box-shadow: 0 3px 0 rgba(0,0,0,0.4);
  border: 1px solid rgba(255,200,100,0.04);
}

/* ── OVERLAY ── */
.overlay {
  position: fixed; inset: 0;
  background: rgba(10,6,2,0.88);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: overlayFade 0.3s ease;
}
@keyframes overlayFade { from { opacity:0; } to { opacity:1; } }

.result-card {
  background: linear-gradient(160deg, #2c1e10, #1a1208);
  border-radius: 20px;
  border: 1px solid rgba(240,192,64,0.2);
  padding: 48px 48px 40px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 30px 80px rgba(0,0,0,0.7), 0 0 60px rgba(180,80,0,0.1);
  animation: cardPop 0.36s cubic-bezier(0.34,1.46,0.64,1);
  position: relative;
  overflow: hidden;
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0; left: 20%; right: 20%; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(240,192,64,0.35), transparent);
}

@keyframes cardPop {
  from { transform: scale(0.78) translateY(30px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

.result-trophy { font-size: 56px; display: block; margin-bottom: 10px; }
.result-title {
  font-family: 'Alfa Slab One', serif;
  font-size: 50px;
  line-height: 1;
  color: var(--gold);
  text-shadow: 0 3px 0 rgba(0,0,0,0.5), 0 0 30px rgba(240,192,64,0.4);
  margin-bottom: 12px;
  letter-spacing: 0.06em;
}
.result-word {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255,220,140,0.55);
  letter-spacing: 0.08em;
  margin-bottom: 5px;
}
.result-word strong { color: var(--gold); font-weight: 900; }
.result-sub {
  font-size: 11px;
  color: rgba(255,200,100,0.28);
  letter-spacing: 0.08em;
  margin-bottom: 30px;
}

.play-again {
  background: linear-gradient(145deg, #c43030, #8b1a1a);
  color: var(--gold);
  border: 1px solid rgba(255,200,80,0.25);
  padding: 15px;
  border-radius: 10px;
  font-family: 'Alfa Slab One', serif;
  font-size: 18px;
  letter-spacing: 0.1em;
  cursor: pointer;
  width: 100%;
  transition: all 0.18s;
  box-shadow: 0 5px 0 #5a0f0f, 0 0 24px rgba(180,30,30,0.4);
  text-shadow: 0 1px 0 rgba(0,0,0,0.4);
}
.play-again:hover { filter: brightness(1.12); transform: translateY(-1px); box-shadow: 0 6px 0 #5a0f0f, 0 0 36px rgba(180,30,30,0.5); }
.play-again:active { transform: translateY(3px); box-shadow: 0 2px 0 #5a0f0f; }
`;

export default function LingoGame() {
  const [answer, setAnswer] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState([]);
  const [typed, setTyped] = useState(""); // everything after the first letter
  const [phase, setPhase] = useState("playing"); // playing | won | lost
  const [toast, setToast] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [revealed, setRevealed] = useState(new Set());
  const [popCol, setPopCol] = useState(null);
  const [winRow, setWinRow] = useState(null);
  const [overlay, setOverlay] = useState(false);
  const [stats, setStats] = useState({ played: 0, won: 0, streak: 0 });
  const toastRef = useRef();

  const MAX = 6, LEN = 5;
  const currentFull = answer[0] + typed;

  const showToast = (text, type, ms = 1800) => {
    clearTimeout(toastRef.current);
    setToast({ text, type });
    if (ms < 9000) toastRef.current = setTimeout(() => setToast(null), ms);
  };

  const doShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 450);
  };

  const submit = useCallback(() => {
    if (phase !== "playing") return;
    const full = answer[0] + typed;
    if (full.length < LEN) { showToast("Not enough letters", "error"); doShake(); return; }

    const newGuesses = [...guesses, full];
    setGuesses(newGuesses);
    setTyped("");

    const rowIdx = newGuesses.length - 1;
    const flipDelay = LEN * 115 + 150;

    // Trigger flip reveal
    setTimeout(() => {
      setRevealed(prev => new Set([...prev, rowIdx]));

      const won = full === answer;
      const lost = !won && newGuesses.length >= MAX;

      if (won) {
        setTimeout(() => {
          setWinRow(rowIdx);
          setPhase("won");
          setStats(s => ({ played: s.played + 1, won: s.won + 1, streak: s.streak + 1 }));
          showToast("LINGO! 🎉", "success", 9999);
          setTimeout(() => setOverlay(true), 700);
        }, flipDelay);
      } else if (lost) {
        setTimeout(() => {
          setPhase("lost");
          setStats(s => ({ played: s.played + 1, won: s.won, streak: 0 }));
          showToast(answer, "fail", 9999);
          setTimeout(() => setOverlay(true), 600);
        }, flipDelay);
      }
    }, 60);
  }, [typed, guesses, answer, phase]);

  const handleKey = useCallback((k) => {
    if (phase !== "playing") return;
    if (k === "ENTER") { submit(); return; }
    if (k === "⌫") { setTyped(t => t.slice(0, -1)); return; }
    if (/^[A-Z]$/.test(k) && currentFull.length < LEN) {
      setPopCol(currentFull.length);
      setTimeout(() => setPopCol(null), 130);
      setTyped(t => t + k);
    }
  }, [phase, submit, currentFull]);

  useEffect(() => {
    const h = e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k === "BACKSPACE") handleKey("⌫");
      else if (k === "ENTER") handleKey("ENTER");
      else if (/^[A-Z]$/.test(k)) handleKey(k);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleKey]);

  const reset = () => {
    setAnswer(WORDS[Math.floor(Math.random() * WORDS.length)]);
    setGuesses([]); setTyped(""); setPhase("playing");
    setToast(null); setRevealed(new Set()); setWinRow(null); setOverlay(false);
  };

  const winRate = stats.played ? Math.round(stats.won / stats.played * 100) : 0;

  // Render tile
  const renderTile = (rowIdx, colIdx) => {
    const isSubmitted = rowIdx < guesses.length;
    const isActiveRow = rowIdx === guesses.length && phase === "playing";
    const isFlipped = revealed.has(rowIdx);
    const isWinning = winRow === rowIdx;

    let cls = "tile t-empty";
    let letter = "";
    let style = {};

    if (isSubmitted) {
      letter = guesses[rowIdx][colIdx] || "";
      if (isFlipped) {
        const st = getTileState(guesses[rowIdx], answer, colIdx);
        const delay = colIdx * 115;
        cls = `tile t-${st} tile-flip`;
        style.animationDelay = `${delay}ms`;
        if (isWinning) {
          cls += " tile-win";
          style.animationDelay = `${delay}ms, ${delay + LEN * 115 + 200}ms`;
        }
      } else {
        cls = "tile t-pending";
      }
    } else if (isActiveRow) {
      if (colIdx === 0) {
        letter = answer[0];
        cls = "tile t-revealed";
      } else {
        letter = typed[colIdx - 1] || "";
        if (letter) {
          cls = `tile t-typed${popCol === colIdx ? " tile-pop" : ""}`;
        } else {
          cls = "tile t-blank-active";
        }
      }
    }

    return <div key={colIdx} className={cls} style={style}>{letter}</div>;
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="app">
        <div className="grain" />

        <div className="header">
          {/* Studio bulbs */}
          <div className="studio-lights">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`bulb ${["bulb-r","bulb-a","bulb-g","bulb-a","bulb-r"][i]}`} />
            ))}
          </div>

          {/* Logo */}
          <img
           src="https://raw.githubusercontent.com/Ghhdhvv2/Lingo/refs/heads/main/public/lingo-logo.avif" 
           alt="Lingo"
           style={{width: 280, marginBottom: 8}}
           />

          {/* Scoreboard */}
          <div className="scoreboard">
            <div className="score-cell">
              <div className="score-num">{stats.played}</div>
              <div className="score-label">Played</div>
            </div>
            <div className="score-cell">
              <div className="score-num">{winRate}%</div>
              <div className="score-label">Won</div>
            </div>
            <div className="score-cell">
              <div className="score-num">{stats.streak}</div>
              <div className="score-label">Streak</div>
            </div>
          </div>
        </div>

        {/* Toast */}
        <div className="toast-area">
          {toast && <div className={`toast toast-${toast.type}`}>{toast.text}</div>}
        </div>

        {/* Grid */}
        <div className="grid">
          {Array.from({ length: MAX }).map((_, ri) => (
            <div
              key={ri}
              className={`grid-row${ri === guesses.length && shaking ? " row-shake" : ""}`}
            >
              {Array.from({ length: LEN }).map((_, ci) => renderTile(ri, ci))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="legend">
          <div className="leg-item">
            <div className="leg-swatch" style={{ background: "#2ab868", boxShadow: "0 0 6px rgba(42,184,104,0.7)" }} />
            Correct
          </div>
          <div className="leg-item">
            <div className="leg-swatch" style={{ background: "#e8a020", boxShadow: "0 0 6px rgba(232,160,32,0.7)" }} />
            Wrong spot
          </div>
          <div className="leg-item">
            <div className="leg-swatch" style={{ background: "#2a2218", border: "1px solid rgba(255,200,100,0.15)" }} />
            Not in word
          </div>
        </div>

        {/* Keyboard */}
        <div className="keyboard">
          {KEY_ROWS.map((row, ri) => (
            <div key={ri} className="key-row">
              {row.map(k => {
                const ks = (k === "ENTER" || k === "⌫") ? "unused" : getKeyState(k, guesses, answer);
                return (
                  <button
                    key={k}
                    className={`key k-${ks}${k === "ENTER" || k === "⌫" ? " key-wide" : ""}`}
                    onClick={() => handleKey(k)}
                  >
                    {k}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Result Overlay */}
        {overlay && (
          <div className="overlay">
            <div className="result-card">
              <span className="result-trophy">{phase === "won" ? "🏆" : "😬"}</span>
              <div className="result-title">{phase === "won" ? "LINGO!" : "UNLUCKY!"}</div>
              {phase === "won" ? (
                <>
                  <div className="result-word">Solved in <strong>{guesses.length}</strong> {guesses.length === 1 ? "guess" : "guesses"}</div>
                  <div className="result-sub">Win streak: {stats.streak} 🔥</div>
                </>
              ) : (
                <>
                  <div className="result-word">The word was <strong>{answer}</strong></div>
                  <div className="result-sub">Better luck next time!</div>
                </>
              )}
              <button className="play-again" onClick={reset}>PLAY AGAIN</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
