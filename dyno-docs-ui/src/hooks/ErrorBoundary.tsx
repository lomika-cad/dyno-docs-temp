import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import "../styles/common.css";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="error-boundary-container">
                    <div className="error-box">
                        <h2 className="error-title">Something went wrong</h2>
                        <p className="error-message">
                            We apologize for the inconvenience. Please try refreshing the page or contact support if the problem persists.
                        </p>

                        <div className="error-details">
                            <p className="error-text">
                                {this.state.error?.toString()}
                            </p>
                        </div>

                        <button 
                            onClick={() => window.location.reload()}
                            className="error-refresh-btn"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
