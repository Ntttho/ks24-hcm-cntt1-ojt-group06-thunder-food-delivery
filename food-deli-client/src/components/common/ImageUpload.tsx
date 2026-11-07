import React, { useState, useRef } from 'react';
import { Button, Input, message, Spin, Tooltip, Tag } from 'antd';
import {
  UploadOutlined,
  LoadingOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleFilled,
  PictureOutlined,
  SyncOutlined,
  CloudUploadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { uploadImageToCloudinary, getOptimizedCloudinaryUrl } from '@/services/modules/cloudinaryService';

export interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  folder?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'auto';
  maxSizeMB?: number;
  disabled?: boolean;
  placeholderText?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  folder = 'foodthunder/products',
  aspectRatio = 'square',
  maxSizeMB = 5,
  disabled = false,
  placeholderText = 'Chưa chọn tệp ảnh nào. Nhấp "Duyệt ảnh từ máy" để tải lên...',
  className = '',
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showManualUrl, setShowManualUrl] = useState<boolean>(false);
  const [manualUrlInput, setManualUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClassMap = {
    square: 'aspect-square max-h-56',
    video: 'aspect-video max-h-56',
    banner: 'aspect-[21/9] max-h-48',
    auto: 'min-h-[160px] max-h-60',
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP,...)');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      message.error(`Kích thước ảnh không được vượt quá ${maxSizeMB}MB (Hiện tại: ${fileSizeMB.toFixed(1)}MB)`);
      return;
    }

    setIsUploading(true);
    const hideLoading = message.loading('Đang tải ảnh trực tiếp lên Cloudinary...', 0);

    try {
      const uploadedUrl = await uploadImageToCloudinary(file, folder);
      hideLoading();
      message.success('Tải ảnh lên Cloudinary thành công!');
      if (onChange) {
        onChange(uploadedUrl);
      }
    } catch (err: any) {
      hideLoading();
      message.error(err.message || 'Không thể tải ảnh lên, vui lòng thử lại');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isUploading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChange) {
      onChange('');
    }
  };

  const handleApplyManualUrl = () => {
    if (manualUrlInput.trim()) {
      if (onChange) {
        onChange(manualUrlInput.trim());
      }
      setManualUrlInput('');
      setShowManualUrl(false);
      message.success('Đã áp dụng liên kết ảnh!');
    }
  };

  return (
    <div className={`w-full space-y-3 ${className}`}>
      {/* Ẩn input file gốc của HTML */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || isUploading}
        onChange={handleFileInputChange}
      />

      {/* 1. THANH NHẬP LIỆU CHỌN FILE HÌNH ẢNH (FILE INPUT BAR) */}
      <div className="flex items-center gap-2">
        <Input
          value={value || ''}
          placeholder={placeholderText}
          readOnly
          prefix={<PictureOutlined className="text-orange-500 mr-1" />}
          suffix={
            value ? (
              <Tag
                color="success"
                className="m-0 font-medium text-[11px] flex items-center gap-1 border-none bg-emerald-50 text-emerald-600 rounded-md py-0.5 px-2"
              >
                <CheckCircleFilled /> Cloudinary
              </Tag>
            ) : null
          }
          className="rounded-xl bg-slate-50 border-slate-200 hover:border-orange-400 focus:border-orange-500 cursor-pointer text-xs py-2 shadow-2xs font-mono"
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        />

        <Button
          type="primary"
          icon={isUploading ? <LoadingOutlined /> : <UploadOutlined />}
          loading={isUploading}
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          className="bg-orange-500 hover:bg-orange-600 font-bold rounded-xl shrink-0 h-10 px-4 shadow-xs"
        >
          {isUploading ? 'Đang tải...' : 'Duyệt ảnh từ máy'}
        </Button>

        <Tooltip title="Dán URL thủ công nếu có sẵn">
          <Button
            icon={<LinkOutlined />}
            onClick={() => setShowManualUrl(!showManualUrl)}
            className="rounded-xl h-10 border-slate-200 text-slate-600 hover:text-orange-600 shrink-0"
          />
        </Tooltip>
      </div>

      {/* Khung dán URL thủ công nếu cần */}
      {showManualUrl && (
        <div className="flex gap-2 p-2.5 bg-orange-50/60 rounded-xl border border-orange-200/70 animate-fadeIn">
          <Input
            value={manualUrlInput}
            onChange={(e) => setManualUrlInput(e.target.value)}
            placeholder="Dán đường dẫn ảnh trực tiếp (https://...)"
            className="rounded-lg text-xs"
            onPressEnter={handleApplyManualUrl}
          />
          <Button
            type="primary"
            size="small"
            onClick={handleApplyManualUrl}
            className="bg-orange-500 hover:bg-orange-600 font-semibold rounded-lg text-xs h-8"
          >
            Áp dụng
          </Button>
          <Button
            size="small"
            onClick={() => setShowManualUrl(false)}
            className="rounded-lg text-xs h-8"
          >
            Đóng
          </Button>
        </div>
      )}

      {/* 2. KHUNG HÌNH ẢNH XEM TRƯỚC (PREVIEW THUMBNAIL & DRAG DROP ZONE) */}
      {value ? (
        // Khung hiển thị ảnh xem trước sắc nét
        <div className="relative group w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 shadow-2xs flex flex-col items-center justify-center">
          <div className={`w-full overflow-hidden flex items-center justify-center ${aspectClassMap[aspectRatio]}`}>
            <img
              src={getOptimizedCloudinaryUrl(value, 600)}
              alt="Hình ảnh xem trước"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>

          {/* Lớp phủ hành động khi hover */}
          <div className="absolute inset-0 bg-slate-950/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2.5 p-4 backdrop-blur-2xs">
            <span className="text-white text-xs font-semibold flex items-center gap-1.5 bg-black/50 px-3 py-1 rounded-full border border-white/20">
              <CheckCircleFilled className="text-emerald-400" /> Sẵn sàng lưu vào CSDL
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Tooltip title="Xem ảnh gốc (kích thước đầy đủ)">
                <Button
                  shape="circle"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(value, '_blank')}
                  className="bg-white/95 hover:bg-white text-slate-800 border-none shadow-sm"
                />
              </Tooltip>
              <Tooltip title="Chọn ảnh khác từ máy tính">
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploading}
                  className="bg-orange-500 hover:bg-orange-600 border-none font-semibold text-xs rounded-xl"
                >
                  Đổi ảnh
                </Button>
              </Tooltip>
              <Tooltip title="Xóa ảnh">
                <Button
                  shape="circle"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleRemove}
                  className="bg-white/95 hover:bg-white border-none shadow-sm"
                />
              </Tooltip>
            </div>
          </div>

          {/* Thanh chân thông tin dưới ảnh */}
          <div className="w-full px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="truncate max-w-[280px] font-mono text-[10px] text-slate-400">
              {value}
            </span>
            <span className="text-emerald-600 font-semibold shrink-0">
              Ảnh xem trước hợp lệ
            </span>
          </div>
        </div>
      ) : (
        // Khung chờ ảnh (Dropzone kéo thả file)
        <div
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-5 text-center transition-all ${
            aspectClassMap[aspectRatio]
          } ${
            isDragOver
              ? 'border-orange-500 bg-orange-50/80 scale-[0.99]'
              : 'border-slate-200 hover:border-orange-400 bg-slate-50/40 hover:bg-orange-50/20'
          } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2.5 py-4">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 34, color: '#f97316' }} spin />} />
              <span className="text-xs font-bold text-orange-600 animate-pulse">
                Đang tải tệp ảnh lên Cloudinary...
              </span>
              <span className="text-[11px] text-slate-400">
                Hệ thống đang tự động tối ưu hóa và sinh liên kết lưu trữ
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 max-w-xs py-2">
              <div className="w-11 h-11 rounded-2xl bg-orange-100/80 flex items-center justify-center text-orange-500 text-xl shadow-2xs">
                <CloudUploadOutlined />
              </div>
              <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                Khung xem trước ảnh món ăn
              </p>
              <span className="text-[11px] text-slate-400">
                Kéo thả file vào đây hoặc bấm nút <strong>"Duyệt ảnh từ máy"</strong> ở trên
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full mt-1">
                Định dạng PNG, JPG, WEBP • Tối đa {maxSizeMB}MB
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
