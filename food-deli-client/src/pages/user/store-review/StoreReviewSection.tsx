import React, { useState, useMemo } from 'react';
import { Empty } from 'antd';
import {
  ReviewScoreOverview,
  ReviewFilterTabs,
  ReviewCardItem,
  ReviewWriteModal,
} from './components';
import type { ReviewItem, ReviewFilterType, ReviewStats } from './types';

const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    authorName: 'Nguyễn Hoàng Long',
    authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    rating: 5,
    createdAt: 'Hôm qua lúc 12:45',
    isVerifiedBuyer: true,
    content:
      'Cơm sườn ngon xuất sắc! Miếng sườn to bản, ướp đậm đà vừa miệng, nướng than hoa không bị khô. Canh khổ qua thanh mát giải ngấy cực tốt. Đồ ăn đóng gói trong hộp giấy giữ nhiệt rất chuyên nghiệp.',
    dishesOrdered: ['Cơm Tấm Sườn Bì Chả Đặc Biệt', 'Canh Khổ Qua Nhồi Thịt'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAIqfTI5s8Q8ASaoe0eenWqww4cUBT5Qndph9kSGOPYbs1F1lc3YSgyIp98tLIRpxAgVziH2jroEu4J3Lm7sSxvt_ZYhlJ-5cAO7yFUGC0B-zfUsVSOEQJgLrBcPS-2JM4UJWXfKrWnqYhSgqDZ0SKVb1PkH5MqQFKI-umi-MtJpVS2KNDAzQWnfvmP968_J5KRwMh_yLu3icf_iU7IHTDx3wnoXLLF2CLwt08eOsO6uO1-Vu4Km2lyEg',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD5xddBWdavFNppRvgJfZ-98sSI-55_jOOTZ78Qypan6fiv63Malq-00eOk0ly36_G0fH7UuQbgBjaEijPgHIbCMNa57oRbWN8ELerPyOl-5ZtOn02rkIIaFPKLIuX-bbdIh51ICzw7yby5ewLv35H3_pFwpatAvydIXHcgyTtU3cn7vYgJsz2OOnAf7JbL8x-Irk3JkkVZOCF1TOL8TsCgRLcZG_WLb0ULMgL1dsj1Pqq9UiL5EfI59w',
    ],
    restaurantReply: {
      content:
        'Dạ Cơm Tấm Sà Bì Chưởng xin chân thành cảm ơn anh Long đã yêu thích hương vị quán ạ! Quán luôn nỗ lực giữ chuẩn chất lượng để phục vụ quý khách tốt nhất!',
      repliedAt: 'Hôm qua lúc 13:10',
    },
  },
  {
    id: 'rev-2',
    authorName: 'Trần Thị Thu Hà',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    rating: 5,
    createdAt: '3 ngày trước',
    isVerifiedBuyer: true,
    content:
      'Giao hàng nhanh trong 18 phút, tài xế giao còn bốc khói nghi ngút. Trà tắc xí muội ly khổng lồ uống mát lạnh đã khát. Sẽ tiếp tục ủng hộ quán dài lâu!',
    dishesOrdered: ['Trà Tắc Xí Muội Khổng Lồ', 'Cơm Tấm Sườn Cốt Lết Nướng'],
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCtdW3utsF1II3NyfRaQbJ4PCJ1N_IIX1n6T3Idti3hHUbMj8r9J8C0j1BHIlAwTtA8wZxkcjJBkTLUSHMJuEDUCC2VpLRfpL8-E_ljpLGxa9sPki6e8NjNHXkMvZdBNtXNdRmgAN0hKX_Ooo-1hZtBQBexu6fdcTEZQjG317qYrBr3M1oB_CwlCNtQ2UdMy1VtkPue4bj7_wl_WxJm0yFDSxErzlcXS5eJPaQL4FS5tBY5d10FjFdQYw',
    ],
  },
  {
    id: 'rev-3',
    authorName: 'Lê Văn Minh',
    rating: 4,
    createdAt: '5 ngày trước',
    isVerifiedBuyer: true,
    content:
      'Món ăn ngon, sườn mềm dễ ăn. Nước mắm pha kẹo kẹo rất hợp gu. Điểm trừ nhỏ là quán quên cho thêm ớt tươi như mình note, mong quán để ý hơn lần sau.',
    dishesOrdered: ['Cơm Tấm Sườn Bì Chả Đặc Biệt'],
  },
  {
    id: 'rev-4',
    authorName: 'Phạm Bảo Ngọc',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
    rating: 5,
    createdAt: '1 tuần trước',
    isVerifiedBuyer: true,
    content:
      'Chả trứng hấp xốp mịn, thơm hạt tiêu. Tép mỡ giòn rụm không bị hôi dầu. Đóng gói rất sạch sẽ và chỉn chu.',
    dishesOrdered: ['Chả Trứng Hấp Thêm', 'Canh Rong Biển Thịt Bằm'],
  },
];

