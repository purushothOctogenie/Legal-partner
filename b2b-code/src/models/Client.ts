import mongoose, { Schema, Document } from "mongoose";

interface Address {
  building: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface ClientDocument {
  name: string;
  type: string;
  size: number;
  data: string; // Base64 encoded file data
  uploadedAt: string;
  category: string;
}

interface KYCValidation {
  aadharValidated: boolean;
  phoneVerified: boolean;
  emailAuthenticated: boolean;
  validatedAt?: string;
  aadharNumber?: string;
  phoneNumber?: string;
  emailId?: string;
}

interface Contract {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  documentId: string;
}

export interface IClient extends Document {
  // Personal Details
  salutation: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  isWhatsappEnabled: boolean;
  alternatePhone?: string;
  gstin?: string;

  // Addresses
  contactAddress: Address;
  alternateAddress?: Address;

  // KYC Validation
  kycValidation: KYCValidation;

  // Documents
  documents: ClientDocument[];

  // Contract Management
  contracts: Contract[];

  // Metadata
  userId: mongoose.Types.ObjectId;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Address Schema
const AddressSchema = new Schema({
  building: { type: String, required: true },
  street: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pincode: { type: String, required: true },
});

// KYC Validation Schema
const KYCValidationSchema = new Schema({
  aadharValidated: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  emailAuthenticated: { type: Boolean, default: false },
  validatedAt: { type: Date },
  aadharNumber: { type: String },
  phoneNumber: { type: String },
  emailId: { type: String },
});

// Document Schema
const DocumentSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  data: { type: String, required: true },
  uploadedAt: { type: Date, required: true },
  category: { type: String, required: true },
});

// Contract Schema
const ContractSchema = new Schema({
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["draft", "active", "expired", "terminated"],
    default: "draft",
  },
  documentId: { type: String },
});

// Client Schema
const ClientSchema = new Schema(
  {
    // Personal Details
    salutation: {
      type: String,
      enum: ["Mr.", "Mrs.", "Ms.", "Dr."],
      required: true,
    },
    firstName: { type: String, required: true },
    middleName: { type: String },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    isWhatsappEnabled: { type: Boolean, default: false },
    alternatePhone: { type: String },
    gstin: { type: String },

    // Addresses
    contactAddress: { type: AddressSchema, required: true },
    alternateAddress: { type: AddressSchema },

    // KYC Validation
    kycValidation: { type: KYCValidationSchema, required: true },

    // Documents
    documents: [DocumentSchema],

    // Contract Management
    contracts: [ContractSchema],

    // Metadata
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
ClientSchema.index({ userId: 1 });
ClientSchema.index({ email: 1 });
ClientSchema.index({ phone: 1 });
ClientSchema.index({ status: 1 });

// Create and export the model
const Client = mongoose.model("Client", ClientSchema);

export default Client;
