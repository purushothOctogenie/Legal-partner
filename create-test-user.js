// Script to create a test user in MongoDB
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b';

// Define user schema
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

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing test user if exists
    await User.deleteOne({ email: 'test@example.com' });
    console.log('Deleted existing test user if any');

    // Create a test user with a known password
    const testPassword = 'Test123!';
    console.log('Creating test user with password:', testPassword);
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(testPassword, salt);
    console.log('Generated password hash:', hashedPassword);

    const newUser = new User({
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      displayName: 'Test User',
      userType: 'admin',
      status: 'approved',
      phone: '1234567890',
      address: '123 Test Street',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await newUser.save();
    console.log('Test user created successfully!');
    console.log('You can login with:');
    console.log('Email: test@example.com');
    console.log('Password: Test123!');

    // Verify the password hash
    const savedUser = await User.findOne({ email: 'test@example.com' });
    const isPasswordValid = await bcrypt.compare(testPassword, savedUser.password);
    console.log('Password verification test:', isPasswordValid ? 'Success' : 'Failed');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error creating test user:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

createTestUser(); 