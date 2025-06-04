"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function VerifyEmail() {
  const router = useRouter();

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
          We've sent you a verification email. Please check your inbox and click the verification link to activate your account.
        </p>

        <div className="space-y-4">
          <Button
            onClick={() => router.push("/")}
            className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold rounded-xl"
          >
            Go to Home
          </Button>
          
          <p className="text-sm text-gray-500">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 