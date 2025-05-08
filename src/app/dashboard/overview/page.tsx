"use client";

import React, { useEffect, useState } from "react";
import RestaurantDialog from "@/components/dashboardcomponent/RestaurantDialog";
import {
  getFirestore,
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase"; // Assuming db is your initialized Firestore instance

export default function OverviewPage() {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  return (
    <div>
      <RestaurantDialog isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
}
