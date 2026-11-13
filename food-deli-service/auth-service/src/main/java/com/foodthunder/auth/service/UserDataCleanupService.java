package com.foodthunder.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.client.ServiceInstance;
import org.springframework.cloud.client.discovery.DiscoveryClient;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Xóa toàn bộ dữ liệu và lịch sử liên quan của một tài khoản trước khi xóa cứng bản ghi user.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDataCleanupService {

    private static final int BATCH_SIZE = 500;
    private static final Duration HTTP_TIMEOUT = Duration.ofMillis(1500);
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(HTTP_TIMEOUT)
            .build();

    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final ObjectProvider<DiscoveryClient> discoveryClientProvider;

    @Value("${app.services.order-url:http://localhost:8083}")
    private String fallbackOrderServiceUrl;

    /**
     * Xóa sạch dữ liệu liên kết của {@code userId} trên các bảng dịch vụ (đơn hàng, thanh toán, đánh giá,
     * chat, hồ sơ quán/tài xế, địa chỉ) theo đúng thứ tự phụ thuộc để không vướng ràng buộc khóa ngoại.
     */
    public void purgeRelatedData(Long userId) {
        Map<String, String> existingTables = findExistingTables();

        List<Long> restaurantIds = queryIds(existingTables, "restaurants",
                "SELECT id FROM restaurants WHERE owner_id = :userId", userId);
        List<Long> categoryIds = queryIdsByIn(existingTables, "categories",
                "SELECT id FROM categories WHERE restaurant_id IN (:ids)", restaurantIds);
        List<Long> foodIds = queryIdsByIn(existingTables, "food_items",
                "SELECT id FROM food_items WHERE category_id IN (:ids)", categoryIds);
        List<Long> toppingIds = queryIdsByIn(existingTables, "toppings",
                "SELECT id FROM toppings WHERE restaurant_id IN (:ids)", restaurantIds);
        List<Long> voucherIds = queryIdsByIn(existingTables, "vouchers",
                "SELECT id FROM vouchers WHERE restaurant_id IN (:ids)", restaurantIds);

        Set<Long> orderIdSet = new LinkedHashSet<>(queryIds(existingTables, "orders",
                "SELECT id FROM orders WHERE customer_id = :userId", userId));
        orderIdSet.addAll(queryIdsByIn(existingTables, "orders",
                "SELECT id FROM orders WHERE restaurant_id IN (:ids)", restaurantIds));
        List<Long> orderIds = new ArrayList<>(orderIdSet);

        List<Long> orderItemIds = queryIdsByIn(existingTables, "order_items",
                "SELECT id FROM order_items WHERE order_id IN (:ids)", orderIds);
        List<Long> paymentIds = queryIdsByIn(existingTables, "payments",
                "SELECT id FROM payments WHERE order_id IN (:ids)", orderIds);

        // 1. Chat & Reviews
        executeByUser(existingTables, "chat_messages",
                "DELETE FROM chat_messages WHERE sender_id = :userId", userId);
        executeByIn(existingTables, "chat_messages",
                "DELETE FROM chat_messages WHERE shop_id IN (:ids)", restaurantIds);
        executeByIn(existingTables, "chat_messages",
                "DELETE FROM chat_messages WHERE order_id IN (:ids)", orderIds);

        executeByUser(existingTables, "reviews",
                "DELETE FROM reviews WHERE customer_id = :userId OR (target_type = 'DRIVER' AND target_id = :userId)",
                userId);
        executeByIn(existingTables, "reviews",
                "DELETE FROM reviews WHERE target_type = 'RESTAURANT' AND target_id IN (:ids)", restaurantIds);
        executeByIn(existingTables, "reviews",
                "DELETE FROM reviews WHERE order_id IN (:ids)", orderIds);
        if (!foodIds.isEmpty() && existingTables.containsKey("reviews")) {
            Set<String> reviewColumns = findExistingColumns(existingTables.get("reviews"));
            if (reviewColumns.contains("food_item_id")) {
                executeByIn(existingTables, "reviews",
                        "DELETE FROM reviews WHERE food_item_id IN (:ids)", foodIds);
            }
        }

        // 2. Payments
        executeByIn(existingTables, "payment_transactions",
                "DELETE FROM payment_transactions WHERE payment_id IN (:ids)", paymentIds);
        executeByIn(existingTables, "payments",
                "DELETE FROM payments WHERE order_id IN (:ids)", orderIds);

        // 3. Delivery telemetry & Driver profile
        executeByUser(existingTables, "driver_locations",
                "DELETE FROM driver_locations WHERE driver_id = :userId", userId);
        executeByIn(existingTables, "driver_locations",
                "DELETE FROM driver_locations WHERE order_id IN (:ids)", orderIds);

        executeByUser(existingTables, "driver_offers",
                "DELETE FROM driver_offers WHERE driver_id = :userId", userId);
        executeByIn(existingTables, "driver_offers",
                "DELETE FROM driver_offers WHERE order_id IN (:ids)", orderIds);

        executeByUser(existingTables, "driver_penalties",
                "DELETE FROM driver_penalties WHERE driver_id = :userId", userId);
        executeByUser(existingTables, "driver_details",
                "DELETE FROM driver_details WHERE user_id = :userId", userId);

        // 4. Orders & Order History
        executeByIn(existingTables, "order_item_toppings",
                "DELETE FROM order_item_toppings WHERE order_item_id IN (:ids)", orderItemIds);
        executeByIn(existingTables, "order_items",
                "DELETE FROM order_items WHERE order_id IN (:ids)", orderIds);
        executeByIn(existingTables, "order_status_logs",
                "DELETE FROM order_status_logs WHERE order_id IN (:ids)", orderIds);
        executeByUser(existingTables, "order_status_logs",
                "UPDATE order_status_logs SET changed_by = NULL WHERE changed_by = :userId", userId);

        executeByIn(existingTables, "orders",
                "DELETE FROM orders WHERE id IN (:ids)", orderIds);
        executeByUser(existingTables, "orders",
                "UPDATE orders SET driver_id = NULL WHERE driver_id = :userId", userId);
        executeByUser(existingTables, "orders",
                "UPDATE orders SET cancelled_by_user_id = NULL WHERE cancelled_by_user_id = :userId", userId);
        executeByIn(existingTables, "orders",
                "UPDATE orders SET voucher_id = NULL WHERE voucher_id IN (:ids)", voucherIds);

        // 5. Restaurants & Catalog
        executeByUser(existingTables, "restaurant_change_requests",
                "DELETE FROM restaurant_change_requests WHERE requested_by = :userId", userId);
        executeByIn(existingTables, "restaurant_change_requests",
                "DELETE FROM restaurant_change_requests WHERE restaurant_id IN (:ids)", restaurantIds);
        executeByUser(existingTables, "restaurant_change_requests",
                "UPDATE restaurant_change_requests SET reviewed_by = NULL WHERE reviewed_by = :userId", userId);

        executeByIn(existingTables, "vouchers",
                "DELETE FROM vouchers WHERE restaurant_id IN (:ids)", restaurantIds);
        executeByIn(existingTables, "food_toppings",
                "DELETE FROM food_toppings WHERE food_id IN (:ids)", foodIds);
        executeByIn(existingTables, "food_toppings",
                "DELETE FROM food_toppings WHERE topping_id IN (:ids)", toppingIds);
        executeByIn(existingTables, "food_items",
                "DELETE FROM food_items WHERE category_id IN (:ids)", categoryIds);
        executeByIn(existingTables, "categories",
                "DELETE FROM categories WHERE restaurant_id IN (:ids)", restaurantIds);
        executeByIn(existingTables, "toppings",
                "DELETE FROM toppings WHERE restaurant_id IN (:ids)", restaurantIds);
        executeByIn(existingTables, "restaurants",
                "DELETE FROM restaurants WHERE id IN (:ids)", restaurantIds);
        executeByUser(existingTables, "restaurants",
                "UPDATE restaurants SET approved_by = NULL WHERE approved_by = :userId", userId);

        // 6. Auth child tables
        executeByUser(existingTables, "merchant_details",
                "DELETE FROM merchant_details WHERE user_id = :userId", userId);
        executeByUser(existingTables, "user_addresses",
                "DELETE FROM user_addresses WHERE user_id = :userId", userId);
    }

    /**
     * Lên lịch xóa giỏ hàng trên Redis/cache của order-service sau khi transaction xóa DB commit thành công.
     */
    public void scheduleExternalCleanup(Long userId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    purgeRemoteCartBestEffort(userId);
                }
            });
        } else {
            purgeRemoteCartBestEffort(userId);
        }
    }

    private void purgeRemoteCartBestEffort(Long userId) {
        String baseUrl = resolveOrderServiceBaseUrl();
        if (baseUrl == null || baseUrl.isBlank()) {
            return;
        }
        String normalizedBase = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        String url = normalizedBase + "/api/v1/cart?userId=" + userId + "&purge=true";
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(HTTP_TIMEOUT)
                    .DELETE()
                    .build();
            HttpResponse<Void> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.discarding());
            log.debug("Purged Redis/fallback cart for userId={}, status={}", userId, response.statusCode());
        } catch (Exception ex) {
            log.debug("Best-effort cart cleanup skipped/failed for userId={}: {}", userId, ex.getMessage());
        }
    }

    private String resolveOrderServiceBaseUrl() {
        DiscoveryClient discoveryClient = discoveryClientProvider.getIfAvailable();
        if (discoveryClient != null) {
            try {
                List<ServiceInstance> instances = discoveryClient.getInstances("order-service");
                if (instances != null && !instances.isEmpty()) {
                    return instances.get(0).getUri().toString();
                }
            } catch (Exception ex) {
                log.debug("Could not resolve order-service via DiscoveryClient: {}", ex.getMessage());
            }
        }
        return fallbackOrderServiceUrl;
    }

    private Map<String, String> findExistingTables() {
        Map<String, String> tables = jdbcTemplate.getJdbcOperations().execute((ConnectionCallback<Map<String, String>>) conn -> {
            Map<String, String> found = new HashMap<>();
            DatabaseMetaData metaData = conn.getMetaData();
            try (ResultSet rs = metaData.getTables(conn.getCatalog(), conn.getSchema(), "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String actualName = rs.getString("TABLE_NAME");
                    if (actualName != null) {
                        found.put(actualName.toLowerCase(Locale.ROOT), actualName);
                    }
                }
            }
            return found;
        });
        return tables != null ? tables : Collections.emptyMap();
    }

    private Set<String> findExistingColumns(String actualTableName) {
        Set<String> cols = jdbcTemplate.getJdbcOperations().execute((ConnectionCallback<Set<String>>) conn -> {
            Set<String> found = new HashSet<>();
            DatabaseMetaData metaData = conn.getMetaData();
            try (ResultSet rs = metaData.getColumns(conn.getCatalog(), conn.getSchema(), actualTableName, "%")) {
                while (rs.next()) {
                    String colName = rs.getString("COLUMN_NAME");
                    if (colName != null) {
                        found.add(colName.toLowerCase(Locale.ROOT));
                    }
                }
            }
            return found;
        });
        return cols != null ? cols : Collections.emptySet();
    }

    private List<Long> queryIds(Map<String, String> existingTables, String tableName, String sql, Long userId) {
        if (!existingTables.containsKey(tableName)) {
            return Collections.emptyList();
        }
        return jdbcTemplate.queryForList(sql, new MapSqlParameterSource("userId", userId), Long.class);
    }

    private List<Long> queryIdsByIn(Map<String, String> existingTables, String tableName, String sql, List<Long> ids) {
        if (ids.isEmpty() || !existingTables.containsKey(tableName)) {
            return Collections.emptyList();
        }
        List<Long> results = new ArrayList<>();
        for (int start = 0; start < ids.size(); start += BATCH_SIZE) {
            List<Long> chunk = ids.subList(start, Math.min(start + BATCH_SIZE, ids.size()));
            results.addAll(jdbcTemplate.queryForList(sql, new MapSqlParameterSource("ids", chunk), Long.class));
        }
        return results;
    }

    private void executeByUser(Map<String, String> existingTables, String tableName, String sql, Long userId) {
        if (!existingTables.containsKey(tableName)) {
            return;
        }
        jdbcTemplate.update(sql, new MapSqlParameterSource("userId", userId));
    }

    private void executeByIn(Map<String, String> existingTables, String tableName, String sql, List<Long> ids) {
        if (ids.isEmpty() || !existingTables.containsKey(tableName)) {
            return;
        }
        for (int start = 0; start < ids.size(); start += BATCH_SIZE) {
            List<Long> chunk = ids.subList(start, Math.min(start + BATCH_SIZE, ids.size()));
            jdbcTemplate.update(sql, new MapSqlParameterSource("ids", chunk));
        }
    }
}

