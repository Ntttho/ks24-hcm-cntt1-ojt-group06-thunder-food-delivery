---
name: microservices-patterns
description: "Master microservices architecture patterns including service boundaries, inter-service communication, data management, and resilience patterns for building distributed systems."
risk: safe
source: community
date_added: "2026-02-27"
---

# Microservices Patterns

Master microservices architecture patterns including service boundaries, inter-service communication, data management, and resilience patterns for building distributed systems.

## Use this skill when

- Decomposing monoliths into microservices
- Designing service boundaries and contracts
- Implementing inter-service communication
- Managing distributed data and transactions
- Building resilient distributed systems
- Implementing service discovery and load balancing
- Designing event-driven architectures

## Do not use this skill when

- The system is small enough for a modular monolith
- You need a quick prototype without distributed complexity
- There is no operational support for distributed systems

## Instructions

1. Identify domain boundaries and ownership for each service.
2. Define contracts, data ownership, and communication patterns.
3. Plan resilience, observability, and deployment strategy.
4. Provide migration steps and operational guardrails.

## Resources

- `resources/structure-for-microservice.md` for detailed 10-microservice architecture, domain decomposition, and directory structure.
- `resources/api-endpoints-and-order-workflow.md` for comprehensive API endpoints matrix, Order Status State Machine, and cross-reference mapping to `older/grab-food-springboot`.
- `document/KIEN_TRUC_CSDL_LOGIC_MICROSERVICES.md` for decoupled database schema and Plain ID rules.
- `document/order-status-flow.md` for the complete visual Order Lifecycle sequence and transition matrix.
- `database/seed_all.sql` for the production 26-table MySQL schema with decoupled logical foreign keys.
- `older/grab-food-springboot/` as the mandatory monolithic legacy baseline reference.

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
