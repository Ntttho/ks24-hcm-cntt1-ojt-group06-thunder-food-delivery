package com.foodthunder.auth.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String phone;
    private final String activeRole;
    private final Collection<? extends GrantedAuthority> authorities;

    public static UserPrincipal create(Long id, String phone, String role, List<String> roles) {
        List<SimpleGrantedAuthority> authorities = roles.stream()
                .map(r -> r.startsWith("ROLE_") ? new SimpleGrantedAuthority(r) : new SimpleGrantedAuthority("ROLE_" + r))
                .toList();

        return UserPrincipal.builder()
                .id(id)
                .phone(phone)
                .activeRole(role)
                .authorities(authorities)
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return null;
    }

    @Override
    public String getUsername() {
        return phone;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
