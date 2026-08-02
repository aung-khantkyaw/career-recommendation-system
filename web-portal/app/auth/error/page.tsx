import Link from "next/link"
import { AlertTriangle, ArrowLeft, Home, LogIn } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Authentication setup needs attention",
    description:
      "The sign-in service is missing required configuration. Please check the app environment settings and try again.",
  },
  AccessDenied: {
    title: "Access denied",
    description:
      "Your account does not have permission to access this area.",
  },
  Verification: {
    title: "Verification link expired",
    description:
      "The sign-in link is no longer valid. Please request a new one.",
  },
  default: {
    title: "We could not complete sign in",
    description:
      "Something went wrong while opening the authentication flow. Please try again.",
  },
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const code = params.error || "default"
  const message = errorMessages[code] || errorMessages.default

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg border bg-muted">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">{message.title}</CardTitle>
          <CardDescription className="mx-auto max-w-sm">
            {message.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
            Error code: <span className="font-medium text-foreground">{code}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/login">
              <Button className="w-full">
                <LogIn className="size-4" aria-hidden="true" />
                Back to Login
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <Home className="size-4" aria-hidden="true" />
                Go Home
              </Button>
            </Link>
          </div>
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Create a new account instead
          </Link>
        </CardContent>
      </Card>
    </main>
  )
}
