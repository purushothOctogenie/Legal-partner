import mongoose from '../config/mongodb';
const { Schema, model } = mongoose;
import { Document } from 'mongoose';

export interface ICaseHistoryEntry {
  date: string;
  judge: string;
  businessOnDate: string;
  hearingDate: string;
  purposeOfHearing: string;
  business: string;
  nextPurpose: string;
  nextHearingDate: string;
}

export interface IDocument {
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoded file data
  uploadedAt: string;
  category: string;
}

export interface ICase extends Document {
  // Case Details
  caseType: string;
  courtComplex: string;
  jurisdictionState: string;
  jurisdictionDistrict: string;
  filingNumber: string;
  caseTitle: string;
  subject: string;
  registrationNumber: string;
  cnrNumber: string;
  petitioner: string;
  respondent: string;
  petitionerAdvocate: string;
  respondentAdvocate: string;
  underActs: string[];
  underSections: string[];

  // Case Status
  dateOfFiling: string;
  firstHearingDate: string;
  nextHearingDate: string;
  dateOfDisposal: string;
  caseStage: string;
  substage: string;
  courtNumber: string;
  judge: string;

  // FIR Details
  policeStation: string;
  firNumber: string;
  firYear: string;
  businessOnDate: string;
  hearingDate: string;
  purposeOfHearing: string;
  summary: string;

  // Case History
  caseHistory: ICaseHistoryEntry[];

  // Assignee and Actions
  assignedTo: string;
  documents: IDocument[];

  // Metadata
  status: string;
  createdAt: string;
  updatedAt: string;

  userId: string;
}

const CaseHistoryEntrySchema = new Schema<ICaseHistoryEntry>({
  date: { type: String },
  judge: { type: String },
  businessOnDate: { type: String },
  hearingDate: { type: String },
  purposeOfHearing: { type: String },
  business: { type: String },
  nextPurpose: { type: String },
  nextHearingDate: { type: String },
}, { _id: false });

const DocumentSchema = new Schema<IDocument>({
  name: { type: String },
  size: { type: Number },
  type: { type: String },
  data: { type: String }, // Base64 encoded file data
  uploadedAt: { type: String },
  category: { type: String },
}, { _id: false });

const CaseSchema = new Schema<ICase>({
  // Case Details
  caseType: { type: String, required: true },
  courtComplex: { type: String, required: true },
  jurisdictionState: { type: String },
  jurisdictionDistrict: { type: String },
  filingNumber: { type: String, required: true },
  caseTitle: { type: String, required: true },
  subject: { type: String },
  registrationNumber: { type: String },
  cnrNumber: { type: String },
  petitioner: { type: String, required: true },
  respondent: { type: String, required: true },
  petitionerAdvocate: { type: String },
  respondentAdvocate: { type: String },
  underActs: [{ type: String }],
  underSections: [{ type: String }],

  // Case Status
  dateOfFiling: { type: String, required: true },
  firstHearingDate: { type: String },
  nextHearingDate: { type: String },
  dateOfDisposal: { type: String },
  caseStage: { type: String, required: true },
  substage: { type: String },
  courtNumber: { type: String },
  judge: { type: String },

  // FIR Details
  policeStation: { type: String },
  firNumber: { type: String },
  firYear: { type: String },
  businessOnDate: { type: String },
  hearingDate: { type: String },
  purposeOfHearing: { type: String },
  summary: { type: String },

  // Case History
  caseHistory: { type: [CaseHistoryEntrySchema], default: [] },

  // Assignee and Actions
  assignedTo: { type: String },
  documents: { type: [DocumentSchema], default: [] },

  // Metadata
  status: { type: String, default: 'active' },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },

  userId: { type: String },
});

CaseSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

const Case = model<ICase>('Case', CaseSchema);

export default Case; 