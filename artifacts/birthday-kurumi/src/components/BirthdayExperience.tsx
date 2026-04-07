import { useState, useEffect, useRef, useCallback } from "react";
import "./birthday.css";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase =
  | "opening"
  | "countdown"
  | "freeze"
  | "reveal"
  | "letter"
  | "interactive"
  | "dial"
  | "finale";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BIRTHDAY = new Date("2026-04-07T00:00:00");
const HER_NAME = "Amna";

// ─── Countdown Logic ──────────────────────────────────────────────────────────
function getTimeLeft() {
  const now = new Date();
  const diff = BIRTHDAY.getTime() - now.getTime();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: false,
  };
}

// ─── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 45, active = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setDisplayed(""); setDone(false); return; }
    setDisplayed(""); setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return { displayed, done };
}

// ─── Particle Canvas ──────────────────────────────────────────────────────────
function ParticleCanvas({ phase }: { phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const isCelebration = phase === "reveal" || phase === "finale";
    const colors = isCelebration
      ? ["#cc88ff", "#ff88dd", "#ffffff", "#ffaaff", "#aa66ff", "#ffccff"]
      : ["#9955cc", "#cc77ee", "#ffffff", "#7733aa", "#ffaaee"];
    const count = isCelebration ? 90 : 45;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas?.width ?? 800),
      y: Math.random() * (canvas?.height ?? 600),
      vx: (Math.random() - 0.5) * (isCelebration ? 1.6 : 0.5),
      vy: -Math.random() * (isCelebration ? 2 : 0.7) - 0.2,
      size: Math.random() * (isCelebration ? 10 : 5) + 2,
      alpha: Math.random() * 0.8 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      type: Math.floor(Math.random() * 3), // 0=circle, 1=star, 2=heart
    }));
    let raf: number;
    function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const b = (i * 4 * Math.PI) / 5 + (2 * Math.PI) / 5 - Math.PI / 2;
        ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        ctx.lineTo(x + (r / 2) * Math.cos(b), y + (r / 2) * Math.sin(b));
      }
      ctx.closePath();
      ctx.fill();
    }
    function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.3);
      ctx.bezierCurveTo(x, y, x - s, y, x - s, y + s * 0.5);
      ctx.bezierCurveTo(x - s, y + s, x, y + s * 1.3, x, y + s * 1.6);
      ctx.bezierCurveTo(x, y + s * 1.3, x + s, y + s, x + s, y + s * 0.5);
      ctx.bezierCurveTo(x + s, y, x, y, x, y + s * 0.3);
      ctx.fill();
    }
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.type === 1) drawStar(ctx, p.x, p.y, p.size);
        else if (p.type === 2) drawHeart(ctx, p.x, p.y, p.size / 2);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.0012;
        if (p.alpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 20;
          p.alpha = Math.random() * 0.8 + 0.2;
        }
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [phase]);
  return <canvas ref={canvasRef} className="bd-particles" />;
}

// ─── Cursor Trail ─────────────────────────────────────────────────────────────
function CursorTrail() {
  const trailRef = useRef<{ x: number; y: number; alpha: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      trailRef.current.push({ x: e.clientX, y: e.clientY, alpha: 1 });
      if (trailRef.current.length > 28) trailRef.current.shift();
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < trailRef.current.length; i++) {
        const p = trailRef.current[i]!;
        const t = i / trailRef.current.length;
        const size = t * 10 + 1;
        ctx.save();
        ctx.globalAlpha = p.alpha * t;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
        grad.addColorStop(0, "#cc66ff");
        grad.addColorStop(0.5, "#ff88cc");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.alpha -= 0.045;
      }
      trailRef.current = trailRef.current.filter((p) => p.alpha > 0);
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="bd-cursor-trail" />;
}

