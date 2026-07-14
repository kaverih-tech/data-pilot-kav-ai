import { createFileRoute, Link } from "@tanstack/react-router";
import { UploadZone } from "@/components/upload-zone";
import { BarChart3, Sparkles, LineChart, Zap, ShieldCheck, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen — AI Data Analyst for CSV & Excel" },
      {
        name: "description",
        content:
          "Drop any CSV or Excel file and get an instant dashboard, AI insights, forecasts, and a chat-with-your-data assistant. Powered by Lovable AI.",
      },
      { property: "og:title", content: "Lumen — AI Data Analyst" },
      {
        property: "og:description",
        content: "Instant dashboards, AI insights, and forecasts from any spreadsheet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary glow">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="font-display text-xl tracking-tight">Lumen</div>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#how" className="hover:text-foreground">How it works</a>
          <Link to="/analyze" className="hover:text-foreground">Open app</Link>
        </nav>
        <Link
          to="/analyze"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          Launch
        </Link>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16 pt-10 text-center">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
          <Zap className="h-3 w-3 text-primary" /> One upload · full analytics stack
        </div>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl">
          Your spreadsheet, <br />
          <span className="text-gradient">explained instantly.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Lumen reads any CSV or Excel file and generates a Power BI-grade dashboard, executive
          insights, forecasts, and a chat assistant — in seconds.
        </p>

        <div className="mx-auto mt-10 max-w-2xl">
          <UploadZone />
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          Files stay in your browser. Nothing is uploaded to a database.
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-5 md:grid-cols-3">
          <Feature
            icon={<BarChart3 className="h-5 w-5" />}
            title="Auto-generated dashboards"
            body="KPIs, top segments, distributions, correlations — chosen based on your data's domain."
          />
          <Feature
            icon={<LineChart className="h-5 w-5" />}
            title="Forecasts & regression"
            body="Holt-Winters trend forecasting and linear models with R², RMSE and MAE."
          />
          <Feature
            icon={<MessageSquare className="h-5 w-5" />}
            title="Chat with your data"
            body="Ask why revenue dropped, which segment underperforms, or what to do next."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="Executive AI brief"
            body="A CEO-ready summary with insights, risks, and 3 concrete recommendations."
          />
          <Feature
            icon={<ShieldCheck className="h-5 w-5" />}
            title="Privacy-first"
            body="Parsing happens in your browser. We send only aggregated summaries to the AI."
          />
          <Feature
            icon={<Zap className="h-5 w-5" />}
            title="Zero configuration"
            body="Type detection, cleaning, and target selection are fully automatic."
          />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="font-display text-4xl tracking-tight">Three steps. No setup.</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            ["01", "Upload", "Drag a CSV or Excel file."],
            ["02", "Analyze", "Lumen profiles, cleans, and visualizes."],
            ["03", "Decide", "Read the brief, forecast, and ask questions."],
          ].map(([n, t, d]) => (
            <div key={n} className="glass rounded-2xl p-6 text-left">
              <div className="font-mono text-xs text-primary">{n}</div>
              <div className="mt-2 font-display text-2xl tracking-tight">{t}</div>
              <div className="mt-2 text-sm text-muted-foreground">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 text-center text-xs text-muted-foreground">
        Built with Lovable AI · Lumen is a demo analytics platform.
      </footer>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="glass rounded-2xl p-6 transition hover:-translate-y-0.5 hover:glow">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="font-display text-xl tracking-tight">{title}</div>
      <div className="mt-2 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}
