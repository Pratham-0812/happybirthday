import { useState, useEffect, useRef, useCallback } from "react";
import "./_kurumi.css";

// ─── Types ───────────────────────────────────────────────────────────────────
type Phase =
  | "opening"
  | "countdown"
  | "freeze"
  | "reveal"
  | "letter"
  | "interactive"
  | "dial"
  | "finale";

// ─── Countdown Target: Birthday date ─────────────────────────────────────────
// Set to today (April 7, 2026) for demo — change to the actual birthday date
const BIRTHDAY = new Date("2026-04-07T00:00:00");

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
    if (!active) return;
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, active]);
  return { displayed, done };
}

// ─── Particle Canvas ─────────────────────────────────────────────────────────
function ParticleCanvas({ phase }: { phase: Phase }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number; y: number; vx: number; vy: number;
      size: number; alpha: number; color: string; shape: string;
    }[] = [];

    const colors =
      phase === "reveal" || phase === "finale"
        ? ["#ff2244", "#ff6688", "#ffd700", "#ff4466", "#ffffff"]
        : ["#8b0000", "#cc2233", "#ffd700", "#330000"];

    const shapes = phase === "reveal" || phase === "finale" ? ["heart", "circle"] : ["circle"];
    const count = phase === "reveal" || phase === "finale" ? 80 : 40;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (phase === "reveal" ? 1.5 : 0.4),
        vy: -Math.random() * (phase === "reveal" ? 1.8 : 0.6) - 0.2,
        size: Math.random() * (phase === "reveal" ? 12 : 5) + 2,
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }

    let raf: number;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.shape === "heart") {
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
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function onMove(e: MouseEvent) {
      trailRef.current.push({ x: e.clientX, y: e.clientY, alpha: 1 });
      if (trailRef.current.length > 30) trailRef.current.shift();
    }
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
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
    />
  );
}

// ─── Clock Gear SVG ──────────────────────────────────────────────────────────
function GearBg() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
      <svg
        className="gear-spin opacity-10"
        width="600" height="600" viewBox="0 0 200 200"
        fill="none"
        style={{ color: "#8b0000" }}
      >
        <circle cx="100" cy="100" r="70" stroke="currentColor" strokeWidth="4" fill="none" />
        <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="3" fill="none" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = 100 + 72 * Math.cos(a);
          const y1 = 100 + 72 * Math.sin(a);
          const x2 = 100 + 90 * Math.cos(a);
          const y2 = 100 + 90 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="6" strokeLinecap="round" />;
        })}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i * 6 * Math.PI) / 180;
          const x1 = 100 + 68 * Math.cos(a);
          const y1 = 100 + 68 * Math.sin(a);
          const x2 = 100 + 72 * Math.cos(a);
          const y2 = 100 + 72 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
        })}
      </svg>
      <svg
        className="gear-spin-reverse opacity-8 absolute"
        width="300" height="300" viewBox="0 0 200 200"
        fill="none"
        style={{ color: "#ffd700", top: "10%", right: "5%" }}
      >
        <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="3" fill="none" />
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          const x1 = 100 + 62 * Math.cos(a);
          const y1 = 100 + 62 * Math.sin(a);
          const x2 = 100 + 78 * Math.cos(a);
          const y2 = 100 + 78 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />;
        })}
      </svg>
    </div>
  );
}

// ─── Eye Glow ────────────────────────────────────────────────────────────────
function KurumiEye({ visible }: { visible: boolean }) {
  return (
    <div
      className="flex items-center justify-center transition-all duration-2000"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "scale(1)" : "scale(0.3)" }}
    >
      <div className="relative">
        <div className="eye-glow" />
        <svg width="120" height="80" viewBox="0 0 120 80">
          <ellipse cx="60" cy="40" rx="58" ry="38" fill="#0a0000" stroke="#cc0022" strokeWidth="2" />
          <ellipse cx="60" cy="40" rx="35" ry="35" fill="#8b0000" />
          <ellipse cx="60" cy="40" rx="20" ry="20" fill="#cc1133" />
          <ellipse cx="60" cy="40" rx="10" ry="10" fill="#000" />
          <circle cx="52" cy="34" r="4" fill="#ffffff" opacity="0.9" />
          <circle cx="67" cy="44" r="2" fill="#ffffff" opacity="0.5" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <line
                key={i}
                x1={60 + 10 * Math.cos(a)}
                y1={40 + 10 * Math.sin(a)}
                x2={60 + 35 * Math.cos(a)}
                y2={40 + 35 * Math.sin(a)}
                stroke="#ff2244"
                strokeWidth="0.8"
                opacity="0.6"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Opening Phase ────────────────────────────────────────────────────────────
