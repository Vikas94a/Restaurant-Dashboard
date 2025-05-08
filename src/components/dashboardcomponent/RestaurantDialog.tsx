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
import RestaurantType from "./RestaurantType";

interface OpeningHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface Restaurant {
  id?: string;
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

function RestaurantDialog({ isOpen, setIsOpen }: LogInProps) {
  const steps = ["Address", "TypeOfRestaurant", "Timing"];
  const [step, setStep] = useState(0);

  const [openingHours, setOpeningHours] = useState<OpeningHours[]>([]);

  const [restaurantData, setRestaurantData] = useState<Restaurant>({
    city: "",
    zipCode: "",
    streetName: "",
    phoneNumber: "",
    restaurantType: "",
    openingHours: [],
    logoUrl: "",
  });
  console.log(step);
  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurant details</DialogTitle>
            <form>
              {step === 0 && (
                <>
                  <Label>City</Label>
                  <Input name="city" />
                  <Label>Zip Code</Label>
                  <Input name="zipCode" />
                  <Label>Street Name</Label>
                  <Input name="streetName" />
                </>
              )}
              {step === 1 && (
                <>
                  <RestaurantType restaurantData={restaurantData}  setRestaurantData={setRestaurantData
                    
                  }/>
                </>
              )}
              {step === 2 && (
                <>
                  <Label>Opening hours</Label>
                  <Input name="opningHours" />
                  <Input name="xyz" />
                  <Input name="opnngHours" />
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
                  <Button>Submit</Button>
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
