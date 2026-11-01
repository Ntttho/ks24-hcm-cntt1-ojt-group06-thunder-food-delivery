import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UiState {
  isGlobalLoading: boolean;
  sidebarCollapsed: boolean;
  themeMode: 'light' | 'dark';
}

const initialState: UiState = {
  isGlobalLoading: false,
  sidebarCollapsed: false,
  themeMode: 'light',
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.isGlobalLoading = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleThemeMode: (state) => {
      state.themeMode = state.themeMode === 'light' ? 'dark' : 'light';
    },
  },
});

export const { setGlobalLoading, toggleSidebar, setSidebarCollapsed, toggleThemeMode } =
  uiSlice.actions;
export default uiSlice.reducer;
