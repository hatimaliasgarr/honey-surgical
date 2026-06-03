import {
  brands as fallbackBrands,
  categories as fallbackCategories,
  getCategoryTree as getFallbackCategoryTree,
  getFeaturedProducts as getFallbackFeaturedProducts,
  getProductBySlug as getFallbackProductBySlug,
  getProductsBySlugs as getFallbackProductsBySlugs,
  getRelatedProducts as getFallbackRelatedProducts,
  products as fallbackProducts,
  searchProducts as fallbackSearchProducts
} from "@/lib/data/catalog";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Brand,
  Category,
  DashboardMetrics,
  Inquiry,
  Product,
  ProductFilters,
  ProductImage,
  ProductStatus,
  ProductSpecification
} from "@/lib/types/catalog";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number | null;
  short_description: string;
  description: string;
  specifications: ProductSpecification[];
  features: string[];
  keywords: string[];
  status: "draft" | "active" | "archived";
  view_count: number | null;
  created_at: string;
  updated_at: string;
  category: Category;
  brand: Brand;
  product_images: ProductImage[];
};

type ProductSearchOptions = ProductFilters & {
  status?: ProductStatus | "all";
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    category: row.category,
    brand: row.brand,
    price: row.price,
    shortDescription: row.short_description,
    description: row.description,
    specifications: row.specifications || [],
    features: row.features || [],
    keywords: row.keywords || [],
    status: row.status,
    viewCount: row.view_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: (row.product_images || []).sort((a, b) => a.sortOrder - b.sortOrder)
  };
}

const productSelect = `
  id,
  name,
  slug,
  sku,
  price,
  short_description,
  description,
  specifications,
  features,
  keywords,
  status,
  view_count,
  created_at,
  updated_at,
  category:categories(id,name,slug,description,imageUrl:image_url,parentId:parent_id,sortOrder:sort_order),
  brand:brands(id,name,slug),
  product_images:product_images(id, productId:product_id, url, alt, sortOrder:sort_order)
`;

export async function getAllCategories(): Promise<Category[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return fallbackCategories;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,description,imageUrl:image_url,parentId:parent_id,sortOrder:sort_order")
    .order("sort_order");

  if (error || !data) {
    return fallbackCategories;
  }

  return data as Category[];
}

export async function getCategoryTree(): Promise<Category[]> {
  return getFallbackCategoryTree(await getAllCategories());
}

export async function getFeaturedCategories(): Promise<Category[]> {
  const tree = await getCategoryTree();
  return tree.slice(0, 8);
}

export async function getAllBrands(): Promise<Brand[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return fallbackBrands;
  }

  const { data, error } = await supabase.from("brands").select("id,name,slug").order("name");
  return error || !data ? fallbackBrands : (data as Brand[]);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return getFallbackFeaturedProducts();
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(8);

  return error || !data ? getFallbackFeaturedProducts() : (data as unknown as ProductRow[]).map(mapProduct);
}

export async function searchProducts(filters: ProductSearchOptions = {}): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return fallbackSearchProducts(filters);
  }

  let query = supabase.from("products").select(productSelect);
  if (filters.status !== "all") {
    query = query.eq("status", filters.status || "active");
  }

  if (filters.query) {
    query = query.textSearch("search_vector", filters.query, {
      type: "websearch",
      config: "english"
    });
  }

  if (filters.category) {
    const allCategories = await getAllCategories();
    const category = allCategories.find((item) => item.slug === filters.category);
    const childIds = allCategories
      .filter((item) => item.parentId === category?.id)
      .map((item) => item.id);
    const ids = [category?.id, ...childIds].filter(Boolean).join(",");
    if (ids) {
      query = query.in("category_id", ids.split(","));
    }
  }

  if (filters.brand) {
    const allBrands = await getAllBrands();
    const brand = allBrands.find((item) => item.slug === filters.brand);
    if (brand) {
      query = query.eq("brand_id", brand.id);
    }
  }

  if (filters.minPrice != null) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice != null) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false, nullsFirst: false });
  } else if (filters.sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("view_count", { ascending: false });
  }

  const { data, error } = await query.limit(200);
  if (error || !data) {
    return filters.status === "all" ? [] : fallbackSearchProducts(filters);
  }

  return (data as unknown as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(
  slug: string,
  options: { includeInactive?: boolean } = {}
): Promise<Product | null> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return getFallbackProductBySlug(slug);
  }

  let query = supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug);

  if (!options.includeInactive) {
    query = query.eq("status", "active");
  }

  const { data, error } = await query.single();

  if (error || !data) {
    return options.includeInactive ? null : getFallbackProductBySlug(slug);
  }

  return mapProduct(data as unknown as ProductRow);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase || slugs.length === 0) {
    return getFallbackProductsBySlugs(slugs);
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .in("slug", slugs)
    .eq("status", "active");

  return error || !data ? getFallbackProductsBySlugs(slugs) : (data as unknown as ProductRow[]).map(mapProduct);
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return getFallbackRelatedProducts(product);
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("category_id", product.category.id)
    .neq("id", product.id)
    .eq("status", "active")
    .limit(4);

  return error || !data ? getFallbackRelatedProducts(product) : (data as unknown as ProductRow[]).map(mapProduct);
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return {
      totalProducts: fallbackProducts.length,
      totalCategories: fallbackCategories.length,
      totalInquiries: 0,
      mostViewedProducts: getFallbackFeaturedProducts().slice(0, 5),
      searchTrends: [
        { query: "oxygen concentrator", count: 42 },
        { query: "nitrile gloves", count: 38 },
        { query: "icu bed", count: 29 }
      ],
      inquiryTrends: [
        { date: "Mon", count: 6 },
        { date: "Tue", count: 9 },
        { date: "Wed", count: 12 },
        { date: "Thu", count: 8 },
        { date: "Fri", count: 14 }
      ],
      categoryPopularity: [
        { category: "Medical Equipment", views: 1920 },
        { category: "Disposable Products", views: 1740 },
        { category: "Hospital Furniture", views: 1220 }
      ]
    };
  }

  const [productCount, categoryCount, inquiryCount, products] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("categories").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }),
    getFeaturedProducts()
  ]);

  return {
    totalProducts: productCount.count || 0,
    totalCategories: categoryCount.count || 0,
    totalInquiries: inquiryCount.count || 0,
    mostViewedProducts: products.slice(0, 5),
    searchTrends: [
      { query: "oxygen concentrator", count: 42 },
      { query: "nitrile gloves", count: 38 },
      { query: "icu bed", count: 29 }
    ],
    inquiryTrends: [
      { date: "Mon", count: 6 },
      { date: "Tue", count: 9 },
      { date: "Wed", count: 12 },
      { date: "Thu", count: 8 },
      { date: "Fri", count: 14 }
    ],
    categoryPopularity: [
      { category: "Medical Equipment", views: 1920 },
      { category: "Disposable Products", views: 1740 },
      { category: "Hospital Furniture", views: 1220 }
    ]
  };
}

export async function getRecentInquiries(): Promise<Inquiry[]> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "id,customerName:customer_name,email,phone,productId:product_id,productName:product_name,message,status,createdAt:created_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return error || !data ? [] : (data as Inquiry[]);
}
