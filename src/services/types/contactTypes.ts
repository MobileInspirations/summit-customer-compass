
export interface ContactForCategorization {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  summit_history?: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  category_type: string;
}