// ─── Kuromi SVG Character ──────────────────────────────────────────────────────
function KuromiCharacter({ size = 220, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <div className={`bd-kuromi-wrap ${animate ? "bd-kuromi-bounce" : ""}`} style={{ width: size, height: size * 1.1 }}>
      <svg width={size} height={size * 1.1} viewBox="0 0 200 220" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="100" cy="175" rx="52" ry="38" fill="#ffffff" />
        {/* Arms */}
        <ellipse cx="52" cy="168" rx="18" ry="11" fill="#ffffff" transform="rotate(-20 52 168)" />
        <ellipse cx="148" cy="168" rx="18" ry="11" fill="#ffffff" transform="rotate(20 148 168)" />
        {/* Legs */}
        <ellipse cx="82" cy="207" rx="13" ry="8" fill="#ffffff" />
        <ellipse cx="118" cy="207" rx="13" ry="8" fill="#ffffff" />
        {/* Head */}
        <ellipse cx="100" cy="105" rx="58" ry="54" fill="#ffffff" />
        {/* Jester hat — main black */}
        <path d="M42,90 Q45,30 100,18 Q155,30 158,90 Q130,75 100,72 Q70,75 42,90 Z" fill="#1a0030" />
        {/* Hat left flap */}
        <path d="M42,90 Q35,55 58,30 Q65,68 85,78 Q62,80 42,90 Z" fill="#1a0030" />
        {/* Hat right flap */}
        <path d="M158,90 Q165,55 142,30 Q135,68 115,78 Q138,80 158,90 Z" fill="#1a0030" />
        {/* Hat top ball */}
        <circle cx="100" cy="15" r="12" fill="#1a0030" />
        {/* Pink skull on hat */}
        <ellipse cx="100" cy="52" rx="13" ry="11" fill="#ff88cc" />
        <ellipse cx="100" cy="59" rx="8" ry="5" fill="#ff88cc" />
        <circle cx="96" cy="51" r="2.5" fill="#1a0030" />
        <circle cx="104" cy="51" r="2.5" fill="#1a0030" />
        <path d="M97,58 L100,55 L103,58" stroke="#1a0030" strokeWidth="1" fill="none" />
        {/* Ears (small bunny ears under hat) */}
        <ellipse cx="68" cy="78" rx="8" ry="14" fill="#1a0030" />
        <ellipse cx="132" cy="78" rx="8" ry="14" fill="#1a0030" />
        {/* Face — eyes */}
        <ellipse cx="84" cy="108" rx="11" ry="12" fill="#1a0030" />
        <ellipse cx="116" cy="108" rx="11" ry="12" fill="#1a0030" />
        <circle cx="87" cy="105" r="3.5" fill="#ffffff" />
        <circle cx="119" cy="105" r="3.5" fill="#ffffff" />
        {/* Nose */}
        <ellipse cx="100" cy="120" rx="4" ry="3" fill="#ff88cc" />
        {/* Smile */}
        <path d="M88,128 Q100,138 112,128" stroke="#1a0030" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Cheeks */}
        <ellipse cx="74" cy="122" rx="9" ry="6" fill="#ffb3e0" opacity="0.6" />
        <ellipse cx="126" cy="122" rx="9" ry="6" fill="#ffb3e0" opacity="0.6" />
        {/* Collar bow */}
        <path d="M88,148 L100,155 L112,148 L100,143 Z" fill="#cc44cc" />
        <circle cx="100" cy="150" r="4" fill="#ff88cc" />
        {/* Body outline */}
        <ellipse cx="100" cy="175" rx="52" ry="38" stroke="#e0d0ff" strokeWidth="1.5" fill="none" />
        {/* Stars around */}
        <text x="20" y="90" fontSize="14" fill="#cc88ff" opacity="0.8">✦</text>
        <text x="168" y="85" fontSize="12" fill="#ff88dd" opacity="0.8">✦</text>
        <text x="30" y="140" fontSize="10" fill="#ffccff" opacity="0.7">⋆</text>
        <text x="162" y="145" fontSize="10" fill="#cc88ff" opacity="0.7">⋆</text>
      </svg>
    </div>
  );
}

