"use client";
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

export interface inputForm {
  restaurantName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

function Signup() {
  const router = useRouter();
  const [form, setForm] = useState<inputForm>({
    restaurantName: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = getFirestore();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const user = userCredential.user;
      const userID = user.uid;

      const data = await setDoc(doc(db, "users", userID), {
        restaurantName: form.restaurantName,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
      });

      toast.success("SignUp successful");
      router.push("/dashboard");
    } catch (error: any) {
      if (error) {
        toast.error("Something is missing");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>
              <p className="mt-2 text-gray-600">Join AI Eat Easy and transform your restaurant's online presence</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Restaurant Name</Label>
                <Input
                  type="text"
                  value={form.restaurantName}
                  onChange={handleInput}
                  name="restaurantName"
                  id="restaurantName"
                  placeholder="Enter your restaurant name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">First Name</Label>
                  <Input
                    type="text"
                    value={form.firstName}
                    onChange={handleInput}
                    name="firstName"
                    id="firstName"
                    placeholder="Enter your first name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                  <Input
                    type="text"
                    value={form.lastName}
                    onChange={handleInput}
                    name="lastName"
                    id="lastName"
                    placeholder="Enter your last name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={handleInput}
                  name="email"
                  id="email"
                  placeholder="Enter your email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={handleInput}
                  name="password"
                  id="password"
                  placeholder="Create a strong password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <Button 
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Create Account
              </Button>
            </form>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <Image
              src="/images/Ai-Eat-Easy logo.png"
              alt="Company Logo"
              width={500}
              height={400}
              className="w-full h-auto object-contain transform hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
