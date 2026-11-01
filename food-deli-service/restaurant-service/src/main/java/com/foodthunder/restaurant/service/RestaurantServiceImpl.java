package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Product;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {

    private final ShopRepository shopRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final ProductRepository productRepository;

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
}
