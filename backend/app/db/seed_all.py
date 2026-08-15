"""Comprehensive database seeder for GramOne.

Populates all roles (Citizen, Panchayat Admin, Field Worker, CSR Partner)
with realistic issues, projects, impact cases, attendance records, and
community notices so no dashboard displays 0 or empty lists.
"""
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
import app.models

from app.models.enums import (
    UserRole, IssueCategory, IssueStatus, IssueSource, EvidenceType,
    ImpactCaseStatus, ProjectStatus, SponsorshipStatus,
    NoticeType, NoticeSource, SafetySection, SafetyResourceType,
    PublishStatus, NotificationType
)
from app.models.user import User
from app.models.village import Village
from app.models.issue import Issue, IssueEvidence, IssueHistory
from app.models.impact import ImpactCase
from app.models.project import Project, CSRProfile, Sponsorship
from app.models.community import CommunityNotice, SafetyResource
from app.models.attendance import Attendance
from app.models.notification import Notification
from app.core.security import hash_password


def seed_all():
    db: Session = SessionLocal()
    try:
        print("Seeding database with rich demonstration data...")
        h_pass = hash_password("Admin1234#")

        # 1. Villages
        v1 = db.query(Village).filter(Village.name == "Kaveri Gram Panchayat").first()
        if not v1:
            v1 = Village(
                name="Kaveri Gram Panchayat",
                district="Mandya",
                state="Karnataka",
                latitude=12.5218,
                longitude=76.8951
            )
            db.add(v1)
            db.flush()

        # 2. Users
        def get_or_create_user(email, name, role):
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    name=name,
                    email=email,
                    password_hash=h_pass,
                    role=role,
                    village_id=v1.id,
                    is_active=True
                )
                db.add(u)
                db.flush()
            return u

        admin = get_or_create_user("admin@gmail.com", "Panchayat Administrator", UserRole.PANCHAYAT)
        admin2 = get_or_create_user("admin@gramone.gov.in", "Gram Panchayat Executive Officer", UserRole.PANCHAYAT)
        citizen = get_or_create_user("citizen@gramone.gov.in", "Ramesh Patel (Citizen)", UserRole.CITIZEN)
        worker = get_or_create_user("worker@gramone.gov.in", "Basavaraju (Field Employee)", UserRole.PANCHAYAT_EMPLOYEE)
        worker2 = get_or_create_user("employee.field@gramone.org", "Suresh Kumar (Field Tech)", UserRole.PANCHAYAT_EMPLOYEE)
        csr = get_or_create_user("csr@gramone.gov.in", "GreenBridge CSR Foundation", UserRole.CSR)

        # 3. CSR Profile
        csr_prof = db.query(CSRProfile).filter(CSRProfile.user_id == csr.id).first()
        if not csr_prof:
            csr_prof = CSRProfile(
                user_id=csr.id,
                org_name="GreenBridge CSR Foundation",
                contact_name="Anita Sharma",
                contact_email="csr@gramone.gov.in",
                description="Supporting sustainable water, solar power, and rural digital infrastructure.",
                focus_areas=["Water", "Energy", "Education"],
                preferred_state="Karnataka"
            )
            db.add(csr_prof)
            db.flush()

        # 4. Issues
        now = datetime.now(timezone.utc)
        issues_data = [
            {
                "title": "Drinking Water Pipeline Leak near Primary School",
                "description": "Main drinking water pipeline near Rampur Primary School has burst. Water is leaking into the street, leaving 250 families without supply.",
                "category": IssueCategory.WATER,
                "status": IssueStatus.ASSIGNED,
                "reporter": citizen,
                "assignee": worker,
            },
            {
                "title": "Main Village Access Road Potholes & Storm Drainage Erosion",
                "description": "Heavy rains damaged a 300m stretch of the connecting asphalt road. Deep potholes cause vehicle hazards.",
                "category": IssueCategory.CIVIC,
                "status": IssueStatus.IN_PROGRESS,
                "reporter": citizen,
                "assignee": worker,
            },
            {
                "title": "Market Street Drainage Overflow & Waste Blockage",
                "description": "Solid waste blockage in storm drain causing foul odor and water logging near local vegetable market.",
                "category": IssueCategory.SANITATION,
                "status": IssueStatus.REPORTED,
                "reporter": citizen,
                "assignee": None,
            },
            {
                "title": "Solar Streetlight Battery Replacement & Circuit Fix",
                "description": "Solar streetlight unit #14 near Community Hall is non-functional at night.",
                "category": IssueCategory.CIVIC,
                "status": IssueStatus.RESOLVED,
                "reporter": citizen,
                "assignee": worker2,
            },
            {
                "title": "Community Borewell Pump Motor Failure",
                "description": "Submersible pump motor stopped working due to voltage fluctuation.",
                "category": IssueCategory.WATER,
                "status": IssueStatus.FIELD_COMPLETED,
                "reporter": citizen,
                "assignee": worker,
            }
        ]

        created_issues = []
        for idata in issues_data:
            iss = db.query(Issue).filter(Issue.title == idata["title"]).first()
            if not iss:
                iss = Issue(
                    village_id=v1.id,
                    reported_by=idata["reporter"].id,
                    assigned_to=idata["assignee"].id if idata["assignee"] else None,
                    title=idata["title"],
                    description=idata["description"],
                    category=idata["category"],
                    source=IssueSource.CITIZEN,
                    status=idata["status"],
                    created_at=now - timedelta(days=2)
                )
                db.add(iss)
                db.flush()

                # Add timeline history event
                h1 = IssueHistory(
                    issue_id=iss.id,
                    changed_by=idata["reporter"].id,
                    previous_status=None,
                    new_status=iss.status,
                    note=f"Issue registered: {idata['title']}"
                )
                db.add(h1)

                # Add evidence item
                ev = IssueEvidence(
                    issue_id=iss.id,
                    evidence_type=EvidenceType.CITIZEN_REPORT,
                    source_reference="https://images.unsplash.com/photo-1584467735871-8e85353a8413?w=800",
                    description="Initial report inspection photo"
                )
                db.add(ev)

            created_issues.append(iss)

        # 5. Impact Cases & Projects
        imp1 = db.query(ImpactCase).filter(ImpactCase.title == "Primary School Rooftop Solarization & Pure Water System").first()
        if not imp1:
            imp1 = ImpactCase(
                village_id=v1.id,
                title="Primary School Rooftop Solarization & Pure Water System",
                summary="Install 5kW Solar Panels and RO Water Purification Plant serving 400 school children and nearby Anganwadi.",
                category=IssueCategory.WATER,
                status=ImpactCaseStatus.OPEN,
                affected_population=1200,
                sdg="SDG 6",
                assigned_to=admin.id
            )
            db.add(imp1)
            db.flush()

        proj1 = db.query(Project).filter(Project.name == "Rural Clean Water & Solar Infrastructure Project").first()
        if not proj1:
            proj1 = Project(
                village_id=v1.id,
                impact_case_id=imp1.id,
                name="Rural Clean Water & Solar Infrastructure Project",
                description="Comprehensive rural transformation supplying clean drinking water and solar power backup.",
                estimated_budget=800000.0,
                status=ProjectStatus.SPONSORED
            )
            db.add(proj1)
            db.flush()

        # Sponsorship
        spons = db.query(Sponsorship).filter(Sponsorship.csr_profile_id == csr_prof.id).first()
        if not spons:
            spons = Sponsorship(
                csr_profile_id=csr_prof.id,
                project_id=proj1.id,
                amount=350000.0,
                support_type="Financial & Technical",
                status=SponsorshipStatus.ACTIVE
            )
            db.add(spons)

        # 6. Community Notices & Safety
        n1 = db.query(CommunityNotice).filter(CommunityNotice.title == "Gram Sabha General Body Meeting").first()
        if not n1:
            n1 = CommunityNotice(
                village_id=v1.id,
                created_by=admin.id,
                title="Gram Sabha General Body Meeting",
                content="All villagers are invited to attend the quarterly Gram Sabha meeting at Panchayat Hall this Sunday at 10:00 AM.",
                notice_type=NoticeType.ANNOUNCEMENT,
                source_type=NoticeSource.PANCHAYAT,
                status=PublishStatus.PUBLISHED
            )
            db.add(n1)

        n2 = db.query(CommunityNotice).filter(CommunityNotice.title == "Free Agricultural Soil Testing & Advisory Camp").first()
        if not n2:
            n2 = CommunityNotice(
                village_id=v1.id,
                created_by=admin.id,
                title="Free Agricultural Soil Testing & Advisory Camp",
                content="Department of Agriculture is conducting a free soil testing and crop insurance registration drive tomorrow.",
                notice_type=NoticeType.NEWS,
                source_type=NoticeSource.PANCHAYAT,
                status=PublishStatus.PUBLISHED
            )
            db.add(n2)

        sr1 = db.query(SafetyResource).filter(SafetyResource.title == "Women Safety & Emergency Helpline Contacts").first()
        if not sr1:
            sr1 = SafetyResource(
                title="Women Safety & Emergency Helpline Contacts",
                content="Local Police Station: 112 | Women Helpline: 181 | Gram Panchayat Safety Cell available 24/7.",
                section=SafetySection.WOMENS_SAFETY,
                resource_type=SafetyResourceType.HELP_RESOURCE,
                status=PublishStatus.PUBLISHED
            )
            db.add(sr1)

        # 7. Attendance for Field Worker
        att = db.query(Attendance).filter(Attendance.user_id == worker.id).first()
        if not att:
            att = Attendance(
                user_id=worker.id,
                rfid_card_id="RFID-KA-4921",
                village_id=v1.id,
                sign_in_time=now - timedelta(hours=3)
            )
            db.add(att)

        # 8. Notifications for all roles
        notifs = [
            (admin.id, "New Issue Reported", "A high urgency water pipeline leak issue has been submitted."),
            (citizen.id, "Issue Status Updated", "Your reported issue 'Borewell Pump Motor' status changed to Field Completed."),
            (worker.id, "New Work Assignment", "You have been assigned to 'Drinking Water Pipeline Leak' by Panchayat Admin."),
            (csr.id, "Sponsorship Milestone", "Project 'Rural Clean Water' solarization phase 1 completed.")
        ]
        for uid, title, msg in notifs:
            n = Notification(
                user_id=uid,
                type=NotificationType.ISSUE_STATUS,
                title=title,
                message=msg,
                is_read=False
            )
            db.add(n)

        db.commit()
        print("DATABASE SEEDED SUCCESSFULLY! All roles populated with active data.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_all()
