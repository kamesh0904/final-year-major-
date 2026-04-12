import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to monitoring service in production
        if (import.meta.env.PROD) {
            // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
            console.error('Error caught by boundary:', error, errorInfo);
        }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null
        });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#0b0616] flex items-center justify-center p-6">
                    <div className="max-w-md w-full card-calm text-center">
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="text-red-400" size={32} />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-4">
                            Something went wrong
                        </h2>

                        <p className="text-gray-300 mb-6 leading-relaxed">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="glass p-4 rounded-xl mb-6 text-left">
                                <p className="text-xs text-red-300 font-mono break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <button
                            onClick={this.handleReset}
                            className="btn-calm inline-flex items-center gap-2"
                        >
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
