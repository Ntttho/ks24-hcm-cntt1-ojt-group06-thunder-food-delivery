package com.foodthunder.auth.config;

import com.foodthunder.auth.model.Role;
import com.foodthunder.auth.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    @Override
    public void run(String... args) {
        List<String> defaultRoles = List.of("CUSTOMER", "DRIVER", "MERCHANT", "ADMIN");
        for (String roleName : defaultRoles) {
            roleRepository.findByName(roleName).orElseGet(() -> {
                log.info("Seeding initial role: {}", roleName);
                return roleRepository.save(Role.builder().name(roleName).build());
            });
        }
    }
}
