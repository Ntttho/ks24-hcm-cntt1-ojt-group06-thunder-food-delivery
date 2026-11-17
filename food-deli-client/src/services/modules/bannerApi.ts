import type { ApiResponse } from '@/types';
import { storage } from '@/utils/storage';

export interface BannerItem {
  id: number | string;
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
}

export interface BannerPayload {
  title: string;
  imageUrl: string;
  targetUrl?: string;
  isActive?: boolean;
  displayOrder?: number;
}

const STORAGE_KEY = 'thunder_banners';
const FALLBACK_BANNERS: BannerItem[] = [
  {
    id: 1,
    title: 'Flash Sale cuối tuần',
    imageUrl:
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/restaurants',
    isActive: true,
    displayOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Giảm 50% đơn đầu tiên',
    imageUrl:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    targetUrl: '/restaurants',
    isActive: true,
    displayOrder: 2,
    createdAt: new Date().toISOString(),
  },
];

const sortBanners = (items: BannerItem[]) =>
  [...items].sort((a, b) => Number(a.displayOrder || 0) - Number(b.displayOrder || 0));

const normalizeBanner = (banner: Partial<BannerItem>): BannerItem => ({
  id: banner.id ?? Date.now(),
  title: banner.title?.trim() || 'Banner quảng cáo',
  imageUrl: banner.imageUrl || '',
  targetUrl: banner.targetUrl || '',
  isActive: banner.isActive ?? true,
  displayOrder: Number(banner.displayOrder ?? 0),
  createdAt: banner.createdAt || new Date().toISOString(),
});

const readBanners = (): BannerItem[] => {
  const stored = storage.get<BannerItem[]>(STORAGE_KEY);
  if (!stored || !Array.isArray(stored) || stored.length === 0) {
    storage.set(STORAGE_KEY, FALLBACK_BANNERS);
    return FALLBACK_BANNERS;
  }

  return sortBanners(stored.map((banner) => normalizeBanner(banner)));
};

const writeBanners = (items: BannerItem[]) => {
  storage.set(STORAGE_KEY, sortBanners(items));
};

const toResponse = <T>(data: T): ApiResponse<T> => ({
  status: 200,
  message: 'Thành công',
  data,
  timestamp: new Date().toISOString(),
});

export const bannerApi = {
  getAll: async (): Promise<ApiResponse<BannerItem[]>> => {
    return toResponse(readBanners());
  },

  getActiveBanners: async (): Promise<ApiResponse<BannerItem[]>> => {
    const active = readBanners().filter((banner) => banner.isActive);
    return toResponse(active);
  },

  getById: async (id: number | string): Promise<ApiResponse<BannerItem | null>> => {
    const banner = readBanners().find((item) => String(item.id) === String(id)) || null;
    return toResponse(banner);
  },

  create: async (payload: BannerPayload): Promise<ApiResponse<BannerItem>> => {
    const banners = readBanners();
    const nextOrder = Math.max(0, ...banners.map((item) => Number(item.displayOrder || 0))) + 1;
    const newBanner: BannerItem = normalizeBanner({
      id: Date.now(),
      title: payload.title,
      imageUrl: payload.imageUrl,
      targetUrl: payload.targetUrl,
      isActive: payload.isActive ?? true,
      displayOrder: payload.displayOrder ?? nextOrder,
      createdAt: new Date().toISOString(),
    });

    const updated = sortBanners([...banners, newBanner]);
    writeBanners(updated);
    return toResponse(newBanner);
  },

  update: async (id: number | string, payload: BannerPayload): Promise<ApiResponse<BannerItem>> => {
    const banners = readBanners();
    const index = banners.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      throw new Error('Không tìm thấy banner cần cập nhật.');
    }

    const nextBanner = normalizeBanner({
      ...banners[index],
      ...payload,
      id,
      title: payload.title?.trim() || banners[index].title,
      imageUrl: payload.imageUrl || banners[index].imageUrl,
      targetUrl: payload.targetUrl ?? banners[index].targetUrl,
      isActive: payload.isActive ?? banners[index].isActive,
      displayOrder: Number(payload.displayOrder ?? banners[index].displayOrder),
      createdAt: banners[index].createdAt || new Date().toISOString(),
    });

    const updated = [...banners];
    updated[index] = nextBanner;
    writeBanners(sortBanners(updated));
    return toResponse(nextBanner);
  },

  updateStatus: async (id: number | string, isActive: boolean): Promise<ApiResponse<BannerItem>> => {
    const banner = readBanners().find((item) => String(item.id) === String(id));
    if (!banner) {
      throw new Error('Không tìm thấy banner cần cập nhật trạng thái.');
    }

    const updatedBanner = normalizeBanner({ ...banner, isActive });
    const banners = readBanners().map((item) =>
      String(item.id) === String(id) ? updatedBanner : item
    );
    writeBanners(sortBanners(banners));
    return toResponse(updatedBanner);
  },

  delete: async (id: number | string): Promise<ApiResponse<boolean>> => {
    const banners = readBanners();
    const filtered = banners.filter((item) => String(item.id) !== String(id));
    if (filtered.length === banners.length) {
      throw new Error('Không tìm thấy banner cần xóa.');
    }

    writeBanners(sortBanners(filtered));
    return toResponse(true);
  },
};

export default bannerApi;
