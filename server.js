const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static("uploads"));

const PORT = 5004;
const MONGO_URI ="mongodb+srv://chandu12121:9182500800Ac@cluster0.vm2zu.mongodb.net/bookstore?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

  const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    price: Number,
    imageUrl: String,
    createdAt: { type: Date, default: Date.now },
  });
  
const Book = mongoose.model("Book", bookSchema);

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

app.get("/search", async (req, res) => {
  try {
    const { query, startDate, endDate } = req.query;
    let filter = {};

    if (query || startDate || endDate) {
      if (query) {
        filter.$or = [
          { title: { $regex: query, $options: "i" } },
          { author: { $regex: query, $options: "i" } }
        ];
      }

      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({ error: "Invalid startDate format" });
        }
        filter.createdAt = { $gte: start };
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({ error: "Invalid endDate format" });
        }
        if (!filter.createdAt) {
          filter.createdAt = {};
        }
        filter.createdAt.$lte = end;
      }
    }

    const books = await Book.find(filter);
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/", async (req, res) => {
  try {
    const { title, author, price, imageUrl } = req.body;

    const newBook = new Book({ title, author, price, imageUrl });
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/", async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/:id", async (req, res) => {
  try {
    const { title, author, price, imageUrl } = req.body; 

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      { title, author, price, imageUrl },
      { new: true }
    );
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.delete("/:id", async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