// ─── Star background ──────────────────────────────────────────────────────────
function StarBg() {
  return (
    <div className="bd-star-bg">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="bd-star"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${Math.random() * 3 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Opening Phase ────────────────────────────────────────────────────────────
const openingLines = [
  "Once upon a time…",
  "In a world full of ordinary days…",
  `There was someone extraordinary…`,
  `Her name was ${HER_NAME} 🌸`,
];

function OpeningPhase({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showKuromi, setShowKuromi] = useState(false);
  const [fading, setFading] = useState(false);
  const { displayed, done } = useTypewriter(openingLines[lineIdx] ?? "", 55, lineIdx < openingLines.length);

  useEffect(() => {
    if (!done) return;
    if (lineIdx === 2) {
      setTimeout(() => setShowKuromi(true), 400);
      setTimeout(() => setLineIdx(3), 1200);
    } else if (lineIdx < openingLines.length - 1) {
      const t = setTimeout(() => setLineIdx((i) => i + 1), 1800);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setFading(true); setTimeout(onDone, 1200); }, 2400);
      return () => clearTimeout(t);
    }
  }, [done, lineIdx, onDone]);

  return (
    <div className="bd-phase" style={{ opacity: fading ? 0 : 1, transition: "opacity 1.2s ease" }}>
      <div className="bd-kuromi-pop" style={{ opacity: showKuromi ? 1 : 0, transform: showKuromi ? "scale(1) translateY(0)" : "scale(0.4) translateY(40px)", transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <KuromiCharacter size={180} animate />
      </div>
      <div className="bd-opening-text-wrap">
        <p className="bd-opening-text" style={{
          color: lineIdx === openingLines.length - 1 ? "#ff88dd" : "#e8d4ff",
          fontSize: lineIdx === openingLines.length - 1 ? "2.2rem" : "1.5rem",
        }}>
          {displayed}<span className="bd-cursor">|</span>
        </p>
      </div>
    </div>
  );
}

// ─── Countdown Phase ──────────────────────────────────────────────────────────
function CountdownPhase({ onDone }: { onDone: () => void }) {
  const [tl, setTl] = useState(getTimeLeft());
  const [fading, setFading] = useState(false);
  const pad = (n: number) => String(n).padStart(2, "0");

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft();
      setTl(t);
      if (t.done) { clearInterval(id); setFading(true); setTimeout(onDone, 1500); }
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="bd-phase" style={{ opacity: fading ? 0 : 1, transition: "opacity 1.5s ease" }}>
      <KuromiCharacter size={130} animate />
      <p className="bd-cd-label">Kuromi counted every second just for you, {HER_NAME}~</p>
      <div className="bd-cd-grid">
        {[{ l: "Days", v: tl.days }, { l: "Hours", v: tl.hours }, { l: "Minutes", v: tl.minutes }, { l: "Seconds", v: tl.seconds }].map(({ l, v }) => (
          <div key={l} className="bd-cd-unit">
            <div className="bd-cd-num">{pad(v)}</div>
            <div className="bd-cd-label-sm">{l}</div>
          </div>
        ))}
      </div>
      <p className="bd-cd-sub">Because you deserve to be celebrated every moment~ ♡</p>
      {tl.done && <p className="bd-cd-now">The moment is here! ✨</p>}
    </div>
  );
}

// ─── Freeze Phase ─────────────────────────────────────────────────────────────
function FreezePhase({ onDone }: { onDone: () => void }) {
  const [sparkles, setSparkles] = useState(false);
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    setTimeout(() => setSparkles(true), 600);
    setTimeout(() => setShow(true), 1000);
    setTimeout(() => { setFading(true); setTimeout(onDone, 900); }, 3200);
  }, [onDone]);
  return (
    <div className="bd-phase bd-freeze-purple" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.9s ease" }}>
      {sparkles && (
        <div className="bd-sparkle-burst">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="bd-sparkle-ray" style={{ transform: `rotate(${i * 22.5}deg)`, animationDelay: `${i * 0.04}s` }} />
          ))}
        </div>
      )}
      {show && <p className="bd-freeze-text">✨ Time to celebrate, {HER_NAME}! ✨</p>}
    </div>
  );
}

