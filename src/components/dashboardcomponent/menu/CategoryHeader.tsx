import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setEditingCategory } from "@/store/features/menuSlice";
import {
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faUtensils,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { Category } from "@/utils/menuTypes";
import { toast } from "sonner";

const CHARACTER_LIMITS = {
  CATEGORY_NAME: 80,
  CATEGORY_DESCRIPTION: 150,
};

interface CategoryHeaderProps {
  category: Category;
  catIndex: number;
  loading: boolean;
  handleCategoryChange: (
    catIndex: number,
    field: keyof Pick<Category, "categoryName" | "categoryDescription">,
    value: string
  ) => void;
  toggleEditCategory: (categoryId: string) => void;
  handleSaveCategory: (categoryId: string) => Promise<void>;
  handleDeleteCategory: (categoryId: string) => Promise<void>;
  handleCategoryClick: () => void;
  isExpanded: boolean;
}

export default function CategoryHeader({
  category,
  catIndex,
  loading,
  handleCategoryChange,
  toggleEditCategory,
  handleSaveCategory,
  handleDeleteCategory,
  handleCategoryClick,
  isExpanded,
}: CategoryHeaderProps) {
  const dispatch = useDispatch();
  const editingCategoryId = useSelector((state: RootState) => state.menu.editingCategoryId);
  const isEditing = editingCategoryId === (category.docId || category.frontendId);
  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      dispatch(setEditingCategory(isEditing ? null : categoryId));
      toggleEditCategory(categoryId);
    }
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = category.docId || category.frontendId;
    if (categoryId) {
      await handleSaveCategory(categoryId);
      dispatch(setEditingCategory(null));
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const categoryId = category.docId || category.frontendId;
    if (!categoryId) {
      return;
    }
    try {
      if (window.confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
        await handleDeleteCategory(categoryId);
      }
    } catch (error) {
      toast.error("Failed to delete category. Please check your permissions and try again.");
    }
  };

  return (
    <div
      className={`w-full px-4 py-3 ${
        isEditing
          ? "bg-gray-50 border-b border-gray-200"
          : "bg-white border-l-4 border-orange-400"
      } flex justify-between items-center ${
        !isEditing ? "cursor-pointer hover:bg-gray-50" : ""
      } transition-colors duration-150`}
      onClick={!isEditing ? handleCategoryClick : undefined}
    >
      {isEditing ? (
        <div className="w-full p-2 mr-3">
          <div className="w-full mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Category Name*
            </label>
            <input
              type="text"
              name="categoryName"
              value={category.categoryName}
              onChange={(e) => {
                e.stopPropagation();
                handleCategoryChange(catIndex, "categoryName", e.target.value);
              }}
              className="text-base font-medium px-5 py-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/50 w-full shadow-sm outline-none transition-all"
              placeholder="Category Name"
              required
              maxLength={CHARACTER_LIMITS.CATEGORY_NAME}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-gray-500 mt-1 text-right pr-1">
              {category.categoryName.length} / {CHARACTER_LIMITS.CATEGORY_NAME}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Description
            </label>
            <textarea
              name="categoryDescription"
              value={category.categoryDescription || ""}
              onChange={(e) => {
                e.stopPropagation();
                handleCategoryChange(catIndex, "categoryDescription", e.target.value);
              }}
              className="text-sm text-gray-700 p-1 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/50 w-full shadow-sm resize-none outline-none transition-all"
              placeholder="Category Description (optional)"
              rows={2}
              maxLength={CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-xs text-gray-500 mt-1 text-right pr-1">
              {(category.categoryDescription || "").length} / {CHARACTER_LIMITS.CATEGORY_DESCRIPTION}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-start min-w-0">
          <div className="flex-shrink-0 mr-3 w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center text-primary">
            <FontAwesomeIcon icon={faUtensils} className="h-4 w-4" />
          </div>

          <div className="flex-grow min-w-0">
            <h3 className="text-base font-semibold text-gray-800 mb-1">{category.categoryName}</h3>
            {category.categoryDescription && (
              <p className="text-sm text-gray-600">{category.categoryDescription}</p>
            )}
          </div>

          <div className="flex items-center text-sm text-gray-500 ml-4">
            <span>{category.items.length}</span>
            <span className="ml-1">item{category.items.length !== 1 && "s"}</span>
            <FontAwesomeIcon
              icon={isExpanded ? faChevronUp : faChevronDown}
              className="ml-2 text-gray-400 transition-transform"
            />
          </div>
        </div>
      )}

      <div
        className="flex items-center space-x-2 pl-2 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditing ? (
          <>
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/70 focus:ring-offset-2 transition-colors duration-200 flex items-center shadow-sm disabled:opacity-75"
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSave} className="mr-1.5 h-5 w-5" />
              Save
            </button>
            {category.docId && (
              <button
                onClick={handleEditClick}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
                disabled={loading}
                title="Cancel"
              >
                <FontAwesomeIcon icon={faTimes} className="h-5 w-5" />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleEditClick}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
              disabled={loading}
              title="Edit Category"
            >
              <FontAwesomeIcon icon={faEdit} className="h-5 w-5" />
            </button>
            <button
              onClick={handleDeleteClick}
              className="p-2 text-red-600 hover:bg-red-50 rounded-full focus:outline-none focus:ring-2 focus:ring-red-600/70 focus:ring-offset-1 transition-colors duration-200 disabled:opacity-75"
              disabled={loading}
              title="Delete Category"
            >
              <FontAwesomeIcon icon={faTrash} className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
} 