interface StoreReviewSectionProps {
  shopId: number | string;
  shopName: string;
  rating?: number;
  reviewCount?: number;
}

export const StoreReviewSection: React.FC<StoreReviewSectionProps> = ({
  shopName,
  rating = 4.8,
  reviewCount = 384,
}) => {
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState<ReviewFilterType>('ALL');
  const [isWriteModalOpen, setIsWriteModalOpen] = useState<boolean>(false);

  const stats: ReviewStats = {
    averageRating: rating,
    totalReviews: reviewCount,
    ratingDistribution: {
      5: 312,
      4: 52,
      3: 14,
      2: 4,
      1: 2,
    },
  };

  const counts = {
    all: reviews.length,
    withPhotos: reviews.filter((r) => r.images && r.images.length > 0).length,
    star5: reviews.filter((r) => r.rating === 5).length,
    star4: reviews.filter((r) => r.rating === 4).length,
    star3: reviews.filter((r) => r.rating === 3).length,
    lowStar: reviews.filter((r) => r.rating <= 2).length,
  };

  const filteredReviews = useMemo(() => {
    switch (filter) {
      case 'WITH_PHOTOS':
        return reviews.filter((r) => r.images && r.images.length > 0);
      case '5_STAR':
        return reviews.filter((r) => r.rating === 5);
      case '4_STAR':
        return reviews.filter((r) => r.rating === 4);
      case '3_STAR':
        return reviews.filter((r) => r.rating === 3);
      case 'LOW_STAR':
        return reviews.filter((r) => r.rating <= 2);
      default:
        return reviews;
    }
  }, [reviews, filter]);

  const handleAddReview = (newReviewData: { rating: number; content: string; images: string[] }) => {
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      authorName: 'Bạn (Người dùng Thunder)',
      rating: newReviewData.rating,
      createdAt: 'Vừa xong',
      isVerifiedBuyer: true,
      content: newReviewData.content,
      images: newReviewData.images.length > 0 ? newReviewData.images : undefined,
    };
    setReviews((prev) => [newRev, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* 1. Score Breakdown Banner */}
      <ReviewScoreOverview
        stats={stats}
        onOpenWriteReview={() => setIsWriteModalOpen(true)}
      />

      {/* 2. Filter Tabs */}
      <ReviewFilterTabs
        currentFilter={filter}
        onChangeFilter={setFilter}
        counts={counts}
      />

      {/* 3. Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((rev) => (
          <ReviewCardItem key={rev.id} review={rev} />
        ))}

        {filteredReviews.length === 0 && (
          <div className="py-12 bg-white rounded-2xl border border-gray-100 text-center">
            <Empty description="Không có đánh giá nào phù hợp với bộ lọc này" />
          </div>
        )}
      </div>

      {/* 4. Write Review Modal */}
      <ReviewWriteModal
        isOpen={isWriteModalOpen}
        onClose={() => setIsWriteModalOpen(false)}
        shopName={shopName}
        onSubmitReview={handleAddReview}
      />
    </div>
  );
};

export default StoreReviewSection;

