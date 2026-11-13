package com.foodthunder.auth.service;

import com.foodthunder.auth.exception.BadRequestException;
import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.model.User;
import com.foodthunder.auth.model.UserAddress;
import com.foodthunder.auth.repository.RoleRepository;
import com.foodthunder.auth.repository.UserAddressRepository;
import com.foodthunder.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class UserHardDeleteIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Role customerRole;
    private Role driverRole;
    private Role merchantRole;
    private Role adminRole;

    @BeforeEach
    void setUpSchemaAndCleanData() {
        createCrossServiceTablesIfNeeded();
        cleanCrossServiceTables();

        userAddressRepository.deleteAll();
        jdbcTemplate.execute("DELETE FROM driver_details");
        jdbcTemplate.execute("DELETE FROM user_roles");
        userRepository.deleteAll();

        customerRole = findOrCreateRole("CUSTOMER");
        driverRole = findOrCreateRole("DRIVER");
        merchantRole = findOrCreateRole("MERCHANT");
        adminRole = findOrCreateRole("ADMIN");
    }

    @Test
    @DisplayName("deleteUser (CUSTOMER): xóa sạch user và toàn bộ lịch sử đơn hàng, thanh toán, đánh giá, chat, địa chỉ")
    void deleteCustomer_wipesUserAndAllHistory_keepsOtherCustomerData() {
        User targetCustomer = saveUser("0901111111", "Customer One", customerRole);
        User otherCustomer = saveUser("0902222222", "Customer Two", customerRole);
        User merchant = saveUser("0903333333", "Merchant One", merchantRole);
        User driver = saveUser("0904444444", "Driver One", driverRole);

        saveAddress(targetCustomer.getId(), "10 Nguyen Hue");
        saveAddress(otherCustomer.getId(), "20 Le Loi");

        insertRestaurant(100L, merchant.getId(), "Quan A", null);
        insertCategory(200L, 100L, "Mon Chinh");
        insertFoodItem(300L, 200L, "Com Tam");
        insertOrderStatus(1L, "COMPLETED");

        // Order của targetCustomer
        insertOrder(1001L, "ORD-TARGET", targetCustomer.getId(), 100L, driver.getId(), null);
        insertOrderItem(2001L, 1001L, 300L, "Com Tam");
        insertOrderItemTopping(3001L, 2001L, 1L);
        insertOrderStatusLog(4001L, 1001L, targetCustomer.getId());
        insertPayment(5001L, 1001L);
        insertPaymentTransaction(6001L, 5001L);
        insertDriverLocation(7001L, driver.getId(), 1001L);
        insertDriverOffer(8001L, 1001L, driver.getId());
        insertReview(9001L, 1001L, targetCustomer.getId(), "RESTAURANT", 100L, 300L);
        insertReview(9002L, 1001L, targetCustomer.getId(), "DRIVER", driver.getId(), null);
        insertChatMessage(9501L, targetCustomer.getId(), 100L, 1001L);
        insertChatMessage(9502L, merchant.getId(), 100L, 1001L);

        // Order của otherCustomer (phải được giữ nguyên)
        insertOrder(1002L, "ORD-OTHER", otherCustomer.getId(), 100L, driver.getId(), null);
        insertOrderItem(2002L, 1002L, 300L, "Com Tam");
        insertPayment(5002L, 1002L);
        insertPaymentTransaction(6002L, 5002L);
        insertReview(9003L, 1002L, otherCustomer.getId(), "RESTAURANT", 100L, 300L);
        insertChatMessage(9503L, otherCustomer.getId(), 100L, 1002L);

        authService.deleteUser(targetCustomer.getId());

        assertThat(userRepository.findById(targetCustomer.getId())).isEmpty();
        assertThat(count("user_roles WHERE user_id = " + targetCustomer.getId())).isZero();
        assertThat(count("user_addresses WHERE user_id = " + targetCustomer.getId())).isZero();
        assertThat(count("orders WHERE customer_id = " + targetCustomer.getId())).isZero();
        assertThat(count("order_items WHERE order_id = 1001")).isZero();
        assertThat(count("order_item_toppings WHERE order_item_id = 2001")).isZero();
        assertThat(count("order_status_logs WHERE order_id = 1001")).isZero();
        assertThat(count("payments WHERE order_id = 1001")).isZero();
        assertThat(count("payment_transactions WHERE payment_id = 5001")).isZero();
        assertThat(count("driver_locations WHERE order_id = 1001")).isZero();
        assertThat(count("driver_offers WHERE order_id = 1001")).isZero();
        assertThat(count("reviews WHERE customer_id = " + targetCustomer.getId())).isZero();
        assertThat(count("chat_messages WHERE order_id = 1001 OR sender_id = " + targetCustomer.getId())).isZero();

        // Dữ liệu của customer khác không bị ảnh hưởng
        assertThat(userRepository.findById(otherCustomer.getId())).isPresent();
        assertThat(count("user_addresses WHERE user_id = " + otherCustomer.getId())).isEqualTo(1);
        assertThat(count("orders WHERE id = 1002")).isEqualTo(1);
        assertThat(count("payments WHERE id = 5002")).isEqualTo(1);
        assertThat(count("payment_transactions WHERE id = 6002")).isEqualTo(1);
        assertThat(count("reviews WHERE id = 9003")).isEqualTo(1);
        assertThat(count("chat_messages WHERE id = 9503")).isEqualTo(1);
    }

    @Test
    @DisplayName("deleteUser (MERCHANT): xóa sạch cửa hàng, thực đơn, topping, voucher, yêu cầu đổi thông tin và lịch sử đơn của quán")
    void deleteMerchant_wipesRestaurantsCatalogAndRelatedOrders() {
        User targetMerchant = saveUser("0905555555", "Merchant Deleted", merchantRole);
        User otherMerchant = saveUser("0906666666", "Merchant Kept", merchantRole);
        User customer = saveUser("0907777777", "Customer Buyer", customerRole);

        jdbcTemplate.update("INSERT INTO merchant_details (user_id, business_license, tax_code) VALUES (?, 'GPKD-1', 'MST-1')",
                targetMerchant.getId());
        insertRestaurant(101L, targetMerchant.getId(), "Quan Xoa", null);
        insertRestaurant(102L, otherMerchant.getId(), "Quan Giu", null);
        insertCategory(201L, 101L, "Com");
        insertFoodItem(301L, 201L, "Com Ga");
        insertTopping(401L, 101L, "Trung Op La");
        jdbcTemplate.update("INSERT INTO food_toppings (food_id, topping_id) VALUES (301, 401)");
        jdbcTemplate.update("INSERT INTO restaurant_change_requests (id, restaurant_id, requested_by, payload, status, reviewed_by) VALUES (1, 101, ?, '{}', 'PENDING', NULL)",
                targetMerchant.getId());
        jdbcTemplate.update("INSERT INTO restaurant_change_requests (id, restaurant_id, requested_by, payload, status, reviewed_by) VALUES (2, 102, ?, '{}', 'APPROVED', ?)",
                otherMerchant.getId(), targetMerchant.getId());
        jdbcTemplate.update("INSERT INTO vouchers (id, restaurant_id, code, discount_type, discount_value, discount_amount) VALUES (10, 101, 'SHOPDEL10', 'FIXED', 10000, 10000)");
        jdbcTemplate.update("INSERT INTO vouchers (id, restaurant_id, code, discount_type, discount_value, discount_amount) VALUES (11, NULL, 'PLATFORM10', 'FIXED', 10000, 10000)");

        insertOrderStatus(1L, "COMPLETED");
        insertOrder(1010L, "ORD-SHOP-101", customer.getId(), 101L, null, 10L);
        insertOrderItem(2010L, 1010L, 301L, "Com Ga");
        insertPayment(5010L, 1010L);
        insertReview(9010L, 1010L, customer.getId(), "RESTAURANT", 101L, 301L);
        insertChatMessage(9510L, customer.getId(), 101L, null);

        authService.deleteUser(targetMerchant.getId());

        assertThat(userRepository.findById(targetMerchant.getId())).isEmpty();
        assertThat(count("merchant_details WHERE user_id = " + targetMerchant.getId())).isZero();
        assertThat(count("restaurants WHERE owner_id = " + targetMerchant.getId())).isZero();
        assertThat(count("categories WHERE restaurant_id = 101")).isZero();
        assertThat(count("food_items WHERE id = 301")).isZero();
        assertThat(count("toppings WHERE id = 401")).isZero();
        assertThat(count("food_toppings WHERE food_id = 301 OR topping_id = 401")).isZero();
        assertThat(count("restaurant_change_requests WHERE id = 1")).isZero();
        assertThat(count("vouchers WHERE id = 10")).isZero();
        assertThat(count("orders WHERE id = 1010")).isZero();
        assertThat(count("order_items WHERE id = 2010")).isZero();
        assertThat(count("payments WHERE id = 5010")).isZero();
        assertThat(count("reviews WHERE id = 9010")).isZero();
        assertThat(count("chat_messages WHERE id = 9510")).isZero();

        // Voucher toàn sàn & quán khác giữ nguyên, reviewed_by được set NULL sạch sẽ
        assertThat(count("restaurants WHERE id = 102")).isEqualTo(1);
        assertThat(count("vouchers WHERE id = 11")).isEqualTo(1);
        Long reviewedBy = jdbcTemplate.queryForObject(
                "SELECT reviewed_by FROM restaurant_change_requests WHERE id = 2", Long.class);
        assertThat(reviewedBy).isNull();
    }

    @Test
    @DisplayName("deleteUser (DRIVER): xóa sạch driver_details, locations, offers, penalties, reviews/chat và gỡ driver_id khỏi đơn")
    void deleteDriver_wipesDriverHistoryAndClearsOrderReferences() {
        User targetDriver = saveUser("0908888888", "Driver Deleted", driverRole);
        User customer = saveUser("0909999999", "Customer Kept", customerRole);
        User merchant = saveUser("0901234567", "Merchant Kept", merchantRole);

        jdbcTemplate.update("INSERT INTO driver_details (user_id, license_plate) VALUES (?, '59A1-99999')",
                targetDriver.getId());
        insertRestaurant(103L, merchant.getId(), "Quan C", null);
        insertOrderStatus(1L, "COMPLETED");
        insertOrder(1020L, "ORD-DRV", customer.getId(), 103L, targetDriver.getId(), null);
        jdbcTemplate.update("UPDATE orders SET cancelled_by_user_id = ? WHERE id = 1020", targetDriver.getId());
        insertOrderStatusLog(4020L, 1020L, targetDriver.getId());
        insertDriverLocation(7020L, targetDriver.getId(), 1020L);
        insertDriverOffer(8020L, 1020L, targetDriver.getId());
        jdbcTemplate.update("INSERT INTO driver_penalties (id, driver_id, type, status) VALUES (1, ?, 'LATE_PICKUP', 'RESOLVED')",
                targetDriver.getId());
        insertReview(9020L, 1020L, customer.getId(), "DRIVER", targetDriver.getId(), null);
        insertChatMessage(9520L, targetDriver.getId(), 103L, 1020L);

        authService.deleteUser(targetDriver.getId());

        assertThat(userRepository.findById(targetDriver.getId())).isEmpty();
        assertThat(count("driver_details WHERE user_id = " + targetDriver.getId())).isZero();
        assertThat(count("driver_locations WHERE driver_id = " + targetDriver.getId())).isZero();
        assertThat(count("driver_offers WHERE driver_id = " + targetDriver.getId())).isZero();
        assertThat(count("driver_penalties WHERE driver_id = " + targetDriver.getId())).isZero();
        assertThat(count("reviews WHERE target_type = 'DRIVER' AND target_id = " + targetDriver.getId())).isZero();
        assertThat(count("chat_messages WHERE sender_id = " + targetDriver.getId())).isZero();

        // Đơn của customer giữ nguyên nhưng không còn dấu vết driverId hay changed_by
        assertThat(count("orders WHERE id = 1020")).isEqualTo(1);
        Long orderDriverId = jdbcTemplate.queryForObject("SELECT driver_id FROM orders WHERE id = 1020", Long.class);
        Long cancelledBy = jdbcTemplate.queryForObject("SELECT cancelled_by_user_id FROM orders WHERE id = 1020", Long.class);
        Long changedBy = jdbcTemplate.queryForObject("SELECT changed_by FROM order_status_logs WHERE id = 4020", Long.class);
        assertThat(orderDriverId).isNull();
        assertThat(cancelledBy).isNull();
        assertThat(changedBy).isNull();
    }

    @Test
    @DisplayName("deleteUser (ADMIN): từ chối xóa và giữ nguyên dữ liệu")
    void deleteAdmin_throwsBadRequest() {
        User admin = saveUser("0900000099", "Admin Guarded", adminRole);

        assertThatThrownBy(() -> authService.deleteUser(admin.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quản trị viên (Admin)");

        assertThat(userRepository.findById(admin.getId())).isPresent();
    }

    private Role findOrCreateRole(String name) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder().name(name).build()));
    }

    private User saveUser(String phone, String fullName, Role role) {
        return userRepository.save(User.builder()
                .phone(phone)
                .fullName(fullName)
                .password("encoded")
                .ratingAvg(new BigDecimal("5.00"))
                .roles(new HashSet<>(Set.of(role)))
                .build());
    }

    private void saveAddress(Long userId, String address) {
        userAddressRepository.save(UserAddress.builder()
                .userId(userId)
                .address(address)
                .isDefault(true)
                .build());
    }

    private void insertRestaurant(Long id, Long ownerId, String name, Long approvedBy) {
        jdbcTemplate.update("INSERT INTO restaurants (id, owner_id, name, approved_by) VALUES (?, ?, ?, ?)",
                id, ownerId, name, approvedBy);
    }

    private void insertCategory(Long id, Long restaurantId, String name) {
        jdbcTemplate.update("INSERT INTO categories (id, restaurant_id, name) VALUES (?, ?, ?)",
                id, restaurantId, name);
    }

    private void insertFoodItem(Long id, Long categoryId, String name) {
        jdbcTemplate.update("INSERT INTO food_items (id, category_id, name, price) VALUES (?, ?, ?, 45000)",
                id, categoryId, name);
    }

    private void insertTopping(Long id, Long restaurantId, String name) {
        jdbcTemplate.update("INSERT INTO toppings (id, restaurant_id, name, price) VALUES (?, ?, ?, 8000)",
                id, restaurantId, name);
    }

    private void insertOrderStatus(Long id, String code) {
        jdbcTemplate.update("INSERT INTO order_statuses (id, code) VALUES (?, ?)", id, code);
    }

    private void insertOrder(Long id, String code, Long customerId, Long restaurantId, Long driverId, Long voucherId) {
        jdbcTemplate.update(
                "INSERT INTO orders (id, order_code, idempotency_key, customer_id, restaurant_id, driver_id, voucher_id, status_id) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
                id, code, "idem-" + code, customerId, restaurantId, driverId, voucherId);
    }

    private void insertOrderItem(Long id, Long orderId, Long foodId, String foodName) {
        jdbcTemplate.update(
                "INSERT INTO order_items (id, order_id, food_id, food_name, quantity, price_at_order) VALUES (?, ?, ?, ?, 1, 45000)",
                id, orderId, foodId, foodName);
    }

    private void insertOrderItemTopping(Long id, Long orderItemId, Long toppingId) {
        jdbcTemplate.update(
                "INSERT INTO order_item_toppings (id, order_item_id, topping_id, quantity, price) VALUES (?, ?, ?, 1, 8000)",
                id, orderItemId, toppingId);
    }

    private void insertOrderStatusLog(Long id, Long orderId, Long changedBy) {
        jdbcTemplate.update(
                "INSERT INTO order_status_logs (id, order_id, new_status, changed_by) VALUES (?, ?, 'COMPLETED', ?)",
                id, orderId, changedBy);
    }

    private void insertPayment(Long id, Long orderId) {
        jdbcTemplate.update(
                "INSERT INTO payments (id, order_id, idempotency_key, payment_method, status, amount) VALUES (?, ?, ?, 'CASH', 'SUCCESS', 45000)",
                id, orderId, "pay-idem-" + id);
    }

    private void insertPaymentTransaction(Long id, Long paymentId) {
        jdbcTemplate.update(
                "INSERT INTO payment_transactions (id, payment_id, attempt_number, status) VALUES (?, ?, 1, 'SUCCESS')",
                id, paymentId);
    }

    private void insertDriverLocation(Long id, Long driverId, Long orderId) {
        jdbcTemplate.update(
                "INSERT INTO driver_locations (id, driver_id, order_id, latitude, longitude) VALUES (?, ?, ?, 10.77, 106.67)",
                id, driverId, orderId);
    }

    private void insertDriverOffer(Long id, Long orderId, Long driverId) {
        jdbcTemplate.update(
                "INSERT INTO driver_offers (id, order_id, driver_id, status, offered_at) VALUES (?, ?, ?, 'ACCEPTED', CURRENT_TIMESTAMP)",
                id, orderId, driverId);
    }

    private void insertReview(Long id, Long orderId, Long customerId, String targetType, Long targetId, Long foodItemId) {
        jdbcTemplate.update(
                "INSERT INTO reviews (id, order_id, customer_id, target_type, target_id, food_item_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?, 5, 'Tot')",
                id, orderId, customerId, targetType, targetId, foodItemId);
    }

    private void insertChatMessage(Long id, Long senderId, Long shopId, Long orderId) {
        jdbcTemplate.update(
                "INSERT INTO chat_messages (id, sender_id, shop_id, order_id, message, sender_role) VALUES (?, ?, ?, ?, 'Hello', 'CUSTOMER')",
                id, senderId, shopId, orderId);
    }

    private long count(String tableAndWhere) {
        Long value = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + tableAndWhere, Long.class);
        return value != null ? value : 0L;
    }

    private void createCrossServiceTablesIfNeeded() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS merchant_details (
                    user_id BIGINT PRIMARY KEY,
                    business_license VARCHAR(100),
                    tax_code VARCHAR(50),
                    CONSTRAINT fk_test_merchant_user FOREIGN KEY (user_id) REFERENCES users(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS restaurants (
                    id BIGINT PRIMARY KEY,
                    owner_id BIGINT NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    approved_by BIGINT
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS restaurant_change_requests (
                    id BIGINT PRIMARY KEY,
                    restaurant_id BIGINT NOT NULL,
                    requested_by BIGINT NOT NULL,
                    payload VARCHAR(1000) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    reviewed_by BIGINT,
                    CONSTRAINT fk_test_rcr_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS categories (
                    id BIGINT PRIMARY KEY,
                    restaurant_id BIGINT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    CONSTRAINT fk_test_cat_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS toppings (
                    id BIGINT PRIMARY KEY,
                    restaurant_id BIGINT NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_test_top_rest FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS food_items (
                    id BIGINT PRIMARY KEY,
                    category_id BIGINT,
                    name VARCHAR(255) NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_test_food_cat FOREIGN KEY (category_id) REFERENCES categories(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS food_toppings (
                    food_id BIGINT NOT NULL,
                    topping_id BIGINT NOT NULL,
                    PRIMARY KEY (food_id, topping_id),
                    CONSTRAINT fk_test_ft_food FOREIGN KEY (food_id) REFERENCES food_items(id),
                    CONSTRAINT fk_test_ft_top FOREIGN KEY (topping_id) REFERENCES toppings(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS vouchers (
                    id BIGINT PRIMARY KEY,
                    restaurant_id BIGINT,
                    code VARCHAR(20) NOT NULL,
                    discount_type VARCHAR(20) NOT NULL,
                    discount_value DECIMAL(10,2) NOT NULL,
                    discount_amount DECIMAL(10,2) NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS order_statuses (
                    id BIGINT PRIMARY KEY,
                    code VARCHAR(50) NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS orders (
                    id BIGINT PRIMARY KEY,
                    order_code VARCHAR(50) NOT NULL,
                    idempotency_key VARCHAR(100) NOT NULL,
                    customer_id BIGINT NOT NULL,
                    restaurant_id BIGINT NOT NULL,
                    driver_id BIGINT,
                    voucher_id BIGINT,
                    status_id BIGINT NOT NULL,
                    cancelled_by_user_id BIGINT,
                    CONSTRAINT fk_test_ord_status FOREIGN KEY (status_id) REFERENCES order_statuses(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS order_items (
                    id BIGINT PRIMARY KEY,
                    order_id BIGINT NOT NULL,
                    food_id BIGINT NOT NULL,
                    food_name VARCHAR(255) NOT NULL,
                    quantity INT NOT NULL,
                    price_at_order DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_test_oi_ord FOREIGN KEY (order_id) REFERENCES orders(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS order_item_toppings (
                    id BIGINT PRIMARY KEY,
                    order_item_id BIGINT NOT NULL,
                    topping_id BIGINT NOT NULL,
                    quantity INT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    CONSTRAINT fk_test_oit_oi FOREIGN KEY (order_item_id) REFERENCES order_items(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS order_status_logs (
                    id BIGINT PRIMARY KEY,
                    order_id BIGINT NOT NULL,
                    new_status VARCHAR(50) NOT NULL,
                    changed_by BIGINT,
                    CONSTRAINT fk_test_osl_ord FOREIGN KEY (order_id) REFERENCES orders(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id BIGINT PRIMARY KEY,
                    order_id BIGINT NOT NULL,
                    idempotency_key VARCHAR(100) NOT NULL,
                    payment_method VARCHAR(20) NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS payment_transactions (
                    id BIGINT PRIMARY KEY,
                    payment_id BIGINT NOT NULL,
                    attempt_number INT NOT NULL,
                    status VARCHAR(20) NOT NULL,
                    CONSTRAINT fk_test_pt_pay FOREIGN KEY (payment_id) REFERENCES payments(id)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS driver_locations (
                    id BIGINT PRIMARY KEY,
                    driver_id BIGINT NOT NULL,
                    order_id BIGINT,
                    latitude DOUBLE NOT NULL,
                    longitude DOUBLE NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS driver_offers (
                    id BIGINT PRIMARY KEY,
                    order_id BIGINT NOT NULL,
                    driver_id BIGINT NOT NULL,
                    status VARCHAR(30) NOT NULL,
                    offered_at TIMESTAMP NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS driver_penalties (
                    id BIGINT PRIMARY KEY,
                    driver_id BIGINT NOT NULL,
                    type VARCHAR(30) NOT NULL,
                    status VARCHAR(20) NOT NULL
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS reviews (
                    id BIGINT PRIMARY KEY,
                    order_id BIGINT NOT NULL,
                    customer_id BIGINT NOT NULL,
                    target_type VARCHAR(20) NOT NULL,
                    target_id BIGINT NOT NULL,
                    food_item_id BIGINT,
                    rating INT NOT NULL,
                    comment VARCHAR(500)
                )""");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id BIGINT PRIMARY KEY,
                    sender_id BIGINT NOT NULL,
                    shop_id BIGINT NOT NULL,
                    order_id BIGINT,
                    message VARCHAR(500) NOT NULL,
                    sender_role VARCHAR(20) NOT NULL
                )""");
    }

    private void cleanCrossServiceTables() {
        jdbcTemplate.execute("DELETE FROM chat_messages");
        jdbcTemplate.execute("DELETE FROM reviews");
        jdbcTemplate.execute("DELETE FROM payment_transactions");
        jdbcTemplate.execute("DELETE FROM payments");
        jdbcTemplate.execute("DELETE FROM driver_locations");
        jdbcTemplate.execute("DELETE FROM driver_offers");
        jdbcTemplate.execute("DELETE FROM driver_penalties");
        jdbcTemplate.execute("DELETE FROM order_item_toppings");
        jdbcTemplate.execute("DELETE FROM order_items");
        jdbcTemplate.execute("DELETE FROM order_status_logs");
        jdbcTemplate.execute("DELETE FROM orders");
        jdbcTemplate.execute("DELETE FROM order_statuses");
        jdbcTemplate.execute("DELETE FROM restaurant_change_requests");
        jdbcTemplate.execute("DELETE FROM vouchers");
        jdbcTemplate.execute("DELETE FROM food_toppings");
        jdbcTemplate.execute("DELETE FROM food_items");
        jdbcTemplate.execute("DELETE FROM categories");
        jdbcTemplate.execute("DELETE FROM toppings");
        jdbcTemplate.execute("DELETE FROM restaurants");
        jdbcTemplate.execute("DELETE FROM merchant_details");
    }
}

