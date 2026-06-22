"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-background p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="flex justify-center">
                            <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-4">
                                <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
                            <p className="text-muted-foreground text-sm">
                                An unexpected error occurred. Please reload the application to continue.
                            </p>
                            {this.state.error && (
                                <p className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded break-all">
                                    {this.state.error.message}
                                </p>
                            )}
                        </div>
                        <Button onClick={this.handleReload} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
