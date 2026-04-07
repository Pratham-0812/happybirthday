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

// ─── CONFIG — edit these to personalize ──────────────────────────────────────
const BIRTHDAY = new Date("2026-04-07T00:00:00"); // ← change to real birthday
const HER_NAME = "My Love"; // ← change to her name

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
    setDisplayed("");
    setDone(false);
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
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const isWarm = phase === "reveal" || phase === "finale";
    const colors = isWarm
      ? ["#ff2244", "#ff6688", "#ffd700", "#ff4466", "#ffffff"]
      : ["#8b0000", "#cc2233", "#ffd700", "#330000"];
    const count = isWarm ? 80 : 40;

    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * (isWarm ? 1.5 : 0.4),
      vy: -Math.random() * (isWarm ? 1.8 : 0.6) - 0.2,
      size: Math.random() * (isWarm ? 12 : 5) + 2,
      alpha: Math.random() * 0.7 + 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      isHeart: isWarm && Math.random() > 0.5,
    }));

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.isHeart) {
          const s = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y + s * 0.3);
          ctx.bezierCurveTo(p.x, p.y, p.x - s, p.y, p.x - s, p.y + s * 0.5);
          ctx.bezierCurveTo(p.x - s, p.y + s, p.x, p.y + s * 1.3, p.x, p.y + s * 1.6);
          ctx.bezierCurveTo(p.x, p.y + s * 1.3, p.x + s, p.y + s, p.x + s, p.y + s * 0.5);
          ctx.bezierCurveTo(p.x + s, p.y, p.x, p.y, p.x, p.y + s * 0.3);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.0015;
        if (p.alpha <= 0) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + 20;
          p.alpha = Math.random() * 0.7 + 0.3;
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
      if (trailRef.current.length > 30) trailRef.current.shift();
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < trailRef.current.length; i++) {
        const p = trailRef.current[i];
        const size = (i / trailRef.current.length) * 8 + 1;
        ctx.save();
        ctx.globalAlpha = p.alpha * (i / trailRef.current.length);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
        grad.addColorStop(0, "#ff2244");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        p.alpha -= 0.04;
      }
      trailRef.current = trailRef.current.filter((p) => p.alpha > 0);
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="bd-cursor-trail" />;
}

// ─── Clock Gear Background ────────────────────────────────────────────────────
function GearBg() {
  return (
    <div className="bd-gear-bg">
      <svg className="bd-gear-spin" width="600" height="600" viewBox="0 0 200 200" fill="none" style={{ color: "#8b0000" }}>
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="4" fill="none" />
        <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="3" fill="none" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return <line key={i} x1={100 + 72 * Math.cos(a)} y1={100 + 72 * Math.sin(a)} x2={100 + 90 * Math.cos(a)} y2={100 + 90 * Math.sin(a)} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />;
        })}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          return <line key={i} x1={100 + 68 * Math.cos(a)} y1={100 + 68 * Math.sin(a)} x2={100 + 72 * Math.cos(a)} y2={100 + 72 * Math.sin(a)} stroke="currentColor" strokeWidth="1.5" />;
        })}
      </svg>
      <svg className="bd-gear-reverse" width="280" height="280" viewBox="0 0 200 200" fill="none" style={{ color: "#ffd700" }}>
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="3" fill="none" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return <line key={i} x1={100 + 62 * Math.cos(a)} y1={100 + 62 * Math.sin(a)} x2={100 + 78 * Math.cos(a)} y2={100 + 78 * Math.sin(a)} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
}

// ─── Kurumi Eye ───────────────────────────────────────────────────────────────
function KurumiEye({ visible }: { visible: boolean }) {
  return (
    <div className="bd-eye-wrap" style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.3)" }}>
      <div className="bd-eye-glow" />
      <svg width="140" height="90" viewBox="0 0 120 80">
        <ellipse cx="60" cy="40" rx="58" ry="38" fill="#0a0000" stroke="#cc0022" strokeWidth="2" />
        <ellipse cx="60" cy="40" rx="35" ry="35" fill="#8b0000" />
        <ellipse cx="60" cy="40" rx="20" ry="20" fill="#cc1133" />
        <ellipse cx="60" cy="40" rx="10" ry="10" fill="#000" />
        <circle cx="52" cy="34" r="4" fill="#ffffff" opacity="0.9" />
        <circle cx="67" cy="44" r="2" fill="#ffffff" opacity="0.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          return <line key={i} x1={60 + 10 * Math.cos(a)} y1={40 + 10 * Math.sin(a)} x2={60 + 35 * Math.cos(a)} y2={40 + 35 * Math.sin(a)} stroke="#ff2244" strokeWidth="0.8" opacity="0.6" />;
        })}
      </svg>
    </div>
  );
}

