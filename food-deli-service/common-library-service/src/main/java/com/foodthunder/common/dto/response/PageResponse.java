package com.foodthunder.common.dto.response;

import java.util.List;

public record PageResponse<T>(
        List<T> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PageResponse<T> of(List<T> content, int pageNumber, int pageSize, long totalElements, int totalPages, boolean last) {
        return new PageResponse<>(content, pageNumber, pageSize, totalElements, totalPages, last);
    }
}

