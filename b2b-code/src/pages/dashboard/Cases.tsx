import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Scale,
  User,
  FileText,
  Plus,
  X,
  Link as LinkIcon,
  Trash2,
  Calendar,
  Gavel,
  Building2,
  MapPin,
  BookOpen,
  FileCheck,
  History,
  Users,
} from "lucide-react";
import { useMongoDB } from "../../hooks/useMongoDB";

interface CaseHistoryEntry {
  date: string;
  judge: string;
  businessOnDate: string;
  hearingDate: string;
  purposeOfHearing: string;
  business: string;
  nextPurpose: string;
  nextHearingDate: string;
}

interface Case {
  id: string;
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
  caseHistory: CaseHistoryEntry[];

  // Assignee and Actions
  assignedTo: string;
  documents: Array<{
    name: string;
    size: number;
  type: string;
    data: string; // Base64 encoded file data
    uploadedAt: string;
    category: string;
  }>;

  // Metadata
  status: string;
  createdAt: string;
  updatedAt: string;
}

const initialCaseState: Omit<Case, "id" | "createdAt" | "updatedAt"> = {
  // Case Details
  caseType: "",
  courtComplex: "",
  jurisdictionState: "",
  jurisdictionDistrict: "",
  filingNumber: "",
  caseTitle: "",
  subject: "",
  registrationNumber: "",
  cnrNumber: "",
  petitioner: "",
  respondent: "",
  petitionerAdvocate: "",
  respondentAdvocate: "",
  underActs: [],
  underSections: [],

  // Case Status
  dateOfFiling: "",
  firstHearingDate: "",
  nextHearingDate: "",
  dateOfDisposal: "",
  caseStage: "",
  substage: "",
  courtNumber: "",
  judge: "",

  // FIR Details
  policeStation: "",
  firNumber: "",
  firYear: "",
  businessOnDate: "",
  hearingDate: "",
  purposeOfHearing: "",
  summary: "",

  // Case History
  caseHistory: [],

  // Assignee and Actions
  assignedTo: "",
  documents: [],

  // Status
  status: "active",
};

