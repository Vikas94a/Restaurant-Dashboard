"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User, sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.emailVerified) {
          toast.success("Email verified! Redirecting to home...");
          router.push("/");
        }
      } else {
        toast.error("You are not logged in. Redirecting to signup.");
        router.push("/signup");
      }
      setLoadingUser(false);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (user && !user.emailVerified) {
      setIsCheckingStatus(true);
      intervalId = setInterval(async () => {
        try {
          // Ensure user is still available before reloading
          if (auth.currentUser) {
            await auth.currentUser.reload();
            const freshUser = auth.currentUser;
            if (freshUser && freshUser.emailVerified) {
              setUser(freshUser);
              toast.success("Email successfully verified! Redirecting...");
              router.push("/");
              clearInterval(intervalId);
            }
          } else {
            // User became null, stop checking
            clearInterval(intervalId);
            setIsCheckingStatus(false);
          }
        } catch (error) {
          console.error("Error reloading user:", error);
          toast.error("Could not check verification status. Please try logging in again if issues persist.");
          clearInterval(intervalId);
        }
      }, 3000);
    } else {
      setIsCheckingStatus(false);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, router]);

  const handleResendVerificationEmail = async () => {
    if (!user) {
      toast.error("No user found. Please log in again.");
      return;
    }
    if (!canResend) {
      toast.info("Please wait before trying to resend the email.");
      return;
    }

    setIsResendingEmail(true);
    setCanResend(false);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Error resending verification email:", error);
      if (error.code === "auth/too-many-requests") {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error("Failed to resend verification email. Please try again.");
      }
    } finally {
      setIsResendingEmail(false);
      // Disable resend for a short period (e.g., 30 seconds)
      setTimeout(() => setCanResend(true), 30000);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  // This case should ideally be caught by the initial onAuthStateChanged or the interval
  // But as a fallback, if the component re-renders and user is verified, redirect.
  if (user && user.emailVerified) {
    if (typeof window !== "undefined") router.push("/");
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <p>Email already verified. Redirecting...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 text-center">
        <div className="mb-6">
          <Image
            src="/images/logo.png"
            alt="AI Eat Easy Logo"
            width={200}
            height={150}
            className="mx-auto"
          />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verify Your Email
        </h1>
        
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a verification email to <strong>{user?.email || "your email address"}</strong>.
          Please check your inbox (and spam folder) and click the verification link to activate your account.
        </p>

        {isCheckingStatus && (
            <div className="flex items-center justify-center text-sm text-gray-500 my-4">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span>Waiting for email verification...</span>
            </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={() => router.push("/")}
            className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold rounded-xl"
          >
            Go to Home (Verification Still Pending)
          </Button>

          <Button
            onClick={handleResendVerificationEmail}
            disabled={isResendingEmail || !canResend}
            variant="outline"
            className="w-full py-3 text-blue-600 border-blue-600 hover:bg-blue-50 disabled:opacity-70"
          >
            {isResendingEmail ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {isResendingEmail ? "Sending..." : "Resend Verification Email"}
          </Button>
          {!canResend && !isResendingEmail && (
            <p className="text-xs text-gray-500">You can resend the email again shortly.</p>
          )}
          
          <p className="text-sm text-gray-500 mt-2">
            If you&apos;ve already verified in another tab/browser, this page will redirect automatically soon.
          </p>
        </div>
      </div>
    </div>
  );
}