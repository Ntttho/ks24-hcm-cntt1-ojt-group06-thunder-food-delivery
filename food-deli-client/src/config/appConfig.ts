import type { ThemeConfig } from 'antd';

export const appConfig = {
  appName: import.meta.env.VITE_APP_TITLE || 'Thunder Food Delivery',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  port: Number(import.meta.env.VITE_APP_PORT) || 3000,
  defaultTimeout: 15000,
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dbsu61unm',
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || '248623814955712',
    apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'CUic7H8Zol524YGoyoiKrdLFM60',
    folder: import.meta.env.VITE_CLOUDINARY_FOLDER || 'foodthunder',
  },
};

/**
 * Ant Design Custom Theme Configuration (Vibrant Food Delivery Branding)
 */
export const antdThemeConfig: ThemeConfig = {
  token: {
    fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    colorPrimary: '#f97316', // Orange-500 (Vibrant food delivery brand)
    colorPrimaryHover: '#ea580c',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#3b82f6',
    borderRadius: 8,
    wireframe: false,
  },
  components: {
    Button: {
      controlHeight: 40,
      borderRadius: 8,
      fontWeight: 600,
    },
    Input: {
      controlHeight: 40,
      borderRadius: 8,
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
};
