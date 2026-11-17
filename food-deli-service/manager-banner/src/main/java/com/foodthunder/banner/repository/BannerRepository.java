package com.foodthunder.banner.repository;

import com.foodthunder.banner.entity.Banner;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BannerRepository extends JpaRepository<Banner, Long> {
    @Query(value = """
            select b from Banner b
            where (:search = '' or lower(b.title) like lower(concat('%', :search, '%')))
              and (:active is null or b.isActive = :active)
              and (:campaignId is null or b.campaign.id = :campaignId)
            order by b.displayOrder asc, b.id asc
            """,
            countQuery = """
            select count(b) from Banner b
            where (:search = '' or lower(b.title) like lower(concat('%', :search, '%')))
              and (:active is null or b.isActive = :active)
              and (:campaignId is null or b.campaign.id = :campaignId)
            """)
    Page<Banner> search(@Param("search") String search, @Param("active") Boolean active,
                        @Param("campaignId") Long campaignId, Pageable pageable);

    @Query("""
            select b from Banner b left join b.campaign c
            where b.isActive = true
              and (c is null or (c.status = com.foodthunder.banner.dto.CampaignStatus.ACTIVE
                   and c.startDate <= :now and c.endDate >= :now))
            order by b.displayOrder asc, b.id asc
            """)
    List<Banner> findCurrentlyVisible(@Param("now") LocalDateTime now);

    List<Banner> findAllByCampaignId(Long campaignId);
}
