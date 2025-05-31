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
  userType: { type: String, enum: ['lawyer', 'client', 'admin', 'non-lawyer'], default: 'admin' },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'approved' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create the User model
const User = mongoose.model('User', userSchema, 'users');

async function testPassword() {
  try {
    // Connect to MongoDB Atlas
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Find the individual user
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

    console.log('\nTesting password validation...');
    console.log('Stored password hash:', user.password);
    
    // Test with the provided password
    const password = 'FV2uEhiAsk8fj8u@';
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('\nPassword validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('\nTrying password variations:');
      const variations = [
        'FV2uEhiAsk8fj8u@',
        'fv2uehiask8fj8u@',
        'FV2UEHIASK8FJ8U@',
        'FV2uEhiAsk8fj8u',
        'fv2uehiask8fj8u',
        'FV2UEHIASK8FJ8U'
      ];
      
      for (const pwd of variations) {
        const match = await bcrypt.compare(pwd, user.password);
        console.log(`${pwd}: ${match}`);
      }
    }

    // Close the connection
    await mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  } catch (error) {
    console.error('Error testing password:', error);
    if (mongoose.connection) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

testPassword(); 