# ==============================================================================
# Multi-stage Dockerfile for Food Thunder Deli Microservices (Java 21 / Spring Boot 3)
# Builds any service module: discovery-service, config-server, api-gateway, auth-service, restaurant-service
# Example manual build:
#   docker build --build-arg SERVICE_NAME=discovery-service -t ft-discovery-service .
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build JAR using Maven 3.9 & Eclipse Temurin JDK 21
# ------------------------------------------------------------------------------
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copy Maven Wrapper and parent POM
COPY pom.xml ./
COPY .mvn/ .mvn/
COPY mvnw ./
RUN chmod +x mvnw

# Copy all submodule POMs to cache dependencies layer
COPY discovery-service/pom.xml discovery-service/
COPY config-server/pom.xml config-server/
COPY api-gateway/pom.xml api-gateway/
COPY auth-service/pom.xml auth-service/
COPY restaurant-service/pom.xml restaurant-service/

# Cache Maven dependencies (offline mode)
RUN ./mvnw dependency:go-offline -B || true

# Copy all submodule source trees
COPY discovery-service/src discovery-service/src
COPY config-server/src config-server/src
COPY api-gateway/src api-gateway/src
COPY auth-service/src auth-service/src
COPY restaurant-service/src restaurant-service/src

# Target microservice module to build
ARG SERVICE_NAME
RUN ./mvnw clean package -pl ${SERVICE_NAME} -am -DskipTests -B

# ------------------------------------------------------------------------------
# Stage 2: Production JRE 21 Runtime (Minimal Alpine Container)
# ------------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

ARG SERVICE_NAME
COPY --from=builder --chown=appuser:appgroup /build/${SERVICE_NAME}/target/*.jar app.jar

# JVM options optimized for containerized environments
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

