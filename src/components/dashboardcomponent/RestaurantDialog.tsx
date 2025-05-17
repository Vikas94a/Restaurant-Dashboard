"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { LogInProps } from "@/components/LogIn";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import RestaurantType from "./RestaurantType";
import RestaurantTiming from "./RestaurantTiming";
import { useContext } from "react";
import { AppContext } from "@/context/Authcontext";

export interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Restaurant {
  restaurantId?: string;
  ownerId?: string;
  city: string;
  zipCode: string;
  streetName: string;
  phoneNumber: string;
  restaurantType: string;
  openingHours: OpeningHours[];
  logoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * RestaurantDialog Component
 *
 * A multi-step dialog for collecting restaurant information including:
 * - Address details
 * - Restaurant type
 * - Opening hours
 *
 * @param {LogInProps} props - Component props
 * @param {boolean} props.isOpen - Controls dialog visibility
 * @param {function} props.setIsOpen - Function to update dialog visibility
 */

export const day = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];
function RestaurantDialog({ isOpen, setIsOpen }: LogInProps) {
  const steps = ["Address", "TypeOfRestaurant", "Timing"];
  const [step, setStep] = useState(0);

  const [openingHours, setOpeningHours] = useState<OpeningHours[]>(
    day.map((day) => ({
      day,
      open: "",
      close: "",
      closed: false,
    }))
  );

  const [restaurantData, setRestaurantData] = useState<Restaurant>({
    restaurantId:"",
    ownerId: "",
    city: "",
    zipCode: "",
    streetName: "",
    phoneNumber: "",
    restaurantType: "",
    openingHours: openingHours,
    logoUrl: "",
  });

  const handleForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRestaurantData({ ...restaurantData, [e.target.name]: e.target.value });
  };
  const context = useContext(AppContext);
  if (!context) {
    console.log("Context is null");
    return null;
  }
  const { user, loading, setLoading } = context;
  console.log(user);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const refRestaurantCollection = await addDoc(
        collection(db, "restaurants"),
        {
          ...restaurantData,
          ownerId: user.uid,
          openingHours: openingHours,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      if (refRestaurantCollection) {
        setIsOpen(false);
        toast.success("Restauant information updated successfully");
      }
    } catch (error) {
      console.log(error);
    }
  };

  console.log(restaurantData);
  return (
    <div className="">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center font-bold  text-2xl text-gray-900">
              Restaurant details
            </DialogTitle>
            <form className="flex flex-col space-y-5" onSubmit={handleSubmit}>
              {step === 0 && (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <Input
                      name="city"
                      value={restaurantData.city}
                      onChange={handleForm}
                      placeholder="City name*"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  <div>
                    <Label>Zip Code</Label>
                    <Input
                      name="zipCode"
                      value={restaurantData.zipCode}
                      onChange={handleForm}
                      placeholder="0000*"
                      required
                    />
                  </div>
                  <div>
                    <Label>Street Name</Label>
                    <Input
                      name="streetName"
                      value={restaurantData.streetName}
                      onChange={handleForm}
                      placeholder="Street Name*"
                      required
                    />
                  </div>
                  <div>
                    <Label>Phone Number</Label>
                    <Input
                      name="phoneNumber"
                      value={restaurantData.phoneNumber}
                      onChange={handleForm}
                      placeholder="00000000*"
                      required
                    />
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <RestaurantType
                    restaurantData={restaurantData}
                    setRestaurantData={setRestaurantData}
                    handleForm={handleForm}
                  />
                </>
              )}
              {step === 2 && (
                <>
                  <RestaurantTiming
                    openingHours={openingHours}
                    setOpeningHours={setOpeningHours}
                  />
                </>
              )}
              <div className="flex  justify-between">
                <Button
                  type="button"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
                {step < steps.length - 1 ? (
                  <Button type="button" onClick={() => setStep(step + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit">Submit</Button>
                )}
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RestaurantDialog;
