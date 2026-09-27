import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Shield,
  Activity,
  Brain,
  Globe2,
  Zap,
  Bell,
  Lock,
  Boxes,
  LineChart,
  Radar,
  ChevronRight,
  PlayCircle,
  Check,
  Github,
  Twitter,
  Linkedin,
  ArrowRight,
  Cpu,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Waves,
} from "lucide-react";
import heroGlobe from "@/assets/hero-globe.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CyberNexis AI — Predict & Neutralize Network Threats" },
      {
        name: "description",
        content:
          "Real-time AI network traffic anomaly detection, LSTM threat prediction, explainable AI, GeoIP mapping and automatic response — all in one platform.",
      },
      { property: "og:title", content: "CyberNexis AI — Predict & Neutralize Network Threats" },
      {
        property: "og:description",
        content: "Detect anomalies, predict attacks, auto-block — before damage occurs.",
      },
    ],
  }),
  component: Landing,
});

/* ---------- helpers ---------- */

function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-2.5">
          <a href="#top" className="flex items-center gap-2">
            <div
              className="relative grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
            </div>
            <span className="font-semibold tracking-tight">CyberNexis AI</span>
          </a>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground transition" href="#features">
              Features
            </a>
            <a className="hover:text-foreground transition" href="#how">
              How it works
            </a>
            <a className="hover:text-foreground transition" href="#architecture">
              Architecture
            </a>
            <a className="hover:text-foreground transition" href="#faq">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground md:inline"
            >
              Sign in
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
            >
              Enter SOC <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCounter({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="font-mono text-3xl font-semibold text-gradient md:text-4xl">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-8">
      {/* Grid + glow backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 cyber-grid" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]"
        style={{ background: "var(--gradient-hero)" }}
      />

      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-[1.05fr_1fr] md:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Live threat intelligence · v1.0
          </div>

          <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
            Protect your network
            <br />
            <span className="text-gradient">before attackers strike.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            AI-powered packet inspection, LSTM threat forecasting, explainable detections and
            automatic response — a full SOC pipeline in one deployable stack.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              id="cta"
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
            >
              Start monitoring <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium hover:bg-white/[0.06]"
            >
              <PlayCircle className="h-4 w-4" /> Watch demo
            </a>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCounter value="99.6%" label="Detection accuracy" />
            <StatCounter value="120K+" label="Packets / sec" />
            <StatCounter value="15K+" label="Threats prevented" />
            <StatCounter value="24/7" label="Autonomous SOC" />
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative">
          <div
            className="absolute -inset-6 -z-10 rounded-[2rem] opacity-70 blur-3xl"
            style={{ background: "var(--gradient-primary)" }}
          />
          <div className="glass relative overflow-hidden rounded-[2rem] p-2">
            <div className="relative aspect-square overflow-hidden rounded-[1.6rem]">
              <img
                src={heroGlobe}
                alt="Global network threat map"
                width={1600}
                height={1200}
                className="h-full w-full animate-float-slow object-cover"
              />
              {/* Scanline */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/40 to-transparent opacity-40"
                style={{ animation: "scanline 6s linear infinite" }}
              />
              {/* Corner HUD */}
              <div className="absolute left-4 top-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-primary">
                ● TRACE ACTIVE
              </div>
              <div className="absolute right-4 top-4 rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 font-mono text-[10px]">
                45.132.192.11 → RU
              </div>

              {/* Floating alert card */}
              <div className="absolute bottom-4 left-4 right-4 glass rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-danger/15 text-danger">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">Reconnaissance detected</span>
                      <span className="font-mono text-muted-foreground">98% conf.</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Moscow, RU · TCP · port 443
                    </div>
                  </div>
                  <span className="rounded-md bg-success/15 px-2 py-1 text-[10px] font-medium text-success">
                    Blocked
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoMarquee() {
  return null;
}

const FEATURES = [
  {
    icon: Radar,
    title: "Live Packet Capture",
    desc: "Scapy-powered sniffer across TCP, UDP, ICMP, HTTP/S and DNS.",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "XGBoost Detection",
    desc: "UNSW-NB15 trained classifier tags Recon, DoS, Botnet, Backdoor & more.",
    color: "purple",
  },
  {
    icon: LineChart,
    title: "LSTM Prediction",
    desc: "Sequence models forecast the next attack from live traffic trends.",
    color: "cyan",
  },
  {
    icon: ShieldCheck,
    title: "Explainable AI",
    desc: "SHAP explains every decision — features, weights, confidence.",
    color: "purple",
  },
  {
    icon: Globe2,
    title: "GeoIP Mapping",
    desc: "MaxMind GeoLite2 pins attacker IPs onto a live world heatmap.",
    color: "cyan",
  },
  {
    icon: Lock,
    title: "Auto Firewall",
    desc: "Malicious IPs blocked at kernel level within milliseconds.",
    color: "purple",
  },
  {
    icon: Bell,
    title: "Multi-channel Alerts",
    desc: "Telegram bot + email reports with recommended remediation.",
    color: "cyan",
  },
  {
    icon: Boxes,
    title: "Docker Deployment",
    desc: "One-command stack: sniffer, model server, dashboard, DB.",
    color: "purple",
  },
];

function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 flex items-end justify-between gap-6">
        <div>
          <h2 className="max-w-2xl text-4xl font-semibold md:text-5xl">
            A complete SOC pipeline, <span className="text-gradient">packet to policy</span>.
          </h2>
        </div>
        <a
          href="#architecture"
          className="hidden items-center gap-1 text-sm text-muted-foreground hover:text-foreground md:inline-flex"
        >
          See full architecture <ChevronRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-surface p-6 transition hover:border-white/15 hover:-translate-y-1"
          >
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition group-hover:opacity-60"
              style={{ background: f.color === "cyan" ? "var(--cyan)" : "var(--purple)" }}
            />
            <div
              className="mb-5 grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.03]"
              style={{ color: f.color === "cyan" ? "var(--cyan)" : "var(--purple)" }}
            >
              <f.icon className="h-5 w-5" />
            </div>
            <div className="text-base font-semibold">{f.title}</div>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Architecture() {
  const steps = [
    { icon: Waves, label: "Traffic", note: "Scapy sniffer" },
    { icon: Cpu, label: "Features", note: "UNSW-NB15 schema" },
    { icon: Brain, label: "XGBoost", note: "Classify attack" },
    { icon: LineChart, label: "LSTM", note: "Predict next" },
    { icon: ShieldCheck, label: "SHAP", note: "Explain" },
    { icon: Globe2, label: "GeoIP", note: "Locate" },
    { icon: Zap, label: "Respond", note: "Block · Alert" },
  ];
  return (
    <section id="architecture" className="relative border-y border-white/5 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10 cyber-grid opacity-40" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-4xl font-semibold md:text-5xl">
            From wire to response in <span className="text-gradient">milliseconds</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every packet flows through a real-time pipeline: capture, engineer, classify, forecast,
            explain, locate and respond — continuously.
          </p>
        </div>

        <div className="glass overflow-x-auto rounded-2xl p-6">
          <div className="flex min-w-max items-center gap-3">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-40 rounded-xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-primary">
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">{s.label}</div>
                  <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{s.note}</div>
                </div>
                {i < steps.length - 1 && (
                  <div className="relative h-px w-8 bg-gradient-to-r from-primary/60 to-accent/60">
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Attack sample panel */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass rounded-2xl p-5">
            <div className="text-xs text-muted-foreground">Prediction</div>
            <div className="mt-1 text-lg font-semibold">DoS attack — 95% probability</div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{ width: "95%", background: "var(--gradient-primary)" }}
              />
            </div>
            <div className="mt-3 font-mono text-xs text-muted-foreground">
              LSTM window: 128 packets · horizon: 30s
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs text-muted-foreground">Top SHAP features</div>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { k: "connection_count", v: 0.32 },
                { k: "protocol_tcp", v: 0.24 },
                { k: "packet_size_avg", v: 0.19 },
                { k: "duration", v: 0.14 },
              ].map((r) => (
                <li key={r.k} className="flex items-center gap-3">
                  <span className="w-40 font-mono text-xs text-muted-foreground">{r.k}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span
                      className="block h-full rounded-full bg-primary"
                      style={{ width: `${r.v * 100}%` }}
                    />
                  </span>
                  <span className="font-mono text-xs">{r.v.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="text-xs text-muted-foreground">Automated response</div>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-success" /> Firewall rule pushed to gateway
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-success" /> Telegram alert delivered · 240ms
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-success" /> Email report to SOC on-call
              </li>
              <li className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 text-success" /> Incident opened in dashboard
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const items = [
    { n: "01", t: "Capture", d: "Passive Scapy sniffer taps traffic without disrupting the wire." },
    { n: "02", t: "Engineer", d: "Extract 40+ features and normalize into UNSW-NB15 schema." },
    { n: "03", t: "Classify", d: "XGBoost tags each flow: Normal, DoS, Recon, Botnet, Backdoor…" },
    { n: "04", t: "Forecast", d: "LSTM predicts the next attack from the last N packets." },
    { n: "05", t: "Explain", d: "SHAP surfaces the features that drove every decision." },
    { n: "06", t: "Respond", d: "Auto-block IP, alert via Telegram + email, update dashboard." },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-14 max-w-2xl">
        <h2 className="text-4xl font-semibold md:text-5xl">
          Six steps, <span className="text-gradient">continuously</span>.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-white/5 bg-surface p-6 transition hover:border-primary/40"
          >
            <div className="font-mono text-xs text-primary">{s.n}</div>
            <div className="mt-2 text-lg font-semibold">{s.t}</div>
            <div className="mt-1.5 text-sm text-muted-foreground">{s.d}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    {
      q: "Cut our mean time to detect from 14 minutes to under 3 seconds.",
      n: "Head of SecOps",
      r: "Global Fintech",
    },
    {
      q: "The explainability layer alone makes our compliance audits trivial.",
      n: "CISO",
      r: "Healthcare Network",
    },
    {
      q: "One command to deploy, and it started catching lateral movement day one.",
      n: "Network Architect",
      r: "University CERT",
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="mb-12">
        <h2 className="text-4xl font-semibold md:text-5xl">
          Built for the teams on <span className="text-gradient">the front line</span>.
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((t, i) => (
          <blockquote key={i} className="glass rounded-2xl p-6">
            <div className="mb-4 text-primary">★★★★★</div>
            <p className="text-base leading-relaxed">"{t.q}"</p>
            <footer className="mt-6 text-sm">
              <div className="font-medium">{t.n}</div>
              <div className="text-muted-foreground">{t.r}</div>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    {
      q: "What kinds of attacks can it detect?",
      a: "DoS, Reconnaissance, Botnet, Backdoor, Shellcode, Generic, Exploits, Worms and Analysis — the full UNSW-NB15 taxonomy — plus anomalies that don't match a known class.",
    },
    {
      q: "Does it run on-prem?",
      a: "Yes. The entire stack ships as Docker containers. Nothing has to leave your network — models, dashboards and databases stay local.",
    },
    {
      q: "How is it different from a traditional IDS?",
      a: "Signature IDSes react to known patterns. CyberNexis AI learns behaviour, predicts the next move via LSTM, and explains every decision with SHAP.",
    },
    {
      q: "Can I integrate with my SIEM / firewall?",
      a: "Yes — REST API, syslog forwarding, webhooks, and native iptables / nftables / Cloudflare Firewall Rules integrations.",
    },
    {
      q: "What data does the model need?",
      a: "Nothing but the traffic itself. Features are extracted live from packets — no clients, agents or endpoint installs required.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-6 py-24">
      <div className="mb-10 text-center">
        <h2 className="text-4xl font-semibold md:text-5xl">Answers, up front.</h2>
      </div>
      <div className="divide-y divide-white/5 rounded-2xl border border-white/5 bg-surface">
        {qs.map((item, i) => (
          <details key={i} className="group p-6 open:bg-white/[0.02]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="text-base font-medium">{item.q}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition group-open:rotate-90" />
            </summary>
            <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="glass relative overflow-hidden rounded-3xl p-10 md:p-16">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "var(--gradient-primary)" }}
        />
        <div className="relative flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <h3 className="text-3xl font-semibold md:text-4xl">
              Deploy a self-defending network <span className="text-gradient">tonight</span>.
            </h3>
            <p className="mt-3 text-muted-foreground">
              One command spins up the sniffer, model server, dashboard and alerts. Free forever for
              single-node.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-primary-foreground"
              style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-cyan)" }}
            >
              Start free <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium hover:bg-white/[0.06]"
            >
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="grid h-8 w-8 place-items-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-4 w-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-semibold">CyberNexis AI</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Predictive network defense powered by AI. Detect, predict, respond.
            </p>
          </div>
          {[
            { h: "Product", l: ["Features", "Architecture", "Documentation"] },
            { h: "Company", l: ["About", "Blog", "Careers", "Contact"] },
            { h: "Legal", l: ["Privacy", "Terms", "Security", "SLA"] },
          ].map((col) => (
            <div key={col.h}>
              <div className="text-sm font-semibold">{col.h}</div>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {col.l.map((i) => (
                  <li key={i}>
                    <a className="hover:text-foreground" href="#">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 text-xs text-muted-foreground md:flex-row md:items-center">
          <div>© 2026 CyberNexis AI · v1.0.0</div>
          <div className="flex items-center gap-4">
            <a href="#" aria-label="GitHub" className="hover:text-foreground">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Twitter" className="hover:text-foreground">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------- page ---------- */

function Landing() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <LogoMarquee />
      <Features />
      <Architecture />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </main>
  );
}

// Unused import guard for Activity to keep tree-shaking honest.
void Activity;
