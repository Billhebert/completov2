/**
 * Error Boundary Component
 * Captura erros de renderização e exibe uma UI de fallback
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../../modules/shared/components/UI/Button';
import { Card } from '../../modules/shared/components/UI/Card';

interface Props {
  children: ReactNode;
  /** Callback quando ocorre um erro */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Componente de fallback customizado */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Callback opcional
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Se foi fornecido um fallback customizado, usa ele
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de fallback padrão
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Algo deu errado
              </h1>
              <p className="text-gray-600">
                Ocorreu um erro inesperado na aplicação.
              </p>
            </div>

            {/* Detalhes do erro (somente em desenvolvimento) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">
                  Detalhes do erro:
                </h3>
                <pre className="text-xs text-red-700 overflow-auto max-h-48 whitespace-pre-wrap">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="secondary"
                onClick={this.handleReset}
              >
                Tentar novamente
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReload}
              >
                Recarregar página
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
