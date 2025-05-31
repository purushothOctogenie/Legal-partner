import mongoose from "../config/mongodb";
const { Schema, model } = mongoose;
import { Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  description?: string;
  status:
    | "pending"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "on-hold"
    | "review";
  priority: "low" | "medium" | "high" | "urgent";
  dueDate: Date;
  caseId: string;
  clientId: string;
  category: string;
  notes?: string;
  assignedTo: Array<{
    email: string;
    name: string;
  }>;
  assignedBy: {
    email: string;
    name: string;
  };
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  status: {
    type: String,
    enum: [
      "pending",
      "in-progress",
      "completed",
      "cancelled",
      "on-hold",
      "review",
    ],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },
  dueDate: { type: Date, required: true },
  caseId: { type: String, required: true },
  clientId: { type: String, required: true },
  category: { type: String, required: true, default: "Legal Research" },
  notes: { type: String },
  assignedTo: [
    {
      email: { type: String, required: true },
      name: { type: String, required: true },
    },
  ],
  assignedBy: {
    email: { type: String, required: true },
    name: { type: String, required: true },
  },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Pre-save middleware to update the updatedAt field
TaskSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Task = model<ITask>("Task", TaskSchema);

export default Task;
