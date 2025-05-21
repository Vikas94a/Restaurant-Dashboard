import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"; // Custom Dialog components for modal
import { Label } from "@radix-ui/react-label"; // Accessible label component
import { signInWithEmailAndPassword } from "firebase/auth"; // Firebase auth function to sign in user
import { auth } from "@/lib/firebase"; // Firebase auth instance
import { Input } from "./ui/input"; // Custom styled Input component
import { Button } from "./ui/button"; // Custom styled Button component
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner"; // Toast notification library for user feedback
import Link from "next/link"; // Next.js Link component for navigation
import { Loader2 } from "lucide-react"; // Loading spinner icon

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

export default function Login({ isOpen, setIsOpen }: LogInProps) {
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

  // Form submit handler for login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation to check required fields
    if (!form.email || !form.password) {
      setForm({ ...form, error: "Email and password are required." });
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true); // Show loading spinner

    try {
      // Attempt to sign in with Firebase auth
      const response = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      if (response) {
        toast.success("Login successful");
        setForm({ email: "", password: "", error: "" }); // Reset form on success
        setIsOpen(false); // Close modal
      }
    } catch (error: any) {
      console.error(error);
      setForm({ ...form, error: "Email or password is incorrect." }); // Show error on failure
      toast.error("Email or password is incorrect");
    } finally {
      setLoading(false); // Hide loading spinner
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
