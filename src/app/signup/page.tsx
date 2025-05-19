"use client"; // Enables client-side rendering in Next.js

// Import necessary hooks, libraries, and components
import { useState } from "react";
import Image from "next/image";
import { Label } from "@radix-ui/react-label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Define the structure of the form state
export interface inputForm {
  restaurantName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function Signup() {
  const router = useRouter();

  // Form state for input values
  const [form, setForm] = useState<inputForm>({
    restaurantName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Handle input change and update form state
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getFirestore();

    // Basic validation check
    if (
      !form.email ||
      !form.password ||
      !form.firstName ||
      !form.restaurantName
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const userID = userCredential.user.uid;

      // Store user details in Firestore
      await setDoc(doc(db, "users", userID), {
        restaurantName: form.restaurantName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });

      toast.success("Signup successful!");
      router.push("/dashboard"); // Redirect to dashboard after successful signup
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Try again."); // Show error if signup fails
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-14">
        {/* Left: Signup Form */}
        <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900">
                Create Your Account
              </h1>
              <p className="mt-2 text-gray-600 text-sm">
                Join AI Eat Easy and elevate your restaurant's online
                experience.
              </p>
            </div>

            {/* Form Starts */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Restaurant Name */}
              <div className="space-y-2">
                <Label htmlFor="restaurantName">Restaurant Name</Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="My Indian Delight"
                  value={form.restaurantName}
                  onChange={handleInput}
                  required
                />
              </div>

              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleInput}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@restaurant.com"
                  value={form.email}
                  onChange={handleInput}
                  required
                />
              </div>

              {/* Password with toggle */}
              <div className="space-y-2 relative">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleInput}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-sm text-blue-500 hover:underline"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Create Account
              </Button>
            </form>

            {/* Link to Login */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: Branding image and background effect */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <Image
              src="/images/logo.png"
              alt="AI Eat Easy Logo"
              width={500}
              height={400}
              className="w-full h-auto object-contain transition-transform duration-300 hover:scale-105"
            />
            {/* Decorative gradient background blur */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