const openingLines = [
  "In a world full of moments…",
  "There was one moment…",
  "That changed everything…",
  "The moment I found you…",
];

function OpeningPhase({ onDone }: { onDone: () => void }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [showEye, setShowEye] = useState(false);
  const [fading, setFading] = useState(false);
  const { displayed, done } = useTypewriter(openingLines[lineIdx] || "", 55, lineIdx < openingLines.length);

  useEffect(() => {
    if (!done) return;
    if (lineIdx === 2) {
      setTimeout(() => setShowEye(true), 500);
      setTimeout(() => setLineIdx(3), 1400);
    } else if (lineIdx < openingLines.length - 1) {
      const t = setTimeout(() => setLineIdx((i) => i + 1), 1800);
      return () => clearTimeout(t);
    } else if (lineIdx === openingLines.length - 1) {
      setTimeout(() => {
        setFading(true);
        setTimeout(onDone, 1200);
      }, 2200);
    }
  }, [done, lineIdx, onDone]);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-1200"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <KurumiEye visible={showEye} />
      <div className="mt-10 text-center px-8">
        <p
          className="opening-text"
          style={{
            color: lineIdx === openingLines.length - 1 ? "#ff2244" : "#e8c8c8",
            fontSize: lineIdx === openingLines.length - 1 ? "2rem" : "1.5rem",
            fontStyle: "italic",
          }}
        >
          {displayed}
          <span className="cursor-blink">|</span>
        </p>
      </div>
    </div>
  );
}

// ─── Countdown Phase ─────────────────────────────────────────────────────────
function CountdownPhase({ onDone }: { onDone: () => void }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      const t = getTimeLeft();
      setTimeLeft(t);
      if (t.done) {
        clearInterval(id);
        setFading(true);
        setTimeout(onDone, 1500);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [onDone]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-10 transition-opacity duration-1500 px-4"
      style={{ opacity: fading ? 0 : 1 }}
    >
      <p className="countdown-label">I counted every second… just to celebrate you.</p>
      <div className="countdown-grid">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Minutes", value: timeLeft.minutes },
          { label: "Seconds", value: timeLeft.seconds },
        ].map(({ label, value }) => (
          <div key={label} className="countdown-unit">
            <div className="countdown-number">{pad(value)}</div>
            <div className="countdown-unit-label">{label}</div>
          </div>
        ))}
      </div>
      <p className="countdown-sub">Because you are worth every moment of my life.</p>
      {timeLeft.done && (
        <p className="mt-6 text-red-400 text-xl animate-pulse font-semibold">
          The moment is here…
        </p>
      )}
    </div>
  );
}

// ─── Freeze Phase ─────────────────────────────────────────────────────────────
function FreezePhase({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);
  const [cracked, setCracked] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setTimeout(() => setCracked(true), 800);
    setTimeout(() => setShow(true), 1200);
    setTimeout(() => {
      setFading(true);
      setTimeout(onDone, 1000);
    }, 3500);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-20 transition-opacity duration-1000"
      style={{ opacity: fading ? 0 : 1, background: "#000" }}
    >
      {cracked && (
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
          {[
            "M400,300 L320,180 L280,100",
            "M400,300 L480,160 L520,80",
            "M400,300 L200,320 L100,280",
            "M400,300 L600,340 L720,300",
            "M400,300 L350,450 L320,550",
            "M400,300 L460,480 L490,580",
          ].map((d, i) => (
            <path
              key={i}
              d={d}
              stroke="#cc0022"
              strokeWidth="1.5"
              fill="none"
              opacity="0.7"
              style={{ animation: `crack-in 0.3s ${i * 0.08}s both ease-out` }}
            />
          ))}
        </svg>
      )}
      {show && (
        <p
          className="text-center text-3xl font-light italic"
          style={{ color: "#ffd700", fontFamily: "'Cormorant Garamond', serif", zIndex: 2 }}
        >
          And now… time belongs to you.
        </p>
      )}
    </div>
  );
}

