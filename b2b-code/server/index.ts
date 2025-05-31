import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { connectDB, setMongoURI } from "../src/lib/db";
import * as mongodbService from "../src/services/mongodb";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
// Direct import of the User model for registration debugging
import User from "../src/models/User";
import LawyerAccess from "../src/models/LawyerAccess";
import NonLawyerAccess from "../src/models/NonLawyerAccess";
import mongoose from "mongoose";
import Task from "../src/models/Task";

// Only load environment variables in Node.js environment
if (
  typeof process !== "undefined" &&
  process.versions &&
  process.versions.node
) {
  dotenv.config();
}

// Set a global flag to track if MongoDB is already connected
let mongodbConnected = false;

// MongoDB Atlas connection string
const MONGODB_URI =
  "mongodb+srv://santhosh-p:santhosh@octogenie.gw4ag1g.mongodb.net/legal-b2b?retryWrites=true&w=majority&appName=legal-b2b";

// Set MongoDB URI before connecting
setMongoURI(MONGODB_URI);

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET =
  typeof process !== "undefined"
    ? process.env.JWT_SECRET || "your-secret-key"
    : "your-secret-key";
const JWT_EXPIRY =
  typeof process !== "undefined" ? process.env.JWT_EXPIRY || "3d" : "3d";

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware
// Configure CORS with specific options
app.use(
  cors({
    origin:
      typeof process !== "undefined" && process.env.NODE_ENV === "production"
        ? [
            "https://legal-b2b.vercel.app",
            "https://legal-b2b-cd16um64m-santhosh-palanisamys-projects.vercel.app",
          ]
        : "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Increase payload size limit for document uploads (to handle Base64 encoded files)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  // Only log non-GET requests or errors to reduce noise
  if (req.method !== "GET") {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  }
  next();
});

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token || typeof token !== "string") {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
      userType: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Modified server startup with error handling
const startServer = () => {
  const server = app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });

  server.on("error", (e: any) => {
    if (e.code === "EADDRINUSE") {
      console.log(
        `Port ${port} is already in use, trying port ${
          parseInt(port.toString()) + 1
        }`
      );
      // Try a different port
      const newPort = parseInt(port.toString()) + 1;
      app.listen(newPort, () => {
        console.log(`✅ Server running at http://localhost:${newPort}`);
      });
    } else {
      console.error("Server error:", e);
    }
  });
};

// Connect to MongoDB first, then start server - ensure it only happens once
if (!mongodbConnected) {
  connectDB()
    .then(() => {
      mongodbConnected = true;
      // MongoDB connection successful, start server
      startServer();
    })
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err);
      process.exit(1); // Exit on connection failure
    });
} else {
  // If MongoDB is already connected, just start the server
  startServer();
}

