import Product from "../models/product.model.js";
import logger from "../config/logger.js";

// Function to create a new product (seller only)

  

export const createProductController = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      discountPrice,
      stock,
      images,
      store,
      category,
      tags,
    } = req.body;

    // Step 1: Validate input
    if (!name || !price || !stock || !store || !category) {
      const err = new Error(
        "Missing required fields: name, price, stock, store, category"
      );
      err.statusCode = 400;
      return next(err);
    }

    // Step 2: Create product
    const newProduct = await Product.create({
      name,
      description,
      price,
      discountPrice,
      stock,
      images,
      store,
      category,
      tags,
      reviews: [],
      averageRating: 0,
      isActive: true,
    });

    // Step 3: Log success
    req.logger.info(
      `Product created: ID=${newProduct._id}, Name=${newProduct.name}`
    );

    // Step 4: Send success response
    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    // Step 5: Log failure
    req.logger.error(`Error creating product: ${error.message}`);
    next(error);
  }
};

export const getAllProductsController = async (req, res, next) => {
  try {
    logger.info(`Fetching products - Query: ${JSON.stringify(req.query)}`);

    // Extract query params
    const {
      page = 1,
      limit = 10,
      sort = "createdAt",
      order = "desc",
      search = "",
      category,
      minPrice,
      maxPrice
    } = req.query;

    //  Build filter object
    let filter = {};
    if (search) {
      filter.name = { $regex: search, $options: "i" }; // case-insensitive search
    }
    if (category) {
      filter.category = category;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    //  Pagination logic
    const skip = (page - 1) * limit;

    //  Fetch products
    const products = await Product.find(filter)
      .sort({ [sort]: order === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(Number(limit));

    //  Get total count for pagination metadata
    const totalProducts = await Product.countDocuments(filter);

    //  Send success response
    res.status(200).json({
      success: true,
      count: products.length,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
      products
    });

  } catch (err) {
    logger.error(`Error fetching products: ${err.message}`);
    next(err); // Goes to errorHandler middleware
  }
};

// Function to get a single product by ID
export const getProductByIdController = async (req, res, next) => {
  // Logic to fetch a single product by ID will go here
  res.status(200).json({
    success: true,
    message: "Product fetched successfully."
  });
};

// Function to update an existing product (seller only)
export const updateProductController = async (req, res, next) => {
  // Logic to update a product in the database will go here
  res.status(200).json({
    success: true,
    message: "Product updated successfully."
  });
};

// Function to delete a product (seller only)
export const deleteProductController = async (req, res, next) => {
  // Logic to delete a product from the database will go here
  res.status(200).json({
    success: true,
    message: "Product deleted successfully."
  });
};
