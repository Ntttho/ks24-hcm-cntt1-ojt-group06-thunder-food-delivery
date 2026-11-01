import React from 'react';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntdApp } from 'antd';
import { RouterProvider } from 'react-router-dom';
import viVN from 'antd/locale/vi_VN';
import { store } from '@/store';
import { router } from '@/routes';
import { antdThemeConfig } from '@/config/appConfig';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <ConfigProvider theme={antdThemeConfig} locale={viVN}>
          <AntdApp>
            <RouterProvider router={router} />
          </AntdApp>
        </ConfigProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
