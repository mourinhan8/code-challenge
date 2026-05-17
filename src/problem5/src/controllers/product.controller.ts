import type { Request, RequestHandler } from "express";
import { Types } from "mongoose";
import { ApiError, asyncHandler } from "../middleware/error.middleware";
import { Product } from "../models/product.model";

interface ProductBody {
  name?: unknown;
  description?: unknown;
  price?: unknown;
  category?: unknown;
  inStock?: unknown;
}

interface ProductQuery {
  category?: string;
  inStock?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  page?: string;
  limit?: string;
}

type ProductFilter = {
  category?: string;
  inStock?: boolean;
  price?: {
    $gte?: number;
    $lte?: number;
  };
  name?: {
    $regex: string;
    $options: string;
  };
};

const isPlainObject = (value: unknown): value is ProductBody =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseBoolean = (value: unknown, fieldName: string): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  throw new ApiError(400, `${fieldName} must be a boolean`);
};

const parseNumber = (value: unknown, fieldName: string): number => {
  if (typeof value !== "number" && typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a number`);
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new ApiError(400, `${fieldName} must be a valid number`);
  }

  return parsed;
};

const parsePositiveInteger = (value: string | undefined, fieldName: string, defaultValue: number): number => {
  if (value === undefined) {
    return defaultValue;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ApiError(400, `${fieldName} must be a positive integer`);
  }

  return parsed;
};

const getQueryString = (value: Request["query"][string]): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }

  return undefined;
};

const parseProductQuery = (query: Request["query"]): ProductQuery => ({
  category: getQueryString(query.category),
  inStock: getQueryString(query.inStock),
  minPrice: getQueryString(query.minPrice),
  maxPrice: getQueryString(query.maxPrice),
  search: getQueryString(query.search),
  page: getQueryString(query.page),
  limit: getQueryString(query.limit)
});

const parseString = (value: unknown, fieldName: string, required = false): string | undefined => {
  if (value === undefined || value === null) {
    if (required) {
      throw new ApiError(400, `${fieldName} is required`);
    }

    return undefined;
  }

  if (typeof value !== "string") {
    throw new ApiError(400, `${fieldName} must be a string`);
  }

  const trimmed = value.trim();

  if (required && trimmed.length === 0) {
    throw new ApiError(400, `${fieldName} cannot be empty`);
  }

  return trimmed.length > 0 ? trimmed : undefined;
};

const validateProductId = (id: string): void => {
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid product ID");
  }
};

const getProductIdParam = (value: string | string[] | undefined): string => {
  if (typeof value !== "string") {
    throw new ApiError(400, "Product ID is required");
  }

  validateProductId(value);

  return value;
};

const buildCreatePayload = (body: unknown) => {
  if (!isPlainObject(body)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  const price = parseNumber(body.price, "price");

  if (price < 0) {
    throw new ApiError(400, "price cannot be negative");
  }

  return {
    name: parseString(body.name, "name", true),
    description: parseString(body.description, "description"),
    price,
    category: parseString(body.category, "category"),
    inStock: body.inStock === undefined ? true : parseBoolean(body.inStock, "inStock")
  };
};

const buildUpdatePayload = (body: unknown) => {
  if (!isPlainObject(body)) {
    throw new ApiError(400, "Request body must be a JSON object");
  }

  const payload: Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    inStock: boolean;
  }> = {};

  if (body.name !== undefined) {
    payload.name = parseString(body.name, "name", true);
  }

  if (body.description !== undefined) {
    payload.description = parseString(body.description, "description");
  }

  if (body.price !== undefined) {
    const price = parseNumber(body.price, "price");

    if (price < 0) {
      throw new ApiError(400, "price cannot be negative");
    }

    payload.price = price;
  }

  if (body.category !== undefined) {
    payload.category = parseString(body.category, "category");
  }

  if (body.inStock !== undefined) {
    payload.inStock = parseBoolean(body.inStock, "inStock");
  }

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, "At least one field must be provided for update");
  }

  return payload;
};

const buildListFilter = (query: ProductQuery): ProductFilter => {
  const filter: ProductFilter = {};

  if (query.category) {
    filter.category = query.category.trim();
  }

  if (query.inStock !== undefined) {
    filter.inStock = parseBoolean(query.inStock, "inStock");
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {};

    if (query.minPrice !== undefined) {
      const minPrice = parseNumber(query.minPrice, "minPrice");

      if (minPrice < 0) {
        throw new ApiError(400, "minPrice cannot be negative");
      }

      filter.price.$gte = minPrice;
    }

    if (query.maxPrice !== undefined) {
      const maxPrice = parseNumber(query.maxPrice, "maxPrice");

      if (maxPrice < 0) {
        throw new ApiError(400, "maxPrice cannot be negative");
      }

      filter.price.$lte = maxPrice;
    }

    if (
      filter.price.$gte !== undefined &&
      filter.price.$lte !== undefined &&
      filter.price.$gte > filter.price.$lte
    ) {
      throw new ApiError(400, "minPrice cannot be greater than maxPrice");
    }
  }

  if (query.search) {
    filter.name = {
      $regex: query.search.trim(),
      $options: "i"
    };
  }

  return filter;
};

export const createProduct: RequestHandler = asyncHandler(async (req, res) => {
  const product = await Product.create(buildCreatePayload(req.body));

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: product
  });
});

export const listProducts: RequestHandler = asyncHandler(async (req, res) => {
  const query = parseProductQuery(req.query);
  const page = parsePositiveInteger(query.page, "page", 1);
  const limit = Math.min(parsePositiveInteger(query.limit, "limit", 10), 100);
  const skip = (page - 1) * limit;
  const filter = buildListFilter(query);

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter)
  ]);

  res.status(200).json({
    success: true,
    message: "Products retrieved successfully",
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export const getProductById: RequestHandler<{ id: string }> = asyncHandler(async (req, res) => {
  const productId = getProductIdParam(req.params.id);

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product retrieved successfully",
    data: product
  });
});

export const updateProduct: RequestHandler<{ id: string }> = asyncHandler(async (req, res) => {
  const productId = getProductIdParam(req.params.id);

  const product = await Product.findByIdAndUpdate(productId, buildUpdatePayload(req.body), {
    new: true,
    runValidators: true
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: product
  });
});

export const deleteProduct: RequestHandler<{ id: string }> = asyncHandler(async (req, res) => {
  const productId = getProductIdParam(req.params.id);

  const product = await Product.findByIdAndDelete(productId);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    data: product
  });
});
