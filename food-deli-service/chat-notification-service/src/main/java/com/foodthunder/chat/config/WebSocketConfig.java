package com.foodthunder.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable simple memory-based message broker for /topic and /queue prefixes
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix for client-to-server messages
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Pure WebSocket connection endpoint (/ws and /ws-food-deli)
        registry.addEndpoint("/ws", "/ws-food-deli")
                .setAllowedOriginPatterns("*");

        // SockJS fallback connection endpoint
        registry.addEndpoint("/ws", "/ws-food-deli")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
}

