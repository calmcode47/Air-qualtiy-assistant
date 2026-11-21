import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-6 text-center">
          <div className="bg-white rounded-3xl border border-[#E6DED6] p-8 max-w-lg w-full paper-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0EC] text-[#A94A28] border border-[#F2D1C5] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold font-serif-natural text-[#18261F]">
              Something went temporarily awry
            </h2>

            <p className="text-xs text-[#56685F] leading-relaxed">
              We encountered an unexpected display hiccup in this section. Your underlying profile and atmospheric cache are safe.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#18261F] text-[#FAF8F4] hover:bg-[#2C3E33] transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] border border-[#DDD5C7] text-[#18261F] hover:bg-[#EAE4D8] transition"
              >
                <Home className="w-3.5 h-3.5 text-[#3D6B56]" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
