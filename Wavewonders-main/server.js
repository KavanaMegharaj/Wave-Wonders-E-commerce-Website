const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static("public")); // Serve static files for the frontend

// In-memory data storage (Replace with a database for production)
let products = [
  { id: 1, name: "Moisturizing Shampoo", category: "Dry Hair", price: 10 },
  { id: 2, name: "Curl Enhancer", category: "Curly Hair", price: 15 },
  { id: 3, name: "Anti-Frizz Serum", category: "Frizzy Hair", price: 12 },
];
let cart = [];

// Endpoint: Get product recommendations
app.post("/recommendations", (req, res) => {
  const { hairType, issues } = req.body;

  const recommendations = products.filter(
    (product) =>
      product.category.toLowerCase().includes(hairType.toLowerCase()) ||
      product.name.toLowerCase().includes(issues.toLowerCase())
  );

  res.json({ success: true, recommendations });
});

// Endpoint: Add product to cart
app.post("/cart", (req, res) => {
  const { productId } = req.body;
  const product = products.find((p) => p.id === productId);

  if (product) {
    cart.push(product);
    res.json({ success: true, message: "Product added to cart", cart });
  } else {
    res.status(404).json({ success: false, message: "Product not found" });
  }
});

// Endpoint: View cart
app.get("/cart", (req, res) => {
  res.json({ success: true, cart });
});

// Endpoint: Checkout and send details via email
app.post("/checkout", async (req, res) => {
  const { name, email, address } = req.body;

  if (!name || !email || !address) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  // Nodemailer setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const emailContent = `
    <h1>New Order from ${name}</h1>
    <p>Email: ${email}</p>
    <p>Address: ${address}</p>
    <h2>Cart Items:</h2>
    <ul>
      ${cart.map((item) => `<li>${item.name} - $${item.price}</li>`).join("")}
    </ul>
    <p>Total: $${cart.reduce((total, item) => total + item.price, 0)}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.RECIPIENT_EMAIL,
      subject: "New Order - Wave Wonders",
      html: emailContent,
    });

    // Clear cart after successful email
    cart = [];
    res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Email sending failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
