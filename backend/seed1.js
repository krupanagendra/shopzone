require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const Product = require("./models/Product");
const User = require("./models/User");
const connectDB = require("./config/db");

const sampleProducts = [
  { name: "Apple iPhone 15 Pro", brand: "Apple", category: "Electronics", description: "Latest iPhone with A17 Pro chip, titanium design, and 48MP camera system.", price: 999, rating: 4.8, numReviews: 124, image: "https://images.unsplash.com/photo-1696446702183-cbd258e53c33?w=400", countInStock: 50, isFeatured: true },
  { name: "Samsung 4K OLED TV 55\"", brand: "Samsung", category: "Electronics", description: "Stunning 4K OLED display with quantum dot technology and smart TV features.", price: 1299, rating: 4.6, numReviews: 89, image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400", countInStock: 20, isFeatured: true },
  { name: "Sony WH-1000XM5 Headphones", brand: "Sony", category: "Electronics", description: "Industry-leading noise canceling with premium sound quality.", price: 349, rating: 4.9, numReviews: 256, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400", countInStock: 75, isFeatured: true },
  { name: "MacBook Pro 14-inch M3", brand: "Apple", category: "Computers", description: "Supercharged by M3 chip with 18-hour battery life.", price: 1999, rating: 4.7, numReviews: 98, image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400", countInStock: 30, isFeatured: true },
  { name: "Nike Air Max 270", brand: "Nike", category: "Clothing", description: "Max cushioning for all-day comfort. Breathable mesh upper.", price: 150, rating: 4.5, numReviews: 312, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400", countInStock: 100 },
  { name: "Instant Pot Duo 7-in-1", brand: "Instant Pot", category: "Home & Kitchen", description: "7-in-1 Electric Pressure Cooker, Slow Cooker, Rice Cooker.", price: 89, rating: 4.7, numReviews: 450, image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400", countInStock: 60 },
  { name: "Levi's 501 Original Jeans", brand: "Levi's", category: "Clothing", description: "The original and most iconic 5-pocket jean since 1873.", price: 69, rating: 4.4, numReviews: 187, image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400", countInStock: 150 },
  { name: "The Alchemist - Paulo Coelho", brand: "HarperCollins", category: "Books", description: "A special 25th anniversary edition of the extraordinary international bestseller.", price: 15, rating: 4.8, numReviews: 892, image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400", countInStock: 200 },
  { name: "Dyson V15 Detect Vacuum", brand: "Dyson", category: "Home & Kitchen", description: "Most powerful cord-free vacuum with laser dust detection.", price: 699, rating: 4.6, numReviews: 134, image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400", countInStock: 25 },
  { name: "Nintendo Switch OLED", brand: "Nintendo", category: "Gaming", description: "Vivid 7-inch OLED screen, enhanced audio and 64GB internal storage.", price: 349, rating: 4.9, numReviews: 567, image: "https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=400", countInStock: 40, isFeatured: true },
  { name: "Yoga Mat Premium", brand: "Liforme", category: "Sports", description: "Extra wide, thick, and non-slip yoga mat for all levels.", price: 120, rating: 4.6, numReviews: 78, image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", countInStock: 80 },
  { name: "Canon EOS R50 Camera", brand: "Canon", category: "Electronics", description: "24.2MP APS-C sensor mirrorless camera with AI-powered autofocus.", price: 679, rating: 4.7, numReviews: 43, image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400", countInStock: 15 },
  { name: "Adidas Ultraboost 22", brand: "Adidas", category: "Clothing", description: "Boost midsole delivers incredible energy return and comfort.", price: 180, rating: 4.5, numReviews: 234, image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400", countInStock: 90 },
  { name: "Coffee Maker Programmable", brand: "Cuisinart", category: "Home & Kitchen", description: "12-cup programmable coffee maker with thermal carafe.", price: 79, rating: 4.4, numReviews: 156, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400", countInStock: 45 },
  { name: "PlayStation 5 Controller", brand: "Sony", category: "Gaming", description: "DualSense wireless controller with haptic feedback.", price: 69, rating: 4.8, numReviews: 389, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400", countInStock: 55 },
  { name: "Kindle Paperwhite 11th Gen", brand: "Amazon", category: "Electronics", description: "Waterproof, 6.8\" display, adjustable warm light, 3-month free trial.", price: 139, rating: 4.7, numReviews: 445, image: "https://images.unsplash.com/photo-1491841573634-28140fc7ced7?w=400", countInStock: 85 },
  { name: "LEGO Star Wars Millennium Falcon", brand: "LEGO", category: "Toys", description: "7541-piece iconic spaceship building set for adults and teens.", price: 849, rating: 4.9, numReviews: 78, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400", countInStock: 12 },
  { name: "Hydroflask 32oz Water Bottle", brand: "Hydro Flask", category: "Sports", description: "Insulated stainless steel bottle keeps drinks cold 24hr.", price: 44, rating: 4.8, numReviews: 678, image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", countInStock: 120 },
  { name: "Vitamix E310 Explorian Blender", brand: "Vitamix", category: "Home & Kitchen", description: "Professional-grade blender with 10 variable speeds.", price: 349, rating: 4.7, numReviews: 89, image: "https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400", countInStock: 30 },
  { name: "Atomic Habits - James Clear", brand: "Avery", category: "Books", description: "Tiny changes, remarkable results. #1 NYT bestseller on building good habits.", price: 18, rating: 4.9, numReviews: 1203, image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400", countInStock: 300 },
];

const seedDatabase = async () => {
  try {
    await connectDB();
    await Product.deleteMany();

    // Load from CSV if exists
    const csvPath = path.join(__dirname, "data", "products.csv");
    if (fs.existsSync(csvPath)) {
      console.log("Loading from CSV file...");
      const csvProducts = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
          .pipe(csv())
          .on("data", (row) => {
            csvProducts.push({
              name: row.name || row.product_name || row.title || "Unnamed Product",
              brand: row.brand || row.manufacturer || "Unknown",
              category: row.category || row.main_category || "General",
              description: row.description || row.about_product || "No description",
              price: parseFloat(row.price || row.actual_price || "0") || 9.99,
              rating: parseFloat(row.rating || "0") || 0,
              numReviews: parseInt(row.no_of_ratings || row.numReviews || "0") || 0,
              image: row.image || row.img_link || "https://via.placeholder.com/400",
              countInStock: parseInt(row.countInStock || "10") || 10,
            });
          })
          .on("end", resolve)
          .on("error", reject);
      });
      await Product.insertMany(csvProducts.slice(0, 100)); // limit 100
      console.log(`Inserted ${Math.min(csvProducts.length, 100)} products from CSV`);
    } else {
      await Product.insertMany(sampleProducts);
      console.log(`Inserted ${sampleProducts.length} sample products`);
    }

    // Create admin user
    await User.deleteMany({ role: "admin" });
    await User.create({
      name: "Admin User",
      email: "admin@ecommerce.com",
      password: "admin123456",
      role: "admin",
    });
    console.log("Admin user created: admin@ecommerce.com / admin123456");

    console.log("Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
};

seedDatabase();
