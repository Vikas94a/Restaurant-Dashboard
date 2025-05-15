import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

export interface LogInProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface inputForm {
  email: string;
  password: string;
  error: string;
}

export default function Login({ isOpen, setIsOpen }: LogInProps) {
  const [form, setForm] = useState<inputForm>({
    email: "",
    password: "",
    error: "",
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const respond = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      if (respond) {
        toast.success("Login successful");
        setForm({
          email: "",
          password: "",
          error: "",
        });
        setIsOpen(false);
      }
    } catch (error: any) {
      console.log(error);
      if (error) {
        toast.error("Email or password is wrong");
      }
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
            <Label className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              name="email"
              type="email"
              id="email"
              value={form.email}
              onChange={handleInput}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              name="password"
              type="password"
              value={form.password}
              onChange={handleInput}
              id="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700"
              >
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            Sign in
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
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
