"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Custom Dialog components for modal
import { Label } from "@/components/ui/label"; // Accessible label component
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase auth function to sign in user
import { auth } from "@/lib/firebase"; // Firebase auth instance
import { Input } from "./ui/input"; // Custom styled Input component
import { Button } from "./ui/button"; // Custom styled Button component
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner"; // Toast notification library for user feedback
import Link from "next/link"; // Next.js Link component for navigation
import { Loader2 } from "lucide-react"; // Loading spinner icon
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuthPersistence, setRememberMe } from "@/store/features/authSlice";
import { AppDispatch } from "@/store/store";

// Props for controlling open state of the login modal
export interface LogInProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

// Interface defining the shape of the form state
export interface InputForm {
  email: string;
  password: string;
  error: string;
}

// Add error message mapping
const ERROR_MESSAGES = {
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/network-request-failed': 'Network error. Please check your connection.',
  'auth/operation-not-allowed': 'Email/password sign in is not enabled.',
  'auth/persistence-error': 'Unable to save login preferences. Please try again.',
  'default': 'An unexpected error occurred. Please try again.'
};

export default function Login({ isOpen, setIsOpen }: LogInProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  // Form state to hold email, password, and any error message
  const [form, setForm] = useState<InputForm>({
    email: "",
    password: "",
    error: "",
  });

  // Loading state to indicate if login request is in progress
  const [loading, setLoading] = useState(false);

  // Ref for the email input to focus it automatically when modal opens
  const emailRef = useRef<HTMLInputElement>(null);

  // Remember Me state
  const [rememberMe, setRememberMeState] = useState(false);

  // Effect to autofocus email input when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Handler for input changes (email or password)
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, error: "" });
    // Update the specific field and clear any previous error
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMeState(e.target.checked);
  };

  // Helper function to get user-friendly error message
  const getErrorMessage = (error: any): string => {
    const errorCode = error?.code || 'default';
    return ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default;
  };

  // Form submit handler for login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation to check required fields
    if (!form.email || !form.password) {
      const errorMsg = "Please fill in all fields";
      setForm({ ...form, error: errorMsg });
      toast.error(errorMsg);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      const errorMsg = "Please enter a valid email address";
      setForm({ ...form, error: errorMsg });
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    try {
      // First set the persistence based on remember me choice
      try {
        await dispatch(setAuthPersistence(rememberMe)).unwrap();
        dispatch(setRememberMe(rememberMe));
      } catch (persistenceError: any) {
        console.error('Persistence error:', persistenceError);
        toast.error('Unable to save login preferences. Please try again.');
        return;
      }

      // Then attempt to sign in
      const response = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (response) {
        toast.success("Login successful");
        setForm({ email: "", password: "", error: "" });
        setIsOpen(false);
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error);
      setForm({ ...form, error: errorMessage });
      toast.error(errorMessage);

      // Clear password field on error for security
      setForm(prev => ({ ...prev, password: "" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    // Dialog component controlled by isOpen prop
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Modal content container with styling */}
      <DialogContent className="sm:max-w-[425px] p-8 bg-white rounded-2xl shadow-2xl border border-gray-100">
        {/* Header of the modal with title and description */}
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-3xl font-semibold text-center text-gray-900">
            Welcome Back
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500 text-base">
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>

        {/* Login form */}
        <form className="space-y-6 mt-6" onSubmit={handleSubmit}>
          {/* Email input field */}
          <div className="space-y-2">
            <Label
              htmlFor="email"
              className="text-sm font-medium text-gray-700"
            >
              Email
            </Label>
            <Input
              ref={emailRef} // Autofocus ref
              name="email"
              type="email"
              id="email"
              value={form.email}
              onChange={handleInput}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-gray-700"
            >
              Password
            </Label>
            <Input
              name="password"
              type="password"
              id="password"
              value={form.password}
              onChange={handleInput}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Display error message if any */}
          {form.error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm text-center">
              {form.error}
            </div>
          )}

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

        {/* Link to Signup page, closes modal on click */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-blue-600 hover:underline font-medium"
              onClick={() => setIsOpen(false)}
            >
              Sign up
            </Link>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
