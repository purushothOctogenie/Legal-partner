import User from "../models/User";
import Case from "../models/Case";
import DocumentModel from "../models/Document";
import Task from "../models/Task";
import Client from "../models/Client";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// MongoDB Connection Options
const MONGODB_URI =
  "mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b";

// Connection Pool Configuration
const connectionOptions = {
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 5000,
  heartbeatFrequencyMS: 10000,
  retryWrites: true,
  w: 1,
};

// Initialize MongoDB Connection
let isConnected = false;

const connectToMongoDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, connectionOptions);
    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

// Ensure connection before operations
const ensureConnection = async () => {
  if (!isConnected) {
    await connectToMongoDB();
  }
};

// Convert MongoDB _id to string id
const convertToPlainObject = (doc: any) => {
  if (!doc) return null;

  // If it's already a plain object, return it
  if (!doc.toObject) return doc;

  // Convert to plain object
  const obj = doc.toObject();

  // Convert _id to id
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }

  // Convert date fields to ISO strings
  Object.keys(obj).forEach((key) => {
    if (obj[key] instanceof Date) {
      obj[key] = obj[key].toISOString();
    } else if (obj[key] instanceof Types.ObjectId) {
      obj[key] = obj[key].toString();
    }
  });

  // Ensure password field is preserved exactly as is
  if (doc.password) {
    obj.password = doc.password;
  }

  return obj;
};

// User Authentication Services
export const createUser = async (userData: any) => {
  try {
    console.log("MongoDB createUser called with email:", userData.email);
    console.log("MongoDB userData fields:", Object.keys(userData).join(", "));

    // Explicitly ensure MongoDB is connected
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState !== 1) {
      console.log("MongoDB not connected. Attempting to connect...");
      await mongoose.connect(
        "mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b",
        {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        }
      );
      console.log("MongoDB connected in createUser function");
    }

    // Ensure required fields are present
    if (!userData.email || !userData.password) {
      console.error("Required fields missing:", {
        email: !!userData.email,
        password: !!userData.password,
      });
      throw new Error("Email and password are required for user creation");
    }

    // Ensure firstName and lastName are set with defaults if missing
    if (!userData.firstName) {
      console.log("Setting default firstName from displayName or email");
      userData.firstName = (userData.displayName || userData.email).split(
        " "
      )[0];
    }

    if (!userData.lastName) {
      console.log("Setting default lastName");
      userData.lastName = userData.displayName
        ? userData.displayName.split(" ").slice(1).join(" ")
        : "";
    }

    // Ensure userType is valid
    const validUserTypes = [
      "lawyer",
      "admin",
      "firm-lawyer",
      "non-lawyer",
      "client",
    ];
    if (!userData.userType || !validUserTypes.includes(userData.userType)) {
      console.log(
        `Invalid userType "${userData.userType}", defaulting to "lawyer"`
      );
      userData.userType = "lawyer";
    }

    // Set default status for firm lawyers and non-lawyers
    if (
      (userData.userType === "firm-lawyer" ||
        userData.userType === "non-lawyer") &&
      userData.firmName
    ) {
      userData.status = "pending";
    }

    // Create user (password will be hashed by the User model's pre-save middleware)
    const userToCreate = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = await User.create(userToCreate);

    // Convert to plain object and return
    return convertToPlainObject(user);
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
};

export const getUserById = async (userId: string) => {
  try {
    const user = await User.findById(userId);
    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    const user = await User.findOne({ email });
    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: any) => {
  try {
    // If updating password, hash it
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );

    return user ? convertToPlainObject(user) : null;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const validatePassword = async (user: any, password: string) => {
  return bcrypt.compare(password, user.password);
};

// Case Services
export const addCase = async (caseData: any) => {
  try {
    console.log(
      "MongoDB service: Adding case with data:",
      JSON.stringify(caseData, null, 2)
    );

    // Ensure client is a valid ObjectId
    if (typeof caseData.client === "string") {
      console.log("Converting client string ID to ObjectId:", caseData.client);
      caseData.client = new Types.ObjectId(caseData.client);
    }

    const newCase = new Case(caseData);
    console.log("Created new Case instance");

    // Validate the case before saving
    const validationError = newCase.validateSync();
    if (validationError) {
      console.error("Case validation failed:", validationError);
      throw validationError;
    }

    await newCase.save();
    console.log("Case saved successfully");
    return (newCase as any)._id.toString();
  } catch (error) {
    console.error("Error adding case:", error);
    throw error;
  }
};

export const getCases = async (userId: string) => {
  try {
    const cases = await Case.find({ userId }).sort({ createdAt: -1 });

    return cases.map(convertToPlainObject);
  } catch (error) {
    console.error("Error getting cases:", error);
    throw error;
  }
};

export const updateCase = async (caseId: string, updates: any) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      caseId,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true } // This ensures we get the updated document back
    );

    if (!updatedCase) {
      throw new Error("Case not found");
    }

    return convertToPlainObject(updatedCase);
  } catch (error) {
    console.error("Error updating case:", error);
    throw error;
  }
};

