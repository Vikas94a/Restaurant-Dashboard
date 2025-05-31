import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faUtensils } from "@fortawesome/free-solid-svg-icons";

interface EmptyMenuStateProps {
  onAddCategory: () => void;
}

/**
 * Empty state component shown when no menu categories exist
 */
const EmptyMenuState: React.FC<EmptyMenuStateProps> = ({ onAddCategory }) => {
  return (
    <div className="text-center py-8 px-4 bg-white rounded-lg shadow border border-dashed border-gray-300">
      <div className="inline-block p-4 bg-gray-100 rounded-full mb-4 shadow-sm">
        <FontAwesomeIcon
          icon={faUtensils}
          className="h-8 w-8 text-gray-400"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Your Menu is Empty
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto text-sm">
        Get started by adding a category. For example: "Appetizers", "Main
        Courses", or "Drinks".
      </p>
      <button
        onClick={onAddCategory}
        className="px-5 py-2 bg-primary text-white font-medium rounded-lg shadow hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 transition-colors duration-200 flex items-center mx-auto text-sm"
      >
        <FontAwesomeIcon icon={faPlus} className="mr-2 h-4 w-4" />
        Create First Category
      </button>
    </div>
  );
};

export default React.memo(EmptyMenuState);
