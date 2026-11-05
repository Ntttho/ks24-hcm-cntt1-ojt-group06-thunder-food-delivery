package com.foodthunder.restaurant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Product;
import com.foodthunder.restaurant.entity.RestaurantChangeRequest;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
import com.foodthunder.restaurant.repository.RestaurantChangeRequestRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {

    private final ShopRepository shopRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final ProductRepository productRepository;
    private final RestaurantChangeRequestRepository restaurantChangeRequestRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RestaurantDto> getRestaurants(String search, Integer categoryId, Boolean isOpen, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "ratingAvg").and(Sort.by("id")));
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Shop> shopPage = shopRepository.searchShops(searchParam, categoryId, isOpen, pageable);
        List<RestaurantDto> content = shopPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.<RestaurantDto>builder()
                .content(content)
                .pageNumber(shopPage.getNumber())
                .pageSize(shopPage.getSize())
                .totalElements(shopPage.getTotalElements())
                .totalPages(shopPage.getTotalPages())
                .last(shopPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantDetailDto getRestaurantDetail(Integer id) {
        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin quán ăn với ID: " + id));

        List<MenuCategory> categories = menuCategoryRepository.findByRestaurantId(id);
        List<CategoryMenuDto> categoryMenuDtos = new ArrayList<>();

        for (MenuCategory category : categories) {
            List<Product> products = productRepository.findByCategoryIdAndDeletedAtIsNull(category.getId());
            List<ProductDto> productDtos = products.stream()
                    .map(this::mapProductToDto)
                    .collect(Collectors.toList());

            categoryMenuDtos.add(CategoryMenuDto.builder()
                    .id(category.getId())
                    .name(category.getName())
                    .products(productDtos)
                    .build());
        }

        return RestaurantDetailDto.builder()
                .id(shop.getId())
                .ownerId(shop.getOwnerId())
                .name(shop.getName())
                .address(shop.getAddress())
                .latitude(shop.getLatitude())
                .longitude(shop.getLongitude())
                .openingTime(shop.getOpeningTime())
                .closingTime(shop.getClosingTime())
                .isOpen(shop.getIsOpen())
                .isOpenToday(shop.getIsOpenToday())
                .temporaryClosedReason(shop.getTemporaryClosedReason())
                .imageUrl(shop.getImageUrl())
                .ratingAvg(shop.getRatingAvg())
                .approvalStatus(shop.getApprovalStatus())
                .categories(categoryMenuDtos)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantDto> getRestaurantsByOwner(Integer ownerId) {
        return shopRepository.findByOwnerIdAndDeletedAtIsNull(ownerId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public RestaurantDto createRestaurant(CreateRestaurantRequest request, Integer ownerId) {
        LocalTime opening = request.getOpeningTime() != null ? request.getOpeningTime() : LocalTime.of(7, 0);
        LocalTime closing = request.getClosingTime() != null ? request.getClosingTime() : LocalTime.of(22, 0);
        Double lat = request.getLatitude() != null ? request.getLatitude() : 10.7769;
        Double lng = request.getLongitude() != null ? request.getLongitude() : 106.7009;
        String img = (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty())
                ? request.getImageUrl().trim()
                : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60";

        Shop shop = Shop.builder()
                .ownerId(ownerId != null ? ownerId : 3)
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .latitude(lat)
                .longitude(lng)
                .openingTime(opening)
                .closingTime(closing)
                .isOpen(true)
                .isOpenToday(true)
                .imageUrl(img)
                .ratingAvg(BigDecimal.valueOf(5.00))
                .approvalStatus("APPROVED")
                .approvedAt(LocalDateTime.now())
                .build();

        Shop savedShop = shopRepository.save(shop);

        // Auto-create initial default category
        String categoryName = (request.getInitialCategoryName() != null && !request.getInitialCategoryName().trim().isEmpty())
                ? request.getInitialCategoryName().trim()
                : "Món chính";

        MenuCategory defaultCategory = MenuCategory.builder()
                .restaurant(savedShop)
                .name(categoryName)
                .build();
        menuCategoryRepository.save(defaultCategory);

        return mapToDto(savedShop);
    }

    @Override
    @Transactional
    public RestaurantDto updateRestaurantDetails(Integer id, CreateRestaurantRequest request, Integer ownerId) {
        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + id));

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            shop.setName(request.getName().trim());
        }
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            shop.setAddress(request.getAddress().trim());
        }
        if (request.getLatitude() != null) {
            shop.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            shop.setLongitude(request.getLongitude());
        }
        if (request.getOpeningTime() != null) {
            shop.setOpeningTime(request.getOpeningTime());
        }
        if (request.getClosingTime() != null) {
            shop.setClosingTime(request.getClosingTime());
        }
        if (request.getImageUrl() != null && !request.getImageUrl().trim().isEmpty()) {
            shop.setImageUrl(request.getImageUrl().trim());
        }

        Shop updated = shopRepository.save(shop);

        // Lưu thông tin vào bảng restaurant_change_requests an toàn
        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("name", updated.getName());
        payloadMap.put("address", updated.getAddress());
        payloadMap.put("ownerId", updated.getOwnerId());
        payloadMap.put("imageUrl", updated.getImageUrl());
        payloadMap.put("latitude", updated.getLatitude());
        payloadMap.put("longitude", updated.getLongitude());
        payloadMap.put("openingTime", updated.getOpeningTime() != null ? updated.getOpeningTime().toString() : "07:00:00");
        payloadMap.put("closingTime", updated.getClosingTime() != null ? updated.getClosingTime().toString() : "22:00:00");
        payloadMap.put("ratingAvg", updated.getRatingAvg());

        saveChangeRequestSafely(updated.getId(), ownerId != null ? ownerId : updated.getOwnerId(), "PENDING", payloadMap);

        return mapToDto(updated);
    }

    @Override
    @Transactional
    public RestaurantDto updateShopStatus(Integer id, Boolean isOpen, String temporaryClosedReason) {
        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + id));

        if (isOpen != null) {
            shop.setIsOpen(isOpen);
        }
        if (temporaryClosedReason != null) {
            shop.setTemporaryClosedReason(temporaryClosedReason);
        }
        Shop updated = shopRepository.save(shop);
        return mapToDto(updated);
    }

    private RestaurantDto mapToDto(Shop shop) {
        return RestaurantDto.builder()
                .id(shop.getId())
                .ownerId(shop.getOwnerId())
                .name(shop.getName())
                .address(shop.getAddress())
                .latitude(shop.getLatitude())
                .longitude(shop.getLongitude())
                .openingTime(shop.getOpeningTime())
                .closingTime(shop.getClosingTime())
                .isOpen(shop.getIsOpen())
                .isOpenToday(shop.getIsOpenToday())
                .temporaryClosedReason(shop.getTemporaryClosedReason())
                .imageUrl(shop.getImageUrl())
                .ratingAvg(shop.getRatingAvg())
                .approvalStatus(shop.getApprovalStatus())
                .build();
    }

    private ProductDto mapProductToDto(Product product) {
        return ProductDto.builder()
                .id(product.getId())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .name(product.getName())
                .price(product.getPrice())
                .isAvailable(product.getIsAvailable())
                .defaultQuantity(product.getDefaultQuantity())
                .currentQuantity(product.getCurrentQuantity())
                .imageUrl(product.getImageUrl())
                .build();
    }

    private void saveChangeRequestSafely(Integer restaurantId, Integer requestedBy, String status, Map<String, Object> payloadMap) {
        try {
            String payloadJson = objectMapper.writeValueAsString(payloadMap);
            RestaurantChangeRequest changeRequest = RestaurantChangeRequest.builder()
                    .restaurantId(restaurantId)
                    .requestedBy(requestedBy != null ? requestedBy : 3)
                    .payload(payloadJson)
                    .status(status)
                    .build();
            restaurantChangeRequestRepository.save(changeRequest);
        } catch (Exception e) {
            log.warn("Lỗi khi ghi nhận restaurant_change_requests: {}", e.getMessage());
        }
    }
}
