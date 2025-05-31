const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
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
  userType: { type: String, enum: ['lawyer', 'client', 'admin', 'non-lawyer', 'firm-lawyer'], default: 'admin' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the User model
const User = mongoose.model('User', userSchema, 'users');

async function updatePassword() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Find the user
    const user = await User.findOne({ email: 'santhosh@octogenie.com' });
    
    if (!user) {
      console.log('User not found in database');
      return;
    }

    console.log('\nUser found:', {
      email: user.email,
      userType: user.userType,
      status: user.status,
      barCouncilNumber: user.barCouncilNumber
    });

    // Generate new password hash
    const newPassword = 'FV2uEhiAsk8fj8u@';
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = newHash;
    user.updatedAt = new Date();
    await user.save();

    console.log('\nPassword updated successfully');
    console.log('New hash:', newHash);

    // Verify the new password works
    const isPasswordValid = await bcrypt.compare(newPassword, newHash);
    console.log('\nVerification test:', isPasswordValid ? '✅ Password works' : '❌ Password failed');

    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error updating password:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

updatePassword(); 