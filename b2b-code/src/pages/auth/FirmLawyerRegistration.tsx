import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Eye, EyeOff, Building, User, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { z } from 'zod';
import Background3D from '../../components/Background3D';

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
  practiceType: z.array(z.string()).min(1, 'At least one practice type is required'),
  languages: z.array(z.string()).min(1, 'At least one language is required'),
  experience: z.string().min(1, 'Experience is required'),
  barCouncilNumber: z.string()
    .min(1, 'Bar Council Number is required')
    .transform(num => num.trim().replace(/[^A-Za-z0-9]/g, '')),
  aadhaarNumber: z.string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^\d+$/, 'Aadhaar number must contain only digits'),
  firmName: z.string().min(1, 'Firm name is required'),
  firmRegistrationNumber: z.string().min(1, 'Firm registration number is required'),
  firmAddress: z.string().min(10, 'Please provide a complete firm address'),
  firmPhone: z.string().min(10, 'Firm phone number is required'),
  firmEmail: z.string().email('Invalid firm email format'),
  photo: z.string().optional(),
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

function FirmLawyerRegistration() {
  const navigate = useNavigate();
  const { signup, logout } = useAuth();
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
  const [showPracticeTypeDropdown, setShowPracticeTypeDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: '',
    practiceType: [] as string[],
    languages: [] as string[],
    experience: '',
    barCouncilNumber: '',
    aadhaarNumber: '',
    firmName: '',
    firmRegistrationNumber: '',
    firmAddress: '',
    firmPhone: '',
    firmEmail: '',
    photo: '',
  });

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
        if (formData.practiceType.length === 0) {
          setValidationErrors(prev => ({ ...prev, practiceType: 'At least one practice type is required' }));
          isValid = false;
        }
        break;
      case 3:
        if (!formData.experience) {
          setValidationErrors(prev => ({ ...prev, experience: 'Experience is required' }));
          isValid = false;
        }
        if (!formData.barCouncilNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, barCouncilNumber: 'Bar Council Number is required' }));
          isValid = false;
        }
        if (!formData.aadhaarNumber.trim()) {
          setValidationErrors(prev => ({ ...prev, aadhaarNumber: 'Aadhaar Number is required' }));
          isValid = false;
        }
        break;
      case 4:
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

    if (currentStep < 4) {
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

    // Generate a random 6-digit OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
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
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setFormData(prev => ({ ...prev, photo: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate all fields using formSchema
      formSchema.parse(formData);

      // Additional validation for Aadhaar verification
      if (!aadhaarVerified) {
        throw new Error('Please verify your Aadhaar number before proceeding');
      }

      try {
        await signup({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          displayName: `${formData.firstName} ${formData.lastName}`,
          userType: 'firm-lawyer',
          experience: formData.experience,
          barCouncilNumber: formData.barCouncilNumber,
          phone: formData.firmPhone,
          gender: formData.gender,
          practiceType: formData.practiceType,
          languages: formData.languages,
          firmName: formData.firmName,
          firmRegistrationNumber: formData.firmRegistrationNumber,
          firmAddress: formData.firmAddress,
          firmPhone: formData.firmPhone,
          firmEmail: formData.firmEmail,
          status: 'pending' // Set initial status as pending
        });
        
        // Logout the user after registration
        await logout();
        
        // Redirect to pending approval page
        navigate('/pending-approval');
      } catch (error: any) {
        // Handle authentication errors
        if (error.message.includes('Email already registered')) {
          setError('This email is already registered. Please use a different email or try to login.');
        } else if (error.message.includes('password')) {
          setError('Password is too weak. Please choose a stronger password.');
        } else if (error.message.includes('email')) {
          setError('Please enter a valid email address.');
        } else {
          setError(error.message || 'An error occurred during registration. Please try again.');
        }
        console.error('Registration error:', error);
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.reduce((acc, curr) => {
          acc[curr.path[0]] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        setValidationErrors(errors);
        setError('Please fix the validation errors before submitting.');
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 py-12 px-4 
    sm:px-6 lg:px-8 relative backdrop-blur-sm">
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
            Firm Lawyer Registration
          </h2>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {currentStep === 1 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Authentication Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                      Email Address
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setValidationErrors(prev => ({ ...prev, email: '' }));
                      }}
                      required
                      className={`mt-1 block w-full border ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-700'
                      } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                      Password
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setValidationErrors(prev => ({ ...prev, password: '' }));
                        }}
                        required
                        className={`block w-full border ${
                          validationErrors.password ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10`}
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
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setValidationErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        required
                        className={`block w-full border ${
                          validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm pr-10`}
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
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Personal Information</h3>
                <div className="space-y-4">
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
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">
                        Last Name
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-gray-300">
                      Gender
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {validationErrors.gender && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.gender}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Practice Type
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setShowPracticeTypeDropdown(!showPracticeTypeDropdown)}
                        className="w-full flex justify-between items-center px-3 py-2 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <span>
                          {formData.practiceType.length > 0
                            ? `${formData.practiceType.length} practice type(s) selected`
                            : 'Select practice type(s)'}
                        </span>
                        <svg
                          className={`h-5 w-5 text-gray-400 transform transition-transform ${
                            showPracticeTypeDropdown ? 'rotate-180' : ''
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {showPracticeTypeDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-[80px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                          <div className="py-0.5">
                            {[
                              { value: 'civil', label: 'Civil Law' },
                              { value: 'criminal', label: 'Criminal Law' },
                              { value: 'corporate', label: 'Corporate Law' },
                              { value: 'family', label: 'Family Law' },
                              { value: 'property', label: 'Property Law' },
                              { value: 'intellectual', label: 'Intellectual Property' },
                              { value: 'tax', label: 'Tax Law' },
                              { value: 'employment', label: 'Employment Law' },
                              { value: 'other', label: 'Other' }
                            ].map((type) => (
                              <label
                                key={type.value}
                                className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  value={type.value}
                                  checked={formData.practiceType.includes(type.value)}
                                  onChange={(e) => {
                                    const newPracticeTypes = e.target.checked
                                      ? [...formData.practiceType, type.value]
                                      : formData.practiceType.filter(pt => pt !== type.value);
                                    setFormData({ ...formData, practiceType: newPracticeTypes });
                                  }}
                                  className="h-4 w-4 text-primary-500 border-gray-600 rounded focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-white">{type.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {validationErrors.practiceType && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.practiceType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300">
                      Languages
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                        className="w-full flex justify-between items-center px-3 py-2 border border-gray-700 bg-gray-800/50 rounded-md shadow-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <span>
                          {formData.languages.length > 0
                            ? `${formData.languages.length} language(s) selected`
                            : 'Select language(s)'}
                        </span>
                        <svg
                          className={`h-5 w-5 text-gray-400 transform transition-transform ${
                            showLanguageDropdown ? 'rotate-180' : ''
                          }`}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {showLanguageDropdown && (
                        <div className="absolute z-50 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-[80px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-700 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                          <div className="py-0.5">
                            {[
                              { value: 'english', label: 'English' },
                              { value: 'hindi', label: 'Hindi' },
                              { value: 'tamil', label: 'Tamil' },
                              { value: 'telugu', label: 'Telugu' },
                              { value: 'kannada', label: 'Kannada' },
                              { value: 'malayalam', label: 'Malayalam' },
                              { value: 'marathi', label: 'Marathi' },
                              { value: 'gujarati', label: 'Gujarati' },
                              { value: 'bengali', label: 'Bengali' },
                              { value: 'punjabi', label: 'Punjabi' },
                              { value: 'other', label: 'Other' }
                            ].map((lang) => (
                              <label
                                key={lang.value}
                                className="flex items-center px-3 py-1 hover:bg-gray-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  value={lang.value}
                                  checked={formData.languages.includes(lang.value)}
                                  onChange={(e) => {
                                    const newLanguages = e.target.checked
                                      ? [...formData.languages, lang.value]
                                      : formData.languages.filter(l => l !== lang.value);
                                    setFormData({ ...formData, languages: newLanguages });
                                  }}
                                  className="h-4 w-4 text-primary-500 border-gray-600 rounded focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-white">{lang.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {validationErrors.languages && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.languages}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Professional Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-300">
                      Experience
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />      
                  </div>
                  <div>
                    <label htmlFor="barCouncilNumber" className="block text-sm font-medium text-gray-300">
                      Bar Council Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="barCouncilNumber"
                      value={formData.barCouncilNumber}
                      onChange={(e) => setFormData({ ...formData, barCouncilNumber: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-700 bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    />
                    {validationErrors.barCouncilNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.barCouncilNumber}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="aadhaarNumber" className="block text-sm font-medium text-gray-300">
                      Aadhaar Number
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 flex space-x-2">
                      <input
                        type="text"
                        id="aadhaarNumber"
                        value={formData.aadhaarNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                          setFormData({ ...formData, aadhaarNumber: value });
                          setValidationErrors(prev => ({ ...prev, aadhaarNumber: '' }));
                        }}
                        required
                        className={`block w-full border ${
                          validationErrors.aadhaarNumber ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                        placeholder="Enter 12-digit Aadhaar number"
                      />
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
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div>
                <h3 className="text-lg font-medium text-white mb-4">Firm Details</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="firmName" className="block text-sm font-medium text-gray-300">
                      Firm Name
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Building className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        type="text"
                        id="firmName"
                        value={formData.firmName}
                        onChange={(e) => {
                          setFormData({ ...formData, firmName: e.target.value });
                          setValidationErrors(prev => ({ ...prev, firmName: '' }));
                        }}
                        required
                        placeholder="Enter your firm's name"
                        className={`block w-full pl-10 border ${
                          validationErrors.firmName ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                    </div>
                    {validationErrors.firmName && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmRegistrationNumber" className="block text-sm font-medium text-gray-300">
                      Firm Registration Number
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firmRegistrationNumber"
                      value={formData.firmRegistrationNumber}
                      onChange={(e) => {
                        setFormData({ ...formData, firmRegistrationNumber: e.target.value });
                        setValidationErrors(prev => ({ ...prev, firmRegistrationNumber: '' }));
                      }}
                      required
                      placeholder="Enter firm's registration number"
                      className={`block w-full border ${
                        validationErrors.firmRegistrationNumber ? 'border-red-500' : 'border-gray-700'
                      } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    />
                    {validationErrors.firmRegistrationNumber && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmRegistrationNumber}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmAddress" className="block text-sm font-medium text-gray-300">
                      Firm Address
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-300" />
                      </div>
                      <textarea
                        id="firmAddress"
                        value={formData.firmAddress}
                        onChange={(e) => {
                          setFormData({ ...formData, firmAddress: e.target.value });
                          setValidationErrors(prev => ({ ...prev, firmAddress: '' }));
                        }}
                        required
                        rows={3}
                        placeholder="Enter complete firm address"
                        className={`block w-full pl-10 border ${
                          validationErrors.firmAddress ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                    </div>
                    {validationErrors.firmAddress && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmAddress}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmPhone" className="block text-sm font-medium text-gray-300">
                      Firm Phone Number
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        type="tel"
                        id="firmPhone"
                        value={formData.firmPhone}
                        onChange={(e) => {
                          setFormData({ ...formData, firmPhone: e.target.value });
                          setValidationErrors(prev => ({ ...prev, firmPhone: '' }));
                        }}
                        required
                        placeholder="Enter firm's contact number"
                        className={`block w-full pl-10 border ${
                          validationErrors.firmPhone ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                    </div>
                    {validationErrors.firmPhone && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmPhone}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firmEmail" className="block text-sm font-medium text-gray-300">
                      Firm Email
                      <span className="text-red-500">*</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-300" />
                      </div>
                      <input
                        type="email"
                        id="firmEmail"
                        value={formData.firmEmail}
                        onChange={(e) => {
                          setFormData({ ...formData, firmEmail: e.target.value });
                          setValidationErrors(prev => ({ ...prev, firmEmail: '' }));
                        }}
                        required
                        placeholder="Enter firm's email address"
                        className={`block w-full pl-10 border ${
                          validationErrors.firmEmail ? 'border-red-500' : 'border-gray-700'
                        } bg-gray-800/50 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                      />
                    </div>
                    {validationErrors.firmEmail && (
                      <p className="mt-1 text-sm text-red-400">{validationErrors.firmEmail}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="py-2 px-4 border border-gray-700 rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Previous
                </button>
              )}
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleStepNavigation}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
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

export default FirmLawyerRegistration; 