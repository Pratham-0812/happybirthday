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

// ─── Kuromi images (real) ─────────────────────────────────────────────────────
const KUROMI_IMGS = [
  "/kuromi1.webp",
  "/karomi2.webp",
  "/kuromi3.webp",
];

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
function useTypewriter(text: string, speed = 48, active = true) {
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
      ? ["#cc88ff", "#ff88dd", "#ffffff", "#ffaaff", "#aa66ff", "#ffccff", "#ffb3e6"]
      : ["#9955cc", "#cc77ee", "#ffffff", "#7733aa", "#ffaaee", "#e0b0ff"];
    const count = isCelebration ? 100 : 50;
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * (canvas?.width ?? 800),
      y: Math.random() * (canvas?.height ?? 600),
      vx: (Math.random() - 0.5) * (isCelebration ? 1.6 : 0.5),
      vy: -Math.random() * (isCelebration ? 2.2 : 0.8) - 0.2,
      size: Math.random() * (isCelebration ? 12 : 6) + 2,
      alpha: Math.random() * 0.8 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)]!,
      type: Math.floor(Math.random() * 3),
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
      ctx.closePath(); ctx.fill();
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
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.fillStyle = p.color;
        if (p.type === 1) drawStar(ctx, p.x, p.y, p.size);
        else if (p.type === 2) drawHeart(ctx, p.x, p.y, p.size / 2);
        else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.001;
        if (p.alpha <= 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 20; p.alpha = Math.random() * 0.8 + 0.2; }
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
    const onMove = (e: MouseEvent) => { trailRef.current.push({ x: e.clientX, y: e.clientY, alpha: 1 }); if (trailRef.current.length > 28) trailRef.current.shift(); };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < trailRef.current.length; i++) {
        const p = trailRef.current[i]!;
        const t = i / trailRef.current.length;
        const size = t * 10 + 1;
        ctx.save(); ctx.globalAlpha = p.alpha * t;
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
        grad.addColorStop(0, "#cc66ff"); grad.addColorStop(0.5, "#ff88cc"); grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2); ctx.fill();
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

// ─── Kuromi Image Component ───────────────────────────────────────────────────
function KuromiImg({ idx = 0, size = 200, animate = false }: { idx?: number; size?: number; animate?: boolean }) {
  return (
    <div className={`bd-kuromi-frame ${animate ? "bd-kuromi-bounce" : ""}`} style={{ width: size, height: size }}>
      <img
        src={KUROMI_IMGS[idx % KUROMI_IMGS.length]}
        alt="Kuromi"
        className="bd-kuromi-img"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </div>
  );
}

// ─── Star background ──────────────────────────────────────────────────────────
const STARS = Array.from({ length: 35 }, (_, i) => ({
  left: `${(i * 37 + 11) % 100}%`,
  top: `${(i * 53 + 7) % 100}%`,
  width: `${(i % 3) + 1}px`,
  height: `${(i % 3) + 1}px`,
  animationDelay: `${(i * 0.4) % 4}s`,
  animationDuration: `${((i * 0.7) % 3) + 2}s`,
}));

function StarBg() {
  return (
    <div className="bd-star-bg">
      {STARS.map((s, i) => <div key={i} className="bd-star" style={s} />)}
    </div>
  );
}

// ─── Opening Phase ────────────────────────────────────────────────────────────
const openingLines = [
  "Close your eyes for a moment…",
  "Think of someone who makes your heart feel full…",
  "Someone whose name alone brings a smile…",
  `That someone is you, ${HER_NAME} 🌸`,
];

