export const MOCK_CATEGORIES = [
  { id: 'rice', label: 'Cơm tấm', emoji: '🍚' },
  { id: 'noodles', label: 'Bún / Phở', emoji: '🍜' },
  { id: 'fastfood', label: 'Đồ ăn nhanh', emoji: '🍔' },
  { id: 'drink', label: 'Trà sữa', emoji: '🧋' },
  { id: 'healthy', label: 'Healthy', emoji: '🥗' },
  { id: 'dessert', label: 'Tráng miệng', emoji: '🍰' },
];

export const MOCK_RESTAURANTS = [
  {
    id: 'res-1',
    name: 'Cơm Tấm Sà Bì Chưởng',
    area: 'Quận 1 • 1.8 km',
    fee: '18.000đ',
    time: '20 - 25 phút',
    rating: '4.8',
    tag: 'Đối tác ưu tiên',
    img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'res-2',
    name: 'Bếp Của Mẹ - Cơm Nhà',
    area: 'Quận 3 • 2.1 km',
    fee: '15.000đ',
    time: '15 - 20 phút',
    rating: '4.7',
    tag: 'Bán chạy',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'res-3',
    name: 'Nhà Hàng Steakhouse & Wine',
    area: 'Quận 1 • 3.4 km',
    fee: '20.000đ',
    time: '20 - 25 phút',
    rating: '4.9',
    tag: 'Cao cấp',
    img: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'res-4',
    name: 'Bếp Trưởng Hải Sản',
    area: 'Quận 4 • 2.8 km',
    fee: '10.000đ',
    time: '10 - 15 phút',
    rating: '4.6',
    tag: 'Freeship gần',
    img: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'res-5',
    name: 'Quán Ăn Gia Đình Tịnh Tâm',
    area: 'Bình Thạnh • 3.0 km',
    fee: 'Miễn phí',
    time: '10 - 20 phút',
    rating: '4.5',
    tag: 'Gia đình',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'res-6',
    name: 'Phê La - Trà Ô Long',
    area: 'Quận 3 • 1.2 km',
    fee: '12.000đ',
    time: '12 - 18 phút',
    rating: '4.8',
    tag: 'Đồ uống',
    img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop',
  },
];

export const MOCK_RESTAURANT_DETAILS: Record<string, {
  address: string;
  hours: string;
  description: string;
  categories: Array<{
    id: string;
    name: string;
    items: Array<{ id: number; name: string; description: string; price: number; image: string }>;
  }>;
}> = Object.fromEntries(
  MOCK_RESTAURANTS.map((restaurant, index) => [restaurant.id, {
    address: `${90 + index * 17} Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh`,
    hours: index % 2 === 0 ? '07:00 - 22:00' : '08:00 - 23:00',
    description: `${restaurant.name} — món ngon được chế biến mỗi ngày từ nguyên liệu tuyển chọn, phục vụ nhanh và tận tâm.`,
    categories: [
      {
        id: 'popular', name: 'Món nổi bật', items: [
          { id: 101 + index * 10, name: index % 2 ? 'Cơm gà sốt đặc biệt' : 'Cơm sườn bì chả', description: 'Đậm đà, đầy đủ, kèm đồ chua và nước mắm nhà làm.', price: 65000 + index * 5000, image: restaurant.img },
          { id: 102 + index * 10, name: 'Combo trọn vị', description: 'Phần ăn lớn kèm topping và đồ uống.', price: 89000 + index * 5000, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800&auto=format&fit=crop' },
        ],
      },
      {
        id: 'main', name: 'Món chính', items: [
          { id: 103 + index * 10, name: 'Món nhà làm', description: 'Hương vị truyền thống, gia vị cân đối.', price: 55000 + index * 4000, image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?q=80&w=800&auto=format&fit=crop' },
          { id: 104 + index * 10, name: 'Đặc biệt theo ngày', description: 'Món được đầu bếp đề xuất trong ngày.', price: 79000 + index * 4000, image: 'https://images.unsplash.com/photo-1565299507177-b0ac66763828?q=80&w=800&auto=format&fit=crop' },
        ],
      },
      {
        id: 'drink', name: 'Thức uống', items: [
          { id: 105 + index * 10, name: 'Trà chanh giã tay', description: 'Chua nhẹ, thơm mát, ít đường.', price: 25000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=800&auto=format&fit=crop' },
        ],
      },
    ],
  }]),
);
