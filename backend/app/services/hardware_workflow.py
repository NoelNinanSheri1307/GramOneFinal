"""Hardware Workflow Service — handles multi-sensor telemetry deduplication & issue creation,
and RFID employee attendance sign-in/sign-out logic.
"""
from datetime import datetime, timedelta, timezone
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import GramOneError
from app.models import Attendance, Device, Issue, IssueEvidence, Notification, User
from app.models.enums import (
    DeviceType,
    EvidenceType,
    IssueCategory,
    IssueSource,
    IssueStatus,
    NotificationType,
    UserRole,
)
from app.schemas.hardware import RFIDScanRequest, RFIDScanResponse, TelemetryIngest

logger = logging.getLogger(__name__)


class HardwareWorkflowService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def process_telemetry(self, device: Device, payload: TelemetryIngest) -> str:
        """Evaluate telemetry thresholds and deterministically generate Panchayat alert/issue if needed.

        Uses deduplication: will not create duplicate issues if an open issue exists for this device
        within the last 6 hours.
        """
        warning_level = "normal"
        issue_title = None
        category = IssueCategory.WATER
        description = None

        if payload.emergency_pressed:
            warning_level = "critical"
            issue_title = f"EMERGENCY BUTTON PRESSED: Device {device.device_id}"
            category = IssueCategory.DISASTER
            description = f"Physical emergency button triggered at device {device.device_id}."
        elif payload.gas_anomaly:
            warning_level = "critical"
            issue_title = f"Gas Anomaly Detected: Device {device.device_id}"
            category = IssueCategory.ENVIRONMENT
            description = f"Gas anomaly threshold exceeded at telemetry node {device.device_id}."
        elif payload.water_level_percent is not None and payload.water_level_percent < 20.0:
            warning_level = "critical"
            issue_title = f"Critical Low Water Tank Level ({payload.water_level_percent:.1f}%): {device.device_id}"
            category = IssueCategory.WATER
            description = f"Water level dropped to {payload.water_level_percent:.1f}% on node {device.device_id}."
        elif payload.waste_bin_level_percent is not None and payload.waste_bin_level_percent > 85.0:
            warning_level = "critical"
            issue_title = f"Waste Bin Overflow Risk ({payload.waste_bin_level_percent:.1f}%): {device.device_id}"
            category = IssueCategory.WASTE
            description = f"Waste bin filled to {payload.waste_bin_level_percent:.1f}% on node {device.device_id}."

        if warning_level == "critical" and issue_title:
            self._create_deduplicated_hardware_issue(device, category, issue_title, description)

        return warning_level

    def _create_deduplicated_hardware_issue(
        self, device: Device, category: IssueCategory, title: str, description: str
    ) -> Issue | None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=6)
        existing = self.db.scalars(
            select(Issue)
            .where(
                Issue.source == IssueSource.HARDWARE,
                Issue.category == category,
                Issue.created_at >= cutoff,
                Issue.status != IssueStatus.RESOLVED,
            )
            .order_by(Issue.created_at.desc())
        ).first()

        if existing:
            logger.info(f"Hardware issue already open for device {device.device_id}: #{existing.id}")
            return existing

        ref_number = f"HW-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        issue = Issue(
            reference=ref_number,
            title=title,
            description=description,
            category=category,
            source=IssueSource.HARDWARE,
            status=IssueStatus.OPEN,
            village_id=device.village_id,
            original_language="en",
        )
        self.db.add(issue)
        self.db.flush()

        evidence = IssueEvidence(
            issue_id=issue.id,
            evidence_type=EvidenceType.HARDWARE_TELEMETRY,
            source_reference=device.device_id,
            description=f"Automated sensor anomaly report from physical node {device.device_id}.",
        )
        self.db.add(evidence)

        # Send Panchayat Alert Notifications
        panchayat_users = self.db.scalars(
            select(User).where(
                User.role == UserRole.PANCHAYAT,
                User.is_active == True,  # noqa: E712
            )
        ).all()

        for p_user in panchayat_users:
            if device.village_id is None or p_user.village_id is None or p_user.village_id == device.village_id:
                notif = Notification(
                    user_id=p_user.id,
                    type=NotificationType.EMERGENCY_ISSUE if category == IssueCategory.DISASTER else NotificationType.URGENT_ISSUE,
                    title=f"Hardware Alert: {title}",
                    message=description,
                )
                self.db.add(notif)

        self.db.commit()
        self.db.refresh(issue)
        return issue

    def process_rfid_scan(self, payload: RFIDScanRequest) -> RFIDScanResponse:
        """Validate employee RFID identifier and record sign-in or sign-out attendance."""
        card_id = payload.rfid_card_id.strip()
        user = self.db.scalars(
            select(User).where(
                User.rfid_card_id == card_id,
                User.is_active == True,  # noqa: E712
            )
        ).first()

        if not user or user.role != UserRole.PANCHAYAT_EMPLOYEE:
            raise GramOneError(
                code="unauthorized_rfid_card",
                message=f"RFID tag '{card_id}' is not assigned to an active Panchayat Employee.",
                status_code=403,
            )

        now = datetime.now(timezone.utc)
        # Duplicate read protection: check for a scan within the last 60 seconds
        recent = self.db.scalars(
            select(Attendance)
            .where(
                Attendance.user_id == user.id,
                Attendance.sign_in_time >= now - timedelta(seconds=60),
            )
        ).first()

        if recent:
            status_str = "SIGNED_OUT" if recent.sign_out_time else "SIGNED_IN"
            return RFIDScanResponse(
                user_id=user.id,
                user_name=user.name,
                rfid_card_id=card_id,
                status=status_str,
                message="Duplicate scan suppressed (within 60s).",
                timestamp=now,
            )

        # Check for an open attendance session (signed in, no sign_out_time)
        open_session = self.db.scalars(
            select(Attendance)
            .where(
                Attendance.user_id == user.id,
                Attendance.sign_out_time == None,  # noqa: E711
            )
            .order_by(Attendance.sign_in_time.desc())
        ).first()

        if open_session:
            # Sign out
            open_session.sign_out_time = now
            self.db.commit()
            return RFIDScanResponse(
                user_id=user.id,
                user_name=user.name,
                rfid_card_id=card_id,
                status="SIGNED_OUT",
                message=f"Employee {user.name} signed OUT successfully.",
                timestamp=now,
            )
        else:
            # Sign in
            new_session = Attendance(
                user_id=user.id,
                rfid_card_id=card_id,
                village_id=user.village_id,
                sign_in_time=now,
            )
            self.db.add(new_session)
            self.db.commit()
            return RFIDScanResponse(
                user_id=user.id,
                user_name=user.name,
                rfid_card_id=card_id,
                status="SIGNED_IN",
                message=f"Employee {user.name} signed IN successfully.",
                timestamp=now,
            )