// ─── Reveal Phase ─────────────────────────────────────────────────────────────
function RevealPhase({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
      setTimeout(onDone, 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-10 px-4 text-center">
      <div
        className="transition-all duration-1000"
        style={{ opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? "scale(1)" : "scale(0.5)" }}
      >
        <h1 className="birthday-title">HAPPY 18TH BIRTHDAY</h1>
        <h1 className="birthday-title-sub">MY LOVE ❤️</h1>
      </div>
      <div
        className="mt-8 transition-all duration-1000 delay-500"
        style={{ opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? "translateY(0)" : "translateY(30px)" }}
      >
        <p className="reveal-line">Today isn't just your birthday…</p>
        <p className="reveal-line" style={{ color: "#ffd700" }}>
          It's the day the world became more beautiful.
        </p>
      </div>
      <button
        className="skip-btn mt-12 transition-opacity duration-500"
        style={{ opacity: step >= 2 ? 1 : 0 }}
        onClick={onDone}
      >
        Continue the story →
      </button>
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
  const [lineIdx, setLineIdx] = useState(0);
  const [shownLines, setShownLines] = useState<string[]>([]);
  const { displayed, done } = useTypewriter(letterLines[lineIdx] || "", 40, lineIdx < letterLines.length);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      setShownLines((prev) => [...prev, letterLines[lineIdx]]);
      if (lineIdx < letterLines.length - 1) {
        setLineIdx((i) => i + 1);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [done, lineIdx]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-10 px-8 text-center">
      <div className="letter-card">
        <div className="letter-inner">
          {shownLines.map((line, i) => (
            <p key={i} className="letter-line">{line}</p>
          ))}
          {lineIdx < letterLines.length && (
            <p className="letter-line">
              {displayed}
              <span className="cursor-blink">|</span>
            </p>
          )}
        </div>
      </div>
      {lineIdx >= letterLines.length - 1 && done && shownLines.length === letterLines.length && (
        <button className="skip-btn mt-8" onClick={onDone}>
          Open your gifts →
        </button>
      )}
    </div>
  );
}

// ─── Interactive Phase ────────────────────────────────────────────────────────
function InteractivePhase({ onDone }: { onDone: () => void }) {
  const [giftOpen, setGiftOpen] = useState(false);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [loveAnswer, setLoveAnswer] = useState<"yes" | "no" | null>(null);
  const [memIdx, setMemIdx] = useState(0);

  const memories = [
    { label: "Our first hello 🌸", msg: "Every great story starts with a single moment…" },
    { label: "The way you laugh 😊", msg: "Your laugh is my favorite sound in the world." },
    { label: "When you held my hand 🤝", msg: "Time stopped when our fingers intertwined." },
    { label: "Late night talks 🌙", msg: "I would trade every sleep for a night talking to you." },
    { label: "The future 🌟", msg: "I can't wait to build every tomorrow with you." },
  ];

  const escapeNo = () => {
    setNoPos({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 200,
    });
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-10 px-4 overflow-auto">
      <h2 className="section-title mb-10">Gifts for You 🎁</h2>
      <div className="interactive-grid">
        {/* Gift Box */}
        <div className="gift-card">
          <div className="gift-card-title">Open Your Gift 💝</div>
          {!giftOpen ? (
            <button className="gift-btn" onClick={() => setGiftOpen(true)}>
              🎁 Tap to open
            </button>
          ) : (
            <p className="gift-msg animate-fade-in">
              "You are the best thing that ever happened to me."
            </p>
          )}
        </div>

        {/* Memory Slider */}
        <div className="gift-card">
          <div className="gift-card-title">Our Memories 📸</div>
          <div className="memory-box">
            <p className="memory-label">{memories[memIdx].label}</p>
            <p className="memory-msg">{memories[memIdx].msg}</p>
            <div className="flex gap-2 mt-4 justify-center">
              <button className="mem-btn" onClick={() => setMemIdx((i) => Math.max(0, i - 1))}>←</button>
              <button className="mem-btn" onClick={() => setMemIdx((i) => Math.min(memories.length - 1, i + 1))}>→</button>
            </div>
            <div className="flex gap-1 mt-3 justify-center">
              {memories.map((_, i) => (
                <div key={i} className="memory-dot" style={{ background: i === memIdx ? "#ff2244" : "#440011" }} />
              ))}
            </div>
          </div>
        </div>

        {/* Do you love me */}
        <div className="gift-card" style={{ position: "relative", overflow: "visible" }}>
          <div className="gift-card-title">Do you love me? ❤️</div>
          {loveAnswer === null ? (
            <div className="love-btns">
              <button
                className="love-yes"
                onClick={() => setLoveAnswer("yes")}
              >
                YES ❤️
              </button>
              <button
                className="love-no"
                style={{ transform: `translate(${noPos.x}px, ${noPos.y}px)` }}
                onMouseEnter={escapeNo}
                onClick={() => setLoveAnswer("no")}
              >
                no...
              </button>
            </div>
          ) : (
            <p className="love-answer animate-fade-in">
              {loveAnswer === "yes"
                ? "I knew it… I love you too, forever. ❤️"
                : "You can't escape this love~ 💕"}
            </p>
          )}
        </div>
      </div>

      <button className="skip-btn mt-10" onClick={onDone}>
        The Time Dial awaits →
      </button>
    </div>
  );
}

// ─── Kurumi Dial Phase ────────────────────────────────────────────────────────
const dialMessages = [
  { type: "memory", text: "The first time I smiled because of you…" },
  { type: "compliment", text: "The way you make everything better…" },
  { type: "promise", text: "I promise to always stay…" },
  { type: "memory", text: "Every moment I've spent with you is precious…" },
  { type: "compliment", text: "You are the most beautiful soul I've ever known…" },
  { type: "promise", text: "I will always choose you, in every timeline…" },
  { type: "memory", text: "The warmth of your presence fills every silence…" },
  { type: "compliment", text: "You light up every room just by existing…" },
];

const typeColors: Record<string, string> = {
  memory: "#ff6688",
  compliment: "#ffd700",
  promise: "#cc99ff",
};

function DialPhase({ onDone }: { onDone: () => void }) {
  const [angle, setAngle] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [lastAngle, setLastAngle] = useState(0);
  const dialRef = useRef<HTMLDivElement>(null);

  const getAngle = (e: React.MouseEvent | React.TouchEvent) => {
    const el = dialRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
  };

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    setLastAngle(getAngle(e));
  };

  const onMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!dragging) return;
      const curr = getAngle(e);
      const delta = curr - lastAngle;
      setAngle((a) => a + delta);
      setLastAngle(curr);
      const idx = Math.abs(Math.round(angle / 45)) % dialMessages.length;
      setMsgIdx(idx);
    },
    [dragging, lastAngle, angle]
  );

  const onEnd = () => setDragging(false);

  const msg = dialMessages[msgIdx];

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-10 px-4 text-center">
      <h2 className="section-title mb-4">Kurumi Time Dial 🕰️</h2>
      <p className="text-gray-400 mb-8 text-sm">Drag the clock to reveal secrets…</p>

      <div
        ref={dialRef}
        className="dial-container select-none"
        onMouseDown={onStart}
        onMouseMove={onMove}
        onMouseUp={onEnd}
        onMouseLeave={onEnd}
        onTouchStart={onStart}
        onTouchMove={onMove}
        onTouchEnd={onEnd}
      >
        <div
          className="dial-inner"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return (
              <div
                key={i}
                className="dial-tick"
                style={{
                  left: `calc(50% + ${Math.cos(a) * 90}px - 3px)`,
                  top: `calc(50% + ${Math.sin(a) * 90}px - 3px)`,
                  background: i % 3 === 0 ? "#cc0022" : "#440011",
                  width: i % 3 === 0 ? "8px" : "4px",
                  height: i % 3 === 0 ? "8px" : "4px",
                }}
              />
            );
          })}
          <div className="dial-center" />
        </div>
        <div className="dial-pointer" />
      </div>

      <div className="dial-message-box mt-8">
        <div className="dial-type" style={{ color: typeColors[msg.type] }}>
          {msg.type === "memory" ? "✦ Memory" : msg.type === "compliment" ? "✦ Compliment" : "✦ Promise"}
        </div>
        <p className="dial-text">{msg.text}</p>
      </div>

      <button className="skip-btn mt-8" onClick={onDone}>
        To the finale →
      </button>
    </div>
  );
}

