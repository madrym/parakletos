"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/clerk-react";
import { Authenticated, Unauthenticated, useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "react-hot-toast";
import { useUser } from "@clerk/nextjs";

export default function Component() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 overflow-hidden">
      <h1 className="text-6xl font-bold mb-8 text-emerald-800">
        <AnimatedTitle />
      </h1>
      <p className="text-xl text-emerald-700 mb-8 max-w-md text-center">
        Your personal helper for sermon and bible study note-taking
      </p>
      <Unauthenticated>
        <SignInButton mode="modal">
          <button className="bg-white hover:bg-gray-100 text-emerald-600 font-bold py-3 px-6 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg w-40">
            Sign In
          </button>
        </SignInButton>
      </Unauthenticated>
      <Authenticated>
        <Content />
      </Authenticated>
    </main>
  );
}

function AnimatedTitle() {
  const [text, setText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const fullText = "parakletos";

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

  return (
    <>
      {text}
      <span className={showCursor ? "opacity-100" : "opacity-0"}>|</span>
    </>
  );
}

function Content() {
  const router = useRouter();
  const createUser = useMutation(api.users.createUser);
  const { user } = useUser();
  const userQuery = useQuery(api.users.getUser, { tokenIdentifier: user?.id ?? '' });

  useEffect(() => {
    const handleUserCreation = async () => {
      try {
        await createUser({ tokenIdentifier: user?.id ?? '' });
        router.push("/home");
      } catch (error) {
        console.error("Error creating user:", error);
        toast.error("Error creating user and logging in");
      }
    };

    if (userQuery === null) {
      handleUserCreation();
    } else if (user) {
      router.push("/home");
    }
  }, [user, router, userQuery, createUser]);

  return <div>Loading...</div>;
}

