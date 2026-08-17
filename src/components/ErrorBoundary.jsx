import React from 'react';
import Icon from './Icon';
import { logErrorToDb } from '../lib/logger';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                             (error?.message && error.message.includes('Failed to fetch dynamically imported module'));
                             
    if (isChunkLoadError) {
      const isReloaded = sessionStorage.getItem('chunk_load_error_reloaded');
      if (!isReloaded) {
        sessionStorage.setItem('chunk_load_error_reloaded', 'true');
        window.location.reload();
        return { hasError: false };
      }
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                             (error?.message && error.message.includes('Failed to fetch dynamically imported module'));
                             
    if (!isChunkLoadError || sessionStorage.getItem('chunk_load_error_reloaded')) {
      sessionStorage.removeItem('chunk_load_error_reloaded');
      this.setState({ error, errorInfo });
      console.error("ErrorBoundary caught an error", error, errorInfo);
      logErrorToDb(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-error-container text-on-error-container rounded-full flex items-center justify-center mb-6">
            <Icon name="error_outline" className="text-3xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface mb-3">Oops! Something went wrong</h1>
          <p className="text-on-surface-variant max-w-md mb-8">
            We encountered an unexpected issue while loading this page. This could be due to a temporary network glitch or a bug on our end.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Icon name="refresh" /> Reload Page
            </button>
            <button 
              onClick={() => window.location.href = import.meta.env.BASE_URL || '/'} 
              className="bg-surface-container text-on-surface px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors"
            >
              <Icon name="home" /> Go to Home
            </button>
          </div>
          {/* We keep the error logged in the console for debugging but hide it from the UI */}
        </div>
      );
    }
    return this.props.children;
  }
}