// ─── Finale Phase ─────────────────────────────────────────────────────────────
const finaleLines = [
  "In every timeline…",
  "In every universe…",
  "I would still choose you…",
  "",
  "Happy 18th Birthday ❤️",
];

function FinalePhase() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    finaleLines.forEach((_, i) => {
      setTimeout(() => setStep(i + 1), i * 2000 + 800);
    });
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-10 text-center px-8">
      <div className="finale-lines">
        {finaleLines.map((line, i) => (
          <p
            key={i}
            className="finale-line transition-all duration-1500"
            style={{
              opacity: step > i ? 1 : 0,
              transform: step > i ? "translateY(0)" : "translateY(20px)",
              color: i === 4 ? "#ff2244" : "#e8c8c8",
              fontSize: i === 4 ? "2.5rem" : "1.6rem",
              fontWeight: i === 4 ? "700" : "300",
              marginBottom: i === 3 ? "1.5rem" : "0.4rem",
            }}
          >
            {line}
          </p>
        ))}
      </div>
      {step > 4 && (
        <div className="mt-12 flex gap-4 animate-fade-in">
          {["❤️", "💕", "🌹", "💖", "🌸"].map((e, i) => (
            <span key={i} className="finale-emoji" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Navigation Bar ───────────────────────────────────────────────────────────
const phases: Phase[] = ["opening", "countdown", "freeze", "reveal", "letter", "interactive", "dial", "finale"];
const phaseLabels: Record<Phase, string> = {
  opening: "Opening",
  countdown: "Countdown",
  freeze: "Freeze",
  reveal: "Birthday",
  letter: "Love Letter",
  interactive: "Gifts",
  dial: "Time Dial",
  finale: "Finale",
};

function NavBar({ current, onJump }: { current: Phase; onJump: (p: Phase) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed top-4 right-4 z-50">
      <button className="nav-toggle" onClick={() => setOpen((o) => !o)}>☰</button>
      {open && (
        <div className="nav-menu">
          {phases.map((p) => (
            <button
              key={p}
              className="nav-item"
              style={{ color: p === current ? "#ff2244" : "#e8c8c8" }}
              onClick={() => { onJump(p); setOpen(false); }}
            >
              {phaseLabels[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Easter Egg ───────────────────────────────────────────────────────────────
function EasterEgg() {
  const [found, setFound] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const code = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight"];

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      setSequence((prev) => {
        const next = [...prev, e.key].slice(-6);
        if (next.join(",") === code.join(",")) setFound(true);
        return next;
      });
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!found) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90">
      <div className="easter-egg-box text-center">
        <div className="text-5xl mb-4">🔓</div>
        <p className="text-2xl" style={{ color: "#ffd700", fontFamily: "'Cormorant Garamond', serif" }}>
          Secret Unlocked…
        </p>
        <p className="mt-4 text-lg" style={{ color: "#ff6688" }}>
          "This love was written in the stars long before we met."
        </p>
        <button className="skip-btn mt-6" onClick={() => setFound(false)}>Close ✕</button>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export function BirthdayExperience() {
  const [phase, setPhase] = useState<Phase>("opening");

  const next = useCallback((p: Phase) => {
    const idx = phases.indexOf(p);
    if (idx < phases.length - 1) setPhase(phases[idx + 1]);
  }, []);

  return (
    <div className="kurumi-root">
      <CursorTrail />
      <GearBg />
      <ParticleCanvas phase={phase} />
      <EasterEgg />
      <NavBar current={phase} onJump={setPhase} />

      {phase === "opening" && <OpeningPhase onDone={() => next("opening")} />}
      {phase === "countdown" && <CountdownPhase onDone={() => next("countdown")} />}
      {phase === "freeze" && <FreezePhase onDone={() => next("freeze")} />}
      {phase === "reveal" && <RevealPhase onDone={() => next("reveal")} />}
      {phase === "letter" && <LoveLetterPhase onDone={() => next("letter")} />}
      {phase === "interactive" && <InteractivePhase onDone={() => next("interactive")} />}
      {phase === "dial" && <DialPhase onDone={() => next("dial")} />}
      {phase === "finale" && <FinalePhase />}
    </div>
  );
}