// Authentication Routes
app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    console.log("Registration request received:", {
      email: userData.email,
      userType: userData.userType,
      firmName: userData.firmName,
    });

    // Ensure userType is explicitly set and valid
    if (
      !userData.userType ||
      !["lawyer", "admin", "firm-lawyer", "non-lawyer", "client"].includes(
        userData.userType
      )
    ) {
      return res.status(400).json({ message: "Invalid user type" });
    }

    // Set default access permissions based on user type
    const defaultPermissions = {
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
      lawyerAccess: userData.userType === "admin", // Only admins get lawyer access
    };

    // Add permissions to user data
    userData.accessPermissions = defaultPermissions;

    // Prevent non-lawyers and firm-lawyers from being registered as admins
    if (
      (userData.userType === "non-lawyer" ||
        userData.userType === "firm-lawyer") &&
      userData.userType === "admin"
    ) {
      return res
        .status(400)
        .json({ message: "Non-lawyer and firm-lawyer users cannot be admins" });
    }

    // Set status based on user type
    if (
      userData.userType === "firm-lawyer" ||
      userData.userType === "non-lawyer"
    ) {
      if (!userData.firmName) {
        return res.status(400).json({
          message: "Firm name is required for firm lawyers and non-lawyers",
        });
      }
      userData.status = "pending"; // Set pending status for firm lawyers and non-lawyers
    } else {
      userData.status = "approved"; // Set approved status for individual lawyers and admins
    }

    // Create user with explicit userType and permissions
    const user = await mongodbService.createUser({
      ...userData,
      userType: userData.userType,
      accessPermissions: defaultPermissions,
    });

    // Check if user was created successfully
    if (!user) {
      console.error("Failed to create user account");
      return res.status(500).json({ message: "Failed to create user account" });
    }

    console.log("User created successfully:", {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      accessPermissions: user.accessPermissions,
    });

    // Create access records for firm lawyers and non-lawyers
    if (
      (userData.userType === "firm-lawyer" ||
        userData.userType === "non-lawyer") &&
      userData.firmName
    ) {
      try {
        // Find the firm by name
        const firm = await User.findOne({
          firmName: userData.firmName,
          userType: "admin",
        });

        if (!firm) {
          console.error(`Firm not found: ${userData.firmName}`);
          // Delete the user if firm not found
          await User.findByIdAndDelete(user.id);
          return res.status(400).json({
            message:
              "Firm not found. Please check the firm name and try again.",
          });
        }

        console.log("Found firm:", { id: firm._id, name: firm.firmName });

        // Create appropriate access record based on user type
        if (userData.userType === "firm-lawyer") {
          const lawyerAccess = await LawyerAccess.create({
            lawyerId: user.id,
            firmId: firm._id,
            status: "pending",
            accessPermissions: defaultPermissions,
          });
          console.log("LawyerAccess record created:", {
            id: lawyerAccess._id,
            lawyerId: user.id,
            firmId: firm._id,
            status: lawyerAccess.status,
          });
        } else if (userData.userType === "non-lawyer") {
          const nonLawyerAccess = await NonLawyerAccess.create({
            nonLawyerId: user.id,
            firmId: firm._id,
            status: "pending",
            accessPermissions: defaultPermissions,
          });
          console.log("NonLawyerAccess record created:", {
            id: nonLawyerAccess._id,
            nonLawyerId: user.id,
            firmId: firm._id,
            status: nonLawyerAccess.status,
          });
        }

        // Return response indicating pending approval
        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            userType: user.userType,
            status: "pending",
            accessPermissions: defaultPermissions,
          },
          JWT_SECRET,
          { expiresIn: "3d" }
        );

        const authUser = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          displayName: user.displayName,
          photoURL: user.photoURL,
          userType: user.userType,
          status: "pending",
          accessPermissions: defaultPermissions,
        };

        return res.status(200).json({
          user: authUser,
          token,
          message:
            "Registration successful. Your account is pending approval from the firm.",
        });
      } catch (error: any) {
        console.error("Error creating access record:", error);
        // Delete the user if access record creation fails
        await User.findByIdAndDelete(user.id);
        return res.status(500).json({
          message: "Failed to create access record. Please try again.",
          details: error.message,
        });
      }
    }

    // For individual lawyers and admins, proceed with normal registration
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        userType: user.userType,
        accessPermissions: defaultPermissions,
      },
      JWT_SECRET,
      { expiresIn: "3d" }
    );

    const authUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      photoURL: user.photoURL,
      userType: user.userType,
      status: user.status,
      accessPermissions: defaultPermissions,
    };

    console.log("Registration successful for:", {
      email: authUser.email,
      userType: authUser.userType,
      status: authUser.status,
      accessPermissions: authUser.accessPermissions,
    });

    res.status(200).json({ user: authUser, token });
  } catch (error: any) {
    console.error("Registration error:", error);
    res.status(500).json({
      message: "An error occurred during registration",
      details: error.message,
    });
  }
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    console.log("Login attempt for email:", email);

    if (!email || !password) {
      console.log("Missing email or password");
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email (case insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("User found:", {
      id: user?._id,
      email: user?.email,
      userType: user?.userType,
      status: user?.status,
      firmName: user?.firmName,
    });

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Validate password
    const isPasswordValid = await mongodbService.validatePassword(
      user,
      password
    );
    console.log("Password validation result:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // For admin users (law firms), allow direct login with full access
    if (user.userType === "admin") {
      console.log("Admin user (law firm) login successful:", email);
      const adminPermissions = {
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
        lawyerAccess: true, // Law firms can access lawyer management
      };

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          userType: user.userType,
          firmId: user._id,
          firmName: user.firmName,
          accessPermissions: adminPermissions,
        },
        JWT_SECRET,
        { expiresIn: "3d" }
      );

      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(200).json({
        user: {
          ...userWithoutPassword,
          status: "approved",
          accessPermissions: adminPermissions,
        },
        token,
      });
    }

    // For individual lawyers (no firm association needed)
    if (user.userType === "lawyer" && !user.firmName) {
      console.log("Individual lawyer login successful:", email);
      const lawyerPermissions = {
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
        lawyerAccess: false, // Individual lawyers don't have lawyer access
      };

      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          userType: user.userType,
          accessPermissions: lawyerPermissions,
        },
        JWT_SECRET,
        { expiresIn: "3d" }
      );

      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(200).json({
        user: {
          ...userWithoutPassword,
          status: "approved",
          accessPermissions: lawyerPermissions,
        },
        token,
      });
    }

    // For firm lawyers and non-lawyers
    if (user.userType === "firm-lawyer" || user.userType === "non-lawyer") {
      const userId = user._id;

      // Determine which model and field to use based on user type
      let accessModel;
      let accessField;
      let accessRecord;

      if (user.userType === "firm-lawyer") {
        accessModel = LawyerAccess;
        accessField = "lawyerId";
        accessRecord = await LawyerAccess.findOne({
          lawyerId: userId,
        }).populate("firmId", "firmName");
      } else {
        accessModel = NonLawyerAccess;
        accessField = "nonLawyerId";
        accessRecord = await NonLawyerAccess.findOne({
          nonLawyerId: userId,
        }).populate("firmId", "firmName");
      }

      console.log("Checking access for:", {
        userId,
        userType: user.userType,
        firmName: user.firmName,
        accessModel:
          user.userType === "firm-lawyer" ? "LawyerAccess" : "NonLawyerAccess",
      });

      if (!accessRecord) {
        // Create access record if it doesn't exist
        const firm = await User.findOne({
          userType: "admin",
          firmName: user.firmName,
        });

        if (!firm) {
          console.log("Firm not found:", user.firmName);
          return res.status(403).json({
            message: "Firm not found. Please contact your firm administrator.",
            status: "no_firm",
          });
        }

        try {
          // Create the appropriate access record based on user type
          const newAccessRecord = await accessModel.create({
            [accessField]: userId,
            firmId: firm._id,
            status: "pending",
            accessPermissions: {
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
            },
          });

          console.log(`Created new ${user.userType} access record:`, {
            id: newAccessRecord._id,
            status: newAccessRecord.status,
            type: user.userType,
            collection:
              user.userType === "firm-lawyer"
                ? "lawyeraccesses"
                : "nonlawyeraccesses",
          });

          return res.status(403).json({
            message:
              "Your registration is pending approval. Please wait for the firm to approve your access.",
            status: "pending",
          });
        } catch (error: any) {
          console.error("Error creating access record:", error);
          return res.status(500).json({
            message: "Failed to create access record. Please try again.",
            details: error.message,
          });
        }
      }

      // Check access status
      if (accessRecord.status !== "approved") {
        console.log("Access not approved:", {
          userId,
          status: accessRecord.status,
        });
        return res.status(403).json({
          message:
            accessRecord.status === "pending"
              ? "Your registration is pending approval. Please wait for the firm to approve your access."
              : accessRecord.status === "rejected"
              ? "Your access request has been rejected. Please contact your firm administrator."
              : "Your access has been blocked. Please contact your firm administrator.",
          status: accessRecord.status,
        });
      }

      // Access approved, generate token
      console.log("Access approved for user:", email);
      const token = jwt.sign(
        {
          id: user._id,
          email: user.email,
          userType: user.userType,
          firmId: accessRecord.firmId._id,
          firmName: accessRecord.firmId.firmName,
          accessPermissions: accessRecord.accessPermissions,
        },
        JWT_SECRET,
        { expiresIn: "3d" }
      );

      const { password: _, ...userWithoutPassword } = user.toObject();
      return res.status(200).json({
        user: {
          ...userWithoutPassword,
          firmId: accessRecord.firmId._id,
          firmName: accessRecord.firmId.firmName,
          status: "approved",
          accessPermissions: accessRecord.accessPermissions,
        },
        token,
      });
    }

    // If we get here, something went wrong
    console.error("Unexpected user type:", user.userType);
    return res.status(500).json({ message: "Invalid user type" });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "An error occurred during login",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// New endpoint for token verification
