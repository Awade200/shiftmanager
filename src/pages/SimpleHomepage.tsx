import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, CheckCircle2, LogIn, UserPlus } from "lucide-react";

/**
 * Shift Manager — Super Simple Homepage (Dummy Data Only)
 * One file, clean sections, no real account data
 * Shows story + preview + Sign in / Sign up CTAs
 */

export default function SimpleHomepage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <Hero />
      <Features />
      <Preview />
      <CTA />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Shift Manager" className="w-9 h-9 rounded-lg object-contain" />
          <span className="font-semibold text-foreground">Shift Manager</span>
        </div>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <a className="text-muted-foreground hover:text-foreground transition-colors" href="#features">
            Features
          </a>
          <a className="text-muted-foreground hover:text-foreground transition-colors" href="#preview">
            Preview
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="gap-2">
            <a href="/auth">
              <LogIn className="h-4 w-4" />
              Sign in
            </a>
          </Button>
          <Button asChild variant="default" className="gap-2">
            <a href="/auth">
              <UserPlus className="h-4 w-4" />
              Sign up
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <Badge variant="secondary" className="mb-4">
              Demo preview • Sample data only
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Track shifts. Fix overlaps.{" "}
              <span className="text-primary">Get paid faster.</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              A clean, simple homepage that tells the story—without touching your account. 
              Everything below uses random sample data.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="/auth">Create account</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/auth">Sign in</a>
              </Button>
            </div>
          </div>

          {/* Lightweight mock card */}
          <Card className="shadow-2">
            <CardHeader>
              <CardTitle className="text-lg">This Week (Sample)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <InfoPill label="Hours" value="32.0" />
                <InfoPill label="Earnings" value="£402.50" />
                <InfoPill label="Unpaid" value="2 shifts" />
              </div>
              <div className="grid grid-cols-4 gap-3">
                {["Mon", "Tue", "Wed", "Thu"].map((d) => (
                  <div key={d} className="rounded-lg border border-border p-3 bg-card">
                    <div className="mb-2 text-xs text-muted-foreground">{d}</div>
                    <div className="h-4 w-full rounded bg-primary/20 mb-2" />
                    <div className="h-4 w-3/4 rounded bg-success/20" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Week 12–18 (dummy)</span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1 text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Paid
                  </span>
                  <span className="inline-flex items-center gap-1 text-warning">
                    <Clock className="h-3.5 w-3.5" />
                    Unpaid
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: Calendar,
      title: "Timeline & Calendar",
      text: "See your week at a glance and spot overlaps instantly.",
    },
    {
      icon: CheckCircle2,
      title: "Paste & Parse",
      text: "Turn agency text/PDF into clean shifts with a preview.",
    },
    {
      icon: Clock,
      title: "Mark Paid Fast",
      text: "Batch confirm payments and track what's outstanding.",
    },
  ];

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
          Simple features. Clear results.
        </h2>
        <p className="text-lg text-muted-foreground">
          All examples below are placeholders—safe to explore.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="hover:shadow-2 transition-all duration-200">
            <CardContent className="p-6">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Preview() {
  const [tab, setTab] = useState("table");

  return (
    <section id="preview" className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="mx-auto max-w-2xl text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
          Preview (dummy data)
        </h2>
        <p className="text-muted-foreground">
          Switch between views—nothing here touches your account.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </div>
        <div>
          <TabsContent value="table">
            <TableMock />
          </TabsContent>
          <TabsContent value="timeline">
            <TimelineMock />
          </TabsContent>
          <TabsContent value="kanban">
            <KanbanMock />
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
}

function TableMock() {
  const rows = [
    {
      date: "Mon 12",
      client: "Russell House",
      start: "09:00",
      end: "17:00",
      hours: 8,
      rate: 12.5,
      status: "Paid",
    },
    {
      date: "Tue 13",
      client: "Sutton Road",
      start: "10:00",
      end: "16:00",
      hours: 6,
      rate: 12.5,
      status: "Unpaid",
    },
    {
      date: "Wed 14",
      client: "St Michael's",
      start: "08:00",
      end: "14:00",
      hours: 6,
      rate: 13.0,
      status: "Paid",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Table View (sample)</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                {["Date", "Client", "Start", "End", "Hours", "Rate", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3 text-sm">{r.date}</td>
                  <td className="px-4 py-3 text-sm">{r.client}</td>
                  <td className="px-4 py-3 text-sm">{r.start}</td>
                  <td className="px-4 py-3 text-sm">{r.end}</td>
                  <td className="px-4 py-3 text-sm">{r.hours}</td>
                  <td className="px-4 py-3 text-sm">£{r.rate.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "Paid" ? "success" : "warning"}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function TimelineMock() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline View (sample)</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {["Mon", "Tue", "Wed"].map((d) => (
            <div key={d} className="grid grid-cols-[80px_1fr] items-center gap-4">
              <div className="text-sm text-muted-foreground font-medium">{d} 12</div>
              <div className="relative h-10 rounded-lg bg-muted/30">
                <div
                  className="absolute top-1/2 h-8 -translate-y-1/2 rounded bg-primary/80 px-3 text-xs leading-8 text-primary-foreground font-medium"
                  style={{ left: "12%", width: "30%" }}
                >
                  09:00–12:00
                </div>
                <div
                  className="absolute top-1/2 h-8 -translate-y-1/2 rounded bg-success/80 px-3 text-xs leading-8 text-success-foreground font-medium"
                  style={{ left: "50%", width: "25%" }}
                >
                  13:00–15:00
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function KanbanMock() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {["Unpaid", "Pending", "Paid"].map((col) => (
        <Card key={col}>
          <CardHeader>
            <CardTitle className="text-lg">{col}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-card p-4 text-sm shadow-1"
              >
                <div className="font-medium mb-1">Sample Shift {i}</div>
                <div className="text-muted-foreground">Status: {col}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CTA() {
  const [email, setEmail] = useState("");

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <Card className="shadow-2">
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h3 className="text-2xl font-bold mb-2">Ready to try it?</h3>
              <p className="text-muted-foreground">
                Create an account or sign in—this homepage uses dummy data only.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <a href="/auth">Sign up</a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/auth">Sign in</a>
              </Button>
            </div>
          </div>
          <form className="mt-6 flex gap-3 max-w-md">
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              type="email"
            />
            <Button type="button" variant="secondary">
              Notify me
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Shift Manager" className="w-6 h-6 object-contain" />
          <span className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Shift Manager
          </span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">
            Terms
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Privacy
          </a>
          <a href="#" className="hover:text-foreground transition-colors">
            Docs
          </a>
        </div>
      </div>
    </footer>
  );
}