// ─── Reveal Phase ─────────────────────────────────────────────────────────────
function RevealPhase({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setStep(1), 500), setTimeout(() => setStep(2), 2200), setTimeout(onDone, 7500)];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className="bd-phase">
      <div style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.4)", transition: "all 1s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <KuromiCharacter size={160} animate />
        <h1 className="bd-birthday-title">HAPPY BIRTHDAY!</h1>
        <h1 className="bd-birthday-sub">{HER_NAME} 🎀</h1>
      </div>
      <div className="bd-reveal-lines" style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(30px)", transition: "all 1s ease 0.4s" }}>
        <p className="bd-reveal-line">Today the whole world shines a little brighter…</p>
        <p className="bd-reveal-line bd-purple">Because YOU are in it~ 💜</p>
      </div>
      {step >= 2 && <button className="bd-btn bd-btn-outline" onClick={onDone}>Continue ♡</button>}
    </div>
  );
}

// ─── Love Letter Phase ────────────────────────────────────────────────────────
const letterLines = [
  `Dear ${HER_NAME}…`,
  "You make every ordinary day feel magical.",
  "Your smile is my favourite thing in the whole world.",
  "I hope today is as wonderful as you are.",
  "I love you more than Kuromi loves mischief~ 💜",
];

function LoveLetterPhase({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState<string[]>([]);
  const { displayed, done } = useTypewriter(letterLines[idx] ?? "", 40, idx < letterLines.length);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setShown((p) => [...p, letterLines[idx]!]);
      if (idx < letterLines.length - 1) setIdx((i) => i + 1);
    }, 900);
    return () => clearTimeout(t);
  }, [done, idx]);

  const finished = idx >= letterLines.length - 1 && done && shown.length === letterLines.length;
  return (
    <div className="bd-phase">
      <KuromiCharacter size={100} animate />
      <div className="bd-letter-card">
        <div className="bd-letter-inner">
          {shown.map((line, i) => <p key={i} className="bd-letter-line" style={{ color: i === 0 ? "#cc88ff" : "#e8d4ff" }}>{line}</p>)}
          {idx < letterLines.length && (
            <p className="bd-letter-line">{displayed}<span className="bd-cursor">|</span></p>
          )}
        </div>
      </div>
      {finished && <button className="bd-btn bd-btn-outline" onClick={onDone}>Open your gifts 🎁</button>}
    </div>
  );
}

// ─── Interactive Phase ────────────────────────────────────────────────────────
const memories = [
  { label: "The first time you smiled at me 🌸", msg: "That smile changed everything…" },
  { label: "Your laugh 🌟", msg: "Your laugh is the best sound in the universe." },
  { label: "Every hug 🤗", msg: "I never want to let go." },
  { label: "Late night chats 🌙", msg: "I would stay up forever just to talk to you." },
  { label: "Our future 🦋", msg: "I can't wait to make more memories with you." },
];

function InteractivePhase({ onDone }: { onDone: () => void }) {
  const [giftOpen, setGiftOpen] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [love, setLove] = useState<"yes" | "no" | null>(null);
  const [memIdx, setMemIdx] = useState(0);

  return (
    <div className="bd-phase bd-interactive">
      <h2 className="bd-section-title">Gifts for {HER_NAME} 🎀</h2>
      <div className="bd-gift-grid">
        <div className="bd-gift-card">
          <div className="bd-gift-card-title">A Special Gift 🎁</div>
          {!giftOpen
            ? <button className="bd-btn bd-btn-primary" onClick={() => setGiftOpen(true)}>🎁 Open me!</button>
            : <p className="bd-gift-msg bd-fade-in">"You are the greatest gift life ever gave me. Happy Birthday, {HER_NAME}~ 💜"</p>}
        </div>
        <div className="bd-gift-card">
          <div className="bd-gift-card-title">Our Memories 🌸</div>
          <div className="bd-memory-box">
            <p className="bd-memory-label">{memories[memIdx]!.label}</p>
            <p className="bd-memory-msg">{memories[memIdx]!.msg}</p>
            <div className="bd-mem-nav">
              <button className="bd-mem-btn" onClick={() => setMemIdx((i) => Math.max(0, i - 1))}>←</button>
              <button className="bd-mem-btn" onClick={() => setMemIdx((i) => Math.min(memories.length - 1, i + 1))}>→</button>
            </div>
            <div className="bd-dots">
              {memories.map((_, i) => <div key={i} className="bd-dot" style={{ background: i === memIdx ? "#cc66ff" : "#6633aa" }} />)}
            </div>
          </div>
        </div>
        <div className="bd-gift-card bd-love-card">
          <div className="bd-gift-card-title">Do you love me? 💜</div>
          {love === null ? (
            <div className="bd-love-btns">
              <button className="bd-btn bd-btn-primary bd-love-yes" onClick={() => setLove("yes")}>YES 💜</button>
              <button
                className="bd-love-no"
                style={{ transform: `translate(${noPos.x}px,${noPos.y}px)` }}
                onMouseEnter={() => setNoPos({ x: (Math.random() - 0.5) * 280, y: (Math.random() - 0.5) * 180 })}
                onClick={() => setLove("no")}
              >no...</button>
            </div>
          ) : (
            <p className="bd-love-answer bd-fade-in">
              {love === "yes" ? `I knew it! I love you so much, ${HER_NAME}~ 💜` : "Kuromi says you can't escape the love! 🖤💜"}
            </p>
          )}
        </div>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>The Wish Dial awaits ✨</button>
    </div>
  );
}

