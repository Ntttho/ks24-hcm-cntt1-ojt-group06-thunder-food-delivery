package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.*;
import com.foodthunder.restaurant.entity.MenuCategory;
import com.foodthunder.restaurant.entity.Product;
import com.foodthunder.restaurant.entity.Topping;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.MenuCategoryRepository;
import com.foodthunder.restaurant.repository.ProductRepository;
import com.foodthunder.restaurant.repository.ToppingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final MenuCategoryRepository menuCategoryRepository;
    private final ToppingRepository toppingRepository;

    @Override
    @Transactional(readOnly = true)
    public ProductDetailDto getProductDetail(Integer id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));

        MenuCategory category = product.getCategory();
        Integer restaurantId = (category != null && category.getRestaurant() != null)
                ? category.getRestaurant().getId()
                : null;
        String restaurantName = (category != null && category.getRestaurant() != null)
                ? category.getRestaurant().getName()
                : null;

        // Collect product toppings, or fallback to restaurant's available toppings
        Set<Topping> toppingsSet = product.getToppings();
        List<ToppingDto> allToppings = new ArrayList<>();

        if (toppingsSet != null && !toppingsSet.isEmpty()) {
            allToppings = toppingsSet.stream()
                    .filter(t -> Boolean.TRUE.equals(t.getIsAvailable()))
                    .map(this::mapToppingToDto)
                    .collect(Collectors.toList());
        } else if (restaurantId != null) {
            allToppings = toppingRepository.findByRestaurantIdAndIsAvailableTrue(restaurantId).stream()
                    .map(this::mapToppingToDto)
                    .collect(Collectors.toList());
        }

        // Build topping groups (Mandatory vs Optional)
        List<ToppingGroupDto> groups = new ArrayList<>();
        if (!allToppings.isEmpty()) {
            // Group 1: Topping thêm (Tùy chọn)
            groups.add(ToppingGroupDto.builder()
                    .groupName("Topping thêm (Tùy chọn)")
                    .required(false)
                    .minSelection(0)
                    .maxSelection(allToppings.size())
                    .toppings(allToppings)
                    .build());
        }

        return ProductDetailDto.builder()
                .id(product.getId())
                .categoryId(category != null ? category.getId() : null)
                .categoryName(category != null ? category.getName() : null)
                .restaurantId(restaurantId)
                .restaurantName(restaurantName)
                .name(product.getName())
                .price(product.getPrice())
                .isAvailable(product.getIsAvailable())
                .defaultQuantity(product.getDefaultQuantity())
                .currentQuantity(product.getCurrentQuantity())
                .imageUrl(product.getImageUrl())
                .toppingGroups(groups)
                .toppings(allToppings)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductDto> getProductsByRestaurant(Integer restaurantId) {
        return productRepository.findByCategoryRestaurantIdAndDeletedAtIsNull(restaurantId).stream()
                .map(this::mapProductToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ProductDto createProduct(ProductRequestDto request) {
        MenuCategory category = menuCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục thực đơn ID: " + request.getCategoryId()));

        Set<Topping> toppings = new HashSet<>();
        if (request.getToppingIds() != null && !request.getToppingIds().isEmpty()) {
            toppings.addAll(toppingRepository.findAllById(request.getToppingIds()));
        }

        Product product = Product.builder()
                .category(category)
                .name(request.getName().trim())
                .price(request.getPrice())
                .imageUrl(request.getImageUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .defaultQuantity(request.getDefaultQuantity() != null ? request.getDefaultQuantity() : 50)
                .currentQuantity(request.getDefaultQuantity() != null ? request.getDefaultQuantity() : 50)
                .toppings(toppings)
                .build();

        Product saved = productRepository.save(product);
        return mapProductToDto(saved);
    }

    @Override
    @Transactional
    public ProductDto updateProduct(Integer id, ProductRequestDto request) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));

        if (!product.getCategory().getId().equals(request.getCategoryId())) {
            MenuCategory newCategory = menuCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục thực đơn ID: " + request.getCategoryId()));
            product.setCategory(newCategory);
        }

        product.setName(request.getName().trim());
        product.setPrice(request.getPrice());
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getIsAvailable() != null) {
            product.setIsAvailable(request.getIsAvailable());
        }
        if (request.getDefaultQuantity() != null) {
            product.setDefaultQuantity(request.getDefaultQuantity());
        }

        if (request.getToppingIds() != null) {
            Set<Topping> toppings = new HashSet<>(toppingRepository.findAllById(request.getToppingIds()));
            product.setToppings(toppings);
        }

        Product updated = productRepository.save(product);
        return mapProductToDto(updated);
    }

    @Override
    @Transactional
    public void deleteProduct(Integer id) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
    }

    @Override
    @Transactional
    public ProductDto updateProductStatus(Integer id, Boolean isAvailable) {
        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy món ăn với ID: " + id));
        product.setIsAvailable(isAvailable);
        Product updated = productRepository.save(product);
        return mapProductToDto(updated);
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

    private ToppingDto mapToppingToDto(Topping topping) {
        return ToppingDto.builder()
                .id(topping.getId())
                .restaurantId(topping.getRestaurantId())
                .name(topping.getName())
                .price(topping.getPrice())
                .isAvailable(topping.getIsAvailable())
                .build();
    }
}
