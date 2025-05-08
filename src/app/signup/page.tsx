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

      toast.success("SignUp successfully");
      console.log(form);
      router.push("/dashboard");
    } catch (error: any) {
      if (error) {
        toast.error("Something is missing");
      }
    }
  };

  return (
    <div className="flex justify-between items-center flex-row-reverse p-1">
      <div className="w-120  mr-19 border-1 rounded-2xl  p-5  shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h3>Signup</h3>
          <div>
            <Label>Restaurant Name</Label>
            <Input
              type="restaurantName"
              value={form.restaurantName}
              onChange={handleInput}
              name="restaurantName"
              id="restaurantName"
              placeholder="Restaurant Name"
            />
          </div>
          <div>
            <Label>First Name</Label>
            <Input
              type="firstName"
              value={form.firstName}
              onChange={handleInput}
              name="firstName"
              id="firstName"
              placeholder="First Name"
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              type="lastName"
              value={form.lastName}
              onChange={handleInput}
              name="lastName"
              id="lastName"
              placeholder="Last Name"
            />
          </div>
          <div>
            <Label>Email </Label>
            <Input
              type="email"
              value={form.email}
              onChange={handleInput}
              name="email"
              id="email"
              placeholder="Email"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={handleInput}
              name="password"
              id="password"
              placeholder="***********"
            />
          </div>
          <div>
            <Button type="submit">Signup</Button>
          </div>
        </form>
      </div>
      <div>
        <Image
          src="/images/Ai-Eat-Easy logo.png"
          alt="Company Logo"
          height={400}
          width={500}
        />
      </div>
    </div>
  );
}

export default Signup;
