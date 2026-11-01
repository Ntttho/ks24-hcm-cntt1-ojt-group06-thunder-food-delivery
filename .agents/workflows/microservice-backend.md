---
description: Comprehensive Spring Boot Microservices Backend development workflow covering domain decomposition, bounded contexts, DTOs, JPA entities, OpenFeign inter-service communication, Resilience4j, Event-Driven Messaging, API Gateway routing, Security, testing, and deployment.
---

# Spring Boot Microservices Backend Development Workflow

You are an expert Senior Spring Boot Microservices Software Engineer and Mentor. All backend source code and microservices reside inside the primary backend folder: **`food-deli-service/`** (located at `d:\ojt-food-deli-start\food-deli-service/`). When developing, migrating, or reviewing any backend feature or service in the **Food Thunder Deli** microservices architecture, follow this systematic workflow:

## Step 1: Service Boundary & Architecture Placement
1. Identify which microservice owns the feature based on the Bounded Context (10 Microservices):
   - **`auth-service` (Port 8081):** User credentials, roles, profile, delivery addresses. Unified Auth (`/login`, `/register`).
   - **`restaurant-service` (Port 8082):** Multi-shop management (`/mine`), menu categories, dishes/products, toppings, restaurant vouchers.
   - **`order-service` (Port 8083):** Cart operations, order checkout (ACID transaction), order state machine, price calculation.
   - **`delivery-service` (Port 8084):** Shipper pool, dispatching, virtual delivery state machine (Accept $\rightarrow$ Picked Up $\rightarrow$ Delivering $\rightarrow$ Delivered), Pessimistic Lock (`SELECT FOR UPDATE`), Driver AR/CR Engine PRD.
   - **`payment-service` (Port 8085):** COD and VNPay Sandbox Gateway integration (URL creation, HMAC-SHA512 checksum, IPN and Return URL callback).
   - **`review-service` (Port 8086):** Customer 5★ reviews for shops and shippers post-delivery.
   - **`chat-notification-service` (Port 8087):** WebSocket STOMP (`/ws-food-deli`) order status push, real-time customer-merchant chat, Merchant Dashboard "ding-dong" chime.
   - **`api-gateway` (Port 8080):** Routing, rate limiting, and centralized JWT validation.
   - **`discovery-service` (Port 8761):** Eureka Service Registry.
   - **`config-server` (Port 8888):** Centralized configuration server.
2. Determine inter-service dependencies:
   - Does this feature need data from another service? (e.g., `order-service` calls `restaurant-service` to validate product price & voucher).
   - Should the communication be **Synchronous (OpenFeign REST)** or **Asynchronous (Event/Message Broker)**?

