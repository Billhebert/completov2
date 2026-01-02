/**
 * TopBar Component
 * Barra superior com informações do usuário e ações
 */

import React, { useState } from 'react';
import { useAuth } from '../../../../core/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../../../crm/components/NotificationBell';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface TopBarProps {
  onMenuClick: () => void;
  sidebarOpen: boolean;
  onSearchClick?: () => void;
}

/**
 * Componente de TopBar
 */
export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, sidebarOpen, onSearchClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const handleProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  return (
    <header className="topbar">
      {/* Left side - Menu toggle */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
          title={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
        >
          <svg
            className="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                sidebarOpen
                  ? 'M6 18L18 6M6 6l12 12'
                  : 'M4 6h16M4 12h16M4 18h16'
              }
            />
          </svg>
        </button>

        {/* Global Search Button (Cmd+K) */}
        {onSearchClick && (
          <button
            onClick={onSearchClick}
            className="ml-4 hidden md:flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
            <span>Buscar</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-sans text-gray-600">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Right side - User menu and notifications */}
      <div className="flex items-center gap-4">
        {/* Notification Bell with real functionality */}
        <NotificationBell />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>

            {/* User info */}
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium text-gray-900">
                {user?.name || 'Usuário'}
              </div>
              <div className="text-xs text-gray-500">{user?.role || ''}</div>
            </div>

            {/* Dropdown icon */}
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${
                showUserMenu ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              {/* Overlay para fechar o menu */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={handleProfile}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Meu Perfil
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Configurações
                </button>

                <div className="border-t border-gray-200 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
