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
        toast.success("login successfull");
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
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login</DialogTitle>
            <form
              className="h-50 flex  flex-col  justify-center items-center gap-4"
              onSubmit={handleSubmit}
            >
              <div className="w-full">
                <Label>Email</Label>
                <Input
                  name="email"
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={handleInput}
                  placeholder="yoursername@gmail.com"
                />
              </div>
              <div className="w-full">
                <Label>Password</Label>
                <Input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInput}
                  id="password"
                  placeholder="yoursername@gmail.com"
                />
              </div>
              <div className="mt-4 flex w-full justify-center items-center">
                <Button type="submit">Login</Button>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
