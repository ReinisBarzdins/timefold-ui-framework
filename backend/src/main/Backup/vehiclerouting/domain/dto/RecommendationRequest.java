package timefold.ui.backend.vehiclerouting.domain.dto;


import timefold.ui.backend.vehiclerouting.domain.VehicleRoutePlan;

public record RecommendationRequest(VehicleRoutePlan solution, String visitId) {
}
