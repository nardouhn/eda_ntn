"""Cấu hình Demand Pattern dùng chung cho toàn bộ backend."""

from __future__ import annotations

from datetime import date


# Ngưỡng được chốt từ phân tích ADI/CV² ở cấp Base SKU + Branch.
ADI_THRESHOLD = 2.333333
CV2_THRESHOLD = 1.007962
THRESHOLD_UPDATED_AT = date(2026, 8, 10)

MIN_HISTORY_MONTHS = 12
MIN_POSITIVE_MONTHS = 3
INACTIVE_RECENT_MONTHS = 12
RELAUNCH_GAP_MONTHS = 6

PATTERN_OPTIONS = (
    "Smooth",
    "Erratic",
    "Intermittent",
    "Lumpy",
    "Insufficient-New",
    "Excluded-Inactive",
)
