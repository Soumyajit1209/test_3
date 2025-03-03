"use client";

import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { UserButton } from "@/components/user-button";

const AnimatedBackground = dynamic(
  () => import("../components/animated-background"),
  {
    ssr: false,
  }
);

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerAnimation = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const textAnimation = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
        duration: 0.8,
      },
    },
  };

  const letterAnimation = {
    hidden: { opacity: 0, y: 50, rotateX: -90 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        delay: i * 0.05,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  const mobileAnimation = {
    hidden: { opacity: 0, scale: 0.8, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        duration: 1,
      },
    },
  };

  const buttonAnimation = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1 + 0.5,
        type: "spring",
        stiffness: 100,
        damping: 8,
      },
    }),
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen bg-[#030303] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/30 to-black/70 pointer-events-none z-10" />
      <AnimatedBackground />
      
      {/* Auth header section */}
      <div className="absolute top-6 right-6 z-30">
        {isLoaded && isSignedIn ? (
          <UserButton />
        ) : (
          <div className="flex space-x-3">
            <motion.div 
              custom={0}
              variants={buttonAnimation}
              initial="hidden"
              animate="visible"
            >
              <SignInButton mode="modal">
                <Button 
                  variant="outline" 
                  className="border-gray-700 text-gray-200 hover:bg-gray-800 hover:text-white transition-all duration-300"
                  size="sm"
                >
                  Sign In
                </Button>
              </SignInButton>
            </motion.div>
            <motion.div 
              custom={1}
              variants={buttonAnimation}
              initial="hidden"
              animate="visible"
            >
              <SignUpButton mode="modal">
                <Button 
                  className="bg-gradient-to-r from-gray-700 to-gray-900 text-white border border-gray-800 
                  hover:from-gray-600 hover:to-gray-800 transition-all duration-300"
                  size="sm"
                >
                  Sign Up
                </Button>
              </SignUpButton>
            </motion.div>
          </div>
        )}
      </div>

      <div className="container relative z-20 mx-auto px-20 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Left Column */}
          <motion.div
            variants={containerAnimation}
            initial="hidden"
            animate="visible"
            className="space-y-10"
          >
            <motion.h1
              className="text-7xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight"
              style={{
                WebkitBackgroundClip: "text",
                filter: "drop-shadow(0 0 25px rgba(255,255,255,0.15))",
              }}
              variants={textAnimation}
            >
              azmth
            </motion.h1>

            <div className="h-12">
              {"Better Everyday".split("").map((char, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={letterAnimation}
                  className="text-gray-400 text-2xl inline-block tracking-widest px-[0.15em]"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>

            <motion.div variants={textAnimation}>
              <Link href="/personal-assistant">
                <Button
                  className="bg-gradient-to-r from-gray-800 to-gray-900 text-white border border-gray-800 
                            hover:from-gray-700 hover:to-gray-800 shadow-xl hover:shadow-2xl hover:scale-105 
                            transition-all duration-300 tracking-wide"
                  size="lg"
                >
                  Get Personal Assistant
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Column - Mobile UI */}
          <motion.div
            variants={mobileAnimation}
            initial="hidden"
            animate="visible"
            className="relative flex justify-center items-center"
          >
            <div
              className="w-[280px] h-[500px] rounded-[35px] bg-gradient-to-b from-gray-900 to-black p-5 
                          border border-gray-800 shadow-[0_0_50px_rgba(255,255,255,0.05)] relative overflow-hidden
                          hover:shadow-[0_0_70px_rgba(255,255,255,0.08)] transition-all duration-500"
            >
              {/* Glossy effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.05),transparent_70%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/10 to-black/20" />

              <div className="space-y-6 relative z-10">
                {/* Notch design */}
                <div className="w-24 h-6 mx-auto bg-black rounded-b-2xl flex items-center justify-center">
                  <div className="w-16 h-3 bg-gray-900 rounded-full" />
                </div>

                <div className="h-16">
                  {"Talk with azmth".split("").map((char, i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={letterAnimation}
                      className="text-gray-300 text-base inline-block tracking-wider px-[0.12em]"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </div>

                <div className="relative group">
                  <div
                    className="absolute -inset-1 bg-gradient-to-r from-gray-600/20 to-gray-400/20 blur-lg 
                                animate-pulse group-hover:from-gray-500/30 group-hover:to-gray-300/30 
                                transition-all duration-300"
                  />
                  <Link href="/azmth-chat" className="block">
                    <Input
                      className="bg-gray-900/50 border-gray-800 text-gray-200 relative cursor-pointer 
                                hover:bg-gray-800/50 transition-colors text-sm tracking-wide
                                focus:ring-2 focus:ring-gray-700 focus:border-gray-600"
                      placeholder="Type your message..."
                      readOnly
                    />
                  </Link>
                </div>

                {/* Bottom line */}
                {/* <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full" /> */}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}