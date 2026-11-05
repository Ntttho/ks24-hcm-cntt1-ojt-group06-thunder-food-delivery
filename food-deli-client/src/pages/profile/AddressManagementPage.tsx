import React, { useEffect, useState, useCallback } from 'react';
import { Button, message, Spin, Alert, Typography } from 'antd';
import { addressApi } from '@/services/modules/addressApi';
import type { UserAddress, AddressRequest } from '@/types';
import {
  AddressPageHeader,
  AddressCardItem,
  AddressEmptyState,
  AddressFormModal,
} from './components/address';

const { Text } = Typography;

export const AddressManagementPage: React.FC = () => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch all addresses for current user
  const fetchAddresses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await addressApi.getMyAddresses();
      setAddresses(response.data || []);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tải danh sách địa chỉ. Vui lòng thử lại!';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item: UserAddress) => {
    setEditingAddress(item);
    setIsModalOpen(true);
  };

  // Submit Create or Edit form
  const handleFormFinish = async (payload: AddressRequest) => {
    setIsSubmitting(true);
    try {
      if (editingAddress) {
        await addressApi.updateAddress(editingAddress.id, payload);
        message.success('Cập nhật địa chỉ thành công!');
      } else {
        await addressApi.createAddress(payload);
        message.success('Thêm mới địa chỉ nhận hàng thành công!');
      }

      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      const msg =
        err.response?.data?.message || 'Có lỗi xảy ra khi lưu địa chỉ. Vui lòng thử lại!';
      message.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Set an address as default
  const handleSetDefault = async (id: number) => {
    try {
      await addressApi.setDefaultAddress(id);
      message.success('Đã đặt địa chỉ làm mặc định thành công!');
      fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể đặt làm địa chỉ mặc định.';
      message.error(msg);
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: number) => {
    try {
      await addressApi.deleteAddress(id);
      message.success('Đã xóa địa chỉ thành công!');
      fetchAddresses();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể xóa địa chỉ. Vui lòng thử lại!';
      message.error(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 1. Page Header */}
      <AddressPageHeader
        isLoading={isLoading}
        onRefresh={fetchAddresses}
        onOpenCreateModal={handleOpenCreateModal}
      />

      {/* 2. Error Alert */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải dữ liệu"
          description={error}
          showIcon
          action={
            <Button size="small" type="primary" onClick={fetchAddresses}>
              Thử lại
            </Button>
          }
          className="rounded-xl"
        />
      )}

      {/* 3. Address List / Empty State */}
      {isLoading ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-100 flex flex-col items-center justify-center gap-3">
          <Spin size="large" />
          <Text type="secondary" className="text-sm">
            Đang tải danh sách địa chỉ nhận hàng...
          </Text>
        </div>
      ) : addresses.length === 0 ? (
        <AddressEmptyState onOpenCreateModal={handleOpenCreateModal} />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {addresses.map((item) => (
            <AddressCardItem
              key={item.id}
              item={item}
              onSetDefault={handleSetDefault}
              onOpenEditModal={handleOpenEditModal}
              onDelete={handleDeleteAddress}
            />
          ))}
        </div>
      )}

      {/* 4. Modal: Create & Edit Address */}
      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingAddress={editingAddress}
        onSubmit={handleFormFinish}
        isSubmitting={isSubmitting}
        isFirstAddress={addresses.length === 0}
      />
    </div>
  );
};

export default AddressManagementPage;
