package com.foodthunder.banner.service;

import com.foodthunder.banner.dto.*;
import com.foodthunder.banner.entity.Banner;
import com.foodthunder.banner.entity.Campaign;
import com.foodthunder.banner.exception.BadRequestException;
import com.foodthunder.banner.exception.ResourceNotFoundException;
import com.foodthunder.banner.repository.BannerRepository;
import com.foodthunder.banner.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BannerService {
    private final BannerRepository bannerRepository;
    private final CampaignRepository campaignRepository;

    @Transactional(readOnly = true)
    public BannerPageResponse search(String search, String status, Long campaignId, int page, int size) {
        if (page < 0 || size < 1 || size > 100) {
            throw new BadRequestException("Trang phải từ 0 trở lên và kích thước trang từ 1 đến 100");
        }
        Boolean active = switch (status == null ? "ALL" : status.toUpperCase()) {
            case "ALL" -> null;
            case "ACTIVE" -> true;
            case "INACTIVE" -> false;
            default -> throw new BadRequestException("Trạng thái phải là ACTIVE, INACTIVE hoặc ALL");
        };
        Page<Banner> result = bannerRepository.search(search == null ? "" : search.trim(),
                active, campaignId, PageRequest.of(page, size));
        return new BannerPageResponse(result.getContent().stream().map(this::toResponse).toList(),
                result.getTotalElements(), result.getTotalPages(), result.getNumber(),
                result.getSize(), result.isLast());
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> findCurrentlyVisible() {
        return bannerRepository.findCurrentlyVisible(LocalDateTime.now()).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public BannerResponse findPublicById(Long id) {
        Banner banner = findBanner(id);
        boolean visible = banner.isActive() && (banner.getCampaign() == null
                || (banner.getCampaign().getStatus() == CampaignStatus.ACTIVE
                && !banner.getCampaign().getStartDate().isAfter(LocalDateTime.now())
                && !banner.getCampaign().getEndDate().isBefore(LocalDateTime.now())));
        if (!visible) throw new ResourceNotFoundException("Không tìm thấy banner đang hiển thị với id=" + id);
        return toResponse(banner);
    }

    @Transactional(readOnly = true)
    public BannerResponse findById(Long id) {
        return toResponse(findBanner(id));
    }

    @Transactional
    public BannerResponse create(BannerRequest request) {
        validateImageUrl(request.imageUrl());
        Banner banner = new Banner();
        apply(banner, request);
        return toResponse(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse update(Long id, BannerRequest request) {
        validateImageUrl(request.imageUrl());
        Banner banner = findBanner(id);
        apply(banner, request);
        return toResponse(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse updateStatus(Long id, boolean isActive) {
        Banner banner = findBanner(id);
        banner.setActive(isActive);
        return toResponse(bannerRepository.save(banner));
    }

    @Transactional
    public void delete(Long id) {
        bannerRepository.delete(findBanner(id));
    }

    private void apply(Banner banner, BannerRequest request) {
        validateTargetUrl(request.targetUrl());
        banner.setTitle(request.title().trim());
        banner.setDescription(request.description());
        banner.setImageUrl(request.imageUrl().trim());
        banner.setTargetUrl(request.targetUrl() == null || request.targetUrl().isBlank()
                ? null : request.targetUrl().trim());
        banner.setActive(request.isActive());
        banner.setDisplayOrder(request.displayOrder());
        if (request.campaignId() == null) {
            banner.setCampaign(null);
        } else {
            Campaign campaign = campaignRepository.findById(request.campaignId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Không tìm thấy chiến dịch với id=" + request.campaignId()));
            banner.setCampaign(campaign);
        }
    }

    private void validateImageUrl(String imageUrl) {
        try {
            URI uri = URI.create(imageUrl.trim());
            String scheme = uri.getScheme();
            if (uri.getHost() == null || scheme == null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("Đường dẫn ảnh phải là URL HTTP hoặc HTTPS hợp lệ");
            }
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Đường dẫn ảnh không hợp lệ");
        }
    }

    private void validateTargetUrl(String targetUrl) {
        if (targetUrl == null || targetUrl.isBlank()) return;
        try {
            URI uri = URI.create(targetUrl.trim());
            String scheme = uri.getScheme();
            if (scheme == null && targetUrl.startsWith("/")
                    && !targetUrl.startsWith("//") && !targetUrl.contains("\\")
                    && uri.getRawAuthority() == null) {
                return;
            }
            if (uri.getHost() == null || scheme == null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new BadRequestException("Đường dẫn điều hướng phải là URL HTTP(S) hoặc đường dẫn nội bộ");
            }
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Đường dẫn điều hướng không hợp lệ");
        }
    }

    private Banner findBanner(Long id) {
        return bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với id=" + id));
    }

    private BannerResponse toResponse(Banner banner) {
        Campaign campaign = banner.getCampaign();
        return new BannerResponse(banner.getId(), banner.getTitle(), banner.getDescription(),
                banner.getImageUrl(), banner.getTargetUrl(), campaign == null ? null : campaign.getId(),
                banner.isActive() ? "ACTIVE" : "INACTIVE", banner.isActive(), banner.getDisplayOrder(),
                banner.getCreatedAt(), banner.getUpdatedAt());
    }
}
