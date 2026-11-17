package com.foodthunder.banner.dto;

import java.util.List;

public record BannerPageResponse(
        List<BannerResponse> content,
        long totalElements,
        int totalPages,
        int pageNumber,
        int pageSize,
        boolean last
) {
}
