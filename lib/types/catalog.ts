export type UserRole = "super_admin" | "product_manager";

export type ProductStatus = "draft" | "active" | "archived";
export type InquiryStatus = "new" | "contacted" | "closed";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: string | null;
  sortOrder: number;
  children?: Category[];
};

export type Brand = {
  id: string;
  name: string;
  slug: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: Brand;
  category: Category;
  price: number | null;
  shortDescription: string;
  description: string;
  specifications: ProductSpecification[];
  features: string[];
  keywords: string[];
  status: ProductStatus;
  images: ProductImage[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Inquiry = {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  productId: string | null;
  productName: string | null;
  message: string;
  status: InquiryStatus;
  createdAt: string;
};

export type ProductFilters = {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "popular";
};

export type DashboardMetrics = {
  totalProducts: number;
  totalCategories: number;
  totalInquiries: number;
  mostViewedProducts: Product[];
  searchTrends: { query: string; count: number }[];
  inquiryTrends: { date: string; count: number }[];
  categoryPopularity: { category: string; views: number }[];
};

export type ProductTemplate = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  specifications: ProductSpecification[];
  features: string[];
  keywords: string[];
};
