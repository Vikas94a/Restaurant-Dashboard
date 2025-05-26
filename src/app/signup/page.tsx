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
      router.push("/dashboard/overview"); // Redirect to dashboard after successful signup
    } catch (error: any) {
      toast.error(error.message || "Signup failed. Try again."); // Show error if signup fails
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-16">
        {/* Left: Signup Form */}
        <div className="w-full lg:w-1/2 bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-12 transition-all duration-300">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 leading-tight">
                Create Your Account
              </h1>
              <p className="mt-2 text-gray-600 text-base">
                Join{" "}
                <span className="font-medium text-blue-600">AI Eat Easy</span>{" "}
                and elevate your restaurant’s experience.
              </p>
            </div>

            {/* Form Starts */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Restaurant Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="restaurantName"
                  className="text-sm font-medium text-gray-700"
                >
                  Restaurant Name
                </Label>
                <Input
                  id="restaurantName"
                  name="restaurantName"
                  placeholder="My Indian Delight"
                  value={form.restaurantName}
                  onChange={handleInput}
                  required
                  className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={form.firstName}
                    onChange={handleInput}
                    required
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleInput}
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="you@restaurant.com"
                  value={form.email}
                  onChange={handleInput}
                  required
                  className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              {/* Password with toggle */}
              <div className="space-y-2 relative">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleInput}
                  required
                  className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-sm text-blue-500 hover:underline focus:outline-none"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold rounded-xl transition-all duration-200"
              >
                Create Account
              </Button>
            </form>

            {/* Link to Login */}
            <p className="text-center text-sm text-gray-600 pt-4">
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

        {/* Right: Branding Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-md">
            <Image
              src="/images/logo.png"
              alt="AI Eat Easy Logo"
              width={600}
              height={400}
              className="w-full h-auto object-contain transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-500/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
