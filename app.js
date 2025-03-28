require("dotenv").config(); // Ensure this is at the top!

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const commonRoutes = require("./routes/common.routes");
const taskRoutes = require("./routes/task.routes");
const projectRoutes = require("./routes/project.routes");

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS for all origins and methods
app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*'
}));

app.use(express.json());

// Middleware to log each API request
app.use((req, res, next) => {
  const method = req.method;    // GET, POST, PUT, DELETE
  const url = req.originalUrl;   // The requested URL
  const timestamp = new Date().toISOString(); // Current timestamp
  console.log(`${timestamp} - ${method} ${url}`);
  next();  // Pass control to the next middleware or route handler
});


// Routes
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes); 
app.use("/api", commonRoutes);
app.use("/api/projects", projectRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
