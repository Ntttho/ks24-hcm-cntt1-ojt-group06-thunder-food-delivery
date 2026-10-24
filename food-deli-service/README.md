# Food Thunder Deli - Microservices Platform

Welcome to the **Food Thunder Deli** Spring Boot 3 Microservices Platform.

## 🏛️ Infrastructure Components & Ports

| Component | Module Name | Port | Description |
| :--- | :--- | :---: | :--- |
| **API Gateway** | `api-gateway` | `8080` | Unified client entry point, JWT validation & dynamic client-side load balancing (`lb://`) |
| **Discovery Service** | `discovery-service` | `8761` | Netflix Eureka Service Registry & Instance Discovery Dashboard |
| **Config Server** | `config-server` | `8888` | Centralized Spring Cloud Configuration Server (`classpath:/config`) |

---
 
## 🚀 Startup Order (Thứ tự khởi chạy)

When running locally in your IDE or via command line, always start services in this sequence:

1. **`discovery-service`** (`http://localhost:8761`): Start first so all subsequent services can register themselves.
2. **`config-server`** (`http://localhost:8888`): Start second to serve centralized configuration properties.
3. **`api-gateway`** (`http://localhost:8080`): Start third to listen for incoming HTTP requests and route via load balancing.
4. **Business Services** (`auth-service`, `restaurant-service`, `order-service`, `delivery-service`, `review-service`, `chat-notification-service`).

---

## ⚡ Dynamic Load Balancing (`lb://`) in API Gateway

API Gateway is configured with `spring-cloud-starter-loadbalancer`. Routes automatically discover service instances registered in Eureka and load-balance client requests across available instances:

- `/api/v1/auth/**`, `/api/v1/users/**` $\rightarrow$ `lb://auth-service`
- `/api/v1/shops/**`, `/api/v1/products/**`, `/api/v1/categories/**`, `/api/v1/vouchers/**` $\rightarrow$ `lb://restaurant-service`
- `/api/v1/orders/**`, `/api/v1/cart/**` $\rightarrow$ `lb://order-service`
- `/api/v1/deliveries/**`, `/api/v1/shippers/**` $\rightarrow$ `lb://delivery-service`
- `/api/v1/reviews/**` $\rightarrow$ `lb://review-service`
- `/api/v1/chat/**`, `/ws/**` $\rightarrow$ `lb://chat-notification-service`

---

## 🛠️ Build & Run Commands

Using the included Maven Wrapper:

```bash
# Build all modules
.\mvnw.cmd clean package -DskipTests

# Run Discovery Service
.\mvnw.cmd -pl discovery-service spring-boot:run

# Run Config Server
.\mvnw.cmd -pl config-server spring-boot:run

# Run API Gateway
.\mvnw.cmd -pl api-gateway spring-boot:run
```

Or via Docker Compose:

```bash
docker compose up --build
```
