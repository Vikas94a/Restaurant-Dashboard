import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Restaurant, OpeningHours, day } from "@/components/dashboardcomponent/RestaurantDialog";

// Types
interface UseRestaurantSetupProps {
  restaurantDetails: Restaurant | null;
  userId: string;
}

interface UseRestaurantSetupReturn {
  editableDetails: Partial<Restaurant>;
  editableHours: OpeningHours[];
  isSaving: boolean;
  isEditing: boolean;
  handleDetailsChange: (details: Partial<Restaurant>) => void;
  toggleEdit: () => void;
  handleSaveChanges: () => Promise<void>;
  setEditableHours: React.Dispatch<React.SetStateAction<OpeningHours[]>>;
}

// Validation functions
const validateOpeningHours = (hours: OpeningHours[]): boolean => {
  return hours.every(hour => {
    if (hour.closed) return true;
    if (!hour.open || !hour.close) return false;
    return true;
  });
};

  const validateRestaurantDetails = (details: Partial<Restaurant>): boolean => {
    const requiredFields = ['streetName', 'zipCode', 'city', 'phoneNumber'] as const;
    return requiredFields.every(field => {
      const value = details[field as keyof Restaurant];
      return typeof value === 'string' && value.trim().length > 0;
    });
  };

// Custom hook to manage editing and saving restaurant details including opening hours
export const useRestaurantSetup = ({
  restaurantDetails,
  userId,
}: UseRestaurantSetupProps): UseRestaurantSetupReturn => {
  // Editable restaurant details state
  const [editableDetails, setEditableDetails] = useState<Partial<Restaurant>>({});
  const [editableHours, setEditableHours] = useState<OpeningHours[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalDetails, setOriginalDetails] = useState<Partial<Restaurant>>({});
  const [originalHours, setOriginalHours] = useState<OpeningHours[]>([]);

  // Memoized function to initialize opening hours
  const initializeOpeningHours = useCallback((hoursData: OpeningHours[]) => {
    if (hoursData.length === 0) {
      return day.map(dayName => ({
        day: dayName,
        open: "",
        close: "",
        closed: true,
      }));
    }

    const existingDays = hoursData.map(h => h.day.toLowerCase());
    return [
      ...hoursData,
      ...day
        .filter(dayName => !existingDays.includes(dayName.toLowerCase()))
        .map(dayName => ({
          day: dayName,
          open: "",
          close: "",
          closed: true,
        }))
    ];
  }, []);

  // Effect to sync editable state when restaurantDetails change
  useEffect(() => {
    if (!restaurantDetails) {
      setEditableDetails({});
      setOriginalDetails({});
      setEditableHours([]);
      setOriginalHours([]);
      return;
    }

    setEditableDetails({ ...restaurantDetails });
    setOriginalDetails({ ...restaurantDetails });

    const hoursData = restaurantDetails.openingHours || [];
    const initializedHours = initializeOpeningHours(hoursData);
    
    setEditableHours(initializedHours);
    setOriginalHours([...initializedHours]);
  }, [restaurantDetails, initializeOpeningHours]);

  // Memoized handlers
  const handleDetailsChange = useCallback((details: Partial<Restaurant>) => {
    setEditableDetails(details);
  }, []);

  const toggleEdit = useCallback(() => {
    if (isEditing) {
      setEditableDetails({ ...originalDetails });
      setEditableHours([...originalHours]);
    }
    setIsEditing(!isEditing);
  }, [isEditing, originalDetails, originalHours]);

  const handleSaveChanges = useCallback(async () => {
    if (!userId || !restaurantDetails?.restaurantId) {
      toast.error("User not authenticated or restaurant not found");
      return;
    }

    // Validate data before saving
    if (!validateRestaurantDetails(editableDetails)) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!validateOpeningHours(editableHours)) {
      toast.error("Please provide valid opening hours for all days");
      return;
    }

    setIsSaving(true);

    try {
      const validHours = editableHours.map(hour => ({
        ...hour,
        open: hour.closed ? "" : hour.open || "",
        close: hour.closed ? "" : hour.close || "",
      }));

      const restaurantRef = doc(db, "restaurants", restaurantDetails.restaurantId);

      const firestoreUpdate = {
        ...editableDetails,
        openingHours: validHours,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(restaurantRef, firestoreUpdate);

      setOriginalDetails({ ...editableDetails });
      setOriginalHours([...validHours]);

      toast.success("Restaurant details updated successfully!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update restaurant details";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }, [userId, restaurantDetails?.restaurantId, editableDetails, editableHours]);

  // Memoize the return value
  return useMemo(() => ({
    editableDetails,
    editableHours,
    isSaving,
    isEditing,
    handleDetailsChange,
    toggleEdit,
    handleSaveChanges,
    setEditableHours,
  }), [
    editableDetails,
    editableHours,
    isSaving,
    isEditing,
    handleDetailsChange,
    toggleEdit,
    handleSaveChanges,
  ]);
};
