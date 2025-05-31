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

async function updatePassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');

    // Find the user
    const user = await User.findOne({ email: 'firmlawyer3@gmail.com' });
    if (!user) {
      console.log('User not found');
      return;
    }

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      userType: user.userType,
      status: user.status
    });

    // Generate new password hash
    const newPassword = 'Firmlawyer3@';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    console.log('Password updated successfully');
    console.log('New password hash:', hashedPassword);

    // Verify the password
    const isPasswordValid = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Password verification test:', isPasswordValid);

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword(); 