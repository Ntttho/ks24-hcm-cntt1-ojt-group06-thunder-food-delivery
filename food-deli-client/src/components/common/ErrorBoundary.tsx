import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result } from 'antd';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in React ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <Result
            status="500"
            title="Đã xảy ra sự cố không mong muốn"
            subTitle={this.state.error?.message || 'Ứng dụng gặp lỗi trong quá trình render.'}
            extra={
              <Button
                type="primary"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
              >
                Về trang chủ
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