function OpeningPhase({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showImg, setShowImg] = useState(false);
  const [fading, setFading] = useState(false);
  const { displayed, done } = useTypewriter(openingLines[lineIdx] ?? "", 52, lineIdx < openingLines.length);

  useEffect(() => {
    if (!done) return;
    if (lineIdx === 2) {
      setTimeout(() => setShowImg(true), 300);
      setTimeout(() => setLineIdx(3), 1100);
    } else if (lineIdx < openingLines.length - 1) {
      const t = setTimeout(() => setLineIdx((i) => i + 1), 1900);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => { setFading(true); setTimeout(onDone, 1200); }, 2500);
      return () => clearTimeout(t);
    }
  }, [done, lineIdx, onDone]);

  return (
    <div className="bd-phase" style={{ opacity: fading ? 0 : 1, transition: "opacity 1.2s ease" }}>
      <div
        className="bd-img-pop"
        style={{
          opacity: showImg ? 1 : 0,
          transform: showImg ? "scale(1) translateY(0)" : "scale(0.3) translateY(50px)",
          transition: "all 1s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <KuromiImg idx={0} size={190} animate />
      </div>
      <div className="bd-opening-text-wrap">
        <p className="bd-opening-text" style={{
          color: lineIdx === openingLines.length - 1 ? "#ff88dd" : "#ddbfff",
          fontSize: lineIdx === openingLines.length - 1 ? "2.1rem" : "1.45rem",
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
      <KuromiImg idx={1} size={130} animate />
      <p className="bd-cd-label">Every second of waiting was worth it… because it leads to you.</p>
      <div className="bd-cd-grid">
        {[{ l: "Days", v: tl.days }, { l: "Hours", v: tl.hours }, { l: "Minutes", v: tl.minutes }, { l: "Seconds", v: tl.seconds }].map(({ l, v }) => (
          <div key={l} className="bd-cd-unit">
            <div className="bd-cd-num">{pad(v)}</div>
            <div className="bd-cd-label-sm">{l}</div>
          </div>
        ))}
      </div>
      <p className="bd-cd-sub">Until the day the world gets to celebrate the most beautiful person in it 💜</p>
      {tl.done && <p className="bd-cd-now">The moment is finally here ✨</p>}
    </div>
  );
}

// ─── Freeze Phase ─────────────────────────────────────────────────────────────
function FreezePhase({ onDone }: { onDone: () => void }) {
  const [sparkles, setSparkles] = useState(false);
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);
  useEffect(() => {
    setTimeout(() => setSparkles(true), 500);
    setTimeout(() => setShow(true), 900);
    setTimeout(() => { setFading(true); setTimeout(onDone, 900); }, 3400);
  }, [onDone]);
  return (
    <div className="bd-phase bd-freeze-purple" style={{ opacity: fading ? 0 : 1, transition: "opacity 0.9s ease" }}>
      {sparkles && (
        <div className="bd-sparkle-burst">
          {Array.from({ length: 18 }).map((_, i) => (
            <div key={i} className="bd-sparkle-ray" style={{ transform: `rotate(${i * 20}deg)`, animationDelay: `${i * 0.03}s` }} />
          ))}
        </div>
      )}
      {show && <p className="bd-freeze-text">✨ Today is all about you, {HER_NAME}… ✨</p>}
    </div>
  );
}

// ─── Reveal Phase ─────────────────────────────────────────────────────────────
function RevealPhase({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [
      setTimeout(() => setStep(1), 400),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 3400),
    ];
    return () => ts.forEach(clearTimeout);
  }, [onDone]);
  return (
    <div className="bd-phase bd-reveal-phase">
      {/* Title */}
      <div className="bd-reveal-top" style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "translateY(0)" : "translateY(-30px)", transition: "all 1s ease" }}>
        <h1 className="bd-birthday-title">HAPPY BIRTHDAY</h1>
        <h1 className="bd-birthday-sub">{HER_NAME} 🎀</h1>
      </div>

      {/* Amna's photo — center */}
      <div className="bd-reveal-photo-wrap" style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.4)", transition: "all 1.1s cubic-bezier(0.34,1.56,0.64,1) 0.2s" }}>
        <div className="bd-reveal-photo-glow" />
        <img src="/amna.jpg" alt={HER_NAME} className="bd-reveal-photo" draggable={false} />
        <div className="bd-reveal-photo-ring" />
      </div>

      {/* Emotional message */}
      <div className="bd-reveal-emotional" style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(25px)", transition: "all 1.1s ease" }}>
        <p className="bd-reveal-line">I have looked at a thousand sunsets and a million stars,</p>
        <p className="bd-reveal-line">but nothing — nothing — has ever stolen my breath</p>
        <p className="bd-reveal-line bd-purple">the way you do, simply by existing. 💜</p>
      </div>

      {step >= 3 && (
        <button className="bd-btn bd-btn-outline bd-fade-in" onClick={onDone}>Read my letter to you ♡</button>
      )}
    </div>
  );
}