app.post("/api/auth/verify", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    // Check if user exists
    const user = await mongodbService.getUserById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user is a lawyer, get their access permissions
    if (user.userType === "lawyer") {
      const lawyerAccess = await LawyerAccess.findOne({ lawyerId: user._id });
      if (lawyerAccess) {
        user.accessPermissions = lawyerAccess.accessPermissions;
      }
    }

    // Create a new object without the password field
    const { password, ...userWithoutPassword } = user;

    // Format user response to match authService
    const authUser = {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      firstName: userWithoutPassword.firstName,
      lastName: userWithoutPassword.lastName,
      displayName: userWithoutPassword.displayName,
      photoURL: userWithoutPassword.photoURL,
      userType: userWithoutPassword.userType || "lawyer",
      status: userWithoutPassword.status,
      accessPermissions: userWithoutPassword.accessPermissions,
    };

    return res.json({ user: authUser });
  } catch (error) {
    console.error("Token verification error:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid token" });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Token expired" });
    }
    return res.status(500).json({ message: "Failed to verify token" });
  }
});

app.get(
  "/api/auth/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const user = await mongodbService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "User not found" });
      }

      // Create a new object without the password field
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  }
);

app.put(
  "/api/auth/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const updates = { ...req.body, updatedAt: new Date() };
      const user = await mongodbService.updateUser(req.user.id, updates);

      if (!user) {
        res.status(404).json({ error: "User not found" });
      }

      // Create a new object without the password field
      const { password, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  }
);

