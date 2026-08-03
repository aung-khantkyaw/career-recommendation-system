"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  LogOut,
  Map,
  Radar,
  ShieldCheck,
  Target,
  Upload,
  UserRound,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "About", href: "#about" },
]

const features = [
  {
    title: "Resume Upload",
    description: "Upload your PDF resume securely.",
    icon: FileText,
  },
  {
    title: "AI Skill Analysis",
    description: "AI extracts technical and soft skills from your resume.",
    icon: Brain,
  },
  {
    title: "Career Recommendation",
    description:
      "Receive personalized career paths based on your skills and profile.",
    icon: Target,
  },
  {
    title: "Smart Dashboard",
    description:
      "View AI insights, recommendations, and skill analysis in one place.",
    icon: BarChart3,
  },
]

const steps = [
  { title: "Login / Register", icon: LogIn },
  { title: "Complete Profile", icon: UserRound },
  { title: "Upload Resume (PDF)", icon: Upload },
  { title: "AI Processing", icon: Brain },
  { title: "Save Analysis", icon: CheckCircle2 },
  { title: "View Dashboard", icon: LayoutDashboard },
]

const aiLabels = [
  "Resume Parsing",
  "Skill Extraction",
  "Embedding",
  "Career Recommendation",
  "AI Analysis",
]

const reasons = [
  {
    title: "Accurate AI Analysis",
    description:
      "Our AI understands resumes and identifies important skills automatically.",
    icon: Radar,
  },
  {
    title: "Student-Centered",
    description:
      "Designed specifically for university students preparing for internships and careers.",
    icon: GraduationCap,
  },
  {
    title: "Fast & Secure",
    description:
      "Secure resume storage and AI-powered analysis within minutes.",
    icon: ShieldCheck,
  },
]

const topSkills = ["Python", "Communication", "SQL", "Research"]
const missingSkills = ["Cloud Basics", "Portfolio", "Interview Prep"]
const recommendedCareers = [
  { role: "Data Analyst", score: "94%" },
  { role: "Business Analyst", score: "88%" },
  { role: "Junior AI Engineer", score: "82%" },
]

