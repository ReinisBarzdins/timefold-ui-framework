package timefold.ui.backend.vehiclerouting.domain.dto;


import timefold.ui.backend.vehiclerouting.domain.VehicleRoutePlan;

public record ApplyRecommendationRequest(VehicleRoutePlan solution, String visitId, String vehicleId, int index) {
}
