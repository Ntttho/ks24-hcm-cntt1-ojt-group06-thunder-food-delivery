package com.foodthunder.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.order.dto.cart.*;
import com.foodthunder.order.exception.ConflictException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CART_KEY_PREFIX = "foodthunder:cart:";
    private static final Duration CART_TTL = Duration.ofDays(30);

    // Fallback in-memory cache if Redis is temporarily unreachable
    private final Map<Long, CartDto> localCartFallback = new ConcurrentHashMap<>();

    private String getRedisKey(Long userId) {
        return CART_KEY_PREFIX + (userId != null ? userId : 0);
    }

    @Override
    public CartDto getCart(Long userId) {
        Long effectiveUserId = userId != null ? userId : 0L;
        String key = getRedisKey(effectiveUserId);

        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                CartDto cart = objectMapper.convertValue(cached, CartDto.class);
                cart.recalculateTotals();
                return cart;
            }
        } catch (Exception e) {
            log.warn("Lỗi khi đọc giỏ hàng từ Redis (chuyển sang local fallback): {}", e.getMessage());
            CartDto fallback = localCartFallback.get(effectiveUserId);
            if (fallback != null) {
                fallback.recalculateTotals();
                return fallback;
            }
        }

        // Trả về giỏ hàng trống mặc định
        return CartDto.builder()
                .userId(effectiveUserId)
                .items(new ArrayList<>())
                .totalQuantity(0)
                .totalAmount(java.math.BigDecimal.ZERO)
                .updatedAt(Instant.now())
                .build();
    }

    @Override
    public CartDto addItem(Long userId, AddCartItemRequest request) {
        Long effectiveUserId = userId != null ? userId : 0L;
        CartDto cart = getCart(effectiveUserId);

        // Hỗ trợ giỏ hàng đa quán (Multi-Shop Cart):
        // Không xóa món cũ của quán khác và không ném ngoại lệ xung đột quán.
        if (Boolean.TRUE.equals(request.getReplaceCart())) {
            log.info("Yêu cầu làm mới toàn bộ giỏ hàng từ quán {}", request.getShopId());
            cart.getItems().clear();
        }

        cart.setShopId(request.getShopId());
        if (request.getShopName() != null && !request.getShopName().isBlank()) {
            cart.setShopName(request.getShopName());
        }

        // Sinh ID duy nhất cho CartItem: productId + toppings
        String toppingKey = "base";
        if (request.getToppings() != null && !request.getToppings().isEmpty()) {
            toppingKey = request.getToppings().stream()
                    .map(CartItemToppingDto::getId)
                    .sorted(Comparator.naturalOrder())
                    .map(String::valueOf)
                    .collect(Collectors.joining("-"));
        }
        String cartItemId = request.getProductId() + "-" + toppingKey;

        // Tìm món đã tồn tại trong giỏ
        CartItemDto existing = cart.getItems().stream()
                .filter(item -> cartItemId.equals(item.getId()))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + request.getQuantity());
        } else {
            CartItemDto newItem = CartItemDto.builder()
                    .id(cartItemId)
                    .productId(request.getProductId())
                    .productName(request.getProductName())
                    .price(request.getPrice())
                    .quantity(request.getQuantity())
                    .imageUrl(request.getImageUrl())
                    .shopId(request.getShopId())
                    .shopName(request.getShopName())
                    .toppings(request.getToppings() != null ? new ArrayList<>(request.getToppings()) : new ArrayList<>())
                    .build();
            cart.getItems().add(newItem);
        }

        cart.recalculateTotals();
        saveCart(effectiveUserId, cart);
        return cart;
    }

    @Override
    public CartDto updateItemQuantity(Long userId, String itemId, Integer quantity) {
        Long effectiveUserId = userId != null ? userId : 0L;
        CartDto cart = getCart(effectiveUserId);

        if (quantity == null || quantity <= 0) {
            cart.getItems().removeIf(item -> itemId.equals(item.getId()));
        } else {
            for (CartItemDto item : cart.getItems()) {
                if (itemId.equals(item.getId())) {
                    item.setQuantity(quantity);
                    break;
                }
            }
        }

        if (cart.getItems().isEmpty()) {
            cart.setShopId(null);
            cart.setShopName(null);
        }

        cart.recalculateTotals();
        saveCart(effectiveUserId, cart);
        return cart;
    }

    @Override
    public CartDto removeItem(Long userId, String itemId) {
        Long effectiveUserId = userId != null ? userId : 0L;
        CartDto cart = getCart(effectiveUserId);

        cart.getItems().removeIf(item -> itemId.equals(item.getId()));
        if (cart.getItems().isEmpty()) {
            cart.setShopId(null);
            cart.setShopName(null);
        }

        cart.recalculateTotals();
        saveCart(effectiveUserId, cart);
        return cart;
    }

    @Override
    public CartDto clearCart(Long userId) {
        Long effectiveUserId = userId != null ? userId : 0L;
        CartDto emptyCart = CartDto.builder()
                .userId(effectiveUserId)
                .shopId(null)
                .shopName(null)
                .items(new ArrayList<>())
                .totalQuantity(0)
                .totalAmount(java.math.BigDecimal.ZERO)
                .updatedAt(Instant.now())
                .build();

        saveCart(effectiveUserId, emptyCart);
        return emptyCart;
    }

    @Override
    public void purgeCart(Long userId) {
        Long effectiveUserId = userId != null ? userId : 0L;
        String key = getRedisKey(effectiveUserId);
        localCartFallback.remove(effectiveUserId);
        try {
            redisTemplate.delete(key);
            log.info("Đã xóa hoàn toàn key giỏ hàng {} khỏi Redis", key);
        } catch (Exception e) {
            log.warn("Lỗi khi xóa key giỏ hàng {} khỏi Redis: {}", key, e.getMessage());
        }
    }

    @Override
    public CartDto syncCart(Long userId, SyncCartRequest request) {
        Long effectiveUserId = userId != null ? userId : 0L;
        CartDto cart = CartDto.builder()
                .userId(effectiveUserId)
                .shopId(request.getShopId())
                .shopName(request.getShopName())
                .items(request.getItems() != null ? new ArrayList<>(request.getItems()) : new ArrayList<>())
                .updatedAt(Instant.now())
                .build();

        if (cart.getItems().isEmpty()) {
            cart.setShopId(null);
            cart.setShopName(null);
        }

        cart.recalculateTotals();
        saveCart(effectiveUserId, cart);
        return cart;
    }

    private void saveCart(Long userId, CartDto cart) {
        String key = getRedisKey(userId);
        localCartFallback.put(userId, cart);

        try {
            redisTemplate.opsForValue().set(key, cart, CART_TTL);
            log.debug("Đã lưu giỏ hàng của user {} vào Redis (TTL 30 ngày)", userId);
        } catch (Exception e) {
            log.warn("Lỗi khi lưu giỏ hàng vào Redis (đã lưu tạm local fallback): {}", e.getMessage());
        }
    }
}

