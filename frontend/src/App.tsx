/**
 * App Component
 * Componente principal da aplicação
 */

import React from 'react';
import { AppProviders } from './core/providers';
import { ModularRouter } from './core/router';
import { ErrorBoundary } from './core/components/ErrorBoundary';



/**
 * Componente raiz da aplicação
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProviders>
        <ModularRouter />
      </AppProviders>
    </ErrorBoundary>
  );
};

export default App;
