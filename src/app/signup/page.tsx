"use client"; // Enables client-side rendering in Next.js

// Import necessary hooks, libraries, and components
import { useState } from "react";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createUserWithEmailAndPassword, sendEmailVerification, AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { validateDomain } from "@/utils/domainValidation";

// Define the structure of the form state
export interface inputForm {
  restaurantName: string;
  domain: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function Signup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Form state for input values
  const [form, setForm] = useState<inputForm>({
    restaurantName: "",
    domain: "",
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
    setIsLoading(true);
    const db = getFirestore();

    // Basic validation check
    if (
      !form.email ||
      !form.password ||
      !form.firstName ||
      !form.restaurantName ||
      !form.domain
    ) {
      toast.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    // Validate domain format
    const domainValidation = validateDomain(form.domain);
    if (!domainValidation.isValid) {
      toast.error(domainValidation.error || "Invalid domain format");
      setIsLoading(false);
      return;
    }

    // Check if domain is already taken
    try {
      const domainQuery = query(collection(db, "restaurants"), where("domain", "==", form.domain));
      const domainSnapshot = await getDocs(domainQuery);
      if (!domainSnapshot.empty) {
        toast.error("This domain is already taken. Please choose a different one.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      toast.error("Error checking domain availability. Please try again.");
      setIsLoading(false);
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
      
      // Store user details in Firestore first
      await setDoc(doc(db, "users", userID), {
        restaurantName: form.restaurantName,
        domain: form.domain,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });
      // Send verification email
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/verify-email`,
        handleCodeInApp: false,
      });
      // Sign out the user after successful signup
      await auth.signOut();
      
      // Show success message and redirect
      toast.success("Account created! Please check your email to verify your account.");
      router.push("/verify-email");
    } catch (error) {
      const authError = error as AuthError;
      let errorMessage = "Signup failed. Please try again.";
      
      if (authError.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please try logging in instead.";
      } else if (authError.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (authError.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters long.";
      } else if (authError.message) {
        errorMessage = authError.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
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
                and elevate your restaurant&apos;s experience.
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
                  Restaurant Name <span className="text-red-500">*</span>
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

              {/* Domain */}
              <div className="space-y-2">
                <Label
                  htmlFor="domain"
                  className="text-sm font-medium text-gray-700"
                >
                  Your Domain <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="domain"
                    name="domain"
                    placeholder="myindian-delight"
                    value={form.domain}
                    onChange={handleInput}
                    required
                    className="rounded-xl border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pr-20"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">.aieateasy.no</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  This will be your unique URL: <span className="font-mono text-blue-600">{form.domain || 'your-domain'}.aieateasy.no</span>
                </p>
              </div>

              {/* First & Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className="text-sm font-medium text-gray-700"
                  >
                    First Name <span className="text-red-500">*</span>
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
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={form.lastName}
                    onChange={handleInput}
                    required
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
                  Email <span className="text-red-500">*</span>
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
                  Password <span className="text-red-500">*</span>
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
                disabled={isLoading}
                className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold rounded-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Link to Login */}
            <div className="text-sm">
              <p>Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
              <p className="mt-2">By signing up, you&apos;re agreeing to our Terms of Service.</p>
            </div>
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
