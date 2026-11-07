import { appConfig } from '@/config/appConfig';

/**
 * Interface cho kết quả upload trả về từ Cloudinary API
 */
export interface CloudinaryUploadResult {
  asset_id: string;
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  width: number;
  height: number;
  url: string;
  secure_url: string;
}

/**
 * Sinh mã băm SHA-1 bằng Web Crypto API có sẵn trên mọi trình duyệt hiện đại
 */
async function generateSha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Tải ảnh trực tiếp lên Cloudinary sử dụng Signed Upload
 *
 * @param file File ảnh cần upload từ thẻ input / drag-and-drop
 * @param folder Thư mục lưu trữ trên Cloudinary (mặc định: appConfig.cloudinary.folder)
 * @returns Đường dẫn bảo mật HTTPS (secure_url) của ảnh trên Cloudinary
 */
export async function uploadImageToCloudinary(
  file: File,
  folder?: string
): Promise<string> {
  const { cloudName, apiKey, apiSecret, folder: defaultFolder } = appConfig.cloudinary;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Chưa cấu hình đầy đủ thông tin Cloudinary (cloudName, apiKey, apiSecret).');
  }

  const targetFolder = folder || defaultFolder || 'foodthunder';
  const timestamp = Math.floor(Date.now() / 1000);

  // Tạo chuỗi ký theo chuẩn Cloudinary (các tham số xếp theo thứ tự bảng chữ cái + api_secret)
  const stringToSign = `folder=${targetFolder}&timestamp=${timestamp}${apiSecret}`;
  const signature = await generateSha1(stringToSign);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', targetFolder);
  formData.append('signature', signature);

  const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const errMsg = errorJson?.error?.message || `Lỗi tải ảnh (${response.status}: ${response.statusText})`;
      throw new Error(errMsg);
    }

    const data: CloudinaryUploadResult = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error('Lỗi upload ảnh lên Cloudinary:', error);
    throw new Error(error.message || 'Không thể tải ảnh lên máy chủ Cloudinary');
  }
}

/**
 * Tối ưu hóa URL ảnh Cloudinary: tự động định dạng (f_auto), nén ảnh (q_auto), resize
 * Đối với các URL không thuộc Cloudinary (ví dụ dữ liệu ảnh cũ hoặc ảnh ngoại bộ), giữ nguyên URL gốc.
 *
 * @param url URL gốc của ảnh
 * @param width Chiều rộng mong muốn (tùy chọn)
 * @param height Chiều cao mong muốn (tùy chọn)
 * @param crop Kiểu crop ảnh ('fill', 'fit', 'thumb', 'limit', ...)
 */
export function getOptimizedCloudinaryUrl(
  url: string | null | undefined,
  width?: number,
  height?: number,
  crop = 'fill'
): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    // Không phải ảnh Cloudinary -> Giữ nguyên để tương thích dữ liệu cũ
    return url;
  }

  const parts = ['f_auto', 'q_auto'];
  if (width) parts.push(`w_${width}`);
  if (height) parts.push(`h_${height}`);
  if (width || height) parts.push(`c_${crop}`);

  const transformation = parts.join(',');
  return url.replace('/upload/', `/upload/${transformation}/`);
}

