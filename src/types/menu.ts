export type Category = {
  id: string;
  name: string;
  sort_order: number;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