// Case Routes
app.get(
  "/api/cases",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const cases = await mongodbService.getCases(req.user.id);
      res.json(cases);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cases" });
    }
  }
);

app.post(
  "/api/cases",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "Creating new case with data:",
        JSON.stringify(req.body, null, 2)
      );

      // Check for required client field
      if (!req.body.client) {
        console.error("Missing required client field in request");
        res.status(400).json({
          message: "Client is required",
          details:
            "Case creation requires a client field with a valid client ID",
        });
      }

      const caseData = {
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Processed case data:", JSON.stringify(caseData, null, 2));

      const caseId = await mongodbService.addCase(caseData);
      console.log("Case created successfully with ID:", caseId);
      res.json({ id: caseId });
    } catch (error) {
      console.error("Error creating case:", error);
      // Type checking for error details
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to create case", details: errorMessage });
    }
  }
);

app.put(
  "/api/cases/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      await mongodbService.updateCase(req.params.id, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update case" });
    }
  }
);

app.delete(
  "/api/cases/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await mongodbService.deleteCase(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete case" });
    }
  }
);

// Client Routes
app.get(
  "/api/clients",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const clients = await mongodbService.getClients(req.user.id);
      res.json(clients);
    } catch (error) {
      console.error("Error getting clients:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to fetch clients", details: errorMessage });
    }
  }
);

app.post(
  "/api/clients",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "Creating new client with data:",
        JSON.stringify(req.body, null, 2)
      );

      // Validate required fields
      if (!req.body.firstName || !req.body.lastName) {
        console.error("Missing required fields in request");
        return res.status(400).json({
          message: "First name and last name are required",
          details: "Client creation requires firstName and lastName fields",
        });
      }

      const clientData = {
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(
        "Processed client data:",
        JSON.stringify(clientData, null, 2)
      );

      const clientId = await mongodbService.addClient(clientData);
      console.log("Client created successfully with ID:", clientId);
      res.json({ id: clientId });
    } catch (error) {
      console.error("Error creating client:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to create client", details: errorMessage });
    }
  }
);

app.put(
  "/api/clients/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      await mongodbService.updateClient(req.params.id, updates);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating client:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to update client", details: errorMessage });
    }
  }
);

app.delete(
  "/api/clients/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await mongodbService.deleteClient(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting client:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to delete client", details: errorMessage });
    }
  }
);

// Document Routes
app.get(
  "/api/documents",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const documents = await mongodbService.getDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error getting documents:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to fetch documents", details: errorMessage });
    }
  }
);

app.post(
  "/api/documents",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "Creating new document with data:",
        JSON.stringify(req.body, null, 2)
      );

      // Manually ensure we have a valid title and fileUrl
      const title = req.body.title || req.body.name || "Untitled Document";
      const fileUrl = req.body.fileUrl || req.body.url || "placeholder-url";

      const documentData = {
        ...req.body,
        title,
        fileUrl,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log(
        "Processed document data:",
        JSON.stringify(documentData, null, 2)
      );

      const documentId = await mongodbService.addDocument(documentData);
      console.log("Document created successfully with ID:", documentId);
      res.json({ id: documentId });
    } catch (error) {
      console.error("Error creating document:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for validation errors
      if (error instanceof Error && error.name === "ValidationError") {
        res.status(400).json({
          error: "Validation error",
          details: errorMessage,
        });
      }

      res
        .status(500)
        .json({ error: "Failed to create document", details: errorMessage });
    }
  }
);

app.put(
  "/api/documents/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      await mongodbService.updateDocument(req.params.id, updates);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update document" });
    }
  }
);

app.delete(
  "/api/documents/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await mongodbService.deleteDocument(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete document" });
    }
  }
);

// Task Routes
app.get(
  "/api/tasks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Get tasks where user is either the creator or assignee
      const tasks = await Task.find({
        $or: [
          { userId: req.user.id }, // Tasks created by the user
          { "assignedTo.email": req.user.email }, // Tasks assigned to the user
        ],
      }).sort({ dueDate: 1, priority: -1 });

      res.json(tasks);
    } catch (error) {
      console.error("Error getting tasks:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      res
        .status(500)
        .json({ error: "Failed to fetch tasks", details: errorMessage });
    }
  }
);

