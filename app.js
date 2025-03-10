require("dotenv").config(); // Ensure this is at the top!

const express = require("express");
const connectDB = require("./config/db");
const userRoutes = require("./routes/user.routes");
const commonRoutes = require("./routes/common.routes");
const taskRoutes = require("./routes/task.routes");

const app = express();

// Connect to MongoDB
connectDB();

app.use(express.json());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/tasks", taskRoutes); 
app.use("/api", commonRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
