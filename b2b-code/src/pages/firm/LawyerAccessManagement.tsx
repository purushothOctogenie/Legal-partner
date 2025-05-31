import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, UserPlus, CheckCircle, XCircle, Shield, Lock, Unlock, Ban, LayoutDashboard, MessageSquare, FileSignature, Bell, Users, Briefcase, FileText, Calendar, BarChart, Settings, HelpCircle, ListTodo, MessageCircle, ScrollText, Trash2 } from 'lucide-react';
import axios from 'axios';

interface Lawyer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  userType: 'lawyer' | 'non-lawyer';
  status: 'pending' | 'approved' | 'rejected' | 'blocked';
  accessPermissions: {
    dashboard: boolean;
    aiAssistant: boolean;
    digitalSignature: boolean;
    notifications: boolean;
    clientManagement: boolean;
    caseManagement: boolean;
    documentManagement: boolean;
    calendar: boolean;
    reports: boolean;
    settings: boolean;
    help: boolean;
    tasks: boolean;
    chat: boolean;
    notary: boolean;
  };
}

export default function LawyerAccessManagement() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<Lawyer['accessPermissions'] | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; userId: string | null }>({ show: false, userId: null });

  // Check if user is a firm admin
  useEffect(() => {
    if (user?.userType !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  // Fetch lawyers from API
  useEffect(() => {
    const fetchLawyers = async () => {
      if (user?.userType !== 'admin' || !token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching users for firm admin:', user.id);
        const response = await axios.get('/api/firm/users', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Received users data:', response.data);
        
        if (Array.isArray(response.data)) {
          setLawyers(response.data);
        } else {
          console.error('Invalid response format:', response.data);
          setError('Received invalid data format from server');
          setLawyers([]);
        }
        
        setLoading(false);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        if (error.response) {
          console.error('Error response:', error.response.status, error.response.data);
          if (error.response.status === 403) {
            setError('Your session has expired. Please log in again.');
            setTimeout(() => navigate('/login'), 2000);
          } else {
            setError(error.response.data?.message || 'Failed to fetch users');
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          setError('No response from server. Please check if the server is running.');
        } else {
          console.error('Error setting up request:', error.message);
          setError('Failed to fetch users. Please try again later.');
        }
        setLoading(false);
        setLawyers([]);
      }
    };

    fetchLawyers();
  }, [user, token, navigate]);

  const handleStatusChange = async (userId: string, newStatus: 'approved' | 'rejected' | 'blocked') => {
    if (!userId) {
      setError('Invalid user ID');
      return;
    }

    try {
      console.log('Updating user status:', { userId, newStatus });
      
      const response = await axios.put(
        `/api/firm/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setLawyers(lawyers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error: any) {
      console.error('Error updating user status:', error);
      let errorMessage = 'Failed to update user status';
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      setError(errorMessage);
    }
  };

  const handleDelete = async (userId: string) => {
    // Show confirmation dialog first
    setDeleteConfirmation({ show: true, userId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.userId) return;

    try {
      console.log('Deleting user:', deleteConfirmation.userId);
      
      const response = await axios.delete(
        `/api/firm/users/${deleteConfirmation.userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setLawyers(lawyers.filter(user => user.id !== deleteConfirmation.userId));
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      let errorMessage = 'Failed to delete user';
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      setError(errorMessage);
    } finally {
      // Close confirmation dialog
      setDeleteConfirmation({ show: false, userId: null });
    }
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    if (!tempPermissions) return;
    setTempPermissions({
      ...tempPermissions,
      [permission]: value
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedLawyer || !tempPermissions) return;

    try {
      console.log('Updating permissions for user:', selectedLawyer.id);
      
      const response = await axios.put(
        `/api/firm/users/${selectedLawyer.id}/permissions`,
        { accessPermissions: tempPermissions },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setLawyers(lawyers.map(user => 
          user.id === selectedLawyer.id 
            ? { 
                ...user,
                accessPermissions: tempPermissions
              } 
            : user
        ));
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        setShowModal(false);
      }
    } catch (error: any) {
      console.error('Error updating permissions:', error);
      let errorMessage = 'Failed to update permissions';
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage = 'No response from server. Please check if the server is running.';
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      setError(errorMessage);
    }
  };

  const openModal = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer);
    setTempPermissions({ ...lawyer.accessPermissions });
    setShowModal(true);
  };

  const filteredLawyers = lawyers.filter(lawyer => 
    `${lawyer.firstName} ${lawyer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lawyer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'dashboard':
        return <LayoutDashboard className="h-5 w-5" />;
      case 'aiAssistant':
        return <MessageSquare className="h-5 w-5" />;
      case 'digitalSignature':
        return <FileSignature className="h-5 w-5" />;
      case 'notifications':
        return <Bell className="h-5 w-5" />;
      case 'clientManagement':
        return <Users className="h-5 w-5" />;
      case 'caseManagement':
        return <Briefcase className="h-5 w-5" />;
      case 'documentManagement':
        return <FileText className="h-5 w-5" />;
      case 'calendar':
        return <Calendar className="h-5 w-5" />;
      case 'reports':
        return <BarChart className="h-5 w-5" />;
      case 'settings':
        return <Settings className="h-5 w-5" />;
      case 'help':
        return <HelpCircle className="h-5 w-5" />;
      case 'tasks':
        return <ListTodo className="h-5 w-5" />;
      case 'chat':
        return <MessageCircle className="h-5 w-5" />;
      case 'notary':
        return <ScrollText className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  // Helper function to get initials safely
  const getInitials = (lawyer: Lawyer) => {
    const firstInitial = lawyer.firstName?.[0] || '';
    const lastInitial = lawyer.lastName?.[0] || '';
    return `${firstInitial}${lastInitial}` || '?';
  };

  // Helper function to get full name safely
  const getFullName = (lawyer: Lawyer) => {
    const firstName = lawyer.firstName || '';
    const lastName = lawyer.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Firm Access Management</h1>
          <div className="relative">
            <input
              type="text"
              placeholder="Search lawyers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Lawyer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Access Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredLawyers.map((user) => (
                    <tr key={`lawyer-${user.id}`} className="hover:bg-gray-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-lg font-medium text-white">
                              {getInitials(user)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              {getFullName(user)}
                            </div>
                            <div className="text-sm text-gray-400">{user.email || 'No email'}</div>
                            <div className="text-xs text-gray-500 capitalize">{user.userType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : user.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : user.status === 'blocked'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(user.status || 'pending').charAt(0).toUpperCase() + (user.status || 'pending').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(user.accessPermissions || {}).map(([permission, value]) => (
                          <span
                            key={`${user.id}-${permission}`}
                            className={`px-2 py-1 text-xs rounded-full flex items-center ${
                              value 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {value ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {permission.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          key={`manage-${user.id}`}
                          onClick={() => openModal(user)}
                          className="text-primary-400 hover:text-primary-300 mr-4"
                        >
                          Manage Access
                        </button>
                        {user.status === 'pending' && (
                          <>
                            <button
                              key={`approve-${user.id}`}
                              onClick={() => handleStatusChange(user.id, 'approved')}
                              className="text-green-400 hover:text-green-300 mr-4"
                            >
                              Approve
                            </button>
                            <button
                              key={`reject-${user.id}`}
                              onClick={() => handleStatusChange(user.id, 'rejected')}
                              className="text-red-400 hover:text-red-300 mr-4"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {user.status === 'approved' && (
                          <button
                            key={`block-${user.id}`}
                            onClick={() => handleStatusChange(user.id, 'blocked')}
                            className="text-gray-400 hover:text-gray-300 mr-4"
                          >
                            Block
                          </button>
                        )}
                        {user.status === 'blocked' && (
                          <button
                            key={`unblock-${user.id}`}
                            onClick={() => handleStatusChange(user.id, 'approved')}
                            className="text-green-400 hover:text-green-300 mr-4"
                          >
                            Unblock
                          </button>
                        )}
                        <button
                          key={`delete-${user.id}`}
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-500 p-2 rounded-full hover:bg-red-100/10 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Access Management Modal */}
      {showModal && selectedLawyer && tempPermissions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">
                  Manage Access for {selectedLawyer.firstName} {selectedLawyer.lastName}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(tempPermissions).map(([permission, value]) => (
                  <div key={`${selectedLawyer?.id}-${permission}`} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${value ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {getPermissionIcon(permission)}
                      </div>
                      <span className="text-white font-medium">
                        {permission.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end space-x-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to remove this user from the firm? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmation({ show: false, userId: null })}
                className="px-4 py-2 border border-gray-700 rounded-md text-white hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-10 right-1 z-50 flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg border border-green-400"
        >
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">Changes saved successfully!</span>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg border border-red-400"
        >
          <XCircle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </motion.div>
      )}
    </div>
  );
} 