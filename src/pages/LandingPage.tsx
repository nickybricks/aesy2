import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView, animate, useMotionValue } from "framer-motion";
import Lenis from "lenis";
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  LineChart,
  ShieldCheck,
  Brain,
  Activity,
  Cpu,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

/* ---------------------------------------------------------------- *
 * Aesy Landing — Bloomberg × Linear, dark, data-dense, kinetic.
 * ---------------------------------------------------------------- */

const ACCENT = "#7CFFB2"; // signal green
const ACCENT_DIM = "#1FE07A";
const BG = "#07090B";
const PANEL = "#0C1014";
const LINE = "rgba(255,255,255,0.06)";

/* ---------- Smooth scroll ---------- */
function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
}

/* ---------- Animated counter ---------- */
function Counter({ to, decimals = 0, prefix = "", suffix = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, { duration: 1.6, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v.toFixed(decimals)}${suffix}`;
    });
    return () => {
      controls.stop();
      unsub();
    };
  }, [inView, to, decimals, prefix, suffix, mv]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/* ---------- Mono ticker tape ---------- */
const TAPE = [
  { s: "AAPL", p: 232.14, d: +0.84 },
  { s: "NVDA", p: 1192.55, d: +2.31 },
  { s: "MSFT", p: 451.07, d: +0.42 },
  { s: "GOOGL", p: 184.62, d: -0.18 },
  { s: "AMZN", p: 224.91, d: +1.07 },
  { s: "META", p: 612.30, d: +1.92 },
  { s: "TSLA", p: 271.45, d: -0.63 },
  { s: "BRK.B", p: 462.18, d: +0.22 },
  { s: "ASML", p: 781.40, d: +0.91 },
  { s: "V", p: 312.66, d: +0.34 },
];

function TickerTape() {
  return (
    <div className="relative w-full overflow-hidden border-y" style={{ borderColor: LINE, background: PANEL }}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#07090B] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#07090B] to-transparent" />
      <motion.div
        className="flex gap-10 whitespace-nowrap py-3 font-mono text-[13px]"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 50, ease: "linear", repeat: Infinity }}
      >
        {[...TAPE, ...TAPE, ...TAPE].map((t, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-white/70">
            <span className="text-white/95 tracking-wider">{t.s}</span>
            <span className="text-white/50">{t.p.toFixed(2)}</span>
            <span style={{ color: t.d >= 0 ? ACCENT : "#FF6B6B" }}>
              {t.d >= 0 ? "▲" : "▼"} {Math.abs(t.d).toFixed(2)}%
            </span>
            <span className="text-white/15">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ---------- Animated sparkline ---------- */
function Sparkline({ points, color = ACCENT }: { points: number[]; color?: string }) {
  const w = 320;
  const h = 90;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const path = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full">
      <defs>
        <linearGradient id="spark-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill="url(#spark-grad)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.4 }}
      />
      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* pulsing endpoint */}
      <motion.circle
        cx={w}
        cy={h - ((points[points.length - 1] - min) / range) * h}
        r="3"
        fill={color}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
    </svg>
  );
}

/* ---------- Hero analysis card ---------- */
const NVDA_POINTS = [
  98, 102, 99, 105, 110, 108, 116, 121, 119, 128, 134, 130, 142, 148, 145, 158, 167,
  172, 169, 181, 190, 198, 195, 207, 219, 226, 240, 252, 261, 274,
];

const INSIGHTS = [
  { icon: Brain, label: "Moat-Analyse", text: "CUDA-Ökosystem als struktureller Wettbewerbsvorteil identifiziert." },
  { icon: ShieldCheck, label: "Bilanzqualität", text: "Net Cash Position positiv. Verschuldungsgrad 12% — konservativ." },
  { icon: LineChart, label: "Bewertung", text: "DCF Fair Value: $1.418. Aktuelle Margin of Safety: 16%." },
  { icon: Sparkles, label: "Aesy-Score", text: "12 von 14 Buffett-Kriterien erfüllt. Predictability: ★★★★☆" },
];

function HeroCard() {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRevealed((r) => (r + 1) % (INSIGHTS.length + 1)), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative w-full max-w-[560px] rounded-2xl border p-5 sm:p-6"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 30px 80px -30px rgba(0,0,0,0.8), 0 0 0 1px rgba(124,255,178,0.04)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* corner crosshair */}
      <div className="pointer-events-none absolute inset-0">
        {(["tl", "tr", "bl", "br"] as const).map((c) => (
          <span
            key={c}
            className={`absolute h-3 w-3 border-white/20 ${
              c === "tl" ? "left-2 top-2 border-l border-t" :
              c === "tr" ? "right-2 top-2 border-r border-t" :
              c === "bl" ? "left-2 bottom-2 border-l border-b" :
              "right-2 bottom-2 border-r border-b"
            }`}
          />
        ))}
      </div>

      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs tracking-[0.2em] text-white/40">NASDAQ : NVDA</span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: ACCENT }} />
              Live
            </span>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-white">NVIDIA Corporation</h3>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-medium text-white">
            $<Counter to={1192.55} decimals={2} />
          </div>
          <div className="font-mono text-xs" style={{ color: ACCENT }}>
            ▲ +27.41 (+2.35%)
          </div>
        </div>
      </div>

      {/* sparkline */}
      <div className="mt-5 h-[110px]">
        <Sparkline points={NVDA_POINTS} />
      </div>

      {/* metrics row */}
      <div className="mt-2 grid grid-cols-4 gap-2 border-t pt-3" style={{ borderColor: LINE }}>
        {[
          { k: "ROIC", v: "48%" },
          { k: "Net Margin", v: "55%" },
          { k: "FCF Growth", v: "+62%" },
          { k: "Aesy Score", v: "12 / 14" },
        ].map((m) => (
          <div key={m.k}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">{m.k}</div>
            <div className="mt-0.5 font-mono text-sm text-white">{m.v}</div>
          </div>
        ))}
      </div>

      {/* AI insights */}
      <div className="mt-4 space-y-2">
        {INSIGHTS.map((ins, i) => {
          const visible = i < revealed || revealed === 0;
          return (
            <motion.div
              key={ins.label}
              initial={false}
              animate={{
                opacity: visible ? 1 : 0.25,
                x: visible ? 0 : -6,
              }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 rounded-lg border px-3 py-2"
              style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}
            >
              <ins.icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: ACCENT }} />
              <div className="min-w-0">
                <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">{ins.label}</div>
                <div className="text-sm text-white/85">{ins.text}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ---------- Section heading ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/40">
      <span className="h-px w-8" style={{ background: ACCENT }} />
      {children}
    </div>
  );
}

/* ---------- Pillar card ---------- */
function Pillar({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-xl border p-6 transition-colors"
      style={{ borderColor: LINE, background: PANEL }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 -top-px h-px opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
      />
      <div className="mb-5 flex items-center justify-between">
        <Icon className="h-5 w-5" style={{ color: ACCENT }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/30">
          0{index + 1}
        </span>
      </div>
      <h3 className="text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/55">{desc}</p>
    </motion.div>
  );
}

/* ---------- Main page ---------- */
const LandingPage: React.FC = () => {
  useLenis();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div
      className="min-h-screen text-white antialiased"
      style={{
        background: BG,
        fontFamily: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {/* grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 30%, transparent 80%)",
        }}
      />

      {/* Nav */}
      <header className="relative z-30">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="group flex items-center gap-2">
            <span
              className="grid h-7 w-7 place-items-center rounded-md border transition-colors group-hover:border-white/30"
              style={{ borderColor: "rgba(255,255,255,0.12)", background: PANEL }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
            </span>
            <span className="font-medium tracking-tight">Aesy</span>
            <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 sm:inline">
              / Quant Intelligence
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            {[
              { label: "Engine", href: "#engine" },
              { label: "Prinzipien", href: "#prinzipien" },
              { label: "KI-Logik", href: "#ki" },
              { label: "Daten", href: "#daten" },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="relative transition-colors hover:text-white"
              >
                <span>{l.label}</span>
                <span
                  className="absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 hover:w-full"
                  style={{ background: ACCENT }}
                />
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-md px-3 py-1.5 text-sm text-white/70 transition-colors hover:text-white sm:inline-block"
            >
              Anmelden
            </Link>
            <Link
              to="/analyzer"
              className="group inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-all"
              style={{ borderColor: "rgba(124,255,178,0.3)", color: ACCENT, background: "rgba(124,255,178,0.05)" }}
            >
              Analyse starten
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-12 lg:grid-cols-12 lg:gap-8 lg:pt-20"
        >
          <div className="lg:col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60"
              style={{ borderColor: LINE, background: PANEL }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: ACCENT }} />
              KI-gestützte Aktienanalyse · Live
            </motion.div>

            <h1 className="mt-6 text-[clamp(2.4rem,6vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.02em]">
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.05 }}
                className="block"
              >
                Analyse-Präzision
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18 }}
                className="block text-white/45"
              >
                in <span className="text-white">Echtzeit</span>.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.32 }}
              className="mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg"
            >
              Aesy ist ein quantitatives Instrument — keine Empfehlungs-App.
              Bewährte Investment-Prinzipien, kombiniert mit Live-Marktdaten und KI-Intelligenz.
              Eine Aktie, vierzehn Kriterien, eine klare Antwort.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.44 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/analyzer"
                className="group inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-black transition-transform"
                style={{ background: ACCENT, boxShadow: `0 0 0 1px rgba(124,255,178,0.3), 0 12px 40px -10px ${ACCENT}` }}
              >
                Aktie analysieren
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/quant"
                className="group inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.12)" }}
              >
                Quant-Screener öffnen
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>

            {/* Live stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mt-12 grid grid-cols-3 gap-6 border-t pt-6"
              style={{ borderColor: LINE }}
            >
              {[
                { v: 8400, suffix: "+", label: "Aktien analysiert" },
                { v: 14, suffix: "", label: "Buffett-Kriterien" },
                { v: 99.4, decimals: 1, suffix: "%", label: "Daten-Verfügbarkeit" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="font-mono text-2xl font-medium tracking-tight text-white sm:text-3xl">
                    <Counter to={s.v} decimals={s.decimals ?? 0} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {s.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero card */}
          <div className="flex justify-center lg:col-span-6 lg:justify-end">
            <HeroCard />
          </div>
        </motion.div>

        <TickerTape />
      </section>

      {/* Engine */}
      <section id="engine" className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <SectionLabel>01 / Analyse-Engine</SectionLabel>
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em]">
              Eine Engine.<br />
              <span className="text-white/45">Vierzehn Linsen.</span>
            </h2>
            <p className="mt-5 max-w-md text-white/55">
              Jede Aktie wird durch dieselben quantitativen Filter geführt — Profitabilität, finanzielle Stärke,
              Bewertung, Wachstum. Keine Stimmungsanalyse. Keine Hot-Takes. Nur Zahlen, die seit Jahrzehnten funktionieren.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            {[
              { icon: Activity, title: "Profitabilität", desc: "ROE, ROIC, ROA und Margen über 10 Jahre — Konsistenz schlägt Spitzenwerte." },
              { icon: ShieldCheck, title: "Finanzielle Stärke", desc: "Verschuldung, Liquidität, Zinsdeckung. Bilanzen, die Krisen überleben." },
              { icon: LineChart, title: "Bewertung", desc: "DCF, KGV, KBV, Margin of Safety. Was eine Aktie wert ist — nicht was sie kostet." },
              { icon: TrendingUp, title: "Wachstum", desc: "Umsatz, EBITDA, EPS, FCF. Vorhersehbarkeit ist wertvoller als Tempo." },
            ].map((p, i) => (
              <Pillar key={p.title} icon={p.icon} title={p.title} desc={p.desc} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section id="prinzipien" className="relative z-10 border-y" style={{ borderColor: LINE, background: "rgba(255,255,255,0.015)" }}>
        <div className="mx-auto max-w-7xl px-6 py-32">
          <SectionLabel>02 / Investment-Prinzipien</SectionLabel>
          <div className="grid items-end gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em]">
                Buffett-Logik,<br />
                <span className="text-white/45">in Code übersetzt.</span>
              </h2>
            </div>
            <p className="text-white/55 lg:col-span-5">
              Jedes Kriterium hat eine klare Schwelle. Wir bewerten nicht — wir messen.
              Der Aesy-Score (0–14) zeigt, wie viele der vierzehn Kriterien eine Aktie objektiv erfüllt.
            </p>
          </div>

          <div className="mt-16 grid gap-px overflow-hidden rounded-xl border md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: LINE, background: LINE }}>
            {[
              { k: "ROE", v: "≥ 15%", d: "über 10 Jahre" },
              { k: "ROIC", v: "≥ 12%", d: "Kapitaleffizienz" },
              { k: "Operating Margin", v: "≥ 15%", d: "operative Stärke" },
              { k: "Net Margin", v: "≥ 10%", d: "echte Profitabilität" },
              { k: "Debt / Assets", v: "≤ 50%", d: "Bilanz-Disziplin" },
              { k: "Current Ratio", v: "≥ 1.5", d: "kurzfristige Liquidität" },
              { k: "Interest Coverage", v: "≥ 5×", d: "Zinslast tragbar" },
              { k: "FCF Growth", v: "positiv", d: "über 5 Jahre" },
              { k: "Years Profitable", v: "≥ 8 / 10", d: "Konsistenz" },
            ].map((c, i) => (
              <motion.div
                key={c.k}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-5% 0px" }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="group relative p-6 transition-colors hover:bg-white/[0.02]"
                style={{ background: BG }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{c.k}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 opacity-60" style={{ color: ACCENT }} />
                </div>
                <div className="mt-3 font-mono text-2xl text-white">{c.v}</div>
                <div className="mt-1 text-xs text-white/45">{c.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI logic */}
      <section id="ki" className="relative z-10 mx-auto max-w-7xl px-6 py-32">
        <SectionLabel>03 / KI-Logik</SectionLabel>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em]">
              KI als zweite Meinung —<br />
              <span className="text-white/45">nicht als Orakel.</span>
            </h2>
            <p className="mt-5 max-w-lg text-white/55">
              Quantitative Daten erzählen die halbe Geschichte. Unsere KI liest Geschäftsberichte, News
              und Branchen­dynamiken — und übersetzt sie in qualitative Faktoren, die du selbst gewichten kannst.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { icon: Brain, title: "Moat-Erkennung", desc: "Identifiziert nachhaltige Wettbewerbsvorteile aus Geschäftsberichten." },
                { icon: Cpu, title: "Management-Analyse", desc: "Bewertet Kapitalallokation, Aktionärs­kommunikation und Insider-Aktivität." },
                { icon: Database, title: "Branchen-Kontext", desc: "Vergleicht jede Kennzahl gegen Sektor- und Industrie-Median." },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md border"
                    style={{ borderColor: "rgba(124,255,178,0.2)", background: "rgba(124,255,178,0.05)" }}
                  >
                    <f.icon className="h-4 w-4" style={{ color: ACCENT }} />
                  </div>
                  <div>
                    <div className="font-medium text-white">{f.title}</div>
                    <div className="mt-1 text-sm text-white/55">{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Terminal-style block */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden rounded-xl border lg:col-span-6"
            style={{ borderColor: LINE, background: PANEL }}
          >
            <div className="flex items-center justify-between border-b px-4 py-2" style={{ borderColor: LINE }}>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full bg-white/15" />
                <span className="h-2 w-2 rounded-full" style={{ background: ACCENT }} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">aesy / analyze AAPL</span>
              <Zap className="h-3.5 w-3.5 text-white/30" />
            </div>
            <div className="space-y-2 p-5 font-mono text-[12.5px] leading-relaxed">
              {[
                { c: "white/40", t: "→ fetching financial statements (10y)" },
                { c: "white/40", t: "→ computing 14 buffett criteria" },
                { c: "white/40", t: "→ running DCF · WACC = 8.4% · g = 3%" },
                { c: "white/40", t: "→ ai · moat detection · 4.2s" },
                { c: "ACCENT", t: "✓ analysis complete · 6.8s" },
                { c: "white", t: "" },
                { c: "white", t: "AAPL · Apple Inc." },
                { c: "white/60", t: "  aesy_score      ████████████░░  12 / 14" },
                { c: "white/60", t: "  fair_value      $214.80" },
                { c: "white/60", t: "  current_price   $232.14" },
                { c: "white/60", t: "  margin_safety   −7.5%   (overvalued)" },
                { c: "white/60", t: "  predictability  ★★★★★" },
                { c: "white/60", t: "  moat            strong (ecosystem · brand)" },
                { c: "ACCENT", t: "  recommendation  hold · wait for pullback" },
              ].map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.07 }}
                  style={{ color: l.c === "ACCENT" ? ACCENT : `rgba(255,255,255,${l.c === "white" ? 0.95 : l.c === "white/60" ? 0.6 : 0.4})` }}
                >
                  {l.t || "\u00A0"}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Data foundation */}
      <section id="daten" className="relative z-10 border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto max-w-7xl px-6 py-32">
          <SectionLabel>04 / Datenbasis</SectionLabel>
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h2 className="text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.02em]">
                Saubere Daten.<br />
                <span className="text-white/45">Ehrliche Antworten.</span>
              </h2>
              <p className="mt-5 max-w-lg text-white/55">
                Über 8.000 Aktien an US-, UK-, kanadischen und deutschen Börsen.
                Live-Preise, geprüfte Finanzberichte, historische Daten bis zehn Jahre zurück.
                Jede Nacht aktualisiert. Jede Sekunde abrufbar.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 lg:col-span-6">
              {[
                { v: 8400, suffix: "+", label: "Aktien" },
                { v: 4, suffix: "", label: "Märkte (US · UK · CA · DE)" },
                { v: 10, suffix: " Jahre", label: "Historie" },
                { v: 24, suffix: " / 7", label: "Verfügbarkeit" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="rounded-xl border p-6"
                  style={{ borderColor: LINE, background: PANEL }}
                >
                  <div className="font-mono text-3xl font-medium text-white">
                    <Counter to={s.v} suffix={s.suffix} />
                  </div>
                  <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-32">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative overflow-hidden rounded-2xl border p-12 sm:p-16"
            style={{
              borderColor: "rgba(124,255,178,0.18)",
              background: "linear-gradient(135deg, rgba(124,255,178,0.05), rgba(124,255,178,0.01))",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(124,255,178,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(124,255,178,0.08) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                maskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(ellipse at center, black 20%, transparent 70%)",
              }}
            />
            <div className="relative">
              <h2 className="max-w-2xl text-[clamp(1.8rem,3.6vw,2.8rem)] font-medium leading-[1.1] tracking-[-0.02em]">
                Hör auf zu raten. Fang an zu messen.
              </h2>
              <p className="mt-4 max-w-xl text-white/60">
                Aesy ist kein Robo-Advisor. Es ist ein Instrument für Investoren, die ihre eigenen Entscheidungen treffen — nur besser informiert.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/analyzer"
                  className="group inline-flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-black transition-transform"
                  style={{ background: ACCENT, boxShadow: `0 12px 40px -10px ${ACCENT}` }}
                >
                  Erste Analyse starten
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 rounded-md border px-5 py-3 text-sm text-white/80 transition-colors hover:bg-white/5 hover:text-white"
                  style={{ borderColor: "rgba(255,255,255,0.12)" }}
                >
                  Konto erstellen
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t" style={{ borderColor: LINE }}>
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: ACCENT }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em]">Aesy © 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
            <Link to="/analyzer" className="transition-colors hover:text-white">Analyzer</Link>
            <Link to="/quant" className="transition-colors hover:text-white">Quant</Link>
            <Link to="/auth" className="transition-colors hover:text-white">Anmelden</Link>
            <span>Hinweis · Keine Anlageberatung</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;