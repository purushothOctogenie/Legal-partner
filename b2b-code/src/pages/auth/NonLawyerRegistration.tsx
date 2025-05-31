import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle,Eye,EyeOff,CheckCircle2,XCircle,RefreshCw,User,Mail,Phone,Calendar,Lock,CheckCircle,MapPin,Globe,Building } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { motion } from "framer-motion";
import { z } from "zod";
import Background3D from "../../components/Background3D";

const baseSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .transform(email => email.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine(password => !/(.)\1{2,}/.test(password), {
      message: 'Password cannot contain repeated characters'
    }),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(1, 'First name is required')
    .transform(name => name.trim().replace(/[<>]/g, '')),
  lastName: z.string()
    .min(1, 'Last name is required')
    .transform(name => name.trim().replace(/[<>]/g, '')),
  gender: z.string().min(1, 'Gender is required'),
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[\d\s-]+$/, 'Invalid phone number format'),
  aadhaarNumber: z.string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^\d+$/, 'Aadhaar number must contain only digits'),
  photo: z.string().optional(),
  firmName: z.string().min(1, 'Firm name is required'),
  firmRegistrationNumber: z.string().min(1, 'Firm registration number is required'),
  firmAddress: z.string().min(10, 'Please provide a complete firm address'),
  firmPhone: z.string().min(10, 'Firm phone number is required'),
  firmEmail: z.string().email('Invalid firm email format'),
});

const formSchema = baseSchema.refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

const BackgroundWrapper = () => (
  <div className="fixed inset-0 -z-10">
    <Background3D />
  </div>
);

