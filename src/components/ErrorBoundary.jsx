import React from 'react';

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
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 w-full h-full flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm w-full overflow-auto text-left">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button onClick={() => window.location.reload()} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
