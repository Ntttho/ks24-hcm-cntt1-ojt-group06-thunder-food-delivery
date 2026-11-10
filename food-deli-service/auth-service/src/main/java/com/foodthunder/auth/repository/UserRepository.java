package com.foodthunder.auth.repository;

import com.foodthunder.auth.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndIdNot(String phone, Long id);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN u.roles r
        WHERE (:search IS NULL 
               OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) 
               OR u.phone LIKE CONCAT('%', :search, '%')
               OR (u.email IS NOT NULL AND LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))))
          AND (:role IS NULL OR UPPER(r.name) = UPPER(:role))
          AND (:status IS NULL 
               OR (:status = 'ACTIVE' AND u.deletedAt IS NULL) 
               OR (:status = 'LOCKED' AND u.deletedAt IS NOT NULL))
    """)
    Page<User> searchUsers(
        @Param("search") String search,
        @Param("role") String role,
        @Param("status") String status,
        Pageable pageable
    );

    default Page<User> searchUsers(String search, String role, Pageable pageable) {
        return searchUsers(search, role, null, pageable);
    }
}