// ─── Love Letter Phase ────────────────────────────────────────────────────────
const letterLines = [
  `My dearest ${HER_NAME},`,
  "You are the kind of person that poets write about and painters dream of.",
  "Your laugh is the most beautiful sound I have ever heard.",
  "When you walk into a room, everything else fades away.",
  "Loving you is the easiest and most wonderful thing I have ever done.",
  "Today and every day — I am so grateful you exist. ♡",
];

function LoveLetterPhase({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState<string[]>([]);
  const { displayed, done } = useTypewriter(letterLines[idx] ?? "", 38, idx < letterLines.length);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setShown((p) => [...p, letterLines[idx]!]);
      if (idx < letterLines.length - 1) setIdx((i) => i + 1);
    }, 850);
    return () => clearTimeout(t);
  }, [done, idx]);

  const finished = idx >= letterLines.length - 1 && done && shown.length === letterLines.length;
  return (
    <div className="bd-phase">
      <KuromiImg idx={0} size={100} animate />
      <div className="bd-letter-card">
        <div className="bd-letter-inner">
          {shown.map((line, i) => (
            <p key={i} className="bd-letter-line" style={{ color: i === 0 ? "#cc88ff" : i === shown.length - 1 && shown.length === letterLines.length ? "#ff88dd" : "#e8d4ff" }}>
              {line}
            </p>
          ))}
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
  { label: "The first time I saw you 🌸", msg: "Everything around me went quiet. There was only you." },
  { label: "The sound of your voice 🎶", msg: "I could listen to you talk forever and still want more." },
  { label: "When you smile 🌟", msg: "Your smile is my safe place — it makes everything okay." },
  { label: "Every moment with you 🤍", msg: "I collect them all like the rarest treasures." },
  { label: "Our future 🦋", msg: "I dream of it every night and it always has you in it." },
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
          <KuromiImg idx={1} size={80} />
          <div className="bd-gift-card-title">A Gift from My Heart 🎁</div>
          {!giftOpen
            ? <button className="bd-btn bd-btn-primary" onClick={() => setGiftOpen(true)}>🎁 Open me!</button>
            : <p className="bd-gift-msg bd-fade-in">"You are not just the love of my life — you are the reason I believe in love at all. Happy Birthday, {HER_NAME}. 💜"</p>}
        </div>
        <div className="bd-gift-card">
          <div className="bd-gift-card-title">My Favourite Moments 🌸</div>
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
          <div className="bd-gift-card-title">A Question for You 💜</div>
          <p className="bd-love-question">Do you know how much I love you?</p>
          {love === null ? (
            <div className="bd-love-btns">
              <button className="bd-btn bd-btn-primary bd-love-yes" onClick={() => setLove("yes")}>Yes 💜</button>
              <button
                className="bd-love-no"
                style={{ transform: `translate(${noPos.x}px,${noPos.y}px)` }}
                onMouseEnter={() => setNoPos({ x: (Math.random() - 0.5) * 280, y: (Math.random() - 0.5) * 180 })}
                onClick={() => setLove("no")}
              >Not really…</button>
            </div>
          ) : (
            <p className="bd-love-answer bd-fade-in">
              {love === "yes"
                ? `Then you already know you are my whole world, ${HER_NAME}. 💜`
                : `Then let me spend every day showing you just how infinite it is. ♾️💜`}
            </p>
          )}
        </div>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>One more surprise ✨</button>
    </div>
  );
}

