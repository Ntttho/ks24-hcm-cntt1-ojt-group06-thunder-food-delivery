import { apiClient, API_ENDPOINTS } from '@/services/api';
import type { ApiResponse, PaginatedData } from '@/types';

export interface BannerItem {
  id: number | string;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl?: string;
  campaignId?: number | null;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerPayload {
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl?: string;
  campaignId?: number | null;
  isActive: boolean;
  displayOrder: number;
}

export interface BannerQuery {
  page: number;
  size: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL';
  campaignId?: number;
}

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface CampaignItem {
  id: number;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CampaignPayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
}

export const bannerApi = {
  getAll: (query: BannerQuery): Promise<ApiResponse<PaginatedData<BannerItem>>> =>
    apiClient.get<PaginatedData<BannerItem>>(API_ENDPOINTS.ADMIN.BANNERS, { params: query }),

  getActiveBanners: (): Promise<ApiResponse<BannerItem[]>> =>
    apiClient.get<BannerItem[]>(API_ENDPOINTS.BANNERS.ACTIVE),

  getById: (id: number | string): Promise<ApiResponse<BannerItem>> =>
    apiClient.get<BannerItem>(API_ENDPOINTS.ADMIN.BANNER_DETAIL(id)),

  create: (payload: BannerPayload): Promise<ApiResponse<BannerItem>> =>
    apiClient.post<BannerItem>(API_ENDPOINTS.ADMIN.BANNERS, payload),

  update: (id: number | string, payload: BannerPayload): Promise<ApiResponse<BannerItem>> =>
    apiClient.put<BannerItem>(API_ENDPOINTS.ADMIN.BANNER_DETAIL(id), payload),

  updateStatus: (id: number | string, isActive: boolean): Promise<ApiResponse<BannerItem>> =>
    apiClient.patch<BannerItem>(API_ENDPOINTS.ADMIN.BANNER_STATUS(id), { isActive }),

  delete: (id: number | string): Promise<ApiResponse<void>> =>
    apiClient.delete<void>(API_ENDPOINTS.ADMIN.BANNER_DETAIL(id)),

  getCampaigns: (): Promise<ApiResponse<CampaignItem[]>> =>
    apiClient.get<CampaignItem[]>(API_ENDPOINTS.ADMIN.CAMPAIGNS),

  getCampaign: (id: number): Promise<ApiResponse<CampaignItem>> =>
    apiClient.get<CampaignItem>(API_ENDPOINTS.ADMIN.CAMPAIGN_DETAIL(id)),

  createCampaign: (payload: CampaignPayload): Promise<ApiResponse<CampaignItem>> =>
    apiClient.post<CampaignItem>(API_ENDPOINTS.ADMIN.CAMPAIGNS, payload),

  updateCampaign: (id: number, payload: CampaignPayload): Promise<ApiResponse<CampaignItem>> =>
    apiClient.put<CampaignItem>(API_ENDPOINTS.ADMIN.CAMPAIGN_DETAIL(id), payload),

  deleteCampaign: (id: number): Promise<ApiResponse<void>> =>
    apiClient.delete<void>(API_ENDPOINTS.ADMIN.CAMPAIGN_DETAIL(id)),
};

export default bannerApi;
