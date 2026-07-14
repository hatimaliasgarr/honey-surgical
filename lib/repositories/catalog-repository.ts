import {
  brands as fallbackBrands,
  categories as fallbackCategories,
  getCategoryTree as getFallbackCategoryTree,
  getFeaturedProducts as getFallbackFeaturedProducts,
  getProductBySlug as getFallbackProductBySlug,
  getProductsBySlugs as getFallbackProductsBySlugs,
  getRelatedProducts as getFallbackRelatedProducts,
  products as fallbackProducts,
  searchProducts as fallbackSearchProducts,
} from "@/lib/data/catalog";
import connectToDatabase from "@/lib/db/mongodb";
import { Category as CategoryModel } from "@/lib/models/Category";
import { Brand as BrandModel } from "@/lib/models/Brand";
import { Product as ProductModel } from "@/lib/models/Product";
import { Inquiry as InquiryModel } from "@/lib/models/Inquiry";
import type {
  Brand,
  Category,
  DashboardMetrics,
  Inquiry,
  Product,
  ProductFilters,
  ProductStatus,
} from "@/lib/types/catalog";
import { FilterQuery } from "mongoose";

type ProductSearchOptions = ProductFilters & {
  status?: ProductStatus | "all";
};

// Helper to convert Mongoose documents to raw JSON objects without _id/ObjectId complexities for Next.js Client Components
function serializeDoc<T>(doc: any): T {
  const json = doc.toObject ? doc.toObject({ getters: true, virtuals: true }) : doc;
  if (json._id) {
    json.id = json._id.toString();
    delete json._id;
  }
  if (json.__v !== undefined) {
    delete json.__v;
  }
  return json as T;
}