app.post(
  "/api/tasks",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      console.log(
        "Creating new task with data:",
        JSON.stringify(req.body, null, 2)
      );

      // Verify required fields
      if (!req.body.title) {
        console.error("Missing required title field in task request");
        res.status(400).json({
          message: "Title is required",
          details: "Task creation requires a title field",
        });
      }

      const taskData = {
        ...req.body,
        userId: req.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log("Processed task data:", JSON.stringify(taskData, null, 2));

      const taskId = await mongodbService.addTask(taskData);
      console.log("Task created successfully with ID:", taskId);
      res.json({ id: taskId });
    } catch (error) {
      console.error("Error creating task:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Check for validation errors
      if (error instanceof Error && error.name === "ValidationError") {
        res.status(400).json({
          error: "Validation error",
          details: errorMessage,
        });
      }

      res
        .status(500)
        .json({ error: "Failed to create task", details: errorMessage });
    }
  }
);

app.put(
  "/api/tasks/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const taskId = req.params.id;
      const updates = req.body;
      const user = req.user;

      // Find the task
      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Check if user has permission to update the task
      const isAdmin = user.userType === "admin";
      const isAssignedToTask = task.assignedTo.some(
        (assignee: { email: string }) => assignee.email === user.email
      );

      if (!isAdmin && !isAssignedToTask) {
        return res
          .status(403)
          .json({ error: "You don't have permission to update this task" });
      }

      // For non-admin users, only allow status updates
      if (!isAdmin) {
        if (Object.keys(updates).length > 1 || !updates.status) {
          return res
            .status(403)
            .json({ error: "Employees can only update task status" });
        }
        updates.status = updates.status.toLowerCase();
      }

      // Update the task
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ error: "Failed to update task" });
    }
  }
);

app.delete(
  "/api/tasks/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      await mongodbService.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete task" });
    }
  }
);

// New endpoints for user management
app.post(
  "/api/users/:userId/change-password",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Ensure the user is modifying their own account
      if (req.user.id !== req.params.userId) {
        res
          .status(403)
          .json({ message: "You can only change your own password" });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res
          .status(400)
          .json({ message: "Current password and new password are required" });
      }

      // Get the user
      const user = await mongodbService.getUserById(req.user.id);
      if (!user) {
        res.status(404).json({ message: "User not found" });
      }

      // Validate current password
      const isPasswordValid = await mongodbService.validatePassword(
        user,
        currentPassword
      );
      if (!isPasswordValid) {
        res.status(401).json({ message: "Current password is incorrect" });
      }

      // Update password
      await mongodbService.updateUser(req.user.id, { password: newPassword });

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  }
);

app.post(
  "/api/users/:userId/change-email",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Ensure the user is modifying their own account
      if (req.user.id !== req.params.userId) {
        res.status(403).json({ message: "You can only change your own email" });
      }

      const { email } = req.body;

      if (!email) {
        res.status(400).json({ message: "Email is required" });
      }

      // Check if email is already in use
      const existingUser = await mongodbService.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.id) {
        res.status(400).json({ message: "Email already in use" });
      }

      // Update email
      const updatedUser = await mongodbService.updateUser(req.user.id, {
        email,
      });

      // Create a new object without the password field
      const { password, ...userWithoutPassword } = updatedUser;

      // Format user response
      const authUser = {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        displayName: userWithoutPassword.displayName,
        photoURL: userWithoutPassword.photoURL,
        userType: userWithoutPassword.userType || "lawyer",
      };

      res.json(authUser);
    } catch (error) {
      console.error("Change email error:", error);
      res.status(500).json({ message: "Failed to change email" });
    }
  }
);

app.put(
  "/api/users/:userId/profile",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Ensure the user is modifying their own account
      if (req.user.id !== req.params.userId) {
        res
          .status(403)
          .json({ message: "You can only update your own profile" });
      }

      // Update profile
      const updatedUser = await mongodbService.updateUser(
        req.user.id,
        req.body
      );

      // Create a new object without the password field
      const { password, ...userWithoutPassword } = updatedUser;

      // Format user response
      const authUser = {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        firstName: userWithoutPassword.firstName,
        lastName: userWithoutPassword.lastName,
        displayName: userWithoutPassword.displayName,
        photoURL: userWithoutPassword.photoURL,
        userType: userWithoutPassword.userType || "lawyer",
      };

      res.json(authUser);
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
);

