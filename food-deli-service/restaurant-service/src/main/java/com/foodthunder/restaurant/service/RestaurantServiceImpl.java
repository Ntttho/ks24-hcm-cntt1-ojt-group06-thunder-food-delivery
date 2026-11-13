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
    @Transactional(readOnly = true)
    public PageResponse<RestaurantDto> getRestaurantsByOwnerPaged(Integer ownerId, String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        String searchParam = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Page<Shop> shopPage = shopRepository.searchShopsByOwner(ownerId, searchParam, pageable);
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

    @Override
    @Transactional
    public RestaurantDto updateRating(Integer id, BigDecimal ratingAvg) {
        if (ratingAvg == null || ratingAvg.compareTo(BigDecimal.ZERO) < 0
                || ratingAvg.compareTo(BigDecimal.valueOf(5)) > 0) {
            throw new com.foodthunder.restaurant.exception.BadRequestException("Điểm đánh giá phải nằm trong khoảng 0 đến 5");
        }

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + id));
        shop.setRatingAvg(ratingAvg.setScale(2, java.math.RoundingMode.HALF_UP));
        return mapToDto(shopRepository.save(shop));
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
                .description(product.getDescription())
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

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantChangeRequestDto> getChangeRequests(String status) {
        List<RestaurantChangeRequest> list;
        if (status != null && !status.trim().isEmpty() && !"ALL".equalsIgnoreCase(status.trim())) {
            list = restaurantChangeRequestRepository.findByStatusOrderByCreatedAtDesc(status.trim().toUpperCase());
        } else {
            list = restaurantChangeRequestRepository.findAllByOrderByCreatedAtDesc();
        }
        return list.stream()
                .map(this::mapToChangeRequestDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantChangeRequestDto getChangeRequestById(Integer id) {
        RestaurantChangeRequest req = restaurantChangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thay đổi với ID: " + id));
        return mapToChangeRequestDto(req);
    }

    @Override
    @Transactional
    public RestaurantChangeRequestDto approveChangeRequest(Integer id, Integer adminId) {
        RestaurantChangeRequest req = restaurantChangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thay đổi với ID: " + id));

        req.setStatus("APPROVED");
        req.setReviewedBy(adminId != null ? adminId : 1);
        req.setReviewedAt(LocalDateTime.now());
        req.setRejectReason(null);
        RestaurantChangeRequest saved = restaurantChangeRequestRepository.save(req);

        // Apply changes to Shop
        shopRepository.findById(req.getRestaurantId()).ifPresent(shop -> {
            shop.setApprovalStatus("APPROVED");
            shop.setApprovedBy(adminId != null ? adminId : 1);
            shop.setApprovedAt(LocalDateTime.now());
            shop.setRejectReason(null);

            try {
                if (req.getPayload() != null && !req.getPayload().isBlank()) {
                    Map<?, ?> data = objectMapper.readValue(req.getPayload(), Map.class);
                    if (data.containsKey("name") && data.get("name") != null) {
                        shop.setName(String.valueOf(data.get("name")));
                    }
                    if (data.containsKey("address") && data.get("address") != null) {
                        shop.setAddress(String.valueOf(data.get("address")));
                    }
                    if (data.containsKey("imageUrl") && data.get("imageUrl") != null) {
                        shop.setImageUrl(String.valueOf(data.get("imageUrl")));
                    }
                    if (data.containsKey("latitude") && data.get("latitude") != null) {
                        shop.setLatitude(Double.valueOf(String.valueOf(data.get("latitude"))));
                    }
                    if (data.containsKey("longitude") && data.get("longitude") != null) {
                        shop.setLongitude(Double.valueOf(String.valueOf(data.get("longitude"))));
                    }
                }
            } catch (Exception e) {
                log.warn("Không thể parse payload khi phê duyệt shop: {}", e.getMessage());
            }

            shopRepository.save(shop);
        });

        return mapToChangeRequestDto(saved);
    }

    @Override
    @Transactional
    public RestaurantChangeRequestDto rejectChangeRequest(Integer id, Integer adminId, String rejectReason) {
        RestaurantChangeRequest req = restaurantChangeRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu thay đổi với ID: " + id));

        req.setStatus("REJECTED");
        req.setReviewedBy(adminId != null ? adminId : 1);
        req.setReviewedAt(LocalDateTime.now());
        req.setRejectReason(rejectReason != null ? rejectReason : "Hồ sơ không đáp ứng tiêu chuẩn sàn");
        RestaurantChangeRequest saved = restaurantChangeRequestRepository.save(req);

        shopRepository.findById(req.getRestaurantId()).ifPresent(shop -> {
            shop.setApprovalStatus("REJECTED");
            shop.setRejectReason(rejectReason);
            shopRepository.save(shop);
        });

        return mapToChangeRequestDto(saved);
    }

    private RestaurantChangeRequestDto mapToChangeRequestDto(RestaurantChangeRequest req) {
        Map<String, Object> payloadData = null;
        String restaurantName = null;
        if (req.getPayload() != null && !req.getPayload().isBlank()) {
            try {
                payloadData = objectMapper.readValue(req.getPayload(), Map.class);
                if (payloadData != null && payloadData.containsKey("name")) {
                    restaurantName = String.valueOf(payloadData.get("name"));
                }
            } catch (Exception ignored) {}
        }

        if (restaurantName == null && req.getRestaurantId() != null) {
            restaurantName = shopRepository.findById(req.getRestaurantId())
                    .map(Shop::getName)
                    .orElse("Quán ăn #" + req.getRestaurantId());
        }

        return RestaurantChangeRequestDto.builder()
                .id(req.getId())
                .restaurantId(req.getRestaurantId())
                .restaurantName(restaurantName)
                .requestedBy(req.getRequestedBy())
                .payload(req.getPayload())
                .payloadData(payloadData)
                .status(req.getStatus())
                .reviewedBy(req.getReviewedBy())
                .reviewedAt(req.getReviewedAt())
                .rejectReason(req.getRejectReason())
                .createdAt(req.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantStatsSummaryDto getStatsSummary() {
        long totalRestaurants = shopRepository.countByDeletedAtIsNull();
        long totalFoodItems = productRepository.countByDeletedAtIsNull();
        return RestaurantStatsSummaryDto.builder()
                .totalRestaurants(totalRestaurants)
                .totalFoodItems(totalFoodItems)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RestaurantAnalyticsCountsDto getAnalyticsCounts() {
        long activeRestaurants = shopRepository.countByDeletedAtIsNullAndApprovalStatus("APPROVED");
        long activeFoodItems = productRepository.countActiveFoodItems();
        return RestaurantAnalyticsCountsDto.builder()
                .totalRestaurantsCount(activeRestaurants)
                .totalFoodItemsCount(activeFoodItems)
                .build();
    }
}