export async function getAllCategories(): Promise<Category[]> {
  try {
    await connectToDatabase();
    const categories = await CategoryModel.find().sort({ sortOrder: 1 }).lean();
    return categories.map(c => {
      const cat = c as any;
      return {
        ...cat,
        id: cat._id.toString(),
        parentId: cat.parentId ? cat.parentId.toString() : null,
      } as Category;
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return fallbackCategories;
  }
}

export async function getCategoryTree(): Promise<Category[]> {
  return getFallbackCategoryTree(await getAllCategories());
}

export async function getFeaturedCategories(): Promise<Category[]> {
  const tree = await getCategoryTree();
  return tree.slice(0, 8);
}

export async function getAllBrands(): Promise<Brand[]> {
  try {
    await connectToDatabase();
    const brands = await BrandModel.find().sort({ name: 1 }).lean();
    return brands.map(b => {
      const brand = b as any;
      return { ...brand, id: brand._id.toString() } as Brand;
    });
  } catch (error) {
    return fallbackBrands;
  }
}

export async function getFeaturedProducts(): Promise<Product[]> {
  try {
    await connectToDatabase();
    const products = await ProductModel.find({ status: "active" })
      .populate("category")
      .populate("brand")
      .sort({ viewCount: -1 })
      .limit(8)
      .lean();
      
    if (!products || products.length === 0) return getFallbackFeaturedProducts();
    return products.map(p => serializeDoc<Product>(p));
  } catch (error) {
    return getFallbackFeaturedProducts();
  }
}

export async function searchProducts(
  filters: ProductSearchOptions = {},
): Promise<Product[]> {
  try {
    await connectToDatabase();
    
    let query: FilterQuery<any> = {};

    if (filters.status !== "all") {
      query.status = filters.status || "active";
    }

    if (filters.query) {
      query.$text = { $search: filters.query };
    }

    if (filters.category) {
      const allCategories = await getAllCategories();
      const category = allCategories.find((item) => item.slug === filters.category);
      if (category) {
        const childIds = allCategories
          .filter((item) => item.parentId === category.id)
          .map((item) => item.id);
        query.category = { $in: [category.id, ...childIds] };
      }
    }

    if (filters.brand) {
      const brand = await BrandModel.findOne({ slug: filters.brand }).lean();
      if (brand) {
        query.brand = brand._id;
      }
    }

    if (filters.minPrice != null || filters.maxPrice != null) {
      query.price = {};
      if (filters.minPrice != null) query.price.$gte = filters.minPrice;
      if (filters.maxPrice != null) query.price.$lte = filters.maxPrice;
    }

    let sort: any = { viewCount: -1 };
    if (filters.sort === "price_asc") sort = { price: 1 };
    else if (filters.sort === "price_desc") sort = { price: -1 };
    else if (filters.sort === "newest") sort = { createdAt: -1 };
    else if (filters.query) sort = { score: { $meta: "textScore" } };

    const products = await ProductModel.find(query)
      .populate("category")
      .populate("brand")
      .sort(sort)
      .limit(200)
      .lean();

    return products.map(p => serializeDoc<Product>(p));
  } catch (error) {
    return filters.status === "all" ? [] : fallbackSearchProducts(filters);
  }
}

export async function getProductBySlug(
  slug: string,
  options: { includeInactive?: boolean } = {},
): Promise<Product | null> {
  try {
    await connectToDatabase();
    const query: any = { slug };
    if (!options.includeInactive) {
      query.status = "active";
    }

    const product = await ProductModel.findOne(query)
      .populate("category")
      .populate("brand")
      .lean();

    if (!product) return options.includeInactive ? null : getFallbackProductBySlug(slug);
    return serializeDoc<Product>(product);
  } catch (error) {
    return options.includeInactive ? null : getFallbackProductBySlug(slug);
  }
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  try {
    if (slugs.length === 0) return getFallbackProductsBySlugs(slugs);
    await connectToDatabase();
    
    const products = await ProductModel.find({
      slug: { $in: slugs },
      status: "active"
    })
      .populate("category")
      .populate("brand")
      .lean();

    if (!products.length) return getFallbackProductsBySlugs(slugs);
    return products.map(p => serializeDoc<Product>(p));
  } catch (error) {
    return getFallbackProductsBySlugs(slugs);
  }
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  try {
    await connectToDatabase();
    
    const products = await ProductModel.find({
      category: product.category.id,
      _id: { $ne: product.id },
      status: "active"
    })
      .populate("category")
      .populate("brand")
      .limit(4)
      .lean();

    if (!products.length) return getFallbackRelatedProducts(product);
    return products.map(p => serializeDoc<Product>(p));
  } catch (error) {
    return getFallbackRelatedProducts(product);
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    await connectToDatabase();
    
    const [productCount, categoryCount, inquiryCount, products] = await Promise.all([
      ProductModel.countDocuments(),
      CategoryModel.countDocuments(),
      InquiryModel.countDocuments(),
      getFeaturedProducts(),
    ]);

    return {
      totalProducts: productCount || 0,
      totalCategories: categoryCount || 0,
      totalInquiries: inquiryCount || 0,
      mostViewedProducts: products.slice(0, 5),
      searchTrends: [
        { query: "oxygen concentrator", count: 42 },
        { query: "nitrile gloves", count: 38 },
        { query: "icu bed", count: 29 },
      ],
      inquiryTrends: [
        { date: "Mon", count: 6 },
        { date: "Tue", count: 9 },
        { date: "Wed", count: 12 },
        { date: "Thu", count: 8 },
        { date: "Fri", count: 14 },
      ],
      categoryPopularity: [
        { category: "Medical Equipment", views: 1920 },
        { category: "Disposable Products", views: 1740 },
        { category: "Hospital Furniture", views: 1220 },
      ],
    };
  } catch (error) {
    return {
      totalProducts: fallbackProducts.length,
      totalCategories: fallbackCategories.length,
      totalInquiries: 0,
      mostViewedProducts: getFallbackFeaturedProducts().slice(0, 5),
      searchTrends: [],
      inquiryTrends: [],
      categoryPopularity: [],
    };
  }
}

export async function getRecentInquiries(): Promise<Inquiry[]> {
  try {
    await connectToDatabase();
    const inquiries = await InquiryModel.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
      
    return inquiries.map(i => serializeDoc<Inquiry>(i));
  } catch (error) {
    return [];
  }
}
