package com.foodthunder.common.constant;

public final class SecurityConstants {

    private SecurityConstants() {
    }

    public static final String ROLE_ADMIN = "ROLE_ADMIN";
    public static final String ROLE_MERCHANT = "ROLE_MERCHANT";
    public static final String ROLE_DRIVER = "ROLE_DRIVER";
    public static final String ROLE_CUSTOMER = "ROLE_CUSTOMER";

    public static final String TOKEN_PREFIX = "Bearer ";
    public static final String AUTHORIZATION_HEADER = "Authorization";
}
