/**
 * App Providers
 * Combina todos os providers da aplicação
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthProvider';
import { ConfigProvider } from './ConfigProvider';
import { ModuleProvider } from './ModuleProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Componente que combina todos os providers necessários para a aplicação
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <AuthProvider>
          <ModuleProvider>
            {children}
          </ModuleProvider>
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  );
};

export default AppProviders;
