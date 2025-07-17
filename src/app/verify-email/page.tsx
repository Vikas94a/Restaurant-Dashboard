"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import LogIn from "@/components/LogIn";

export default function VerifyEmail() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const checkAuthState = () => {
      const user = auth.currentUser;
      if (!user) {
        router.push('/');
        return;
      }

      if (user.emailVerified) {
        router.push('/dashboard/overview');
        return;
      }

      setEmail(user.email);
    };

    checkAuthState();

    // Set up an interval to check verification status
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          await user.reload();
          if (user.emailVerified) {
            router.push('/dashboard/overview');
          }
        } catch (error) {
          }
      } else {
        }
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, [router]);

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user, {
          url: `${window.location.origin}/verify-email`,
          handleCodeInApp: false,
        });
        setVerificationSent(true);
        toast.success("Verification email sent! Please check your inbox.");
      } else {
        toast.error("No user found. Please sign up again.");
        router.push('/signup');
      }
    } catch (error) {
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
          We&apos;ve sent you a verification email to{" "}
          <span className="font-semibold">{email}</span>. Please check your inbox and click the verification link to activate your account.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => setIsLoginOpen(true)}
            className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold rounded-xl"
          >
            Go to Login
          </Button>

          <p className="text-sm text-gray-500">
            Make sure to check your spam folder. If you still haven&apos;t received the email,  
            <button
              onClick={handleResendVerification}
              className="text-blue-600 hover:underline"
              disabled={isLoading || verificationSent}
            >
              click here to resend
            </button>
          </p>
        </div>
      </div>
      <LogIn isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
} 