package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.ProductDetailDto;
import com.foodthunder.restaurant.dto.ProductDto;
import com.foodthunder.restaurant.dto.ProductRequestDto;

import java.util.List;

public interface ProductService {

    ProductDetailDto getProductDetail(Integer id);

    List<ProductDto> getProductsByRestaurant(Integer restaurantId);

    ProductDto createProduct(ProductRequestDto request);

    ProductDto updateProduct(Integer id, ProductRequestDto request);

    void deleteProduct(Integer id);

    ProductDto updateProductStatus(Integer id, Boolean isAvailable);
}
