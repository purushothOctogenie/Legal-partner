const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b';

// Define user schema without pre-save middleware
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

async function fixPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log('Current user data:');
    console.log('Email:', user.email);
    console.log('Current password hash:', user.password);
    console.log('Password field type:', typeof user.password);
    console.log('Password field length:', user.password?.length);

    // Create new password hash with a specific salt
    const testPassword = 'Test123!';
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(testPassword, salt);
    console.log('New password hash:', newHash);

    // Update the user's password directly in the database using updateOne
    // This bypasses the pre-save middleware
    await User.updateOne(
      { email: 'test@example.com' },
      { $set: { password: newHash } }
    );
    console.log('Password updated in database');

    // Fetch the user again to verify the update
    const updatedUser = await User.findOne({ email: 'test@example.com' });
    console.log('Updated password hash:', updatedUser.password);

    // Verify the new password
    const isPasswordValid = await bcrypt.compare(testPassword, updatedUser.password);
    console.log('Password verification test:', isPasswordValid ? 'Success' : 'Failed');

    // Test with the actual password
    const testResult = await bcrypt.compare('Test123!', updatedUser.password);
    console.log('Test with actual password:', testResult ? 'Success' : 'Failed');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error fixing password:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

fixPassword(); 