export const deleteCase = async (caseId: string) => {
  try {
    await Case.findByIdAndDelete(caseId);
  } catch (error) {
    console.error("Error deleting case:", error);
    throw error;
  }
};

// Document Services
export const addDocument = async (documentData: any) => {
  try {
    console.log(
      "MongoDB service: Adding document with data:",
      JSON.stringify(documentData, null, 2)
    );

    // Process the document data to match the schema
    const processedDocumentData: any = {
      title: documentData.name || documentData.title || "Untitled Document",
      description: documentData.description || "",
      fileUrl: documentData.url || documentData.fileUrl || "placeholder-url",
      fileType: documentData.type || documentData.fileType || "application/pdf",
      fileSize: documentData.size || documentData.fileSize || 0,
      userId: documentData.userId,
      tags: documentData.tags || [],
    };

    // If caseId is provided and is a string, convert to ObjectId
    if (
      documentData.caseId &&
      typeof documentData.caseId === "string" &&
      documentData.caseId.trim() !== ""
    ) {
      try {
        processedDocumentData.caseId = new Types.ObjectId(documentData.caseId);
      } catch (e) {
        console.warn("Invalid caseId format, skipping:", documentData.caseId);
      }
    } else if (
      documentData.case &&
      typeof documentData.case === "string" &&
      documentData.case.trim() !== ""
    ) {
      // Handle 'case' field from frontend
      if (documentData.case !== "Unassigned") {
        try {
          // Try to convert to ObjectId if it looks like one
          if (/^[0-9a-fA-F]{24}$/.test(documentData.case)) {
            processedDocumentData.caseId = new Types.ObjectId(
              documentData.case
            );
          } else {
            // Or store as a tag
            processedDocumentData.tags.push(`case:${documentData.case}`);
          }
        } catch (e) {
          console.warn(
            "Invalid case format, adding as tag:",
            documentData.case
          );
          processedDocumentData.tags.push(`case:${documentData.case}`);
        }
      }
    }

    // If clientId is provided and is a string, convert to ObjectId
    if (
      documentData.clientId &&
      typeof documentData.clientId === "string" &&
      documentData.clientId.trim() !== ""
    ) {
      try {
        processedDocumentData.clientId = new Types.ObjectId(
          documentData.clientId
        );
      } catch (e) {
        console.warn(
          "Invalid clientId format, skipping:",
          documentData.clientId
        );
      }
    }

    console.log(
      "Processed document data:",
      JSON.stringify(processedDocumentData, null, 2)
    );

    const document = new DocumentModel(processedDocumentData);

    // Validate the document before saving
    const validationError = document.validateSync();
    if (validationError) {
      console.error("Document validation failed:", validationError);
      throw validationError;
    }

    await document.save();
    console.log("Document saved successfully with ID:", document._id);
    return (document as any)._id.toString();
  } catch (error) {
    console.error("Error adding document:", error);
    throw error;
  }
};

export const getDocuments = async (userId: string) => {
  try {
    const documents = await DocumentModel.find({ userId })
      .populate("caseId", "title")
      .populate("clientId", "name")
      .sort({ createdAt: -1 });

    return documents.map(convertToPlainObject);
  } catch (error) {
    console.error("Error getting documents:", error);
    throw error;
  }
};