// ─── Opening Phase ────────────────────────────────────────────────────────────
const openingLines = [
  "In a world full of moments…",
  "There was one moment…",
  "That changed everything…",
  `The moment I found you…`,
];

function OpeningPhase({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showEye, setShowEye] = useState(false);
  const [fading, setFading] = useState(false);
  const { displayed, done } = useTypewriter(openingLines[lineIdx] ?? "", 55, lineIdx < openingLines.length);

  useEffect(() => {
    if (!done) return;
    if (lineIdx === 2) {
      setTimeout(() => setShowEye(true), 500);
      setTimeout(() => setLineIdx(3), 1400);
    } else if (lineIdx < openingLines.length - 1) {
      const t = setTimeout(() => setLineIdx((i) => i + 1), 1800);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setFading(true); setTimeout(onDone, 1200); }, 2200);
      return () => clearTimeout(t);
    }
  }, [done, lineIdx, onDone]);

  return (
    <div className="bd-phase" style={{ opacity: fading ? 0 : 1, transition: "opacity 1.2s ease" }}>
      <KurumiEye visible={showEye} />
      <div className="bd-opening-text-wrap">
        <p className="bd-opening-text" style={{
          color: lineIdx === openingLines.length - 1 ? "#ff2244" : "#e8c8c8",
          fontSize: lineIdx === openingLines.length - 1 ? "2rem" : "1.5rem",
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
      <p className="bd-cd-label">I counted every second… just to celebrate you.</p>
      <div className="bd-cd-grid">
        {[{ l: "Days", v: tl.days }, { l: "Hours", v: tl.hours }, { l: "Minutes", v: tl.minutes }, { l: "Seconds", v: tl.seconds }].map(({ l, v }) => (
          <div key={l} className="bd-cd-unit">
            <div className="bd-cd-num">{pad(v)}</div>
            <div className="bd-cd-label-sm">{l}</div>
          </div>
        ))}
      </div>
      <p className="bd-cd-sub">Because you are worth every moment of my life.</p>
      {tl.done && <p className="bd-cd-now">The moment is here…</p>}
    </div>
  );
}

// ─── Freeze Phase ─────────────────────────────────────────────────────────────
function FreezePhase({ onDone }: { onDone: () => void }) {
  const [cracked, setCracked] = useState(false);
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    setTimeout(() => setCracked(true), 800);
    setTimeout(() => setShow(true), 1200);
    setTimeout(() => { setFading(true); setTimeout(onDone, 1000); }, 3500);
  }, [onDone]);

  return (
    <div className="bd-phase bd-freeze" style={{ opacity: fading ? 0 : 1, transition: "opacity 1s ease" }}>
      {cracked && (
        <svg className="bd-cracks" viewBox="0 0 800 600" preserveAspectRatio="none">
          {["M400,300 L320,180 L280,100","M400,300 L480,160 L520,80","M400,300 L200,320 L100,280","M400,300 L600,340 L720,300","M400,300 L350,450 L320,550","M400,300 L460,480 L490,580"].map((d, i) => (
            <path key={i} d={d} stroke="#cc0022" strokeWidth="1.5" fill="none" opacity="0.7"
              style={{ animation: `bd-crack-in 0.3s ${i * 0.08}s both ease-out` }} />
          ))}
        </svg>
      )}
      {show && <p className="bd-freeze-text">And now… time belongs to you.</p>}
    </div>
  );
}

// ─── Reveal Phase ─────────────────────────────────────────────────────────────
function RevealPhase({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setStep(1), 600), setTimeout(() => setStep(2), 2500), setTimeout(onDone, 7000)];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="bd-phase">
      <div style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.5)", transition: "all 1s ease" }}>
        <h1 className="bd-birthday-title">HAPPY 18TH BIRTHDAY</h1>
        <h1 className="bd-birthday-sub">{HER_NAME} ❤️</h1>
      </div>
      <div className="bd-reveal-lines" style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(30px)", transition: "all 1s ease 0.5s" }}>
        <p className="bd-reveal-line">Today isn't just your birthday…</p>
        <p className="bd-reveal-line bd-gold">It's the day the world became more beautiful.</p>
      </div>
      {step >= 2 && <button className="bd-btn bd-btn-outline" onClick={onDone}>Continue the story →</button>}
    </div>
  );
}

