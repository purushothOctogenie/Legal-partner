import mongoose from 'mongoose';

const nonLawyerAccessSchema = new mongoose.Schema({
  nonLawyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: 'pending'
  },
  accessPermissions: {
    dashboard: { type: Boolean, default: true},
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
    notary: { type: Boolean, default: true }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
nonLawyerAccessSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const NonLawyerAccess = mongoose.model('NonLawyerAccess', nonLawyerAccessSchema);

export default NonLawyerAccess; 