export const updateDocument = async (documentId: string, updates: any) => {
  try {
    await DocumentModel.findByIdAndUpdate(documentId, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating document:", error);
    throw error;
  }
};

export const deleteDocument = async (documentId: string) => {
  try {
    await DocumentModel.findByIdAndDelete(documentId);
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error;
  }
};

// Task Services
export const addTask = async (taskData: any) => {
  try {
    console.log(
      "MongoDB service: Adding task with data:",
      JSON.stringify(taskData, null, 2)
    );

    // Process the task data to match the schema
    const processedTaskData: any = {
      title: taskData.title,
      description: taskData.description || "",
      status:
        taskData.status?.toLowerCase() === "pending"
          ? "pending"
          : taskData.status?.toLowerCase() === "completed"
          ? "completed"
          : taskData.status?.toLowerCase() === "in progress"
          ? "in-progress"
          : taskData.status?.toLowerCase() === "cancelled"
          ? "cancelled"
          : taskData.status?.toLowerCase() === "on hold"
          ? "on-hold"
          : taskData.status?.toLowerCase() === "review"
          ? "review"
          : "pending",
      priority:
        taskData.priority?.toLowerCase() === "high"
          ? "high"
          : taskData.priority?.toLowerCase() === "medium"
          ? "medium"
          : taskData.priority?.toLowerCase() === "low"
          ? "low"
          : "medium",
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      notes: taskData.notes || taskData.description || "",
      userId: taskData.userId,
      caseId: taskData.caseId || "",
      clientId: taskData.clientId || "",
      category: taskData.category || "Legal Research",
      assignedTo: taskData.assignedTo || [],
      assignedBy: {
        email: taskData.assignedBy?.email || taskData.userId || "",
        name: taskData.assignedBy?.name || "Unknown",
      },
    };

    console.log(
      "Processed task data:",
      JSON.stringify(processedTaskData, null, 2)
    );

    const task = new Task(processedTaskData);

    // Validate the task before saving
    const validationError = task.validateSync();
    if (validationError) {
      console.error("Task validation error:", validationError);
      throw validationError;
    }

    const savedTask = await task.save();
    return savedTask;
  } catch (error) {
    console.error("Error adding task:", error);
    throw error;
  }
};

export const getTasks = async (userId: string) => {
  try {
    const tasks = await Task.find({ userId })
      .populate("caseId", "title")
      .populate("clientId", "name")
      .sort({ dueDate: 1, priority: -1 });

    return tasks.map(convertToPlainObject);
  } catch (error) {
    console.error("Error getting tasks:", error);
    throw error;
  }
};

export const updateTask = async (taskId: string, updates: any) => {
  try {
    console.log("Updating task with data:", JSON.stringify(updates, null, 2));

    // Process the updates to match the schema
    const processedUpdates: any = {
      ...updates,
      status:
        updates.status?.toLowerCase() === "pending"
          ? "pending"
          : updates.status?.toLowerCase() === "completed"
          ? "completed"
          : updates.status?.toLowerCase() === "in progress"
          ? "in-progress"
          : updates.status?.toLowerCase() === "cancelled"
          ? "cancelled"
          : updates.status?.toLowerCase() === "on hold"
          ? "on-hold"
          : updates.status?.toLowerCase() === "review"
          ? "review"
          : updates.status,
      priority:
        updates.priority?.toLowerCase() === "high"
          ? "high"
          : updates.priority?.toLowerCase() === "medium"
          ? "medium"
          : updates.priority?.toLowerCase() === "low"
          ? "low"
          : updates.priority,
      updatedAt: new Date(),
    };

    const updatedTask = await Task.findByIdAndUpdate(taskId, processedUpdates, {
      new: true,
    });

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    return convertToPlainObject(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await Task.findByIdAndDelete(taskId);
  } catch (error) {
    console.error("Error deleting task:", error);
    throw error;
  }
};

// Client Services
export const addClient = async (clientData: any) => {
  try {
    console.log(
      "MongoDB service: Adding client with data:",
      JSON.stringify(clientData, null, 2)
    );

    // Process the client data to match the schema
    const processedClientData: any = {
      ...clientData,
      status: clientData.status || "active",
      kycValidation: {
        aadharValidated: clientData.kycValidation?.aadharValidated || false,
        phoneVerified: clientData.kycValidation?.phoneVerified || false,
        emailAuthenticated:
          clientData.kycValidation?.emailAuthenticated || false,
        validatedAt: clientData.kycValidation?.validatedAt,
        aadharNumber: clientData.kycValidation?.aadharNumber,
        phoneNumber: clientData.kycValidation?.phoneNumber,
        emailId: clientData.kycValidation?.emailId,
      },
      documents: clientData.documents || [],
      contracts: clientData.contracts || [],
    };

    console.log(
      "Processed client data:",
      JSON.stringify(processedClientData, null, 2)
    );

    const client = new Client(processedClientData);

    // Validate the client before saving
    const validationError = client.validateSync();
    if (validationError) {
      console.error("Client validation failed:", validationError);
      throw validationError;
    }

    await client.save();
    console.log("Client saved successfully with ID:", client._id);
    return (client as any)._id.toString();
  } catch (error) {
    console.error("Error adding client:", error);
    throw error;
  }
};

export const getClients = async (userId: string) => {
  try {
    const clients = await Client.find({ userId }).sort({ createdAt: -1 });
    return clients.map(convertToPlainObject);
  } catch (error) {
    console.error("Error getting clients:", error);
    throw error;
  }
};

export const updateClient = async (clientId: string, updates: any) => {
  try {
    const updatedClient = await Client.findByIdAndUpdate(
      clientId,
      {
        ...updates,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!updatedClient) {
      throw new Error("Client not found");
    }

    return convertToPlainObject(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
};

export const deleteClient = async (clientId: string) => {
  try {
    await Client.findByIdAndDelete(clientId);
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
};