export default function NonLawyerRegistration() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    phone: '',
    aadhaarNumber: '',
    photo: '',
    firmName: '',
    firmRegistrationNumber: '',
    firmAddress: '',
    firmPhone: '',
    firmEmail: '',
  });

  const { signup, logout } = useAuth();
  const navigate = useNavigate();

  const handleStepNavigation = () => {
    let isValid = true;
    setValidationErrors({});

    switch (currentStep) {
      case 1:
        if (!formData.email.trim()) {
          setValidationErrors(prev => ({ ...prev, email: 'Email is required' }));
          isValid = false;
        }
        if (!formData.password) {
          setValidationErrors(prev => ({ ...prev, password: 'Password is required' }));
          isValid = false;
        }
        if (!formData.confirmPassword) {
          setValidationErrors(prev => ({ ...prev, confirmPassword: 'Confirm password is required' }));
          isValid = false;
        }
        break;
      case 2:
        if (!formData.firstName.trim()) {
          setValidationErrors(prev => ({ ...prev, firstName: 'First name is required' }));
          isValid = false;
        }
        if (!formData.lastName.trim()) {
          setValidationErrors(prev => ({ ...prev, lastName: 'Last name is required' }));
          isValid = false;
        }
        if (!formData.gender) {
          setValidationErrors(prev => ({ ...prev, gender: 'Gender is required' }));
          isValid = false;
        }
        if (!formData.phone.trim()) {
          setValidationErrors(prev => ({ ...prev, phone: 'Phone number is required' }));
          isValid = false;
        }
        if (!formData.aadhaarNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, aadhaarNumber: 'Aadhaar Number is required' }));
          isValid = false;
        }
        if (!aadhaarVerified) {
          setValidationErrors(prev => ({ ...prev, aadhaarNumber: 'Aadhaar number must be verified' }));
          isValid = false;
        }
        break;
      case 3:
        if (!formData.firmName.trim()) {
          setValidationErrors(prev => ({ ...prev, firmName: 'Firm name is required' }));
          isValid = false;
        }
        if (!formData.firmRegistrationNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, firmRegistrationNumber: 'Firm registration number is required' }));
          isValid = false;
        }
        if (!formData.firmAddress.trim()) {
          setValidationErrors(prev => ({ ...prev, firmAddress: 'Firm address is required' }));
          isValid = false;
        }
        if (!formData.firmPhone.trim()) {
          setValidationErrors(prev => ({ ...prev, firmPhone: 'Firm phone number is required' }));
          isValid = false;
        }
        if (!formData.firmEmail.trim()) {
          setValidationErrors(prev => ({ ...prev, firmEmail: 'Firm email is required' }));
          isValid = false;
        }
        break;
    }

    if (!isValid) {
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const verifyAadhaar = () => {
    // Validate Aadhaar number format
    if (!/^\d{12}$/.test(formData.aadhaarNumber)) {
      setValidationErrors(prev => ({
        ...prev,
        aadhaarNumber: 'Please enter a valid 12-digit Aadhaar number'
      }));
      return;
    }

    // Use fixed OTP for testing
    const newOtp = "123456";
    setGeneratedOtp(newOtp);

    // Show OTP input
    setShowOtpInput(true);
    setOtpSent(true);
    setOtpTimer(30);

    // Start OTP timer
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Store OTP in localStorage for verification (in real app, this would be handled by backend)
    localStorage.setItem('aadhaarOtp', newOtp);
  };

  const verifyOtp = () => {
    const storedOtp = localStorage.getItem('aadhaarOtp');
    
    if (!storedOtp) {
      setOtpError('OTP has expired. Please request a new one.');
      return;
    }

    if (otp === storedOtp) {
      setAadhaarVerified(true);
      setShowOtpInput(false);
      setOtpError('');
      setOtpSent(false);
      setOtpTimer(0);
      localStorage.removeItem('aadhaarOtp');
    } else {
      setOtpError('Invalid OTP. Please try again.');
    }
  };

  const resendOtp = () => {
    if (otpTimer > 0) return;
    verifyAadhaar();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);

      // Validate form data
      const validationResult = formSchema.safeParse(formData);
      if (!validationResult.success) {
        const validationErrors = validationResult.error.errors.reduce((acc, err) => {
          const path = err.path[0] as string;
          acc[path] = err.message;
          return acc;
        }, {} as Record<string, string>);
        setValidationErrors(validationErrors);
        return;
      }

      // Register user
      await signup({
        ...formData,
        userType: 'non-lawyer',
        displayName: `${formData.firstName} ${formData.lastName}`,
        status: 'pending' // Set initial status as pending
      });

      // Logout the user after registration
      await logout();
      
      // Redirect to pending approval page
      navigate('/pending-approval');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 py-12 px-4 sm:px-6 lg:px-8 relative backdrop-blur-sm">
      <BackgroundWrapper />
      <div className="max-w-2xl mx-auto relative z-20">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <motion.div
              className="bg-white p-4 rounded-xl shadow-lg"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img
                src="https://i.postimg.cc/tC44YgWz/logo-new.png"
                alt="LegalAI ERP Logo"
                className="w-16 h-16 object-contain"
              />
            </motion.div>
          </motion.div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            Non-Lawyer Registration
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Create your account to access legal services
          </p>
        </div>

        <div className="mt-8 bg-gray-900/50 backdrop-blur-xl py-8 px-4 shadow-xl ring-1 ring-gray-800 sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-500/10 border-l-4 border-red-500 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="ml-3 text-sm text-red-400">{error}</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= step
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {step}
                    </div>
                    <div className="ml-2 text-sm text-gray-400">
                      {step === 1 && 'Authentication'}
                      {step === 2 && 'Personal Details'}
                      {step === 3 && 'Firm Details'}
                    </div>
                  </div>
                  {step < 3 && (
                    <div className="flex-1 h-0.5 mx-4 bg-gray-700" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email Address
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="you@example.com"
                    />
                  </div>
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.password}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                    Confirm Password
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.confirmPassword}</p>
                  )}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-700">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <User className="w-16 h-16 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <label
                      htmlFor="photo"
                      className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full cursor-pointer hover:bg-primary-600 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </label>
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-300">
                      First Name
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="John"
                      />
                    </div>
                    {validationErrors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                      Last Name
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Doe"
                      />
                    </div>
                    {validationErrors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.lastName}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                    Gender
                    <span className="text-red-500"> *</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {validationErrors.gender && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.gender}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-300">
                    Phone Number
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-300" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-300">
                    Aadhaar Number
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1">
                    <div className="flex space-x-2">
                      <div className="relative rounded-md shadow-sm flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-300" />
                        </div>
                        <input
                          id="aadhaarNumber"
                          name="aadhaarNumber"
                          type="text"
                          required
                          value={formData.aadhaarNumber}
                          onChange={handleChange}
                          className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                          placeholder="Enter your 12-digit Aadhaar number"
                          maxLength={12}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={verifyAadhaar}
                        disabled={aadhaarVerified || otpSent}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          aadhaarVerified
                            ? 'bg-green-500 text-white cursor-not-allowed'
                            : otpSent
                            ? 'bg-gray-500 text-white cursor-not-allowed'
                            : 'bg-primary-500 text-white hover:bg-primary-600'
                        }`}
                      >
                        {aadhaarVerified ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : otpSent ? (
                          'OTP Sent'
                        ) : (
                          'Verify'
                        )}
                      </button>
                    </div>
                    {validationErrors.aadhaarNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.aadhaarNumber}</p>
                    )}
                    {aadhaarVerified && (
                      <p className="mt-1 text-sm text-green-400">Aadhaar number verified successfully</p>
                    )}
                  </div>
                </div>

                {showOtpInput && !aadhaarVerified && (
                  <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h4 className="text-sm font-medium text-white mb-2">Enter OTP</h4>
                    <p className="text-sm text-gray-300 mb-4">
                      A 6-digit OTP has been sent to the mobile number linked with your Aadhaar
                    </p>
                    <div className="mb-4 p-3 bg-gray-900/50 rounded-md border border-gray-700">
                      <p className="text-sm text-gray-300">For testing purposes, use this OTP:</p>
                      <p className="text-lg font-mono text-primary-400 mt-1">{generatedOtp}</p>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setOtp(value);
                          setOtpError('');
                        }}
                        className="block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={verifyOtp}
                        className="px-4 py-2 bg-primary-500 text-white rounded-md text-sm font-medium hover:bg-primary-600"
                      >
                        Verify OTP
                      </button>
                    </div>
                    {otpError && (
                      <p className="mt-2 text-sm text-red-400">{otpError}</p>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={otpTimer > 0}
                        className={`text-sm ${
                          otpTimer > 0
                            ? 'text-gray-500 cursor-not-allowed'
                            : 'text-primary-400 hover:text-primary-300'
                        }`}
                      >
                        Resend OTP
                      </button>
                      {otpTimer > 0 && (
                        <span className="text-sm text-gray-400">
                          Resend available in {otpTimer}s
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 mb-6">
                  <h3 className="text-lg font-medium text-white mb-2">Firm Information</h3>
                  <p className="text-sm text-gray-400">
                    Please provide your firm's details for verification and communication purposes.
                  </p>
                </div> */}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firmName" className="block text-sm font-medium text-gray-300">
                      Firm Name
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="firmName"
                        name="firmName"
                        type="text"
                        required
                        value={formData.firmName}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter firm name"
                      />
                    </div>
                    {validationErrors.firmName && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmRegistrationNumber" className="block text-sm font-medium text-gray-300">
                      Firm Registration Number
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="firmRegistrationNumber"
                        name="firmRegistrationNumber"
                        type="text"
                        required
                        value={formData.firmRegistrationNumber}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter firm registration number"
                      />
                    </div>
                    {validationErrors.firmRegistrationNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmRegistrationNumber}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="firmAddress" className="block text-sm font-medium text-gray-300">
                    Firm Address
                    <span className="text-red-500"> *</span>
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-300" />
                    </div>
                    <textarea
                      id="firmAddress"
                      name="firmAddress"
                      required
                      value={formData.firmAddress}
                      onChange={handleChange}
                      rows={3}
                      className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Enter complete firm address"
                    />
                  </div>
                  {validationErrors.firmAddress && (
                    <p className="mt-1 text-sm text-red-400">{validationErrors.firmAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firmPhone" className="block text-sm font-medium text-gray-300">
                      Firm Phone Number
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="firmPhone"
                        name="firmPhone"
                        type="tel"
                        required
                        value={formData.firmPhone}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter firm phone number"
                      />
                    </div>
                    {validationErrors.firmPhone && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmPhone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmEmail" className="block text-sm font-medium text-gray-300">
                      Firm Email
                      <span className="text-red-500"> *</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        id="firmEmail"
                        name="firmEmail"
                        type="email"
                        required
                        value={formData.firmEmail}
                        onChange={handleChange}
                        className="block w-full pl-10 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="Enter firm email"
                      />
                    </div>
                    {validationErrors.firmEmail && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmEmail}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-700 rounded-md text-sm font-medium text-primary-400 bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                >
                  Previous
                </button>
              )}
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleStepNavigation}
                  className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="ml-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