app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists (but don't reveal this information)
    const user = await mongodbService.getUserByEmail(email);

    // In a real implementation, you would:
    // 1. Generate a reset token and save it to the database with an expiry
    // 2. Send an email with a link containing the token

    // Just return success even if user doesn't exist (for security)
    res.json({
      success: true,
      message:
        "If your email is registered, you will receive a password reset link",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res
      .status(500)
      .json({ message: "Failed to process reset password request" });
  }
});

// Lawyer Access Management Routes
app.get(
  "/api/firm/lawyers",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can access this endpoint" });
      }

      // Find all lawyers associated with this firm
      const lawyerAccessRecords = await LawyerAccess.find({
        firmId: req.user.id,
      }).populate("lawyerId", "firstName lastName email status");

      if (!lawyerAccessRecords) {
        return res
          .status(404)
          .json({ message: "No lawyers found for this firm" });
      }

      // Format the response
      const lawyers = lawyerAccessRecords.map((record) => ({
        id: record.lawyerId._id,
        firstName: record.lawyerId.firstName,
        lastName: record.lawyerId.lastName,
        email: record.lawyerId.email,
        status: record.status,
        accessPermissions: record.accessPermissions,
      }));

      res.status(200).json(lawyers);
    } catch (error: any) {
      console.error("Error fetching firm lawyers:", error);
      res
        .status(500)
        .json({ message: "Error fetching lawyers", details: error.message });
    }
  }
);

// Update lawyer status
app.put(
  "/api/firm/lawyers/:lawyerId/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { lawyerId } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can update lawyer status" });
      }

      const lawyerAccess = await LawyerAccess.findOneAndUpdate(
        { lawyerId, firmId: req.user.id },
        { status },
        { new: true }
      );

      if (!lawyerAccess) {
        return res.status(404).json({ message: "Lawyer not found" });
      }

      res.status(200).json({ message: "Lawyer status updated successfully" });
    } catch (error: any) {
      console.error("Error updating lawyer status:", error);
      res.status(500).json({
        message: "Error updating lawyer status",
        details: error.message,
      });
    }
  }
);

// Update lawyer permissions
app.put(
  "/api/firm/lawyers/:lawyerId/permissions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { lawyerId } = req.params;
      const { accessPermissions } = req.body;

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can update lawyer permissions" });
      }

      const lawyerAccess = await LawyerAccess.findOneAndUpdate(
        { lawyerId, firmId: req.user.id },
        { accessPermissions },
        { new: true }
      );

      if (!lawyerAccess) {
        return res.status(404).json({ message: "Lawyer not found" });
      }

      res
        .status(200)
        .json({ message: "Lawyer permissions updated successfully" });
    } catch (error: any) {
      console.error("Error updating lawyer permissions:", error);
      res.status(500).json({
        message: "Error updating lawyer permissions",
        details: error.message,
      });
    }
  }
);

// Get all users (lawyers and non-lawyers) for a firm
app.get(
  "/api/firm/users",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can access this endpoint" });
      }

      // Find all users associated with this firm
      const users = await User.find({
        $or: [
          {
            firmName: req.user.firmName,
            userType: { $in: ["lawyer", "non-lawyer"] },
          },
          {
            _id: {
              $in: (
                await LawyerAccess.find({ firmId: req.user.id })
              ).map((la) => la.lawyerId),
            },
          },
        ],
      }).select("-password");

      // Get access records for all users
      const [lawyerAccessRecords, nonLawyerAccessRecords] = await Promise.all([
        LawyerAccess.find({
          $or: [
            { firmId: req.user.id },
            { lawyerId: { $in: users.map((u) => u._id) } },
          ],
        }),
        NonLawyerAccess.find({
          $or: [
            { firmId: req.user.id },
            { nonLawyerId: { $in: users.map((u) => u._id) } },
          ],
        }),
      ]);

      // Format the response
      const formattedUsers = users.map((user) => {
        const lawyerAccess = lawyerAccessRecords.find(
          (ar) =>
            ar.lawyerId.toString() === user._id.toString() ||
            ar.firmId.toString() === user._id.toString()
        );
        const nonLawyerAccess = nonLawyerAccessRecords.find(
          (ar) =>
            ar.nonLawyerId.toString() === user._id.toString() ||
            ar.firmId.toString() === user._id.toString()
        );

        const accessRecord = lawyerAccess || nonLawyerAccess;

        return {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType,
          status: accessRecord?.status || user.status || "pending",
          accessPermissions: accessRecord?.accessPermissions || {
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
          },
        };
      });

      res.status(200).json(formattedUsers);
    } catch (error: any) {
      console.error("Error fetching firm users:", error);
      res
        .status(500)
        .json({ message: "Error fetching users", details: error.message });
    }
  }
);

