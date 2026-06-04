import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Printer, Receipt, LogOut } from 'lucide-react';
import clsx from 'clsx';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Individual Reports', path: '/reports', icon: Receipt },
  ];

  return (
    <div className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shadow-primary/30">
          PT
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
          PrintTrack Pro
        </h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-textMuted hover:bg-surfaceHighlight hover:text-white"
              )}
            >
              <Icon size={20} className="transition-transform group-hover:scale-110" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-textMuted hover:bg-danger/10 hover:text-danger transition-all duration-200 group">
          <LogOut size={20} className="transition-transform group-hover:-translate-x-1" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
