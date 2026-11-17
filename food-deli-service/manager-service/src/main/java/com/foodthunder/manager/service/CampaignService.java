package com.foodthunder.manager.service;

import com.foodthunder.manager.dto.CampaignRequest;
import com.foodthunder.manager.dto.CampaignResponse;
import com.foodthunder.manager.entity.Banner;
import com.foodthunder.manager.entity.Campaign;
import com.foodthunder.manager.exception.BadRequestException;
import com.foodthunder.manager.exception.ResourceNotFoundException;
import com.foodthunder.manager.repository.BannerRepository;
import com.foodthunder.manager.repository.CampaignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CampaignService {
    private final CampaignRepository campaignRepository;
    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public List<CampaignResponse> findAll() {
        return campaignRepository.findAllByOrderByStartDateDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse findById(Long id) {
        return toResponse(findCampaign(id));
    }

    @Transactional
    public CampaignResponse create(CampaignRequest request) {
        validateDates(request);
        Campaign campaign = new Campaign();
        apply(campaign, request);
        return toResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public CampaignResponse update(Long id, CampaignRequest request) {
        validateDates(request);
        Campaign campaign = findCampaign(id);
        apply(campaign, request);
        return toResponse(campaignRepository.save(campaign));
    }

    @Transactional
    public void delete(Long id) {
        Campaign campaign = findCampaign(id);
        List<Banner> banners = bannerRepository.findAllByCampaignId(id);
        banners.forEach(banner -> banner.setCampaign(null));
        bannerRepository.saveAll(banners);
        campaignRepository.delete(campaign);
    }

    private void validateDates(CampaignRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BadRequestException("Thời gian kết thúc phải bằng hoặc sau thời gian bắt đầu");
        }
    }

    private void apply(Campaign campaign, CampaignRequest request) {
        campaign.setName(request.name().trim());
        campaign.setDescription(request.description());
        campaign.setStartDate(request.startDate());
        campaign.setEndDate(request.endDate());
        campaign.setStatus(request.status());
    }

    private Campaign findCampaign(Long id) {
        return campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chiến dịch với id=" + id));
    }

    private CampaignResponse toResponse(Campaign campaign) {
        return new CampaignResponse(campaign.getId(), campaign.getName(), campaign.getDescription(),
                campaign.getStartDate(), campaign.getEndDate(), campaign.getStatus(),
                campaign.getCreatedAt(), campaign.getUpdatedAt());
    }
}
