package com.foodthunder.restaurant.service;

import com.foodthunder.restaurant.dto.CreateToppingRequest;
import com.foodthunder.restaurant.dto.ToppingDto;
import com.foodthunder.restaurant.dto.ToppingGroupDto;
import com.foodthunder.restaurant.dto.UpdateToppingRequest;
import com.foodthunder.restaurant.entity.Shop;
import com.foodthunder.restaurant.entity.Topping;
import com.foodthunder.restaurant.exception.BadRequestException;
import com.foodthunder.restaurant.exception.ConflictException;
import com.foodthunder.restaurant.exception.ForbiddenException;
import com.foodthunder.restaurant.exception.ResourceNotFoundException;
import com.foodthunder.restaurant.repository.ProductToppingRepository;
import com.foodthunder.restaurant.repository.ShopRepository;
import com.foodthunder.restaurant.repository.ToppingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ToppingServiceImpl implements ToppingService {

    private final ToppingRepository toppingRepository;
    private final ShopRepository shopRepository;
    private final ProductToppingRepository productToppingRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ToppingDto> getToppingsByRestaurant(Integer restaurantId, String groupName) {
        List<Topping> toppings;
        if (groupName != null && !groupName.isBlank()) {
            toppings = toppingRepository.findByRestaurantIdAndGroupName(restaurantId, groupName.trim());
        } else {
            toppings = toppingRepository.findByRestaurantId(restaurantId);
        }

        return toppings.stream()
                .map(this::mapToDto)
                .sorted(Comparator.comparing(ToppingDto::getGroupName, Comparator.nullsLast(String::compareTo))
                        .thenComparing(ToppingDto::getPrice)
                        .thenComparing(ToppingDto::getName))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ToppingGroupDto> getToppingGroupsByRestaurant(Integer restaurantId) {
        List<Topping> toppings = toppingRepository.findByRestaurantId(restaurantId);
        return buildToppingGroups(toppings);
    }

    @Override
    @Transactional(readOnly = true)
    public ToppingDto getToppingById(Integer id) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy topping với ID: " + id));
        return mapToDto(topping);
    }

    @Override
    @Transactional
    public ToppingDto createTopping(CreateToppingRequest request, Integer ownerId, String role) {
        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(request.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + request.getRestaurantId()));

        verifyOwnership(shop, ownerId, role);

        String trimmedName = request.getName().trim();
        if (toppingRepository.existsByRestaurantIdAndNameIgnoreCase(request.getRestaurantId(), trimmedName)) {
            throw new ConflictException("Tên topping '" + trimmedName + "' đã tồn tại trong thực đơn của quán");
        }

        String groupName = (request.getGroupName() != null && !request.getGroupName().isBlank())
                ? request.getGroupName().trim()
                : "Topping thêm";

        Topping topping = Topping.builder()
                .restaurantId(request.getRestaurantId())
                .groupName(groupName)
                .name(trimmedName)
                .price(request.getPrice())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        Topping saved = toppingRepository.save(topping);
        log.info("Tạo mới Topping thành công: ID={}, Name={}, Price={}, Group={}", saved.getId(), saved.getName(), saved.getPrice(), saved.getGroupName());
        return mapToDto(saved);
    }

    @Override
    @Transactional
    public ToppingDto updateTopping(Integer id, UpdateToppingRequest request, Integer ownerId, String role) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy topping với ID: " + id));

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(topping.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + topping.getRestaurantId()));

        verifyOwnership(shop, ownerId, role);

        if (request.getName() != null && !request.getName().isBlank()) {
            String trimmedName = request.getName().trim();
            if (toppingRepository.existsByRestaurantIdAndNameIgnoreCaseAndIdNot(topping.getRestaurantId(), trimmedName, id)) {
                throw new ConflictException("Tên topping '" + trimmedName + "' đã được sử dụng cho topping khác trong quán");
            }
            topping.setName(trimmedName);
        }

        if (request.getGroupName() != null && !request.getGroupName().isBlank()) {
            topping.setGroupName(request.getGroupName().trim());
        }

        if (request.getPrice() != null) {
            topping.setPrice(request.getPrice());
        }

        if (request.getIsAvailable() != null) {
            topping.setIsAvailable(request.getIsAvailable());
        }

        Topping updated = toppingRepository.save(topping);
        log.info("Cập nhật Topping thành công: ID={}, Name={}, Price={}", updated.getId(), updated.getName(), updated.getPrice());
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public ToppingDto updateToppingStatus(Integer id, Boolean isAvailable, Integer ownerId, String role) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy topping với ID: " + id));

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(topping.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + topping.getRestaurantId()));

        verifyOwnership(shop, ownerId, role);

        topping.setIsAvailable(Boolean.TRUE.equals(isAvailable));
        Topping updated = toppingRepository.save(topping);
        log.info("Cập nhật trạng thái Topping ID={}: isAvailable={}", id, topping.getIsAvailable());
        return mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteTopping(Integer id, Integer ownerId, String role) {
        Topping topping = toppingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy topping với ID: " + id));

        Shop shop = shopRepository.findByIdAndDeletedAtIsNull(topping.getRestaurantId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quán ăn với ID: " + topping.getRestaurantId()));

        verifyOwnership(shop, ownerId, role);

        // Remove mapping from food_toppings junction
        productToppingRepository.deleteByIdToppingId(id);

        toppingRepository.delete(topping);
        log.info("Đã xóa Topping ID={} khỏi hệ thống", id);
    }

    private void verifyOwnership(Shop shop, Integer ownerId, String role) {
        if (role != null && role.contains("MERCHANT") && ownerId != null) {
            if (!shop.getOwnerId().equals(ownerId)) {
                throw new ForbiddenException("Bạn không có quyền quản lý topping của quán ăn khác (Chủ sở hữu quán ID: " + shop.getOwnerId() + ")");
            }
        }
    }

    private ToppingDto mapToDto(Topping topping) {
        return ToppingDto.builder()
                .id(topping.getId())
                .restaurantId(topping.getRestaurantId())
                .groupName(topping.getGroupName() != null ? topping.getGroupName() : "Topping thêm")
                .name(topping.getName())
                .price(topping.getPrice())
                .isAvailable(topping.getIsAvailable())
                .build();
    }

    private List<ToppingGroupDto> buildToppingGroups(List<Topping> toppings) {
        if (toppings == null || toppings.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, List<Topping>> grouped = toppings.stream()
                .collect(Collectors.groupingBy(
                        t -> (t.getGroupName() != null && !t.getGroupName().isBlank()) ? t.getGroupName() : "Topping thêm",
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        List<ToppingGroupDto> result = new ArrayList<>();
        grouped.forEach((groupName, items) -> {
            boolean isSize = groupName.toLowerCase().contains("size");
            boolean isSweetness = groupName.toLowerCase().contains("ngọt") || groupName.toLowerCase().contains("đường");
            boolean isIce = groupName.toLowerCase().contains("đá");

            boolean required = isSize;
            int minSelection = isSize ? 1 : 0;
            int maxSelection = (isSize || isSweetness || isIce) ? 1 : items.size();

            result.add(ToppingGroupDto.builder()
                    .groupName(groupName)
                    .required(required)
                    .minSelection(minSelection)
                    .maxSelection(maxSelection)
                    .toppings(items.stream().map(this::mapToDto).collect(Collectors.toList()))
                    .build());
        });

        return result;
    }
}
