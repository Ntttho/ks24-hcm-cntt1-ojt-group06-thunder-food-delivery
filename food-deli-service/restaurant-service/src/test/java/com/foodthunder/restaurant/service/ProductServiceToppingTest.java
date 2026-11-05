package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.ToppingDto;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Product;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.entity.Topping;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
import com.foodthunder.restaurant.repository.ToppingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceToppingTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private MenuCategoryRepository menuCategoryRepository;

    @Mock
    private ToppingRepository toppingRepository;

    @InjectMocks
    private ProductServiceImpl productService;

    private Shop shop;
    private MenuCategory category;
    private Product product;
    private Topping topping1;
    private Topping topping2;

    @BeforeEach
    void setUp() {
        shop = Shop.builder()
                .id(1)
                .ownerId(3)
                .name("Quán Ăn Hạnh Dung")
                .build();

        category = MenuCategory.builder()
                .id(1)
                .restaurant(shop)
                .name("Cơm trưa")
                .build();

        product = Product.builder()
                .id(10)
                .category(category)
                .name("Cơm gà xối mỡ")
                .price(BigDecimal.valueOf(45000))
                .isAvailable(true)
                .toppings(new HashSet<>())
                .build();

        topping1 = Topping.builder()
                .id(1)
                .restaurantId(1)
                .name("Thêm trứng ốp la")
                .price(BigDecimal.valueOf(5000))
                .isAvailable(true)
                .build();

        topping2 = Topping.builder()
                .id(2)
                .restaurantId(1)
                .name("Thêm canh rong biển")
                .price(BigDecimal.valueOf(10000))
                .isAvailable(true)
                .build();
    }

    @Test
    @DisplayName("Gán topping cho món ăn thành công khi topping cùng quán")
    void assignToppingsToProduct_success() {
        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product));
        when(toppingRepository.findAllById(List.of(1, 2))).thenReturn(List.of(topping1, topping2));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        List<ToppingDto> result = productService.assignToppingsToProduct(10, List.of(1, 2), 3, "ROLE_MERCHANT");

        assertThat(result).hasSize(2);
        assertThat(product.getToppings()).contains(topping1, topping2);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("Ném BadRequestException khi có topping thuộc quán khác")
    void assignToppingsToProduct_differentRestaurant_throwsBadRequest() {
        Topping otherShopTopping = Topping.builder()
                .id(99)
                .restaurantId(2) // Belongs to restaurant 2, while product is in restaurant 1
                .name("Trân châu đen quán 2")
                .price(BigDecimal.valueOf(5000))
                .isAvailable(true)
                .build();

        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product));
        when(toppingRepository.findAllById(List.of(1, 99))).thenReturn(List.of(topping1, otherShopTopping));

        assertThatThrownBy(() -> productService.assignToppingsToProduct(10, List.of(1, 99), 3, "ROLE_MERCHANT"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("không thuộc về quán ăn ID: 1");
    }

    @Test
    @DisplayName("Ném ForbiddenException khi chủ quán khác cố gắng gán topping cho món không phải của mình")
    void assignToppingsToProduct_notOwner_throwsForbidden() {
        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product)); // Shop owner is 3

        assertThatThrownBy(() -> productService.assignToppingsToProduct(10, List.of(1), 999, "ROLE_MERCHANT")) // Requester is 999
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Bạn không có quyền quản lý món ăn của quán khác");
    }

    @Test
    @DisplayName("Lấy danh sách topping của món ăn chỉ trả về các topping đang khả dụng (isAvailable = true)")
    void getProductToppings_onlyAvailable() {
        Topping inactiveTopping = Topping.builder()
                .id(3)
                .restaurantId(1)
                .name("Topping hết hàng")
                .price(BigDecimal.valueOf(5000))
                .isAvailable(false)
                .build();

        product.setToppings(new HashSet<>(List.of(topping1, topping2, inactiveTopping)));
        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product));

        List<ToppingDto> toppings = productService.getProductToppings(10);

        assertThat(toppings).hasSize(2);
        assertThat(toppings).extracting(ToppingDto::getId).containsExactly(1, 2);
    }

    @Test
    @DisplayName("Khách xem chi tiết món ăn chỉ hiển thị đúng các topping đã được quán cấu hình cho món")
    void getProductDetail_withConfiguredToppings_returnsOnlyConfiguredToppings() {
        product.setToppings(new HashSet<>(List.of(topping1, topping2)));
        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product));

        var detail = productService.getProductDetail(10);

        assertThat(detail).isNotNull();
        assertThat(detail.getToppings()).hasSize(2);
        assertThat(detail.getToppings()).extracting(ToppingDto::getId).containsExactlyInAnyOrder(1, 2);
        verify(toppingRepository, never()).findByRestaurantIdAndIsAvailableTrue(any());
    }

    @Test
    @DisplayName("Khách xem chi tiết món ăn KHÔNG có topping cấu hình trả về danh sách rỗng, không tự động fallback lấy toàn bộ topping quán")
    void getProductDetail_withoutToppings_returnsEmptyList_notFallbackToRestaurantToppings() {
        product.setToppings(new HashSet<>());
        when(productRepository.findByIdAndDeletedAtIsNull(10)).thenReturn(Optional.of(product));

        var detail = productService.getProductDetail(10);

        assertThat(detail).isNotNull();
        assertThat(detail.getToppings()).isEmpty();
        assertThat(detail.getToppingGroups()).isEmpty();
        verify(toppingRepository, never()).findByRestaurantIdAndIsAvailableTrue(any());
    }
}