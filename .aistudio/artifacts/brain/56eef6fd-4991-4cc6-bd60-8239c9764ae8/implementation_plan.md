# Thuto Mobile — University Learning Portal Gateway

A modern, fluid, touch-optimized Android PWA gateway for the National University of Lesotho (NUL) Thuto Sakai Learning Portal. Delivers persistent authentication, offline-first course materials caching, university-wide multi-course navigation across all faculties and departments, and reliable countdown push notifications for assignment deadlines.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> - **University-Wide Scope**: Fully generalized for any degree program, faculty, and enrolled course across NUL Thuto (Science & Technology, Law, Humanities, Health Sciences, Education, Social Sciences), with semester filters and custom course search.
> - **Visual Aesthetic**: Academic Navy (`#0B192C` / `#1E293B`) and warm Golden Amber (`#F59E0B`), blending the tactile rounded-card ergonomics of the smart home dashboard with the crisp typographic minimalism of the "learn up" mobile concept.
> - **Portal Gateway**: Dual-engine connection supporting live Thuto Sakai portal authentication (`https://thuto.nul.ls/portal`) with seamless demo student fallback covering multiple diverse faculty courses.
> - **Deadline Push Notifications**: Smart automated countdown alerts scheduled at **3 days, 24 hours, 6 hours, 3 hours, and 1 hour** before assignment submission cutoffs via the Web Notifications API and Service Worker.

---

### 1. Overview & Core Concept

- **What It Does**: Transforms the desktop-heavy university Sakai portal into an intuitive, high-performance mobile gateway for all enrolled university students. Students can browse all registered courses, download lecture materials for offline study in campus network dead zones, track academic deadlines with visual countdown dials, and receive background push alerts before due dates.
- **Target Audience**: University students across all faculties and years needing fast mobile navigation without continuous relogging and guaranteed offline document access.
- **Key Value**: Persistent authentication, offline course document caching, and reliable multi-interval deadline notifications.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Persistent Authentication & Quick Unlock**:
   - Students enter their university student credentials or explore the multi-course demo student portal.
   - Credentials and portal session tokens are securely persisted in local storage with optional PIN or biometric quick unlock.
2. **Campus Dashboard & Multi-Course Directory**:
   - Universal course cards across disciplines (Computing, Engineering, Law, Accounting, Statistics, Public Health).
   - Semester filters (Semester 1, Semester 2, Past Semesters) and search.
   - Course overview dials showing overall progress, upcoming submissions, and cached offline materials.
3. **Course Hub & Offline Material Caching**:
   - Course workspace: Announcements, Syllabus, Resources & Lecture Slides, Assignments, and Grades.
   - 1-tap offline download button on any resource file (PDF, PPTX, DOCX, ZIP) saved into IndexedDB with instant in-app offline document reader.
   - Storage monitor showing device space consumed with 1-tap cache clear or selective removal.
4. **Assignment Center & Countdown Notifications**:
   - Universal deadline timeline sorted by urgency: *Due Today*, *Due This Week*, and *Upcoming*.
   - Live countdown clocks (Days : Hours : Minutes : Seconds) and submission state.
   - Notification engine with granular alerts for 3d, 24h, 6h, 3h, and 1h intervals, test alert simulation, and audio chimes.
5. **Fluid Mobile Ergonomics & PWA Installability**:
   - Fixed bottom tab bar (Dashboard, Assignments, Offline Hub, Alerts, Profile).
   - In-app Android / iOS PWA install button with guided instructions.
   - Responsive design: native phone viewport on mobile, optional interactive phone frame toggle on desktop.

---

### 3. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THUTO MOBILE PWA GATEWAY                        │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
      ┌──────────────────────────────┼──────────────────────────────┐
      │                              │                              │
┌─────▼────────────────┐   ┌─────────▼────────────┐   ┌─────────────▼──────┐
│  State & Persistence │   │ UI & Mobile Views    │   │ Notification Engine│
├──────────────────────┤   ├──────────────────────┤   ├────────────────────┤
│ • Student Session    │   │ • Bottom Tab Bar     │   │ • Web Notifications│
│ • Universal Courses  │   │ • Campus Dashboard   │   │ • 3d, 24h, 6h, 3h, │
│ • IndexedDB Files    │   │ • Assignment Tracker │   │   1h Countdown Prober
│ • Offline Cache Sync │   │ • Offline Downloads  │   │ • In-App Audio Chime
│ • Notification Rules │   │ • Student Profile    │   │ • Push Simulation  │
└─────┬────────────────┘   └─────────┬────────────┘   └─────────────┬──────┘
      │                              │                              │
      └──────────────────────────────┼──────────────────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │  Sakai Live Gateway & Demo Data │
                    │ (Universal NUL Thuto REST APIs) │
                    └─────────────────────────────────┘
```
