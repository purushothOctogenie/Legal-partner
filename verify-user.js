const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb://127.0.0.1:27017/legal-b2b';

// Define user schema (same as in create-test-user.js)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  displayName: { type: String },
  photoURL: { type: String },
  phone: { type: String },
  address: { type: String },
  website: { type: String },
  barCouncilNumber: { type: String },
  practiceType: { type: String },
  gender: { type: String },
  aadhaarNumber: { type: String },
  userType: { type: String, enum: ['lawyer', 'client', 'admin', 'non-lawyer'], default: 'admin' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the User model
const User = mongoose.model('User', userSchema, 'users');

async function verifyUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'test@example.com' });
    
    if (!user) {
      console.log('Test user not found in database');
      return;
    }

    console.log('User found in database:');
    console.log('Email:', user.email);
    console.log('Password hash:', user.password);
    console.log('User type:', user.userType);
    console.log('Status:', user.status);
    console.log('Created at:', user.createdAt);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error verifying user:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

verifyUser(); 