// ─── Dial Phase ───────────────────────────────────────────────────────────────
const dialMsgs = [
  { type: "feeling",  text: "You make me feel things I never had words for before." },
  { type: "promise",  text: "I promise to love you on your hardest days, not just your best." },
  { type: "truth",    text: "You are the most breathtaking person I have ever known." },
  { type: "feeling",  text: "Every time you look at me, my heart forgets how to be calm." },
  { type: "promise",  text: "I will be your safe place, always — no matter what." },
  { type: "truth",    text: "Knowing you is the greatest gift life has ever given me." },
  { type: "feeling",  text: "With you, even ordinary moments feel like magic." },
  { type: "promise",  text: "I choose you. Today, tomorrow, and every day after." },
];

const typeColor: Record<string, string> = { feeling: "#ff88dd", promise: "#cc88ff", truth: "#88aaff" };
const typeLabel: Record<string, string> = { feeling: "✦ How I feel", promise: "✦ My promise", truth: "✦ The truth" };

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
      <KuromiImg idx={2} size={110} animate />
      <h2 className="bd-section-title">A Dial of Feelings 🌙</h2>
      <p className="bd-dial-hint">Drag the dial to hear what my heart has to say…</p>
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
        <div className="bd-dial-type" style={{ color: typeColor[msg.type] }}>{typeLabel[msg.type]}</div>
        <p className="bd-dial-text">{msg.text}</p>
      </div>
      <button className="bd-btn bd-btn-outline" onClick={onDone}>The final moment ✨</button>
    </div>
  );
}

// ─── Finale Phase ─────────────────────────────────────────────────────────────
const finaleLines = [
  "Of all the lives I could have lived…",
  "Of all the people I could have met…",
  `I am the luckiest, because I got you, ${HER_NAME}.`,
  "",
  "Happy Birthday, my love. 💜🎀",
];

function FinalePhase() {
  const [step, setStep] = useState(0);
  useEffect(() => { finaleLines.forEach((_, i) => setTimeout(() => setStep(i + 1), i * 2000 + 500)); }, []);
  return (
    <div className="bd-phase">
      <KuromiImg idx={0} size={180} animate />
      <div className="bd-finale-lines">
        {finaleLines.map((line, i) => (
          <p key={i} className="bd-finale-line" style={{
            opacity: step > i ? 1 : 0,
            transform: step > i ? "translateY(0)" : "translateY(20px)",
            transition: "all 1.5s ease",
            color: i === 4 ? "#ff88dd" : "#e8d4ff",
            fontSize: i === 4 ? "2.3rem" : i === 2 ? "1.35rem" : "1.5rem",
            fontWeight: i === 4 ? 700 : i === 2 ? 600 : 300,
            fontStyle: i === 4 ? "normal" : "italic",
            marginBottom: i === 3 ? "1rem" : "0.3rem",
          }}>{line}</p>
        ))}
      </div>
      {step > 4 && (
        <div className="bd-finale-emojis">
          {["💜","🎀","🌸","✨","💖","⭐","🦋","🌙"].map((e, i) => (
            <span key={i} className="bd-finale-emoji" style={{ animationDelay: `${i * 0.16}s` }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
const PHASES: Phase[] = ["opening","countdown","freeze","reveal","letter","interactive","dial","finale"];
const LABELS: Record<Phase, string> = { opening:"Opening", countdown:"Countdown", freeze:"Sparkle", reveal:"Birthday", letter:"Love Letter", interactive:"Gifts", dial:"Feelings Dial", finale:"Finale" };

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
        <KuromiImg idx={1} size={130} animate />
        <p className="bd-easter-title">You found the secret 🌸</p>
        <p className="bd-easter-msg">
          "{HER_NAME}, if I searched every corner of this world and every page of every story ever written,
          I still would not find words beautiful enough to describe what you mean to me.
          So I will just say this — I love you. Completely, endlessly, always. 💜"
        </p>
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
