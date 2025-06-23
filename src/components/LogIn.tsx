"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner"; // Toast notification library for user feedback
import Link from "next/link"; // Next.js Link component for navigation
import { Loader2, Mail, AlertCircle } from "lucide-react"; // Loading spinner icon, email icon, and alert icon
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setAuthPersistence, setRememberMe, fetchUserData, fetchRestaurantData } from "@/store/features/authSlice";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth"; // Firebase auth function to sign in user and send email verification
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase"; // Firebase auth instance

// Props for controlling open state of the login modal
export interface LogInProps {
  isOpen: boolean;  // Changed from isLoginOpen
  onClose: () => void;  // Changed from setIsLoginOpen
}

// Interface defining the shape of the form state
export interface InputForm {
  email: string;
  password: string;
  error: string;
}

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login({ isOpen, onClose }: LogInProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMeState] = useState(false);
  const [showVerificationUI, setShowVerificationUI] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMeState(e.target.checked);
  };

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        toast.success("Verification email sent! Please check your inbox.");
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await dispatch(setAuthPersistence(rememberMe)).unwrap();
      dispatch(setRememberMe(rememberMe));

      const response = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (response.user) {
        // Step 1: Check email verification
        if (!response.user.emailVerified) {
          setVerificationEmail(response.user.email || "");
          setShowVerificationUI(true);
          toast.error("Please verify your email before logging in.");
          await auth.signOut();
          return;
        }

        // Step 2: Fetch user data
        const userData = await dispatch(fetchUserData(response.user)).unwrap();
        
        if (userData) {
          // Step 3: Check restaurant details
          const restaurantData = await dispatch(fetchRestaurantData(userData.uid)).unwrap();
          
          if (!restaurantData || !restaurantData.streetName) {
            // If no restaurant details, redirect to restaurant setup
            toast.info("Please complete your restaurant setup first.");
            onClose();
            router.push('/dashboard/overview');
            return;
          }

          // All checks passed, proceed to dashboard
          toast.success("Login successful");
          onClose();
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Handle specific Firebase auth errors
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setError('Invalid email or password');
            break;
          case 'auth/invalid-email':
            setError('Please enter a valid email address');
            break;
          case 'auth/too-many-requests':
            setError('Too many failed attempts. Please try again later');
            break;
          default:
            setError('Invalid email or password');
        }
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // Dialog component controlled by isOpen prop
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        setShowVerificationUI(false);
      }
    }}>
      {/* Modal content container with styling */}
      <DialogContent className="sm:max-w-[425px] p-8 bg-white rounded-2xl shadow-2xl border border-gray-100 fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] z-50">
        {/* Header of the modal with title and description */}
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-3xl font-semibold text-center text-gray-900">
            {showVerificationUI ? "Verify Your Email" : "Welcome Back"}
          </DialogTitle>
        </DialogHeader>

        {showVerificationUI ? (
          <div className="space-y-6 mt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Mail className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-gray-600">
                We&apos;ve sent a verification email to <span className="font-semibold">{verificationEmail}</span>
              </p>
              <p className="text-sm text-gray-500">
                Please check your inbox and click the verification link to continue.
              </p>
            </div>
            <div className="space-y-4">
              <Button
                onClick={handleResendVerification}
                className="w-full py-3 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4" /> Sending...
                  </span>
                ) : (
                  "Resend Verification Email"
                )}
              </Button>
              <Button
                onClick={() => setShowVerificationUI(false)}
                variant="outline"
                className="w-full py-3 rounded-xl text-base font-semibold"
              >
                Back to Login
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            {/* Email input field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full p-2 border rounded-md"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Password input field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full p-2 border rounded-md"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-red-500 text-sm">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me checkbox and forgot password link */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleRememberMeChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition"
                />
                Remember me
              </label>
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit button, shows loader when logging in */}
            <Button
              type="submit"
              className="w-full py-3 rounded-xl text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" /> Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        )}

        {!showVerificationUI && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