// ─── Dial Phase ───────────────────────────────────────────────────────────────
const dialMsgs = [
  { type: "wish",      text: "I wish you endless happiness, always~ 🌸" },
  { type: "compliment", text: "You are the most beautiful soul I've ever known 💜" },
  { type: "promise",   text: "I promise to always be by your side 🤝" },
  { type: "wish",      text: "May every dream you have come true ✨" },
  { type: "compliment", text: "Your kindness lights up every room 🌟" },
  { type: "promise",   text: "I will choose you, in every universe 🌙" },
  { type: "wish",      text: "I wish you a year full of magic and love 🎀" },
  { type: "compliment", text: "You are everything and more, {HER_NAME} 💖" },
];

const typeColor: Record<string, string> = { wish: "#ff88dd", compliment: "#cc88ff", promise: "#88aaff" };

function DialPhase({ onDone }: { onDone: () => void }) {
  const [angle, setAngle] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const dialRef = useRef<HTMLDivElement>(null);

  const getA = (e: React.MouseEvent | React.TouchEvent) => {
    const el = dialRef.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const { clientX, clientY } = "touches" in e ? e.touches[0]! : e;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };
  const onStart = (e: React.MouseEvent | React.TouchEvent) => { setDragging(true); setLastAngle(getA(e)); };
  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const curr = getA(e);
    const delta = curr - lastAngle;
    setAngle((a) => { const next = a + delta; setMsgIdx(Math.abs(Math.round(next / 45)) % dialMsgs.length); return next; });
    setLastAngle(curr);
  }, [dragging, lastAngle]);
  const onEnd = () => setDragging(false);

  const msg = dialMsgs[msgIdx]!;
  return (
    <div className="bd-phase">
      <h2 className="bd-section-title">Kuromi's Wish Dial 🌙</h2>
      <p className="bd-dial-hint">Drag the dial to reveal wishes for {HER_NAME}~</p>
      <div ref={dialRef} className="bd-dial" onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div className="bd-dial-inner" style={{ transform: `rotate(${angle}deg)` }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <div key={i} className="bd-dial-tick" style={{ left: `calc(50% + ${Math.cos(a) * 90}px - 4px)`, top: `calc(50% + ${Math.sin(a) * 90}px - 4px)`, width: i % 3 === 0 ? 8 : 4, height: i % 3 === 0 ? 8 : 4, background: i % 3 === 0 ? "#cc66ff" : "#6633aa" }} />;
          })}
          <div className="bd-dial-center" />
        </div>
        <div className="bd-dial-pointer" />
      </div>
      <div className="bd-dial-msg">
        <div className="bd-dial-type" style={{ color: typeColor[msg.type] }}>
          {msg.type === "wish" ? "✦ Wish" : msg.type === "compliment" ? "✦ Compliment" : "✦ Promise"}
        </div>
        <p className="bd-dial-text">{msg.text.replace("{HER_NAME}", HER_NAME)}</p>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>The grand finale ✨</button>
    </div>
  );
}

// ─── Finale Phase ─────────────────────────────────────────────────────────────
const finaleLines = [
  "In every world…",
  "In every story…",
  `You are my favourite chapter, ${HER_NAME}…`,
  "",
  `Happy Birthday 💜🎀`,
];

