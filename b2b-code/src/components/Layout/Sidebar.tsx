import React from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Scale,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  Bell,
  FileSignature,
  Brain,
  Stamp,
  CheckSquare,
  Menu,
  X,
  LogOut,
  UserCog
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', permission: 'dashboard' },
  { name: 'Cases', icon: Scale, path: '/cases', permission: 'caseManagement' },
  { name: 'Tasks', icon: CheckSquare, path: '/tasks', permission: 'tasks' },
  { name: 'Clients', icon: Users, path: '/clients', permission: 'clientManagement' },
  { name: 'Documents', icon: FileText, path: '/documents', permission: 'documentManagement' },
  { name: 'Calendar', icon: Calendar, path: '/calendar', permission: 'calendar' },
  { name: 'Chat', icon: MessageSquare, path: '/chat', permission: 'chat' },
  { name: 'AI Assistant', icon: Brain, path: '/ai-assistant', permission: 'aiAssistant' },
  { name: 'Notifications', icon: Bell, path: '/notifications', permission: 'notifications' },
  { name: 'Digital Signature', icon: FileSignature, path: '/signature', permission: 'digitalSignature' },
  { name: 'Notary', icon: Stamp, path: '/notary', permission: 'notary' },
  { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Filter navigation items based on user permissions
  const filteredNavigation = navigation.filter(item => {
    // If user is admin, show all items
    if (user?.userType === 'admin') return true;
    
    // For lawyers, check if they have permission for the item
    return user?.accessPermissions?.[item.permission] === true;
  });

  return (
    <>
      <div className={`lg:w-64 bg-gray-900 border-r border-gray-800 p-4 
        fixed lg:static inset-0 z-30 transform lg:transform-none transition-transform duration-200 ease-in-out
        bg-opacity-30 backdrop-blur-sm
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute right-4 top-4 text-gray-300 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="space-y-4 h-full overflow-y-auto">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                hover:bg-gray-800/50 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-300'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </NavLink>
          ))}
          {user?.userType === 'admin' && (
            <NavLink
              to="/lawyer-access"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                hover:bg-gray-800/50 ${
                  isActive
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-gray-300'
                }`
              }
            >
              <UserCog className="w-5 h-5" />
              <span>Lawyer Access</span>
            </NavLink>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-red-400 hover:bg-gray-800/50 mt-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed left-4 bottom-4 z-50 p-3 bg-primary-500 rounded-full text-white shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  );
};

export default Sidebar;