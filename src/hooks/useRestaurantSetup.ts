import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Restaurant, OpeningHours, day } from "@/components/dashboardcomponent/RestaurantDialog";

// Custom hook to manage editing and saving restaurant details including opening hours
export const useRestaurantSetup = (
  restaurantDetails: Restaurant | null,
  userId: string | undefined
) => {
  // Editable restaurant details state (partial because editing might not include all fields)
  const [editableDetails, setEditableDetails] = useState<Partial<Restaurant>>({});
  // Editable opening hours state, an array representing each day's open/close info
  const [editableHours, setEditableHours] = useState<OpeningHours[]>([]);
  // Flag to track saving state during update
  const [isSaving, setIsSaving] = useState(false);
  // Flag to track whether currently in edit mode or not
  const [isEditing, setIsEditing] = useState(false);
  // Store original restaurant details to revert changes if editing is canceled
  const [originalDetails, setOriginalDetails] = useState<Partial<Restaurant>>({});
  // Store original opening hours to revert if needed
  const [originalHours, setOriginalHours] = useState<OpeningHours[]>([]);

  // Effect to sync editable state when restaurantDetails change
  useEffect(() => {
    if (!restaurantDetails) {
      setEditableDetails({});
      setOriginalDetails({});
      setEditableHours([]);
      setOriginalHours([]);
      return;
    }

    // Initialize editable details with a copy of original
    setEditableDetails({ ...restaurantDetails });
    setOriginalDetails({ ...restaurantDetails });

    // Initialize opening hours or default all days as closed if none provided
    let hoursData = restaurantDetails.openingHours || [];

    if (hoursData.length === 0) {
      // Create default closed hours for all days
      hoursData = day.map(dayName => ({
        day: dayName,
        open: "",
        close: "",
        closed: true,
      }));
    } else {
      // Ensure every day of the week is present, add missing days as closed
      const existingDays = hoursData.map(h => h.day.toLowerCase());
      day.forEach(dayName => {
        if (!existingDays.includes(dayName.toLowerCase())) {
          hoursData.push({
            day: dayName,
            open: "",
            close: "",
            closed: true,
          });
        }
      });
    }

    setEditableHours(hoursData);
    setOriginalHours([...hoursData]);
  }, [restaurantDetails]);

  // Update editable restaurant details state when user edits form fields
  const handleDetailsChange = (details: Partial<Restaurant>) => {
    setEditableDetails(details);
  };

  // Toggle edit mode on/off.
  // If turning edit off (cancel), revert changes to original details and hours.
  const toggleEdit = () => {
    if (isEditing) {
      setEditableDetails({ ...originalDetails });
      setEditableHours([...originalHours]);
    }
    setIsEditing(!isEditing);
  };

  // Save changes to Firestore database
  const handleSaveChanges = async () => {
    if (!userId || !restaurantDetails?.restaurantId) {
      toast.error("User not authenticated or restaurant not found");
      return;
    }

    setIsSaving(true);

    try {
      // Normalize opening hours: clear open/close times if marked as closed
      const validHours = editableHours.map(hour => ({
        ...hour,
        open: hour.closed ? "" : hour.open || "",
        close: hour.closed ? "" : hour.close || "",
      }));

      const restaurantRef = doc(db, "restaurants", restaurantDetails.restaurantId);

      // Prepare update payload including updatedAt timestamp
      const firestoreUpdate = {
        ...editableDetails,
        openingHours: validHours,
        updatedAt: serverTimestamp(),
      };

      // Update document in Firestore
      await updateDoc(restaurantRef, firestoreUpdate);

      // Update originals after successful save and exit edit mode
      setOriginalDetails({ ...editableDetails });
      setOriginalHours([...validHours]);

      toast.success("Restaurant details updated successfully!");
    } catch (error) {
      console.error("Error updating restaurant:", error);
      toast.error("Failed to update restaurant details. Please try again.");
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  // Return state and handlers for component consumption
  return {
    editableDetails,
    editableHours,
    isSaving,
    isEditing,
    handleDetailsChange,
    toggleEdit,
    handleSaveChanges,
    setEditableHours,
  };
};
