import { getMongoose } from '../lib/db';
import { Schema, model, Document, Model, Types } from 'mongoose';
import { hashPassword, validatePassword } from '../utils/passwordUtils';

// Get mongoose instance
// console.log('Initializing User model');
const mongoose = getMongoose();

if (mongoose) {
  // console.log('Mongoose instance found, will create User model');
  // console.log('Mongoose version:', mongoose.version);
  // console.log('Mongoose connection state:', mongoose.connection.readyState);
  
  // Check if db is connected
  if (mongoose.connection.readyState === 1) {
    console.log('Mongoose is connected to MongoDB');
    console.log('Connected to database:', mongoose.connection.name);
  } else {
    console.warn('Mongoose is not connected to MongoDB yet!');
  }
} else {
  console.warn('No mongoose instance available in User model initialization');
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string; // Stored hashed
  displayName?: string;
  photoURL?: string;
  phone?: string;
  address?: string;
  website?: string;
  barCouncilNumber?: string;
  practiceType?: string;
  gender?: string;
  aadhaarNumber?: string;
  firmName?: string;
  firmId?: Types.ObjectId;
  userType: 'lawyer' | 'client' | 'admin' | 'non-lawyer' | 'firm-lawyer';
  status?: 'pending' | 'approved' | 'rejected' | 'blocked';
  accessPermissions?: {
    dashboard: boolean;
    aiAssistant: boolean;
    digitalSignature: boolean;
    notifications: boolean;
    clientManagement: boolean;
    caseManagement: boolean;
    documentManagement: boolean;
    calendar: boolean;
    reports: boolean;
    settings: boolean;
    help: boolean;
    tasks: boolean;
    chat: boolean;
    notary: boolean;
    lawyerAccess: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Only create model on server side
let User: Model<IUser>;

// Check if mongoose is available (server-side)
if (mongoose) {
  const UserSchema = new Schema<IUser>({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    displayName: { type: String, trim: true },
    photoURL: { type: String },
    phone: { type: String },
    address: { type: String },
    website: { type: String },
    barCouncilNumber: { type: String },
    practiceType: { type: String },
    gender: { type: String },
    aadhaarNumber: { type: String },
    firmName: { type: String, trim: true },
    userType: {
      type: String,
      enum: ['lawyer', 'admin', 'firm-lawyer', 'non-lawyer', 'client'],
      required: true,
      default: 'lawyer',
      validate: {
        validator: function(value: string) {
          // Prevent non-lawyers from being admins
          if (value === 'non-lawyer' && this.userType === 'admin') {
            return false;
          }
          // Prevent firm-lawyers from being admins
          if (value === 'firm-lawyer' && this.userType === 'admin') {
            return false;
          }
          return true;
        },
        message: 'Non-lawyer and firm-lawyer users cannot be admins'
      }
    },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'blocked'], default: 'approved' },
    accessPermissions: {
      type: {
        dashboard: { type: Boolean, default: true },
        aiAssistant: { type: Boolean, default: true },
        digitalSignature: { type: Boolean, default: true },
        notifications: { type: Boolean, default: true },
        clientManagement: { type: Boolean, default: true },
        caseManagement: { type: Boolean, default: true },
        documentManagement: { type: Boolean, default: true },
        calendar: { type: Boolean, default: true },
        reports: { type: Boolean, default: true },
        settings: { type: Boolean, default: true },
        help: { type: Boolean, default: true },
        tasks: { type: Boolean, default: true },
        chat: { type: Boolean, default: true },
        notary: { type: Boolean, default: true },
        lawyerAccess: { type: Boolean, default: false }
      },
      default: {
        dashboard: true,
        aiAssistant: true,
        digitalSignature: true,
        notifications: true,
        clientManagement: true,
        caseManagement: true,
        documentManagement: true,
        calendar: true,
        reports: true,
        settings: true,
        help: true,
        tasks: true,
        chat: true,
        notary: true,
        lawyerAccess: false
      }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    firmId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  });

  // Pre-save middleware to hash password
  UserSchema.pre('save', async function(this: IUser, next) {
    console.log('User pre-save middleware called');
    if (this.isModified('password')) {
      try {
        this.password = await hashPassword(this.password);
      } catch (error) {
        console.error('Error hashing password:', error);
        return next(error as Error);
      }
    }
    this.updatedAt = new Date();
    next();
  });

  // Add a post-save hook to verify data was saved
  UserSchema.post('save', function(doc) {
    console.log('User saved successfully:', doc._id);
    console.log('User data:', JSON.stringify({
      id: doc._id,
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      userType: doc.userType
    }));
  });

  // Virtual for full name
  UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
  });

  // Method to compare password
  UserSchema.methods.comparePassword = async function(candidatePassword: string) {
    return validatePassword(this.password, candidatePassword);
  };

  // Create the model
  try {
    // Check if model already exists to prevent duplicate model error
    if (mongoose.models && mongoose.models.User) {
      console.log('Using existing User model:', mongoose.models.User.modelName, mongoose.models.User.collection.name);
      User = mongoose.models.User as Model<IUser>;
    } else {
      console.log('Creating new User model with collection name "users"');
      User = model<IUser>('User', UserSchema, 'users');
      console.log('User model created successfully:', User.modelName);
      console.log('User collection name:', User.collection.name);
    }
  } catch (error) {
    console.error('Error creating User model:', error);
    // Create a dummy model if there was an error
    User = {} as Model<IUser>;
  }
} else {
  console.warn('Creating dummy User model for client-side');
  // Create a dummy model for client-side
  User = {} as Model<IUser>;
}

export default User; 