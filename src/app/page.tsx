"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSpring, animated } from "react-spring";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, useAuth } from "@clerk/nextjs";

export default function Component() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "parakletos";

  useEffect(() => {
    if (isSignedIn) {
      router.push("/home");
    }
  }, [isSignedIn, router]);

  useEffect(() => {
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < fullText.length) {
        setText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, 150);

    return () => clearInterval(typingEffect);
  }, []);

  useEffect(() => {
    const cursorEffect = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorEffect);
  }, []);

  const fadeIn = useSpring({
    from: { opacity: 0, transform: "translateY(20px)" },
    to: { opacity: 1, transform: "translateY(0)" },
    delay: 1500,
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="shimmer"></div>
      </div>
      <div className="relative z-10 text-center">
        <h1 className="text-6xl font-bold mb-8 text-emerald-800">
          {text}
          <span className={showCursor ? "opacity-100" : "opacity-0"}>|</span>
        </h1>
        <animated.div style={fadeIn}>
          <p className="text-xl text-emerald-700 mb-8 max-w-md">
            Your personal helper for sermon and bible study note-taking
          </p>
          <div className="flex justify-center space-x-4">
            <SignedOut>
              <SignInButton>
                <button className="bg-white hover:bg-gray-100 text-emerald-600 font-bold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg w-40">
                    Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </animated.div>
      </div>
    </div>
  );
}