function FinalePhase() {
  const [step, setStep] = useState(0);
  useEffect(() => { finaleLines.forEach((_, i) => setTimeout(() => setStep(i + 1), i * 2000 + 600)); }, []);
  return (
    <div className="bd-phase">
      <KuromiCharacter size={170} animate />
      <div className="bd-finale-lines">
        {finaleLines.map((line, i) => (
          <p key={i} className="bd-finale-line" style={{
            opacity: step > i ? 1 : 0,
            transform: step > i ? "translateY(0)" : "translateY(20px)",
            transition: "all 1.4s ease",
            color: i === 4 ? "#ff88dd" : "#e8d4ff",
            fontSize: i === 4 ? "2.4rem" : i === 2 ? "1.4rem" : "1.5rem",
            fontWeight: i === 4 ? 700 : 300,
            marginBottom: i === 3 ? "1rem" : "0.3rem",
          }}>{line}</p>
        ))}
      </div>
      {step > 4 && (
        <div className="bd-finale-emojis">
          {["💜","🎀","🌸","✨","💖","⭐","🦋"].map((e, i) => (
            <span key={i} className="bd-finale-emoji" style={{ animationDelay: `${i * 0.18}s` }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const PHASES: Phase[] = ["opening","countdown","freeze","reveal","letter","interactive","dial","finale"];
const LABELS: Record<Phase, string> = { opening:"Opening", countdown:"Countdown", freeze:"Sparkle", reveal:"Birthday", letter:"Love Letter", interactive:"Gifts", dial:"Wish Dial", finale:"Finale" };

function NavBar({ current, onJump }: { current: Phase; onJump: (p: Phase) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bd-nav">
      <button className="bd-nav-toggle" onClick={() => setOpen((o) => !o)}>☰</button>
      {open && (
        <div className="bd-nav-menu">
          {PHASES.map((p) => (
            <button key={p} className="bd-nav-item" style={{ color: p === current ? "#cc66ff" : "#e8d4ff" }} onClick={() => { onJump(p); setOpen(false); }}>{LABELS[p]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Easter Egg ───────────────────────────────────────────────────────────────
function EasterEgg() {
  const [found, setFound] = useState(false);
  const seq = useRef<string[]>([]);
  const CODE = ["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight"];
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      seq.current = [...seq.current, e.key].slice(-6);
      if (seq.current.join(",") === CODE.join(",")) setFound(true);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  if (!found) return null;
  return (
    <div className="bd-easter-overlay">
      <div className="bd-easter-box">
        <KuromiCharacter size={120} animate />
        <p className="bd-easter-title">Secret Unlocked~ 🖤💜</p>
        <p className="bd-easter-msg">"{HER_NAME}, you found the secret message! You are magic, and I love you more than words can say~ 💜"</p>
        <button className="bd-btn bd-btn-outline" onClick={() => setFound(false)}>Close ✕</button>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export function BirthdayExperience() {
  const [phase, setPhase] = useState<Phase>("opening");
  const next = useCallback((p: Phase) => {
    const i = PHASES.indexOf(p);
    if (i < PHASES.length - 1) setPhase(PHASES[i + 1]!);
  }, []);

  return (
    <div className="bd-root">
      <CursorTrail />
      <StarBg />
      <ParticleCanvas phase={phase} />
      <EasterEgg />
      <NavBar current={phase} onJump={setPhase} />
      {phase === "opening"     && <OpeningPhase     onDone={() => next("opening")} />}
      {phase === "countdown"   && <CountdownPhase   onDone={() => next("countdown")} />}
      {phase === "freeze"      && <FreezePhase      onDone={() => next("freeze")} />}
      {phase === "reveal"      && <RevealPhase      onDone={() => next("reveal")} />}
      {phase === "letter"      && <LoveLetterPhase  onDone={() => next("letter")} />}
      {phase === "interactive" && <InteractivePhase onDone={() => next("interactive")} />}
      {phase === "dial"        && <DialPhase        onDone={() => next("dial")} />}
      {phase === "finale"      && <FinalePhase />}
    </div>
  );
}