const CaseForm: React.FC<{
  onSubmit: (data: Partial<Case>) => void;
  initialData?: Partial<Case>;
  onCancel: () => void;
}> = ({ onSubmit, initialData, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Case>>(
    initialData || initialCaseState
  );
  const [activeTab, setActiveTab] = useState("caseDetails");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const tabs = [
    "caseDetails",
    "caseStatus",
    "firDetails",
    "caseHistory",
    "assigneeAndActions",
  ];

  const currentTabIndex = tabs.indexOf(activeTab);

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setActiveTab(tabs[currentTabIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentTabIndex < tabs.length - 1) {
      setActiveTab(tabs[currentTabIndex + 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size should be less than 10MB");
        return;
      }
      // Validate file type
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

      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target?.result as string;

          // Add the document to the case's documents array
      const newDocument = {
        name: selectedFile.name,
        type: selectedFile.type,
            size: selectedFile.size,
            data: base64Data,
            uploadedAt: new Date().toISOString(),
            category: "case-document",
          };

          setFormData((prev) => ({
            ...prev,
            documents: [...(prev.documents || []), newDocument],
          }));

          setUploadProgress(100);
      setSelectedFile(null);

          // Reset progress after a delay
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

  const handleDownloadDocument = (doc: Case["documents"][0]) => {
    try {
      if (!doc.data) {
        throw new Error("Document data is missing");
      }

      // Check if the data is a valid base64 string
      if (!doc.data.startsWith("data:")) {
        throw new Error("Invalid document data format");
      }

      // Extract the base64 data and mime type
      const [header, base64Data] = doc.data.split(",");
      if (!header || !base64Data) {
        throw new Error("Invalid document data format");
      }

      const mimeString = header.split(":")[1].split(";")[0];

      // Convert base64 to blob
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);

      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      const blob = new Blob([ab], { type: mimeString });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();

      // Cleanup
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

  const renderCaseDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Type of Case <span className="text-red-400">*</span>
        </label>
        <select
          value={formData.caseType || ""}
          onChange={(e) =>
            setFormData({ ...formData, caseType: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        >
          <option value="">Select Type</option>
          <option value="civil">Civil</option>
          <option value="criminal">Criminal</option>
          <option value="family">Family</option>
          <option value="corporate">Corporate</option>
        </select>
      </div>

            <div>
        <label className="block text-sm font-medium text-gray-300">
          Court Complex <span className="text-red-400">*</span>
        </label>
              <input
                type="text"
          value={formData.courtComplex || ""}
          onChange={(e) =>
            setFormData({ ...formData, courtComplex: e.target.value })
          }
                className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                required
              />
            </div>

              <div>
        <label className="block text-sm font-medium text-gray-300">
          Jurisdiction State
        </label>
        <input
          type="text"
          value={formData.jurisdictionState || ""}
          onChange={(e) =>
            setFormData({ ...formData, jurisdictionState: e.target.value })
          }
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
              </div>
              
              <div>
        <label className="block text-sm font-medium text-gray-300">
          Jurisdiction District
        </label>
        <input
          type="text"
          value={formData.jurisdictionDistrict || ""}
          onChange={(e) =>
            setFormData({ ...formData, jurisdictionDistrict: e.target.value })
          }
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
              </div>
              
              <div>
        <label className="block text-sm font-medium text-gray-300">
          Filing Number <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.filingNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, filingNumber: e.target.value })
          }
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                  required
        />
              </div>

            <div>
        <label className="block text-sm font-medium text-gray-300">
          Case Title <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.caseTitle || ""}
          onChange={(e) =>
            setFormData({ ...formData, caseTitle: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300">
          Subject
        </label>
              <textarea
          value={formData.subject || ""}
          onChange={(e) =>
            setFormData({ ...formData, subject: e.target.value })
          }
                rows={3}
                  className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Registration Number
        </label>
        <input
          type="text"
          value={formData.registrationNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, registrationNumber: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
            </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          CNR Number
        </label>
        <input
          type="text"
          value={formData.cnrNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, cnrNumber: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
        </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Petitioner <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.petitioner || ""}
          onChange={(e) =>
            setFormData({ ...formData, petitioner: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
                    </div>

                    <div>
        <label className="block text-sm font-medium text-gray-300">
          Respondent <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.respondent || ""}
          onChange={(e) =>
            setFormData({ ...formData, respondent: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
                      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Petitioner Advocate
        </label>
        <input
          type="text"
          value={formData.petitionerAdvocate || ""}
          onChange={(e) =>
            setFormData({ ...formData, petitionerAdvocate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                    </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Respondent Advocate
        </label>
        <input
          type="text"
          value={formData.respondentAdvocate || ""}
          onChange={(e) =>
            setFormData({ ...formData, respondentAdvocate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                  </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300">
          Under Act(s)
        </label>
        <input
          type="text"
          value={formData.underActs?.join(", ") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              underActs: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          placeholder="Enter acts separated by commas"
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300">
          Under Section(s)
        </label>
        <input
          type="text"
          value={formData.underSections?.join(", ") || ""}
          onChange={(e) =>
            setFormData({
              ...formData,
              underSections: e.target.value.split(",").map((s) => s.trim()),
            })
          }
          placeholder="Enter sections separated by commas"
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                </div>

      <div className="md:col-span-2">
        <p className="text-sm text-gray-400">
          <span className="text-red-400">*</span> indicates required fields
        </p>
          </div>
        </div>
  );

  const renderCaseStatus = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Date of Filing <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={formData.dateOfFiling || ""}
          onChange={(e) =>
            setFormData({ ...formData, dateOfFiling: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          First Hearing Date
        </label>
        <input
          type="date"
          value={formData.firstHearingDate || ""}
          onChange={(e) =>
            setFormData({ ...formData, firstHearingDate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
              </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Next Hearing Date
        </label>
        <input
          type="date"
          value={formData.nextHearingDate || ""}
          onChange={(e) =>
            setFormData({ ...formData, nextHearingDate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
            </div>

              <div>
        <label className="block text-sm font-medium text-gray-300">
          Date of Disposal
        </label>
        <input
          type="date"
          value={formData.dateOfDisposal || ""}
          onChange={(e) =>
            setFormData({ ...formData, dateOfDisposal: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

                  <div>
        <label className="block text-sm font-medium text-gray-300">
          Case Stage <span className="text-red-400">*</span>
        </label>
                    <select
          value={formData.caseStage || ""}
          onChange={(e) =>
            setFormData({ ...formData, caseStage: e.target.value })
          }
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          required
        >
          <option value="">Select Stage</option>
          <option value="filing">Filing</option>
          <option value="preliminary">Preliminary Hearing</option>
          <option value="evidence">Evidence</option>
          <option value="arguments">Arguments</option>
          <option value="judgment">Judgment</option>
          <option value="disposed">Disposed</option>
                    </select>
                  </div>

                  <div>
        <label className="block text-sm font-medium text-gray-300">
          Substage
        </label>
        <input
          type="text"
          value={formData.substage || ""}
          onChange={(e) =>
            setFormData({ ...formData, substage: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Court Number
        </label>
        <input
          type="text"
          value={formData.courtNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, courtNumber: e.target.value })
          }
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                  </div>

                  <div>
        <label className="block text-sm font-medium text-gray-300">Judge</label>
                    <input
          type="text"
          value={formData.judge || ""}
          onChange={(e) => setFormData({ ...formData, judge: e.target.value })}
                      className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                    />
                  </div>
                </div>
  );

  const renderFirDetails = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-300">
          Police Station
        </label>
        <input
          type="text"
          value={formData.policeStation || ""}
          onChange={(e) =>
            setFormData({ ...formData, policeStation: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
              </div>

              <div>
        <label className="block text-sm font-medium text-gray-300">
          FIR Number
        </label>
        <input
          type="text"
          value={formData.firNumber || ""}
          onChange={(e) =>
            setFormData({ ...formData, firNumber: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">Year</label>
        <input
          type="number"
          value={formData.firYear || ""}
          onChange={(e) =>
            setFormData({ ...formData, firYear: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
                        </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Business on Date
        </label>
        <input
          type="date"
          value={formData.businessOnDate || ""}
          onChange={(e) =>
            setFormData({ ...formData, businessOnDate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Hearing Date
        </label>
        <input
          type="date"
          value={formData.hearingDate || ""}
          onChange={(e) =>
            setFormData({ ...formData, hearingDate: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300">
          Purpose of Hearing
        </label>
        <input
          type="text"
          value={formData.purposeOfHearing || ""}
          onChange={(e) =>
            setFormData({ ...formData, purposeOfHearing: e.target.value })
          }
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-300">
          Summary
        </label>
        <textarea
          value={formData.summary || ""}
          onChange={(e) =>
            setFormData({ ...formData, summary: e.target.value })
          }
          rows={4}
          className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
        />
      </div>
    </div>
  );

  const renderCaseHistory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Case History</h3>
                        <button 
          type="button"
          onClick={() => {
            const newHistory = [
              ...(formData.caseHistory || []),
              {
                date: new Date().toISOString().split("T")[0],
                judge: "",
                businessOnDate: "",
                hearingDate: "",
                purposeOfHearing: "",
                business: "",
                nextPurpose: "",
                nextHearingDate: "",
              },
            ];
            setFormData({ ...formData, caseHistory: newHistory });
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Add History Entry
                        </button>
                      </div>

      <div className="space-y-4">
        {(formData.caseHistory || []).map((entry, index) => (
          <div key={index} className="bg-gray-800 p-4 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Judge
                </label>
                <input
                  type="text"
                  value={entry.judge || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = { ...entry, judge: e.target.value };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
                </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Business on Date
                </label>
                <input
                  type="date"
                  value={entry.businessOnDate || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = {
                      ...entry,
                      businessOnDate: e.target.value,
                    };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Hearing Date
                </label>
                <input
                  type="date"
                  value={entry.hearingDate || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = {
                      ...entry,
                      hearingDate: e.target.value,
                    };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Purpose of Hearing
                </label>
                <input
                  type="text"
                  value={entry.purposeOfHearing || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = {
                      ...entry,
                      purposeOfHearing: e.target.value,
                    };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Next Purpose
                </label>
                <input
                  type="text"
                  value={entry.nextPurpose || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = {
                      ...entry,
                      nextPurpose: e.target.value,
                    };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300">
                  Next Hearing Date
                </label>
                <input
                  type="date"
                  value={entry.nextHearingDate || ""}
                  onChange={(e) => {
                    const newHistory = [...(formData.caseHistory || [])];
                    newHistory[index] = {
                      ...entry,
                      nextHearingDate: e.target.value,
                    };
                    setFormData({ ...formData, caseHistory: newHistory });
                  }}
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300">
                Business
              </label>
              <textarea
                value={entry.business || ""}
                onChange={(e) => {
                  const newHistory = [...(formData.caseHistory || [])];
                  newHistory[index] = { ...entry, business: e.target.value };
                  setFormData({ ...formData, caseHistory: newHistory });
                }}
                rows={3}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white"
              />
            </div>

            <div className="flex justify-end">
                        <button
                type="button"
                onClick={() => {
                  const newHistory =
                    formData.caseHistory?.filter((_, i) => i !== index) || [];
                  setFormData({ ...formData, caseHistory: newHistory });
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Remove Entry
                        </button>
            </div>
          </div>
                      ))}
                  </div>
                </div>
  );

  const renderAssigneeAndActions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Assigned To
          </label>
          <select
            value={formData.assignedTo || ""}
            onChange={(e) =>
              setFormData({ ...formData, assignedTo: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
          >
            <option value="">Select Assignee</option>
            <option value="john.doe">John Doe</option>
            <option value="jane.smith">Jane Smith</option>
          </select>
              </div>

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
      </div>

      {/* Display uploaded documents */}
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

      <div className="flex justify-end space-x-3">
                          <button
                            type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                          >
          {initialData ? "Update Case" : "Create Case"}
                          </button>
                        </div>
                      </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "caseDetails":
        return renderCaseDetails();
      case "caseStatus":
        return renderCaseStatus();
      case "firDetails":
        return renderFirDetails();
      case "caseHistory":
        return renderCaseHistory();
      case "assigneeAndActions":
        return renderAssigneeAndActions();
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
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

      <div className="flex justify-between items-center pt-6 border-t border-gray-700">
        <div className="flex items-center gap-4">
          {currentTabIndex > 0 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
          )}
          {currentTabIndex < tabs.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          {currentTabIndex === tabs.length - 1 && (
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              {initialData ? "Update Case" : "Create Case"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

const Cases = () => {
  const {
    data: cases = [],
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
  } = useMongoDB("cases");
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const openDetailsModal = (case_: Case) => {
    setSelectedCase(case_);
    setIsDetailsModalOpen(true);
  };

  const handleSubmit = async (formData: Partial<Case>) => {
    try {
      // Ensure required fields are present
      if (!formData.caseTitle) {
        throw new Error("Case title is required");
      }

      const caseData = {
        ...formData,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addItem(caseData);
      setIsAddingCase(false);
    } catch (err) {
      console.error("Error adding case:", err);
      alert(err instanceof Error ? err.message : "Failed to add case");
    }
  };

  const handleUpdateCase = async (caseId: string, updates: Partial<Case>) => {
    try {
      if (!updateItem) {
        throw new Error("Update function not available");
      }

      // Ensure required fields are present for updates
      if (updates.caseTitle === "") {
        throw new Error("Case title is required");
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await updateItem(caseId, updatedData);

      // Update the local state with the updated data
      if (selectedCase) {
        setSelectedCase({ ...selectedCase, ...updatedData });
      }

      // Close the modal after successful update
      setIsDetailsModalOpen(false);

      // Show success message
      alert("Case updated successfully");
    } catch (err) {
      console.error("Error updating case:", err);
      alert(err instanceof Error ? err.message : "Failed to update case");
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!deleteItem) return;
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this case?"
      );
      if (confirmDelete) {
        await deleteItem(caseId);
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting case:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Cases</h1>
        <p className="mt-2 text-gray-300">
          Manage and track all your legal cases
        </p>
        <button
          onClick={() => setIsAddingCase(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Case</span>
        </button>
      </div>

      {isAddingCase && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <CaseForm
            onSubmit={handleSubmit}
            onCancel={() => setIsAddingCase(false)}
          />
                  </div>
                )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          {loading && <p className="text-gray-300">Loading cases...</p>}
          {error && <p className="text-red-400">Error: {error}</p>}
          <div className="flex flex-col space-y-4">
            {cases.map((case_, index) => (
              <motion.div
                key={case_.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800/50 hover:bg-gray-800/70 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-500/20 rounded-lg">
                      <Scale className="w-6 h-6 text-primary-400" />
              </div>
                    <h3 className="text-lg font-medium text-white">{case_.caseTitle}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      case_.status === "active"
                        ? "bg-green-500/20 text-green-400"
                        : case_.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {case_.status}
                    </span>
            </div>
                  <button
                    onClick={() => openDetailsModal(case_)}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    View Details
                  </button>
                </div>

                <div className="flex items-center gap-8 text-sm text-gray-400">
                  <span>{case_.caseType}</span>
                  <span className="text-gray-600">•</span>
                  <span>{case_.courtComplex}</span>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>{case_.documents?.length || 0} Documents</span>
                  </div>
                  <span className="text-gray-600">•</span>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>Assigned to: {case_.assignedTo || 'Unassigned'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Case Details Modal */}
      {isDetailsModalOpen && selectedCase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedCase.caseTitle}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteCase(selectedCase.id)}
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

            <CaseForm
              onSubmit={(updates) => handleUpdateCase(selectedCase.id, updates)}
              initialData={selectedCase}
              onCancel={() => setIsDetailsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Cases;