export default function Home() {
  const { data: session } = useSession()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className={`sticky top-0 z-50 border-b bg-background/90 backdrop-blur transition-shadow ${
          scrolled ? "shadow-sm" : "shadow-none"
        }`}
      >
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="#home" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            <span>Career AI</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Link href="/profile">
                  <Button variant="ghost">
                    <UserRound className="size-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="size-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      <main>
        <section
          id="home"
          className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24"
        >
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-5">
              AI guidance for university students
            </Badge>
            <h1 className="text-4xl font-semibold tracking-normal text-balance sm:text-5xl lg:text-6xl">
              Discover Your Ideal Career with AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Upload your resume, let AI analyze your skills, and receive
              personalized career recommendations designed for your future.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={session ? "/dashboard" : "/register"}>
                <Button size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <HeroIllustration />
        </section>

        <Section id="features" title="Features" eyebrow="What students can do">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </Section>

        <Section
          id="how-it-works"
          title="How It Works"
          eyebrow="A simple path from resume to roadmap"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, index) => (
              <TimelineItem
                key={step.title}
                step={step}
                index={index}
                showArrow={index < steps.length - 1}
              />
            ))}
          </div>
        </Section>

        <Section
          id="about"
          title="Why Choose Our AI"
          eyebrow="Built for clarity, privacy, and student growth"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {reasons.map((reason) => (
              <FeatureCard key={reason.title} {...reason} />
            ))}
          </div>
        </Section>

        <Section
          id="dashboard-preview"
          title="Dashboard Preview"
          eyebrow="All recommendations in one calm workspace"
        >
          <DashboardPreview />
        </Section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-xl border bg-card px-6 py-12 text-center shadow-sm sm:px-10">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Ready to Discover Your Career Path?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Start building your future with AI-powered career
              recommendations.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Free Account
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-semibold">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
            <span>AI-based Student Career Recommendation System</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {["About", "Features", "Contact", "Privacy Policy", "Terms"].map(
              (item) => (
                <Link
                  key={item}
                  href="#"
                  className="transition-colors hover:text-foreground"
                >
                  {item}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
            {title}
          </h2>
        </div>
        {children}
      </div>
    </section>
  )
}

function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <Card className="shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
      <CardHeader>
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg border bg-muted">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function TimelineItem({
  step,
  index,
  showArrow,
}: {
  step: (typeof steps)[number]
  index: number
  showArrow: boolean
}) {
  const Icon = step.icon

  return (
    <>
      <Card className="min-h-36 shadow-sm lg:col-span-1">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              0{index + 1}
            </span>
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <CardTitle className="text-sm">{step.title}</CardTitle>
        </CardHeader>
        {step.title === "AI Processing" ? (
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {aiLabels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </CardContent>
        ) : null}
      </Card>
      {showArrow ? (
        <div className="flex items-center justify-center text-muted-foreground md:hidden">
          <ArrowDown className="size-4" aria-hidden="true" />
        </div>
      ) : null}
    </>
  )
}

function HeroIllustration() {
  return (
    <div
      className="relative rounded-xl border bg-card p-4 shadow-lg"
      aria-label="Student career recommendation workflow illustration"
    >
      <div className="grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="mx-auto flex aspect-square max-w-44 flex-col items-center justify-center rounded-full border bg-background">
            <GraduationCap className="mb-2 size-9" aria-hidden="true" />
            <UserRound className="size-14" aria-hidden="true" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-2 rounded-full bg-foreground/20" />
            <div className="h-2 w-2/3 rounded-full bg-foreground/10" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 font-medium">
                <FileText className="size-4" aria-hidden="true" />
                Student Resume.pdf
              </div>
              <Badge variant="secondary">Ready</Badge>
            </div>
            <div className="space-y-2">
              <div className="h-2 rounded-full bg-muted" />
              <div className="h-2 w-4/5 rounded-full bg-muted" />
              <div className="h-2 w-3/5 rounded-full bg-muted" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Brain className="size-4" aria-hidden="true" />
                AI Analysis
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Skills</span>
                  <span>16</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Match</span>
                  <span>94%</span>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-background p-4 shadow-xs">
              <div className="mb-3 flex items-center gap-2 font-medium">
                <Map className="size-4" aria-hidden="true" />
                Roadmap
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-foreground/30" />
                <span className="h-px flex-1 bg-border" />
                <span className="size-2 rounded-full bg-foreground/40" />
                <span className="h-px flex-1 bg-border" />
                <Target className="size-4" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4 shadow-xs">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <LayoutDashboard className="size-4" aria-hidden="true" />
              Dashboard Preview
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="h-16 rounded-md bg-muted" />
              <div className="h-16 rounded-md bg-muted" />
              <div className="h-16 rounded-md bg-muted" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-lg sm:p-6">
      <div className="mb-6 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold">Student Career Dashboard</h3>
          <p className="text-sm text-muted-foreground">
            Resume analysis updated just now
          </p>
        </div>
        <Badge variant="outline">
          <LockKeyhole className="size-3" aria-hidden="true" />
          Secure
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Career Match Score</CardTitle>
            <CardDescription>Based on resume skills and profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-semibold">94</span>
              <span className="pb-2 text-muted-foreground">/ 100</span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[94%] rounded-full bg-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recommended Careers</CardTitle>
            <CardDescription>Best-fit paths for this student</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendedCareers.map((career) => (
              <div
                key={career.role}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
              >
                <span className="font-medium">{career.role}</span>
                <Badge variant="secondary">{career.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardPanel title="Top Skills">
          <SkillList items={topSkills} />
        </DashboardPanel>
        <DashboardPanel title="Missing Skills">
          <SkillList items={missingSkills} variant="outline" />
        </DashboardPanel>
        <DashboardPanel title="AI Summary">
          <p className="text-sm leading-6 text-muted-foreground">
            Strong analytical profile with clear fit for data-focused roles.
            Add cloud basics and a portfolio project to improve readiness.
          </p>
        </DashboardPanel>
        <DashboardPanel title="Resume Status">
          <div className="space-y-3">
            <Badge>
              <CheckCircle2 className="size-3" aria-hidden="true" />
              Analyzed
            </Badge>
            <p className="text-sm text-muted-foreground">
              PDF uploaded, parsed, and stored securely.
            </p>
          </div>
        </DashboardPanel>
      </div>
    </div>
  )
}

function DashboardPanel({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function SkillList({
  items,
  variant = "secondary",
}: {
  items: string[]
  variant?: "secondary" | "outline"
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} variant={variant}>
          {item}
        </Badge>
      ))}
    </div>
  )
}
