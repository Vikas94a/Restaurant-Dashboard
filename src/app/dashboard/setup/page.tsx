"use client";
import { useContext, useState, useEffect } from "react";
import { AppContext } from "@/context/Authcontext";
import RestaurantDetails from "@/components/dashboardcomponent/ReataurantDetails";
import RestaurantTiming from "@/components/dashboardcomponent/RestaurantTiming";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faClock, faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Restaurant, OpeningHours, day } from "@/components/dashboardcomponent/RestaurantDialog";
import { Button } from "@/components/ui/button";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

export default function RestaurantTest() {
  const context = useContext(AppContext);
  const [editableDetails, setEditableDetails] = useState<Partial<Restaurant>>({});
  const [editableHours, setEditableHours] = useState<OpeningHours[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalDetails, setOriginalDetails] = useState<Partial<Restaurant>>({});
  const [originalHours, setOriginalHours] = useState<OpeningHours[]>([]);

  useEffect(() => {
    if (context?.restaurantDetails) {
      setEditableDetails({ ...context.restaurantDetails });
      setOriginalDetails({ ...context.restaurantDetails });
      
      // Initialize opening hours with data from restaurantDetails
      let hoursData = context.restaurantDetails.openingHours || [];
      
      // If no hours exist, create default structure with all days
      if (hoursData.length === 0) {
        hoursData = day.map(dayName => ({
          day: dayName,
          open: '',
          close: '',
          closed: true
        }));
      } else {
        // Ensure all days are present in the data
        const existingDays = hoursData.map(h => h.day.toLowerCase());
        day.forEach(dayName => {
          if (!existingDays.includes(dayName.toLowerCase())) {
            hoursData.push({
              day: dayName,
              open: '',
              close: '',
              closed: true
            });
          }
        });
      }
      
      setEditableHours(hoursData);
      setOriginalHours([...hoursData]);
      
      console.log("Loaded restaurant hours:", hoursData);
    }
  }, [context?.restaurantDetails]);

  if (!context || context.loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!context.restaurantDetails) {
    return <div className="p-6 text-center text-gray-500">No restaurant found. Please create a restaurant first.</div>;
  }

  const { restaurantName, restaurantDetails } = context;

  const handleDetailsChange = (details: Partial<Restaurant>) => {
    setEditableDetails(details);
  };

  const handleHoursChange = (hours: OpeningHours[]) => {
    setEditableHours(hours);
  };

  const toggleEdit = () => {
    if (isEditing) {
      // If canceling edit, revert to original values
      setEditableDetails({ ...originalDetails });
      setEditableHours([...originalHours]);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    if (!context?.user?.uid || !context.restaurantDetails?.restaurantId) {
      toast.error("User not authenticated or restaurant not found");
      return;
    }

    setIsSaving(true);
    
    try {
      // Filter out any empty or invalid time slots
      const validHours = editableHours.map(hour => ({
        ...hour,
        open: hour.closed ? '' : (hour.open || ''),
        close: hour.closed ? '' : (hour.close || '')
      }));

      const restaurantRef = doc(db, "restaurants", context.restaurantDetails.restaurantId);
      
      // Create separate objects for Firestore update and local state
      const firestoreUpdate = {
        ...editableDetails,
        openingHours: validHours,
        updatedAt: serverTimestamp(),
      };

      // Update Firestore
      await updateDoc(restaurantRef, firestoreUpdate);
      
      // Update context with new data
      if (context.restaurantDetails) {
        context.restaurantDetails = {
          ...context.restaurantDetails,
          ...editableDetails,
          openingHours: validHours,
          updatedAt: new Date().toISOString(), // Use string timestamp for local state
        };
      }
      
      // Update local state
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm mb-6">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-gray-900 text-3xl font-bold truncate">
            {restaurantName || "Restaurant Setup"}
          </h1>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={toggleEdit}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button 
                onClick={toggleEdit}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faEdit} />
                Edit
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 flex-grow">
        <section className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Restaurant Configuration
            </h2>
            <p className="text-gray-600">
              {isEditing 
                ? "Update your restaurant details and hours below."
                : "View your restaurant details and hours below."}
            </p>
          </div>

          <div className="md:flex md:flex-row p-6 gap-8">
            <div className="md:w-1/2 mb-6 md:mb-0">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faInfoCircle} className="h-5 w-5 mr-2 text-blue-500" />
                Restaurant Details
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                <RestaurantDetails
                  restaurantDetails={editableDetails}
                  onDetailsChange={handleDetailsChange}
                  isEditing={isEditing}
                />
              </div>
            </div>

            <div className="md:w-1/2">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faClock} className="h-5 w-5 mr-2 text-blue-500" />
                Restaurant Hours
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                {isEditing ? (
                  <RestaurantTiming
                    openingHours={editableHours}
                    setOpeningHours={setEditableHours}
                  />
                ) : (
                  <div className="grid gap-2">
                    {editableHours && editableHours.length > 0 ? (
                      editableHours.map((hour, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="font-medium capitalize">
                            {hour.day}
                          </div>
                          <div>
                            {hour.closed ? (
                              <span className="text-red-500">Closed</span>
                            ) : (
                              <span>
                                {hour.open || "--:--"} - {hour.close || "--:--"}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No opening hours set</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          
        </section>
      </main>
    </div>
  );
}