// ─── Love Letter Phase ────────────────────────────────────────────────────────
const letterLines = [
  "I don't know how to explain what you are to me…",
  "But somehow… everything feels right when you're here.",
  "You are my peace… my chaos… my home…",
  "And if I had to live my life again…",
  "I would find you… every single time.",
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
      <div className="bd-letter-card">
        <div className="bd-letter-inner">
          {shown.map((line, i) => <p key={i} className="bd-letter-line">{line}</p>)}
          {idx < letterLines.length && (
            <p className="bd-letter-line">{displayed}<span className="bd-cursor">|</span></p>
          )}
        </div>
      </div>
      {finished && <button className="bd-btn bd-btn-outline" onClick={onDone}>Open your gifts →</button>}
    </div>
  );
}

// ─── Interactive Phase ────────────────────────────────────────────────────────
const memories = [
  { label: "Our first hello 🌸", msg: "Every great story starts with a single moment…" },
  { label: "The way you laugh 😊", msg: "Your laugh is my favorite sound in the world." },
  { label: "When you held my hand 🤝", msg: "Time stopped when our fingers intertwined." },
  { label: "Late night talks 🌙", msg: "I would trade every sleep for a night talking to you." },
  { label: "The future 🌟", msg: "I can't wait to build every tomorrow with you." },
];

function InteractivePhase({ onDone }: { onDone: () => void }) {
  const [giftOpen, setGiftOpen] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [love, setLove] = useState<"yes" | "no" | null>(null);
  const [memIdx, setMemIdx] = useState(0);

  return (
    <div className="bd-phase bd-interactive">
      <h2 className="bd-section-title">Gifts for You 🎁</h2>
      <div className="bd-gift-grid">
        {/* Gift */}
        <div className="bd-gift-card">
          <div className="bd-gift-card-title">Open Your Gift 💝</div>
          {!giftOpen
            ? <button className="bd-btn bd-btn-primary" onClick={() => setGiftOpen(true)}>🎁 Tap to open</button>
            : <p className="bd-gift-msg bd-fade-in">"You are the best thing that ever happened to me."</p>
          }
        </div>
        {/* Memories */}
        <div className="bd-gift-card">
          <div className="bd-gift-card-title">Our Memories 📸</div>
          <div className="bd-memory-box">
            <p className="bd-memory-label">{memories[memIdx]!.label}</p>
            <p className="bd-memory-msg">{memories[memIdx]!.msg}</p>
            <div className="bd-mem-nav">
              <button className="bd-mem-btn" onClick={() => setMemIdx((i) => Math.max(0, i - 1))}>←</button>
              <button className="bd-mem-btn" onClick={() => setMemIdx((i) => Math.min(memories.length - 1, i + 1))}>→</button>
            </div>
            <div className="bd-dots">
              {memories.map((_, i) => <div key={i} className="bd-dot" style={{ background: i === memIdx ? "#ff2244" : "#440011" }} />)}
            </div>
          </div>
        </div>
        {/* Love */}
        <div className="bd-gift-card bd-love-card">
          <div className="bd-gift-card-title">Do you love me? ❤️</div>
          {love === null ? (
            <div className="bd-love-btns">
              <button className="bd-btn bd-btn-primary bd-love-yes" onClick={() => setLove("yes")}>YES ❤️</button>
              <button
                className="bd-love-no"
                style={{ transform: `translate(${noPos.x}px,${noPos.y}px)` }}
                onMouseEnter={() => setNoPos({ x: (Math.random() - 0.5) * 300, y: (Math.random() - 0.5) * 200 })}
                onClick={() => setLove("no")}
              >no...</button>
            </div>
          ) : (
            <p className="bd-love-answer bd-fade-in">
              {love === "yes" ? "I knew it… I love you too, forever. ❤️" : "You can't escape this love~ 💕"}
            </p>
          )}
        </div>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>The Time Dial awaits →</button>
    </div>
  );
}

