
export interface ContactForCategorization {
  id: string;
  email: string;
  full_name?: string;
  company?: string;
  summit_history?: string[];
  tags?: string[];
}

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  category_type: string;
}