// Update user status (for both lawyers and non-lawyers)
app.put(
  "/api/firm/users/:userId/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can update user status" });
      }

      // First get the user to determine their type
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update user status
      user.status = status;
      await user.save();

      // Update the appropriate access record based on user type
      if (user.userType === "firm-lawyer") {
        const lawyerAccess = await LawyerAccess.findOneAndUpdate(
          { lawyerId: userId, firmId: req.user.id },
          { status },
          { new: true }
        );

        if (!lawyerAccess) {
          console.error("Lawyer access record not found for:", {
            userId,
            firmId: req.user.id,
            userType: user.userType,
          });
          return res
            .status(404)
            .json({ message: "Lawyer access record not found" });
        }

        console.log("Lawyer status updated in both collections:", {
          userId,
          newStatus: status,
          userStatus: user.status,
          accessStatus: lawyerAccess.status,
          userType: user.userType,
          collection: "lawyeraccesses",
        });
      } else if (user.userType === "non-lawyer") {
        const nonLawyerAccess = await NonLawyerAccess.findOneAndUpdate(
          { nonLawyerId: userId, firmId: req.user.id },
          { status },
          { new: true }
        );

        if (!nonLawyerAccess) {
          console.error("Non-lawyer access record not found for:", {
            userId,
            firmId: req.user.id,
            userType: user.userType,
          });
          return res
            .status(404)
            .json({ message: "Non-lawyer access record not found" });
        }

        console.log("Non-lawyer status updated in both collections:", {
          userId,
          newStatus: status,
          userStatus: user.status,
          accessStatus: nonLawyerAccess.status,
          userType: user.userType,
          collection: "nonlawyeraccesses",
        });
      }

      // Return the updated user data including the access record status
      const accessRecord =
        user.userType === "firm-lawyer"
          ? await LawyerAccess.findOne({
              lawyerId: userId,
              firmId: req.user.id,
            })
          : user.userType === "non-lawyer"
          ? await NonLawyerAccess.findOne({
              nonLawyerId: userId,
              firmId: req.user.id,
            })
          : null;

      res.status(200).json({
        message: "User status updated successfully",
        status: status,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          status: user.status,
          accessStatus: accessRecord?.status || status,
        },
      });
    } catch (error: any) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        message: "Error updating user status",
        details: error.message,
      });
    }
  }
);

// Update user permissions (for both lawyers and non-lawyers)
app.put(
  "/api/firm/users/:userId/permissions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { accessPermissions } = req.body;

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can update user permissions" });
      }

      // First get the user to determine their type
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update permissions based on user type
      if (user.userType === "firm-lawyer") {
        const lawyerAccess = await LawyerAccess.findOneAndUpdate(
          { lawyerId: userId, firmId: req.user.id },
          { accessPermissions },
          { new: true }
        );

        if (!lawyerAccess) {
          return res
            .status(404)
            .json({ message: "Lawyer access record not found" });
        }

        console.log("Lawyer permissions updated:", {
          userId,
          userType: user.userType,
          collection: "lawyeraccesses",
        });
      } else if (user.userType === "non-lawyer") {
        const nonLawyerAccess = await NonLawyerAccess.findOneAndUpdate(
          { nonLawyerId: userId, firmId: req.user.id },
          { accessPermissions },
          { new: true }
        );

        if (!nonLawyerAccess) {
          return res
            .status(404)
            .json({ message: "Non-lawyer access record not found" });
        }

        console.log("Non-lawyer permissions updated:", {
          userId,
          userType: user.userType,
          collection: "nonlawyeraccesses",
        });
      } else {
        return res
          .status(400)
          .json({ message: "Invalid user type for permission update" });
      }

      res
        .status(200)
        .json({ message: "User permissions updated successfully" });
    } catch (error: any) {
      console.error("Error updating user permissions:", error);
      res.status(500).json({
        message: "Error updating user permissions",
        details: error.message,
      });
    }
  }
);

