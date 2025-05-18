import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export interface LogInProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface InputForm {
  email: string;
  password: string;
  error: string;
}

export default function Login({ isOpen, setIsOpen }: LogInProps) {
  const [form, setForm] = useState<InputForm>({
    email: "",
    password: "",
    error: "",
  });
  const [loading, setLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  // Autofocus on email input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => emailRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value, error: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      setForm({ ...form, error: "Email and password are required." });
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      if (response) {
        toast.success("Login successful");
        setForm({ email: "", password: "", error: "" });
        setIsOpen(false);
      }
    } catch (error: any) {
      console.error(error);
      setForm({ ...form, error: "Email or password is incorrect." });
      toast.error("Email or password is incorrect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] p-6 bg-white rounded-xl shadow-lg">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            Welcome Back
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Enter your credentials to access your account
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-6 mt-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </Label>
            <Input
              ref={emailRef}
              name="email"
              type="email"
              id="email"
              value={form.email}
              onChange={handleInput}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
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
            />
          </div>

          {form.error && (
            <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded text-sm text-center">
              {form.error}
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-gray-600">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              />
              Remember me
            </label>
            <a href="#" className="text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full py-2"
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
