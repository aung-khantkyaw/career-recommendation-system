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
  Cpu,
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
  UploadCloud,
  User,
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
            <span className="flex size-9 items-center justify-center rounded-lg shadow-lg">
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
          className="relative w-full grid max-w-7xl mx-auto items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.95fr] lg:px-8 lg:py-24"
        >
          <div className="absolute inset-0 pointer-events-none overflow-visible">

            <div className="absolute top-[-5%] left-[-5%] w-80 h-80 bg-cyan-400/40 rounded-full blur-3xl" />
            <div className="absolute top-[-5%] right-[-5%] w-80 h-80 bg-violet-400/40 rounded-full blur-3xl" />

            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(203, 213, 225, 0.4) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(203, 213, 225, 0.4) 1px, transparent 1px)
                `,
                backgroundSize: '32px 32px',
                WebkitMaskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
                maskImage: 'radial-gradient(circle at center, black 30%, transparent 80%)',
              }}
            />
          </div>

          <div className="max-w-3xl relative z-10">
            <Badge variant="outline" className="mb-5 bg-white/60 backdrop-blur-sm">
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
                  className="w-full sm:w-auto bg-white/60 backdrop-blur-sm"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>

          <img
            src="/Hero.jpg"
            alt="Career AI Hero Illustration"
            className="w-full h-auto rounded-xl border bg-card shadow-lg relative z-10"
          />
        </section>

        <Section id="features" title="Features" eyebrow="What students can do">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Top Section */}
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-400">01</span>
                <User className="size-5 text-gray-400" aria-hidden="true" />
              </div>
              {/* Middle Section - Image Area */}
              <div className="h-40 mx-4 rounded-lg overflow-hidden">
                <img
                  src="/1.jpg"
                  alt="Profile Setup Illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Bottom Section */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create Account</h3>
                <p className="text-sm text-slate-600">Register and complete your student profile.</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Top Section */}
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-400">02</span>
                <UploadCloud className="size-5 text-gray-400" aria-hidden="true" />
              </div>
              {/* Middle Section - Image Area */}
              <div className="h-40 mx-4 rounded-lg overflow-hidden">
                <img
                  src="/2.jpg"
                  alt="Resume Upload Illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Bottom Section */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Resume</h3>
                <p className="text-sm text-slate-600">Securely upload your PDF resume for analysis.</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Top Section */}
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-400">03</span>
                <Cpu className="size-5 text-gray-400" aria-hidden="true" />
              </div>
              {/* Middle Section - Image Area */}
              <div className="h-40 mx-4 rounded-lg overflow-hidden">
                <img
                  src="/3.jpg"
                  alt="AI Processing Illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Bottom Section */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">AI Analysis</h3>
                <p className="text-sm text-slate-600">Our AI extracts your skills and parses data instantly.</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
              {/* Top Section */}
              <div className="flex items-center justify-between p-4">
                <span className="text-sm font-medium text-gray-400">04</span>
                <LayoutDashboard className="size-5 text-gray-400" aria-hidden="true" />
              </div>
              {/* Middle Section - Image Area */}
              <div className="h-40 mx-4 rounded-lg overflow-hidden">
                <img
                  src="/4.jpg"
                  alt="Dashboard Matches Illustration"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Bottom Section */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-slate-900 mb-2">View Matches</h3>
                <p className="text-sm text-slate-600">Get personalized career paths on your dashboard.</p>
              </div>
            </div>
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
    <div className="bg-white border border-gray-200 rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg hover:shadow-blue-900/5 hover:border-blue-200">
      <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed">
        {description}
      </p>
    </div>
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

function DashboardPreview() {
  return (
    <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
      {/* Browser Window Header */}
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <div className="flex gap-2">
          <div className="size-3 rounded-full bg-red-500" />
          <div className="size-3 rounded-full bg-yellow-500" />
          <div className="size-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 mx-4">
          <div className="flex items-center gap-2 rounded-md bg-background px-3 py-1.5 text-sm text-muted-foreground">
            <LockKeyhole className="size-3" aria-hidden="true" />
            <span>career-ai.com/dashboard</span>
          </div>
        </div>
      </div>

      {/* Browser Content */}
      <div className="p-4 sm:p-6">
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