// Delete user from firm
app.delete(
  "/api/firm/users/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can delete users" });
      }

      // First get the user to determine their type
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete the appropriate access record based on user type
      if (user.userType === "firm-lawyer") {
        const lawyerAccess = await LawyerAccess.findOneAndDelete({
          lawyerId: userId,
          firmId: req.user.id,
        });

        if (!lawyerAccess) {
          console.error("Lawyer access record not found for:", {
            userId,
            firmId: req.user.id,
            userType: user.userType,
          });
          return res
            .status(404)
            .json({ message: "Lawyer access record not found" });
        }

        console.log("Lawyer access record deleted:", {
          userId,
          userType: user.userType,
          collection: "lawyeraccesses",
        });
      } else if (user.userType === "non-lawyer") {
        const nonLawyerAccess = await NonLawyerAccess.findOneAndDelete({
          nonLawyerId: userId,
          firmId: req.user.id,
        });

        if (!nonLawyerAccess) {
          console.error("Non-lawyer access record not found for:", {
            userId,
            firmId: req.user.id,
            userType: user.userType,
          });
          return res
            .status(404)
            .json({ message: "Non-lawyer access record not found" });
        }

        console.log("Non-lawyer access record deleted:", {
          userId,
          userType: user.userType,
          collection: "nonlawyeraccesses",
        });
      } else {
        return res
          .status(400)
          .json({ message: "Invalid user type for deletion" });
      }

      // Update the user's firm association
      user.firmName = undefined;
      user.status = "pending";
      await user.save();

      console.log("User firm association removed:", {
        userId,
        userType: user.userType,
        newStatus: user.status,
      });

      res.status(200).json({ message: "User removed from firm successfully" });
    } catch (error: any) {
      console.error("Error deleting user from firm:", error);
      res.status(500).json({
        message: "Error deleting user from firm",
        details: error.message,
      });
    }
  }
);

// Non-Lawyer Access Management Routes
app.get(
  "/api/firm/non-lawyers",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can access this endpoint" });
      }

      // Find all non-lawyers associated with this firm
      const nonLawyerAccessRecords = await NonLawyerAccess.find({
        firmId: req.user.id,
      }).populate<{
        nonLawyerId: {
          _id: mongoose.Types.ObjectId;
          firstName: string;
          lastName: string;
          email: string;
          status: string;
        };
      }>("nonLawyerId", "firstName lastName email status");

      if (!nonLawyerAccessRecords) {
        return res
          .status(404)
          .json({ message: "No non-lawyers found for this firm" });
      }

      // Format the response
      const nonLawyers = nonLawyerAccessRecords.map((record) => ({
        id: record.nonLawyerId,
        firstName: record.nonLawyerId.firstName,
        lastName: record.nonLawyerId.lastName,
        email: record.nonLawyerId.email,
        status: record.status,
        accessPermissions: record.accessPermissions,
      }));

      res.status(200).json(nonLawyers);
    } catch (error: any) {
      console.error("Error fetching firm non-lawyers:", error);
      res.status(500).json({
        message: "Error fetching non-lawyers",
        details: error.message,
      });
    }
  }
);

// Update non-lawyer status
app.put(
  "/api/firm/non-lawyers/:nonLawyerId/status",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { nonLawyerId } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected", "blocked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res
          .status(403)
          .json({ message: "Only firm admins can update non-lawyer status" });
      }

      // Update both User and NonLawyerAccess records
      const [user, nonLawyerAccess] = await Promise.all([
        User.findByIdAndUpdate(nonLawyerId, { status }, { new: true }),
        NonLawyerAccess.findOneAndUpdate(
          { nonLawyerId, firmId: req.user.id },
          { status },
          { new: true }
        ),
      ]);

      if (!user || !nonLawyerAccess) {
        return res.status(404).json({ message: "Non-lawyer not found" });
      }

      console.log("Non-lawyer status updated:", {
        userId: nonLawyerId,
        newStatus: status,
        userStatus: user.status,
        accessStatus: nonLawyerAccess.status,
      });

      res.status(200).json({
        message: "Non-lawyer status updated successfully",
        status: status,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
          status: user.status,
        },
      });
    } catch (error: any) {
      console.error("Error updating non-lawyer status:", error);
      res.status(500).json({
        message: "Error updating non-lawyer status",
        details: error.message,
      });
    }
  }
);

// Update non-lawyer permissions
app.put(
  "/api/firm/non-lawyers/:nonLawyerId/permissions",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { nonLawyerId } = req.params;
      const { accessPermissions } = req.body;

      // Check if user is a firm admin
      if (req.user.userType !== "admin") {
        return res.status(403).json({
          message: "Only firm admins can update non-lawyer permissions",
        });
      }

      const nonLawyerAccess = await NonLawyerAccess.findOneAndUpdate(
        { nonLawyerId, firmId: req.user.id },
        { accessPermissions },
        { new: true }
      );

      if (!nonLawyerAccess) {
        return res.status(404).json({ message: "Non-lawyer not found" });
      }

      res
        .status(200)
        .json({ message: "Non-lawyer permissions updated successfully" });
    } catch (error: any) {
      console.error("Error updating non-lawyer permissions:", error);
      res.status(500).json({
        message: "Error updating non-lawyer permissions",
        details: error.message,
      });
    }
  }
);

// Export the Express API
export default app;
