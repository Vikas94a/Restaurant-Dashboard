"use client"; // Enables client-side rendering in Next.js

// Import necessary hooks and components
import { useContext } from "react";
import { AppContext } from "@/context/Authcontext";
import RestaurantDetails from "@/components/dashboardcomponent/ReataurantDetails";
import RestaurantTiming from "@/components/dashboardcomponent/RestaurantTiming";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { LoadingSpinner } from "@/components/dashboardcomponent/LoadingSpinner";
import { SetupHeader } from "@/components/dashboardcomponent/SetupHeader";
import { useRestaurantSetup } from "@/hooks/useRestaurantSetup";

export default function RestaurantSetup() {
  // Get global app context
  const context = useContext(AppContext);

  // Show loading spinner while context is loading
  if (!context || context.loading) {
    return <LoadingSpinner />;
  }

  // Show message if no restaurant is found
  if (!context.restaurantDetails) {
    return <div className="p-6 text-center text-gray-500">No restaurant found. Please create a restaurant first.</div>;
  }

  // Destructure values from context
  const { restaurantName, restaurantDetails, user } = context;

  // Use custom hook to manage form state and actions
  const {
    editableDetails,
    editableHours,
    isSaving,
    isEditing,
    handleDetailsChange,
    toggleEdit,
    handleSaveChanges,
    setEditableHours
  } = useRestaurantSetup(restaurantDetails, user?.uid);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Edit and Save controls */}
      <SetupHeader
        restaurantName={restaurantName}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={toggleEdit}
        onSave={handleSaveChanges}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 flex-grow">
        <section className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Section title and description */}
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

          {/* Two-column layout: Details and Hours */}
          <div className="md:flex md:flex-row p-6 gap-8">
            {/* Left: Restaurant Details */}
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

            {/* Right: Restaurant Hours */}
            <div className="md:w-1/2">
              <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                <FontAwesomeIcon icon={faClock} className="h-5 w-5 mr-2 text-blue-500" />
                Restaurant Hours
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg shadow-inner">
                {isEditing ? (
                  // Show editable timing fields if in edit mode
                  <RestaurantTiming
                    openingHours={editableHours}
                    setOpeningHours={setEditableHours}
                  />
                ) : (
                  // Show readable hours if not editing
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
