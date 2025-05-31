import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Background3D from '../../components/Background3D';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  useEffect(() => {
    // If user is authenticated and not pending, redirect to dashboard
    if (user && user.status !== 'pending') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900/80 via-gray-800/50 to-black/80 text-white relative backdrop-blur-sm overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Background3D />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-16 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Clock className="w-16 h-16 text-primary-400" />
            </motion.div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Registration Pending Approval</h1>
          <p className="text-gray-300 mb-8">
            Your registration is currently being reviewed by the law firm. You will be notified once your access is approved.
          </p>
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingApproval; 