// ─── Dial Phase ───────────────────────────────────────────────────────────────
const dialMsgs = [
  { type: "memory", text: "The first time I smiled because of you…" },
  { type: "compliment", text: "The way you make everything better…" },
  { type: "promise", text: "I promise to always stay…" },
  { type: "memory", text: "Every moment I've spent with you is precious…" },
  { type: "compliment", text: "You are the most beautiful soul I've ever known…" },
  { type: "promise", text: "I will always choose you, in every timeline…" },
  { type: "memory", text: "The warmth of your presence fills every silence…" },
  { type: "compliment", text: "You light up every room just by existing…" },
];

const typeColor: Record<string, string> = { memory: "#ff6688", compliment: "#ffd700", promise: "#cc99ff" };

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
      <h2 className="bd-section-title">Kurumi Time Dial 🕰️</h2>
      <p className="bd-dial-hint">Drag the clock to reveal secrets…</p>
      <div ref={dialRef} className="bd-dial" onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}>
        <div className="bd-dial-inner" style={{ transform: `rotate(${angle}deg)` }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <div key={i} className="bd-dial-tick" style={{ left: `calc(50% + ${Math.cos(a) * 90}px - 4px)`, top: `calc(50% + ${Math.sin(a) * 90}px - 4px)`, width: i % 3 === 0 ? 8 : 4, height: i % 3 === 0 ? 8 : 4, background: i % 3 === 0 ? "#cc0022" : "#440011" }} />;
          })}
          <div className="bd-dial-center" />
        </div>
        <div className="bd-dial-pointer" />
      </div>
      <div className="bd-dial-msg">
        <div className="bd-dial-type" style={{ color: typeColor[msg.type] }}>
          {msg.type === "memory" ? "✦ Memory" : msg.type === "compliment" ? "✦ Compliment" : "✦ Promise"}
        </div>
        <p className="bd-dial-text">{msg.text}</p>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>To the finale →</button>
    </div>
  );
}

// ─── Finale Phase ─────────────────────────────────────────────────────────────
const finaleLines = ["In every timeline…", "In every universe…", "I would still choose you…", "", `Happy 18th Birthday ❤️`];

function FinalePhase() {
  const [step, setStep] = useState(0);
  useEffect(() => { finaleLines.forEach((_, i) => setTimeout(() => setStep(i + 1), i * 2000 + 800)); }, []);
  return (
    <div className="bd-phase">
      <div className="bd-finale-lines">
        {finaleLines.map((line, i) => (
          <p key={i} className="bd-finale-line" style={{
            opacity: step > i ? 1 : 0,
            transform: step > i ? "translateY(0)" : "translateY(20px)",
            transition: "all 1.5s ease",
            color: i === 4 ? "#ff2244" : "#e8c8c8",
            fontSize: i === 4 ? "2.5rem" : "1.6rem",
            fontWeight: i === 4 ? 700 : 300,
            marginBottom: i === 3 ? "1.5rem" : "0.4rem",
          }}>{line}</p>
        ))}
      </div>
      {step > 4 && (
        <div className="bd-finale-emojis">
          {["❤️","💕","🌹","💖","🌸"].map((e, i) => (
            <span key={i} className="bd-finale-emoji" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const PHASES: Phase[] = ["opening","countdown","freeze","reveal","letter","interactive","dial","finale"];
const LABELS: Record<Phase, string> = { opening:"Opening", countdown:"Countdown", freeze:"Freeze", reveal:"Birthday", letter:"Love Letter", interactive:"Gifts", dial:"Time Dial", finale:"Finale" };

function NavBar({ current, onJump }: { current: Phase; onJump: (p: Phase) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bd-nav">
      <button className="bd-nav-toggle" onClick={() => setOpen((o) => !o)}>☰</button>
      {open && (
        <div className="bd-nav-menu">
          {PHASES.map((p) => (
            <button key={p} className="bd-nav-item" style={{ color: p === current ? "#ff2244" : "#e8c8c8" }} onClick={() => { onJump(p); setOpen(false); }}>{LABELS[p]}</button>
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
        <div style={{ fontSize: "3rem" }}>🔓</div>
        <p className="bd-easter-title">Secret Unlocked…</p>
        <p className="bd-easter-msg">"This love was written in the stars long before we met."</p>
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
      <GearBg />
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
