import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as Icons from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { NAV_BY_ROLE } from './navConfig';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications } = useSocket();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = NAV_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 240 : 76 }}
        className="hidden md:flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md"
      >
        <div className="flex items-center gap-2 px-4 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white font-bold">
            A
          </div>
          {sidebarOpen && <span className="font-semibold text-neutral-800 dark:text-neutral-100">AgriChain</span>}
        </div>

        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = Icons[item.icon] || Icons.Circle;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                  }`
                }
              >
                <Icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="m-2 rounded-xl p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Icons.PanelLeft size={18} />
        </button>
      </motion.aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-6 py-3">
          <div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Welcome back,</p>
            <p className="font-semibold text-neutral-800 dark:text-neutral-100">{user?.fullName}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
            </button>

            <div className="relative">
              <NavLink to="/dashboard/notifications" className="block rounded-full p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <Icons.Bell size={18} />
              </NavLink>
              {notifications.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-red-500 text-[10px] text-white pointer-events-none">
                  {notifications.length}
                </span>
              )}
            </div>

            <span className="rounded-full bg-brand-100 dark:bg-brand-900/40 px-3 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 capitalize">
              {user?.role?.replace('_', ' ')}
            </span>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <Icons.LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
