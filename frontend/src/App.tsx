/**
 * App Component
 * Componente principal da aplicação
 */

import React from 'react';
import { AppProviders } from './core/providers';
import { ModularRouter } from './core/router';

/**
 * Componente raiz da aplicação
 */
const App: React.FC = () => {
  return (
    <AppProviders>
      <ModularRouter />
    </AppProviders>
  );
};

export default App;
