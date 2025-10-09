require("dotenv").config(); // Ensure this is at the top!

// Load environment variables from .env fileß
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const admin = require('./config/firebase.config');

// Route files
const userRoutes = require("./routes/user.routes");
const commonRoutes = require("./routes/common.routes");
const taskRoutes = require("./routes/task.routes");
const projectRoutes = require("./routes/project.routes");
const projectTasks = require("./routes/projectTasks.routes");
const habitRoutes = require("./routes/habit.routes");
const expenseRoutes = require("./routes/expense.routes");
const budgetRoutes = require("./routes/budget.routes");
const expenseCategoryRoutes = require("./routes/expenseCategory.routes");
const financialOverviewRoutes = require("./routes/finiacialOverview.routes");
const emiRoutes = require("./routes/emi.routes");
const investmentRoutes = require("./routes/investment.routes");
const fcmTokenRoutes = require('./routes/fcmToken.routes');
const app = express();

// Connect to MongoDB
connectDB();

const testFirebaseConnection = async () => {
  try {
    // Test 1: Check if app is initialized
    const app = admin.app();
    console.log('🔥 Firebase App initialized:', app.name);

    // Test 2: Try to verify a dummy token (this tests Auth service)
    // Instead of listUsers which requires specific permissions
    try {
      await admin.auth().verifyIdToken('dummy-token');
    } catch (error) {
      // We expect this to fail with 'ID token has invalid signature'
      // but if Auth is working, it won't say "no configuration"
      if (error.code === 'auth/argument-error' || error.message.includes('invalid signature')) {
        console.log('✅ Firebase Auth service is accessible');
      } else {
        console.warn('⚠️  Firebase Auth test warning:', error.message);
      }
    }
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error.message);
  }
};

testFirebaseConnection();

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
app.use("/api/projectTasks", projectTasks);
app.use("/api/habits", habitRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenseCategories', expenseCategoryRoutes);
app.use('/api/financialOverview', financialOverviewRoutes);
app.use('/api/emi', emiRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/fcm', fcmTokenRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
