package com.foodthunder.order.service;

import com.foodthunder.order.dto.cart.AddCartItemRequest;
import com.foodthunder.order.dto.cart.CartDto;
import com.foodthunder.order.dto.cart.SyncCartRequest;

public interface CartService {
    CartDto getCart(Long userId);
    CartDto addItem(Long userId, AddCartItemRequest request);
    CartDto updateItemQuantity(Long userId, String itemId, Integer quantity);
    CartDto removeItem(Long userId, String itemId);
    CartDto clearCart(Long userId);
    CartDto syncCart(Long userId, SyncCartRequest request);
}

