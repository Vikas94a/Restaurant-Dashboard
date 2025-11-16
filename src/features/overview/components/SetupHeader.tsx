import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Button } from "@/components/ui/button";

interface SetupHeaderProps {
  restaurantName: string;   // Name of the restaurant to display in header
  isEditing: boolean;       // Flag to indicate if we are in editing mode
  isSaving: boolean;        // Flag to indicate if saving is in progress
  onEdit: () => void;       // Handler function to start or cancel editing
  onSave: () => void;       // Handler function to save changes
}

export const SetupHeader = ({ 
  restaurantName, 
  isEditing, 
  isSaving, 
  onEdit, 
  onSave 
}: SetupHeaderProps) => {
  return (
    // Header container with white background and shadow for separation
    <header className="bg-white shadow-sm mb-6">
      {/* Centered content container with padding and flex layout */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        
        {/* Restaurant name or default title */}
        <h1 className="text-gray-900 text-3xl font-bold truncate">
          {restaurantName || "Restaurant Setup"}
        </h1>
        
        {/* Button group container */}
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              {/* Cancel button - triggers onEdit to cancel editing */}
              <Button 
                variant="outline" 
                onClick={onEdit}
                disabled={isSaving} // disable if saving is in progress
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faTimes} /> {/* Cancel icon */}
                Cancel
              </Button>
              
              {/* Save button - triggers onSave to save changes */}
              <Button 
                onClick={onSave}
                disabled={isSaving} // disable while saving
                className="flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} /> {/* Save icon */}
                {/* Show loading text if saving */}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            // When not editing, show Edit button to enter editing mode
            <Button 
              onClick={onEdit}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faEdit} /> {/* Edit icon */}
              Edit
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
