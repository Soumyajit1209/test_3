"use client"

import { useAuth, UserButton as ClerkUserButton } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function UserButton() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  // Handle sign out redirect
  const handleSignOut = () => {
    router.push("/")
  }

  // Redirect to home if not signed in (for protected pages)
  useEffect(() => {
    if (isLoaded && !isSignedIn && window.location.pathname !== "/") {
      router.push("/")
    }
  }, [isSignedIn, isLoaded, router])

  if (!isLoaded || !isSignedIn) return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <ClerkUserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonBox: "hover:scale-105 transition-transform",
            userButtonTrigger: "rounded-full ring-2 ring-gray-800 hover:ring-gray-600",
          },
        }}
      />
    </div>
  )
}