## Step 2: Database Schema & Entity Design (Decoupled Logical Foreign Keys)
1. Use [`database/seed_all.sql`](file:///d:/ojt-food-deli-start/database/seed_all.sql) and follow [`document/KIEN_TRUC_CSDL_LOGIC_MICROSERVICES.md`](file:///d:/ojt-food-deli-start/document/KIEN_TRUC_CSDL_LOGIC_MICROSERVICES.md).
2. In the target microservice, implement JPA Entities belonging strictly to its domain:
   - Entities within the **same service** maintain full JPA relationships (`@ManyToOne`, `@OneToMany`) and physical foreign keys (`ON DELETE CASCADE`).
   - For entities in **external services**, store only foreign **Plain IDs** (`Long restaurantId`, `Long customerId`, `Long driverId`, `Long orderId`) with B-Tree indices (`KEY idx_...`). **Never create cross-service JPA entity associations or physical foreign keys**.
   - **Data Snapshot Pattern:** For order items and transactions, always snapshot historical immutable data (`food_name`, `price_at_order`, `receiver_address`, `phone`).
   - Standard audit fields: `createdAt`, `updatedAt` via `@EntityListeners(AuditingEntityListener.class)`.
   - Map enums with `@Enumerated(EnumType.STRING)`.

## Step 3: DTOs, Event Models & Validation
1. **Request DTOs:** Add Jakarta validation annotations (`@NotBlank`, `@NotNull`, `@Size`, `@Min`, `@Pattern`).
2. **Response DTOs:** Decouple internal entity representations from API responses; wrap them in `ApiResponse<T>`.
3. **Event Payloads:** For asynchronous communication, create immutable event records (e.g., `OrderCreatedEvent`, `OrderStatusUpdatedEvent`).

## Step 4: Repository Layer
1. Extend `JpaRepository<Entity, ID>` or `JpaSpecificationExecutor`.
2. Define custom queries with Spring Data derived methods or JPQL `@Query`.
3. Ensure proper indexing and optimize fetch joins within the local domain to prevent N+1 queries.

## Step 5: Inter-Service Communication (OpenFeign & Events)
1. **OpenFeign Client Interface:**
   - Define `@FeignClient(name = "target-service", fallbackFactory = TargetServiceFallbackFactory.class)`.
   - Propagate security context via `FeignClientInterceptor` (`Authorization: Bearer <token>`).
   - Configure Resilience4j Circuit Breaker & timeouts in `application.yml`.
   - Provide a `FallbackFactory` returning meaningful fallback data or throwing clear domain exceptions.
2. **Event Publishing / Consuming:**
   - Publish domain events to RabbitMQ / Kafka exchange/topic when a critical state change occurs.
   - Implement consumers with idempotency checks to avoid duplicate processing.

## Step 6: Service Layer (Business Logic & Transactions)
1. Implement business rules within `@Service`.
2. Apply `@Transactional` for methods modifying local database state.
3. Coordinate with external services via Feign clients or publish events for eventual consistency (Saga choreography).
4. Throw domain-specific exceptions (`ResourceNotFoundException`, `BadRequestException`, `ConflictException`).
5. Include structured SLF4J logging (`@Slf4j`) with contextual IDs (`orderId`, `userId`, `restaurantId`).

## Step 7: Controller Layer & API Gateway Exposure
1. Create `@RestController` mapped to `/api/v1/...`.
2. Use constructor injection (`@RequiredArgsConstructor`).
3. Add `@Valid` on request bodies and return appropriate HTTP status (`200 OK`, `201 Created`, `204 No Content`).
4. Update **`api-gateway`** routing configuration:
   - Route path predicates (e.g., `/api/v1/orders/**` $\rightarrow$ `lb://order-service`).
   - Role authorization filters (e.g., Merchant, Shipper, Customer routes).

## Step 8: Security & Context Extraction
1. Extract authenticated user info from JWT claims or Gateway forwarded headers (`X-User-Id`, `X-User-Role`).
2. Enforce endpoint authorization via `@PreAuthorize("hasAuthority('ROLE_...')")`.
3. Centralized `@RestControllerAdvice` handles validation errors, domain exceptions, and `FeignException`.

## Step 9: Unit & Integration Testing
1. **Service Unit Tests:** Use JUnit 5 and Mockito. Mock both local repositories and remote `@Mock FeignClient`.
2. **Controller Tests:** Use `@WebMvcTest` with `@MockBean` for services.
3. **Circuit Breaker Tests:** Verify fallback methods when external Feign calls fail or time out.
4. Aim for 80%+ test coverage across core business scenarios.

## Step 10: Microservice Quality & Review Checklist
- [ ] Are table schemas and existing database data fully preserved according to the decoupled schema?
- [ ] Are cross-service foreign keys represented as plain IDs (no cross-service `@ManyToOne` or `@JoinColumn`)?
- [ ] Are Feign clients protected with Circuit Breakers, timeouts, and fallbacks?
- [ ] Is the JWT token propagated across inter-service calls via `FeignClientInterceptor`?
- [ ] Are asynchronous events used where synchronous blocking is unnecessary?
- [ ] Are API Gateway routes and role filters properly configured?
- [ ] Is constructor injection used exclusively?
- [ ] Are all exceptions handled gracefully without leaking sensitive stack traces?
