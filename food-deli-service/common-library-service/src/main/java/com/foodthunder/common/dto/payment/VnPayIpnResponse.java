package com.foodthunder.common.dto.payment;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VnPayIpnResponse {

    @JsonProperty("RspCode")
    private String rspCode;

    @JsonProperty("Message")
    private String message;

    public static VnPayIpnResponse success() {
        return new VnPayIpnResponse("00", "Confirm Success");
    }

    public static VnPayIpnResponse orderNotFound() {
        return new VnPayIpnResponse("01", "Order not found");
    }

    public static VnPayIpnResponse alreadyConfirmed() {
        return new VnPayIpnResponse("02", "Order already confirmed");
    }

    public static VnPayIpnResponse invalidAmount() {
        return new VnPayIpnResponse("04", "Invalid amount");
    }

    public static VnPayIpnResponse invalidChecksum() {
        return new VnPayIpnResponse("97", "Invalid Checksum");
    }

    public static VnPayIpnResponse otherError() {
        return new VnPayIpnResponse("99", "Unknown error");
    }
}

