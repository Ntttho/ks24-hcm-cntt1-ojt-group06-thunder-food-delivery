export interface ReviewItem {
  id: string | number;
  authorName: string;
  authorAvatar?: string;
  rating: number; // 1 to 5
  createdAt: string;
  content: string;
  dishesOrdered?: string[];
  images?: string[];
  likesCount?: number;
  isVerifiedBuyer?: boolean;
  restaurantReply?: {
    content: string;
    repliedAt: string;
  };
}

export type ReviewFilterType = 'ALL' | 'WITH_PHOTOS' | '5_STAR' | '4_STAR' | '3_STAR' | 'LOW_STAR';

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

