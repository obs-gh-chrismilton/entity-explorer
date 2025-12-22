import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Database,
  BarChart3,
  Bell,
  Network,
  Search,
  MessageSquare,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Datasets', path: '/datasets', icon: Database },
  { name: 'Dashboards', path: '/dashboards', icon: BarChart3 },
  { name: 'Monitors', path: '/monitors', icon: Bell },
  { name: 'Relationships', path: '/relationships', icon: Network },
  { name: 'Search', path: '/search', icon: Search },
  { name: 'AI Chat', path: '/ai-chat', icon: MessageSquare },
];

export default function Sidebar() {
  const { username, logout } = useAuthStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col shadow-lg z-50"
    >
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
            <Network className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Entity Explorer</h1>
            <p className="text-xs text-gray-500">Observe Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-5 h-5 ${isActive ? 'text-primary-700' : 'text-gray-400'}`}
                    />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-4 h-4 text-primary-700" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-gray-900">{username}</p>
            <p className="text-xs text-gray-500">Account</p>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isProfileOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isProfileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
}
