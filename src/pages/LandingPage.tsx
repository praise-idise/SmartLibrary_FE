import type { ComponentType } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GraduationCap, Library, Monitor, Moon, SearchCheck, Sun } from "lucide-react";
import { BrandLogo } from "@/components/app/BrandLogo";
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { cn } from "@/lib/cn";
import { type Theme, useTheme } from "@/hooks/use-theme";

const themeOptions: { label: string; value: Theme; icon: ComponentType<{ className?: string }> }[] = [
  { label: "Light", value: "light", icon: Sun },
  { label: "Dark", value: "dark", icon: Moon },
  { label: "System", value: "system", icon: Monitor },
];

const highlights = [
  {
    title: "Student Search Experience",
    description: "Students can browse by title, category, author, and availability from any device.",
    icon: SearchCheck,
  },
  {
    title: "Librarian Control Panel",
    description: "Admins manage books, monitor users, and keep inventory records accurate.",
    icon: Library,
  },
  {
    title: "Education Focused",
    description: "Designed for campus workflows with due dates, reminders, and transparent book tracking.",
    icon: GraduationCap,
  },
];

export function LandingPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const year = new Date().getFullYear()


  const BrowseCatalogDiv = () => {
    return (
      <div className="mt-7 flex flex-wrap gap-3">
        <Button size="lg" onClick={() => navigate({ to: "/auth/login" })}>
          Login to SmartLibrary
        </Button>
        <Button variant="outline" size="lg" onClick={() => navigate({ to: "/app/books" })}>
          Browse Catalog
        </Button>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-128 w-lg -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-8 top-20 h-48 w-48 rounded-full bg-warning/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-success/20 blur-3xl" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface/80 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo></BrandLogo>
          </div>

          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-muted p-1">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTheme(option.value)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    active ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        <section className="grid items-start gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <div>
            <Badge variant="outline" className="mb-5 border-primary/30 bg-primary/10 text-primary">
              Welcome to SmartLibrary
            </Badge>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Your gateway to smarter library management.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              Discover books faster, submit requests online, and help your campus library run smoothly every day.
            </p>
            <BrowseCatalogDiv />

            <div className="mt-7 overflow-hidden rounded-xl border border-border bg-surface/95">
              <img
                src="/images/landing/heroimg.png"
                alt="SmartLibrary students browsing books"
                className=" w-full object-cover"
              />
            </div>
          </div>

          <Card className="border-primary/20 bg-surface/95 lg:mt-auto">
            <CardHeader>
              <CardTitle>Why This Platform</CardTitle>
              <CardDescription>Simple and practical features for educational institutions.</CardDescription>
            </CardHeader>
            <div className="space-y-3 px-6 pb-6">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-lg border border-border bg-background/60 px-4 py-3">
                    <div className="mb-2 inline-flex items-center gap-2 text-sm font-medium">
                      <Icon className="size-4 text-primary" />
                      {item.title}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </Card>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="bg-surface/95">
            <CardHeader>
              <CardTitle className="text-base">Anywhere Access</CardTitle>
              <CardDescription>Students search and request books remotely without paper registers.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-surface/95">
            <CardHeader>
              <CardTitle className="text-base">Live Availability</CardTitle>
              <CardDescription>Track available, borrowed, and reserved status in one view.</CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-surface/95">
            <CardHeader>
              <CardTitle className="text-base">Cleaner Operations</CardTitle>
              <CardDescription>Admins maintain inventory and user borrowing data from one dashboard.</CardDescription>
            </CardHeader>
          </Card>
        </section>

        <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface/95 h-[20vh] lg:h-[60vh]">
          <img
            src="/images/landing/dashboardmockup.png"
            alt="SmartLibrary dashboard preview"
            className=" w-full object-cover"
          />
        </section>

        <section className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-5">
          <img
            src="/images/landing/footerimg.png"
            alt="SmartLibrary call to action"
            className="mb-3 h-auto w-full rounded-lg border border-border object-cover"
          />
          <p className="text-sm font-medium text-foreground">Ready to get started with SmartLibrary?</p>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to manage borrowing, reservations, and catalog updates from your dashboard.</p>
          <BrowseCatalogDiv />
        </section>
      </div>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {year} {' '}
        <a
          href="https://praiseidise.netlify.app/"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Progomid Solutions
        </a>
      </footer>
    </main>
  );
}