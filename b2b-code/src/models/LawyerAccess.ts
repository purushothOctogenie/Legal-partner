import mongoose, { Schema, Document } from 'mongoose';

export interface ILawyerAccess extends Document {
  lawyerId: mongoose.Types.ObjectId;
  firmId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  accessPermissions: {
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
  };
}

const LawyerAccessSchema = new Schema({
  lawyerId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  firmId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'blocked'], 
    default: 'pending',
    index: true 
  },
  accessPermissions: {
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
    notary: { type: Boolean, default: true }
  }
}, { 
  timestamps: true,
  // Ensure unique combination of lawyerId and firmId
  unique: true
});

// Create compound index for lawyerId and firmId
LawyerAccessSchema.index({ lawyerId: 1, firmId: 1 }, { unique: true });

// Add validation to ensure lawyerId and firmId are different
LawyerAccessSchema.pre('save', function(next) {
  if (this.lawyerId.toString() === this.firmId.toString()) {
    next(new Error('Lawyer and firm cannot be the same user'));
  }
  next();
});

const LawyerAccess = mongoose.models.LawyerAccess || mongoose.model<ILawyerAccess>('LawyerAccess', LawyerAccessSchema);

export default LawyerAccess; 