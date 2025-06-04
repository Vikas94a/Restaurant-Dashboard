import { Category } from "@/utils/menuTypes";

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

declare const CategoryHeader: React.FC<CategoryHeaderProps>;
export default CategoryHeader; 