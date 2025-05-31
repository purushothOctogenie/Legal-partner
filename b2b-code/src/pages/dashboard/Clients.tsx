import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Plus,
  X,
  Trash2,
  FileText,
  Link as LinkIcon,
  AlertCircle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useMongoDB } from "../../hooks/useMongoDB";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

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
  data: string;
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

interface Client {
  id: string;
  _id?: string;
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
  status: string;
  createdAt: string;
  updatedAt: string;
}

const initialClientState: Omit<Client, "id" | "createdAt" | "updatedAt"> = {
  // Personal Details
  salutation: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  isWhatsappEnabled: false,
  alternatePhone: "",
  gstin: "",

  // Addresses
  contactAddress: {
    building: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },
  alternateAddress: {
    building: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },

  // KYC Validation
  kycValidation: {
    aadharValidated: false,
    phoneVerified: false,
    emailAuthenticated: false,
  },

  // Documents
  documents: [],

  // Contract Management
  contracts: [],

  // Status
  status: "active",
};

const ClientForm: React.FC<{
  onSubmit: (data: Partial<Client>) => void;
  initialData?: Partial<Client>;
  onCancel: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Client>>(
    initialData || {
      ...initialClientState,
      kycValidation: {
        aadharValidated: false,
        phoneVerified: false,
        emailAuthenticated: false,
        aadharNumber: "",
        phoneNumber: "",
        emailId: "",
      },
    }
  );
  const [activeTab, setActiveTab] = useState("personalDetails");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [otpStates, setOtpStates] = useState({
    aadhar: { showOtp: false, otp: "", sent: false },
    phone: { showOtp: false, otp: "", sent: false },
    email: { showOtp: false, otp: "", sent: false },
  });

  const isFormValid = () => {
    // Check personal details
    if (
      !formData.salutation ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone
    ) {
      return false;
    }

    // Check contact address
    if (
      !formData.contactAddress?.building ||
      !formData.contactAddress?.street ||
      !formData.contactAddress?.city ||
      !formData.contactAddress?.state ||
      !formData.contactAddress?.country ||
      !formData.contactAddress?.pincode
    ) {
      return false;
    }

    // Check KYC validation
    if (
      !formData.kycValidation?.aadharValidated ||
      !formData.kycValidation?.phoneVerified ||
      !formData.kycValidation?.emailAuthenticated
    ) {
      return false;
    }

    return true;
  };

  const getNextTab = () => {
    const tabs = [
      "personalDetails",
      "contactAddress",
      "alternateAddress",
      "kycValidation",
      "documents",
      "contractManagement",
    ];
    const currentIndex = tabs.indexOf(activeTab);
    return tabs[currentIndex + 1];
  };

  const handleNextTab = () => {
    const nextTab = getNextTab();
    if (nextTab) {
      setActiveTab(nextTab);
    }
  };

  const handlePreviousTab = () => {
    const tabs = [
      "personalDetails",
      "contactAddress",
      "alternateAddress",
      "kycValidation",
      "documents",
      "contractManagement",
    ];
    const currentIndex = tabs.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1]);
    }
  };

  const validateAadhaar = (value: string) => {
    return /^\d{12}$/.test(value);
  };

  const validatePhone = (value: string) => {
    return /^\d{10}$/.test(value);
  };

  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleVerifyOtp = (type: "aadhar" | "phone" | "email") => {
    if (otpStates[type].otp === "123456") {
      const validationField =
        type === "aadhar"
          ? "aadharValidated"
          : type === "phone"
          ? "phoneVerified"
          : "emailAuthenticated";

      setFormData((prev) => ({
        ...prev,
        kycValidation: {
          ...prev.kycValidation!,
          [validationField]: true,
          validatedAt: new Date().toISOString(),
        },
      }));

      setOtpStates((prev) => ({
        ...prev,
        [type]: { ...prev[type], showOtp: false, otp: "" },
      }));

      alert(
        `${
          type.charAt(0).toUpperCase() + type.slice(1)
        } verification successful!`
      );
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleSendOtp = (type: "aadhar" | "phone" | "email") => {
    let isValid = false;
    let errorMessage = "";

    switch (type) {
      case "aadhar":
        isValid = validateAadhaar(formData.kycValidation?.aadharNumber || "");
        errorMessage = "Please enter a valid 12-digit Aadhaar number";
        break;
      case "phone":
        isValid = validatePhone(formData.kycValidation?.phoneNumber || "");
        errorMessage = "Please enter a valid 10-digit phone number";
        break;
      case "email":
        isValid = validateEmail(formData.kycValidation?.emailId || "");
        errorMessage = "Please enter a valid email address";
        break;
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    const validationField =
      type === "aadhar"
        ? "aadharValidated"
        : type === "phone"
        ? "phoneVerified"
        : "emailAuthenticated";

    // Reset validation state when sending new OTP
    setFormData((prev) => ({
      ...prev,
      kycValidation: {
        ...prev.kycValidation!,
        [validationField]: false,
      },
    }));

    setOtpStates((prev) => ({
      ...prev,
      [type]: { ...prev[type], showOtp: true, sent: true },
    }));

    alert(
      `OTP sent to ${
        type === "email"
          ? "your email"
          : type === "phone"
          ? "your phone"
          : "your Aadhaar"
      }. Use 123456 as the OTP.`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF and Word documents are allowed");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;

          const newDocument = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            data: base64Data,
            uploadedAt: new Date().toISOString(),
            category: "client-document",
          };

          setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), newDocument],
          }));

          setUploadProgress(100);
          setSelectedFile(null);

          setTimeout(() => {
            setUploadProgress(0);
            setIsUploading(false);
          }, 1000);
        } catch (error) {
          console.error("Error processing file:", error);
          alert("Failed to process file. Please try again.");
          setIsUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(Math.round(progress));
        }
      };

      reader.readAsDataURL(selectedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please try again.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownloadDocument = (doc: ClientDocument) => {
    try {
      if (!doc.data) {
        throw new Error("Document data is missing");
      }

      if (!doc.data.startsWith("data:")) {
        throw new Error("Invalid document data format");
      }

      const [header, base64Data] = doc.data.split(",");
      if (!header || !base64Data) {
        throw new Error("Invalid document data format");
      }

      const mimeString = header.split(":")[1].split(";")[0];

      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to download file. Please try again."
      );
    }
  };

  const handleRemoveDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents?.filter((_, i) => i !== index) || [],
    }));
  };

  const renderPersonalDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Salutation <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.salutation || ""}
          onChange={(e) =>
            setFormData({ ...formData, salutation: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        >
          <option value="">Select Salutation</option>
          <option value="Mr.">Mr.</option>
          <option value="Mrs.">Mrs.</option>
          <option value="Ms.">Ms.</option>
          <option value="Dr.">Dr.</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          First Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.firstName || ""}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Middle Name
        </label>
        <input
          type="text"
          value={formData.middleName || ""}
          onChange={(e) =>
            setFormData({ ...formData, middleName: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Last Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.lastName || ""}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Email ID <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={formData.email || ""}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          value={formData.phone || ""}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          WhatsApp Enabled
        </label>
        <div className="mt-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={formData.isWhatsappEnabled || false}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  isWhatsappEnabled: e.target.checked,
                })
              }
              className="form-checkbox h-4 w-4 text-primary-500 bg-gray-800 border-gray-700 rounded"
            />
            <span className="ml-2 text-gray-300">
              Enable WhatsApp notifications
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Alternate Phone Number
        </label>
        <input
          type="tel"
          value={formData.alternatePhone || ""}
          onChange={(e) =>
            setFormData({ ...formData, alternatePhone: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">GSTIN</label>
        <input
          type="text"
          value={formData.gstin || ""}
          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>
    </div>
  );

  const renderAddress = (type: "contact" | "alternate") => {
    const address =
      type === "contact" ? formData.contactAddress : formData.alternateAddress;
    const setAddress = (newAddress: Address) => {
      if (type === "contact") {
        setFormData({ ...formData, contactAddress: newAddress });
      } else {
        setFormData({ ...formData, alternateAddress: newAddress });
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Building <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.building || ""}
            onChange={(e) =>
              setAddress({ ...address!, building: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Street <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.street || ""}
            onChange={(e) =>
              setAddress({ ...address!, street: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Landmark
          </label>
          <input
            type="text"
            value={address?.landmark || ""}
            onChange={(e) =>
              setAddress({ ...address!, landmark: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.city || ""}
            onChange={(e) => setAddress({ ...address!, city: e.target.value })}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            State <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.state || ""}
            onChange={(e) => setAddress({ ...address!, state: e.target.value })}
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Country <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.country || ""}
            onChange={(e) =>
              setAddress({ ...address!, country: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Pincode <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={address?.pincode || ""}
            onChange={(e) =>
              setAddress({ ...address!, pincode: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          />
        </div>
      </div>
    );
  };

  const renderKYCValidation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Aadhaar Validation
            </h3>
            {formData.kycValidation?.aadharValidated ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Enter Aadhaar Number"
                value={formData.kycValidation?.aadharNumber || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 12);
                  setFormData((prev) => ({
                    ...prev,
                    kycValidation: {
                      ...prev.kycValidation!,
                      aadharNumber: value,
                      aadharValidated: false,
                    },
                  }));
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                maxLength={12}
              />
              <p className="mt-1 text-sm text-gray-400">
                Enter 12-digit Aadhaar number
              </p>
            </div>
            {otpStates.aadhar.showOtp ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otpStates.aadhar.otp}
                  onChange={(e) =>
                    setOtpStates((prev) => ({
                      ...prev,
                      aadhar: { ...prev.aadhar, otp: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp("aadhar")}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Verify OTP
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp("aadhar")}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                {otpStates.aadhar.sent ? "Resend OTP" : "Send OTP"}
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Phone Verification
            </h3>
            {formData.kycValidation?.phoneVerified ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="space-y-3">
            <div>
              <input
                type="tel"
                placeholder="Enter Phone Number"
                value={formData.kycValidation?.phoneNumber || ""}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData((prev) => ({
                    ...prev,
                    kycValidation: {
                      ...prev.kycValidation!,
                      phoneNumber: value,
                      phoneVerified: false,
                    },
                  }));
                }}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                maxLength={10}
              />
              <p className="mt-1 text-sm text-gray-400">
                Enter 10-digit phone number
              </p>
            </div>
            {otpStates.phone.showOtp ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otpStates.phone.otp}
                  onChange={(e) =>
                    setOtpStates((prev) => ({
                      ...prev,
                      phone: { ...prev.phone, otp: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp("phone")}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Verify OTP
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp("phone")}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                {otpStates.phone.sent ? "Resend OTP" : "Send OTP"}
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">
              Email Authentication
            </h3>
            {formData.kycValidation?.emailAuthenticated ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="space-y-3">
            <div>
              <input
                type="email"
                placeholder="Enter Email ID"
                value={formData.kycValidation?.emailId || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    kycValidation: {
                      ...prev.kycValidation!,
                      emailId: e.target.value,
                      emailAuthenticated: false,
                    },
                  }))
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
              />
              <p className="mt-1 text-sm text-gray-400">
                Enter a valid email address
              </p>
            </div>
            {otpStates.email.showOtp ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otpStates.email.otp}
                  onChange={(e) =>
                    setOtpStates((prev) => ({
                      ...prev,
                      email: { ...prev.email, otp: e.target.value },
                    }))
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => handleVerifyOtp("email")}
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Verify OTP
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp("email")}
                className="w-full px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                {otpStates.email.sent ? "Resend OTP" : "Send OTP"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Document Upload
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-700 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-300">{selectedFile.name}</p>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                    className="px-3 py-1 bg-primary-500 text-white rounded-md hover:bg-primary-600 disabled:opacity-50"
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
                {isUploading && (
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <>
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-primary-400 hover:text-primary-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-400">
                  PDF, DOC, DOCX up to 10MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {formData.documents && formData.documents.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Uploaded Documents
          </h4>
          <div className="space-y-2">
            {formData.documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-800 p-3 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-300">{doc.name}</p>
                    <p className="text-xs text-gray-400">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB •{" "}
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadDocument(doc)}
                    className="p-1 text-gray-400 hover:text-gray-300"
                    title="Download"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="p-1 text-red-400 hover:text-red-300"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContractManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Contracts</h3>
        <button
          type="button"
          onClick={() => {
            const newContract = {
              id: Date.now().toString(),
              title: "",
              startDate: new Date().toISOString().split("T")[0],
              endDate: "",
              status: "draft",
              documentId: "",
            };
            setFormData((prev) => ({
              ...prev,
              contracts: [...(prev.contracts || []), newContract],
            }));
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add Contract
        </button>
      </div>

      <div className="space-y-4">
        {(formData.contracts || []).map((contract, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Contract Title
                </label>
                <input
                  type="text"
                  value={contract.title}
                  onChange={(e) => {
                    const newContracts = [...(formData.contracts || [])];
                    newContracts[index] = {
                      ...contract,
                      title: e.target.value,
                    };
                    setFormData({ ...formData, contracts: newContracts });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Status
                </label>
                <select
                  value={contract.status}
                  onChange={(e) => {
                    const newContracts = [...(formData.contracts || [])];
                    newContracts[index] = {
                      ...contract,
                      status: e.target.value,
                    };
                    setFormData({ ...formData, contracts: newContracts });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Start Date
                </label>
                <input
                  type="date"
                  value={contract.startDate}
                  onChange={(e) => {
                    const newContracts = [...(formData.contracts || [])];
                    newContracts[index] = {
                      ...contract,
                      startDate: e.target.value,
                    };
                    setFormData({ ...formData, contracts: newContracts });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  End Date
                </label>
                <input
                  type="date"
                  value={contract.endDate}
                  onChange={(e) => {
                    const newContracts = [...(formData.contracts || [])];
                    newContracts[index] = {
                      ...contract,
                      endDate: e.target.value,
                    };
                    setFormData({ ...formData, contracts: newContracts });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const newContracts =
                    formData.contracts?.filter((_, i) => i !== index) || [];
                  setFormData({ ...formData, contracts: newContracts });
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Contract
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "personalDetails":
        return renderPersonalDetails();
      case "contactAddress":
        return renderAddress("contact");
      case "alternateAddress":
        return renderAddress("alternate");
      case "kycValidation":
        return renderKYCValidation();
      case "documents":
        return renderDocuments();
      case "contractManagement":
        return renderContractManagement();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {[
            "personalDetails",
            "contactAddress",
            "alternateAddress",
            "kycValidation",
            "documents",
            "contractManagement",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab
                    ? "border-primary-500 text-primary-400"
                    : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300"
                }
              `}
            >
              {tab
                .split(/(?=[A-Z])/)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">{renderTabContent()}</div>

      <div className="flex justify-between space-x-3">
        <div className="flex space-x-3">
          {activeTab !== "personalDetails" && (
            <button
              type="button"
              onClick={handlePreviousTab}
              className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
            >
              Previous
            </button>
          )}
          {activeTab !== "contractManagement" && (
            <button
              type="button"
              onClick={handleNextTab}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              Next
            </button>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          {activeTab === "contractManagement" && isFormValid() && (
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              {initialData ? "Update Client" : "Create Client"}
            </button>
          )}
        </div>
      </div>

      {activeTab === "contractManagement" && !isFormValid() && (
        <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500 rounded-md">
          <div className="flex items-center space-x-2 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p>
              Please complete all required fields and KYC validations before
              creating the client.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};

const Clients = () => {
  const {
    data: clients = [],
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  } = useMongoDB("clients");
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const openDetailsModal = (client: Client) => {
    setSelectedClient(client);
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = async (formData: Partial<Client>) => {
    try {
      if (!formData.firstName || !formData.lastName) {
        throw new Error("First name and last name are required");
      }

      const clientData = {
        ...formData,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addItem(clientData);
      setIsAddingClient(false);
    } catch (err) {
      console.error("Error adding client:", err);
      alert(err instanceof Error ? err.message : "Failed to add client");
    }
  };

  const handleUpdateClient = async (
    clientId: string,
    updates: Partial<Client>
  ) => {
    try {
      if (!updateItem) {
        throw new Error("Update function not available");
      }

      if (!updates.firstName || !updates.lastName) {
        throw new Error("First name and last name are required");
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateItem(clientId, updatedData);

      if (selectedClient) {
        setSelectedClient({ ...selectedClient, ...updatedData });
      }

      setIsDetailsModalOpen(false);
      alert("Client updated successfully");
    } catch (err) {
      console.error("Error updating client:", err);
      alert(err instanceof Error ? err.message : "Failed to update client");
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!deleteItem) return;
    try {
      if (!clientId) {
        throw new Error("Client ID is missing");
      }

      const confirmDelete = window.confirm(
        "Are you sure you want to delete this client?"
      );
      if (confirmDelete) {
        await deleteItem(clientId);
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      alert(err instanceof Error ? err.message : "Failed to delete client");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <p className="mt-2 text-gray-300">Manage your client relationships</p>
        <button
          onClick={() => setIsAddingClient(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Client</span>
        </button>
      </div>

      {isAddingClient && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <ClientForm
            onSubmit={handleSubmit}
            onCancel={() => setIsAddingClient(false)}
          />
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-300">Loading clients...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="flex flex-col space-y-4">
            {clients.map((client, index) => (
              <motion.div
                key={client.id || `client-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 hover:bg-gray-800/70 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <User className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        {client.salutation} {client.firstName}{" "}
                        {client.middleName} {client.lastName}
                      </h3>
                      <div className="flex items-center mt-1 space-x-4 text-sm">
                        <span className="text-gray-400">{client.email}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            client.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : client.status === "pending"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {client.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => openDetailsModal(client)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm truncate">
                      {client.contactAddress?.city},{" "}
                      {client.contactAddress?.state}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-300">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">
                      {client.documents?.length || 0} Documents
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Details Modal */}
      {isDetailsModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedClient.salutation} {selectedClient.firstName}{" "}
                {selectedClient.middleName} {selectedClient.lastName}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleDeleteClient(selectedClient._id || selectedClient.id)
                  }
                  className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500 rounded-lg"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <ClientForm
              onSubmit={(updates) =>
                handleUpdateClient(
                  selectedClient._id || selectedClient.id,
                  updates
                )
              }
              initialData={selectedClient}
              onCancel={() => setIsDetailsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
