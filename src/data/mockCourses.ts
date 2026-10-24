import { Course } from '../types';

// Helper to generate dynamic deadlines relative to current time so timers and countdowns are always active
const now = new Date();
const addHours = (hours: number) => new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
const addDays = (days: number) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_COURSES: Course[] = [
  {
    id: 'course-cs3541',
    code: 'CS3541',
    name: 'Advanced Web Programming & Mobile Services',
    faculty: 'Faculty of Science & Technology',
    instructor: 'Dr. T. Mofokeng',
    instructorEmail: 't.mofokeng@nul.ls',
    semester: 'Semester 1 (2026/27)',
    credits: 12,
    color: '#0B192C',
    progressPercent: 68,
    attendancePercent: 92,
    syllabusOverview: 'Architectures for distributed web applications, modern mobile web engineering, service workers, client-side caching, and RESTful service integration with institutional learning management systems.',
    announcements: [
      {
        id: 'ann-cs3541-1',
        courseId: 'course-cs3541',
        courseCode: 'CS3541',
        title: 'Project Submission Portal Open for Milestone 2',
        author: 'Dr. T. Mofokeng',
        date: '2026-10-21',
        content: 'Please ensure your mobile offline caching logic and Service Worker manifest pass offline verification before submission. Late submissions attract a 5% per day penalty.',
        isImportant: true,
        isRead: false,
      },
      {
        id: 'ann-cs3541-2',
        courseId: 'course-cs3541',
        courseCode: 'CS3541',
        title: 'Guest Lecture: Mobile Network Bandwidth Optimization in Southern Africa',
        author: 'Dr. T. Mofokeng',
        date: '2026-10-18',
        content: 'Next Tuesday at 14:00 in S&T Lab 4. Attendance is compulsory for all registered final-year students.',
        isImportant: false,
        isRead: true,
      },
    ],
    modules: [
      {
        id: 'mod-1',
        week: 1,
        title: 'Client-Side Storage Architectures & IndexedDB',
        description: 'Deep dive into browser persistence mechanisms, transaction lifecycles, and caching binary blobs for offline study.',
        resources: [
          {
            id: 'res-cs3541-1',
            courseId: 'course-cs3541',
            title: 'Lecture 04: IndexedDB & CacheStorage Patterns.pdf',
            fileName: 'Lecture04_IndexedDB_Patterns.pdf',
            fileSize: 4200000, // 4.2 MB
            fileType: 'pdf',
            uploadedAt: '2026-10-15',
            topic: 'Storage Engines',
            downloadUrl: '#',
            contentSnippet: `--- LECTURE 04: INDEXEDDB & CACHESTORAGE PATTERNS ---
Faculty of Science & Technology | CS3541

1. WHY INDEXEDDB OVER LOCALSTORAGE?
• LocalStorage is synchronous, blocking the main UI thread during read/writes.
• 5MB storage limit per origin is insufficient for modern educational multimedia and PDFs.
• IndexedDB supports structured cloning, indexed queries, and large binary blobs.

2. TRANSACTION LIFECYCLES:
• Database version change triggers 'onupgradeneeded'.
• Read/Write transactions should be kept short to prevent lock contention.

3. CACHE STRATEGIES FOR UNSTABLE CAMPUS NETWORKS:
• Cache-First for static lecture slides and assets.
• Network-First with Cache Fallback for assignment submission endpoints.`,
          },
          {
            id: 'res-cs3541-2',
            courseId: 'course-cs3541',
            title: 'Lab Exercise 03: Service Worker Registration Code.zip',
            fileName: 'Lab03_ServiceWorker_Code.zip',
            fileSize: 1850000, // 1.85 MB
            fileType: 'code',
            uploadedAt: '2026-10-16',
            topic: 'Hands-on Lab',
            downloadUrl: '#',
            contentSnippet: `// Lab 03: Background Sync and Service Worker Lifecycle
// Self-registering offline gateway handler
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('thuto-v1').then((cache) => {
      return cache.addAll(['/', '/index.html', '/manifest.json']);
    })
  );
});`,
          },
        ],
      },
      {
        id: 'mod-2',
        week: 2,
        title: 'Push Notifications & Web Audio Integration',
        description: 'Implementing background alarms, deadline polling, and user permission management without battery drain.',
        resources: [
          {
            id: 'res-cs3541-3',
            courseId: 'course-cs3541',
            title: 'Lecture 05: Push API & Web Audio Synthesis.pptx',
            fileName: 'Lecture05_Push_Notification_Audio.pptx',
            fileSize: 6100000, // 6.1 MB
            fileType: 'pptx',
            uploadedAt: '2026-10-19',
            topic: 'Push Notifications',
            downloadUrl: '#',
            contentSnippet: `SLIDE 1: Web Notifications API & Permission Model
• Never trigger permissions unprompted on initial page load.
• Explain the value proposition: "Receive assignment deadline countdowns".
• Use Web Audio API for custom audio chimes without external network dependency.`,
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assign-cs3541-1',
        courseId: 'course-cs3541',
        courseCode: 'CS3541',
        title: 'Practical Project: PWA Gateway with Offline Storage',
        description: 'Build a mobile gateway application that allows students to persist authentication, store downloaded course notes locally, and receive deadline alerts at 3d, 24h, 6h, 3h, and 1h intervals.',
        dueDate: addHours(2.5), // Due in 2.5 hours (urgent!)
        points: 100,
        status: 'pending',
        allowSubmissions: true,
      },
      {
        id: 'assign-cs3541-2',
        courseId: 'course-cs3541',
        courseCode: 'CS3541',
        title: 'Research Essay: Offline Educational Technology for African Universities',
        description: 'Critically analyze how low-bandwidth optimization and client-side caching bridge the digital divide in sub-Saharan higher education institutions.',
        dueDate: addDays(3), // Due in 3 days
        points: 50,
        status: 'pending',
        allowSubmissions: true,
      },
    ],
  },
  {
    id: 'course-cs3511',
    code: 'CS3511',
    name: 'Database Systems & Information Retrieval',
    faculty: 'Faculty of Science & Technology',
    instructor: 'Prof. L. Ramoshebi',
    instructorEmail: 'l.ramoshebi@nul.ls',
    semester: 'Semester 1 (2026/27)',
    credits: 12,
    color: '#1E293B',
    progressPercent: 78,
    attendancePercent: 88,
    syllabusOverview: 'Relational query optimization, B+ trees, ACID transactions, distributed consistency, and query processing engine design.',
    announcements: [
      {
        id: 'ann-cs3511-1',
        courseId: 'course-cs3511',
        courseCode: 'CS3511',
        title: 'Midterm Test Results Released on Gradebook',
        author: 'Prof. L. Ramoshebi',
        date: '2026-10-20',
        content: 'Class average was 71.4%. Solutions and grading criteria have been uploaded to Course Resources.',
        isImportant: false,
        isRead: true,
      },
    ],
    modules: [
      {
        id: 'mod-cs3511-1',
        week: 1,
        title: 'Query Optimization & Index Structures',
        description: 'Understanding query execution plans, cost-based optimizers, and indexing strategies.',
        resources: [
          {
            id: 'res-cs3511-1',
            courseId: 'course-cs3511',
            title: 'Lecture 08: Relational Query Optimization.pdf',
            fileName: 'Lecture08_Query_Optimization.pdf',
            fileSize: 3400000,
            fileType: 'pdf',
            uploadedAt: '2026-10-12',
            topic: 'Query Optimization',
            downloadUrl: '#',
            contentSnippet: `--- CS3511: RELATIONAL QUERY OPTIMIZATION ---
Prof. L. Ramoshebi

Key Execution Principles:
1. PUSH SELECTIONS DOWN: Apply filter predicates as early as possible in the AST.
2. JOIN REORDERING: Dynamic programming vs greedy heuristic join algorithms.
3. INDEX SCANS: Choosing Index-Only Scan over Sequential Disk Scan.`,
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assign-cs3511-1',
        courseId: 'course-cs3511',
        courseCode: 'CS3511',
        title: 'Lab 4: SQL Query Execution Plan Tuning',
        description: 'Analyze the given EXPLAIN ANALYZE traces for a multi-table university registrar schema and construct optimal composite indexes.',
        dueDate: addHours(23), // Due in 23 hours!
        points: 40,
        status: 'pending',
        allowSubmissions: true,
      },
    ],
  },
  {
    id: 'course-law1102',
    code: 'LAW1102',
    name: 'Introduction to Lesotho Legal System & Constitutional Law',
    faculty: 'Faculty of Law',
    instructor: 'Adv. M. Letsie',
    instructorEmail: 'm.letsie@nul.ls',
    semester: 'Semester 1 (2026/27)',
    credits: 10,
    color: '#334155',
    progressPercent: 55,
    attendancePercent: 95,
    syllabusOverview: 'Sources of law in Lesotho: customary law, common law (Roman-Dutch), statutes, hierarchy of courts, and constitutional human rights jurisprudence.',
    announcements: [
      {
        id: 'ann-law-1',
        courseId: 'course-law1102',
        courseCode: 'LAW1102',
        title: 'Moot Court Trial Schedule & Team Allocations',
        author: 'Adv. M. Letsie',
        date: '2026-10-17',
        content: 'The appellate moot court sessions will commence in Moot Court Hall B from November 3rd.',
        isImportant: true,
        isRead: false,
      },
    ],
    modules: [
      {
        id: 'mod-law-1',
        week: 1,
        title: 'Dual Legal System: Customary Law & Roman-Dutch Law',
        description: 'Interaction between the Laws of Lerotholi and received colonial common law statutes in contemporary jurisprudence.',
        resources: [
          {
            id: 'res-law-1',
            courseId: 'course-law1102',
            title: 'Reading Pack: Laws of Lerotholi & Constitutional Precedents.pdf',
            fileName: 'Laws_of_Lerotholi_Cases.pdf',
            fileSize: 5100000,
            fileType: 'pdf',
            uploadedAt: '2026-10-10',
            topic: 'Customary Jurisprudence',
            downloadUrl: '#',
            contentSnippet: `--- FACULTY OF LAW: LESOTHO LEGAL SYSTEM ---
Adv. M. Letsie

1. HISTORICAL EVOLUTION:
• Dualism in Lesotho legal jurisprudence established under General Law Proclamation 2B of 1884.
• Recognition of customary law subject to the repugnancy doctrine and modern constitutional supremacy.

2. CORE CASE AUTHORITIES:
• Ramantele v Mmusi and Others (Customary Succession and Equality).
• Lesotho High Court & Court of Appeal jurisdictional hierarchy.`,
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assign-law-1',
        courseId: 'course-law1102',
        courseCode: 'LAW1102',
        title: 'Case Brief: Constitutional Supremacy vs Customary Succession',
        description: 'Prepare a 1,500-word case summary and ratio decidendi analysis evaluating gender equality under the 1993 Constitution.',
        dueDate: addDays(5),
        points: 100,
        status: 'pending',
        allowSubmissions: true,
      },
    ],
  },
  {
    id: 'course-econ2201',
    code: 'ECON2201',
    name: 'Principles of Macroeconomic Policy',
    faculty: 'Faculty of Social Sciences',
    instructor: 'Dr. K. Ntho',
    instructorEmail: 'k.ntho@nul.ls',
    semester: 'Semester 1 (2026/27)',
    credits: 10,
    color: '#0F172A',
    progressPercent: 82,
    attendancePercent: 90,
    syllabusOverview: 'IS-LM model, aggregate demand and supply, monetary policy within the Common Monetary Area (CMA), exchange rate pegs, and inflation dynamics.',
    announcements: [
      {
        id: 'ann-econ-1',
        courseId: 'course-econ2201',
        courseCode: 'ECON2201',
        title: 'Lecture Slides on Central Bank Reserve Requirements Available',
        author: 'Dr. K. Ntho',
        date: '2026-10-19',
        content: 'Check the resources section for the updated econometric data on SACU revenue shares.',
        isImportant: false,
        isRead: true,
      },
    ],
    modules: [
      {
        id: 'mod-econ-1',
        week: 1,
        title: 'Monetary Policy in the CMA & Open Economy Macroeconomics',
        description: 'The Loti-Rand currency peg, capital mobility, and fiscal policy autonomy.',
        resources: [
          {
            id: 'res-econ-1',
            courseId: 'course-econ2201',
            title: 'Lecture 06: The Trilemma & Common Monetary Area.pdf',
            fileName: 'Lecture06_CMA_Macroeconomics.pdf',
            fileSize: 2800000,
            fileType: 'pdf',
            uploadedAt: '2026-10-14',
            topic: 'Monetary Policy',
            downloadUrl: '#',
            contentSnippet: `--- PRINCIPLES OF MACROECONOMICS ---
Dr. K. Ntho

The Open Economy Trilemma:
A country cannot simultaneously maintain:
1. Fixed foreign exchange rate (1 Loti = 1 ZAR)
2. Free capital movement across borders
3. Independent domestic monetary policy

Because Lesotho maintains (1) and (2), the Central Bank of Lesotho closely tracks South African Reserve Bank repo rate decisions.`,
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assign-econ-1',
        courseId: 'course-econ2201',
        courseCode: 'ECON2201',
        title: 'Problem Set 3: IS-LM Equilibrium & Fiscal Multipliers',
        description: 'Calculate the equilibrium national income and interest rate under an expansionary fiscal spending program.',
        dueDate: addDays(6),
        points: 30,
        status: 'submitted',
        submittedAt: '2026-10-21T09:30:00Z',
        allowSubmissions: false,
      },
    ],
  },
  {
    id: 'course-nurs3104',
    code: 'NURS3104',
    name: 'Clinical Epidemiology & Community Health',
    faculty: 'Faculty of Health Sciences',
    instructor: 'Sr. E. Sechele',
    instructorEmail: 'e.sechele@nul.ls',
    semester: 'Semester 1 (2026/27)',
    credits: 14,
    color: '#134E4A',
    progressPercent: 90,
    attendancePercent: 98,
    syllabusOverview: 'Epidemiological study designs, disease surveillance, outbreak investigation, maternal and child health indicators in low-resource primary clinics.',
    announcements: [
      {
        id: 'ann-nurs-1',
        courseId: 'course-nurs3104',
        courseCode: 'NURS3104',
        title: 'Clinical Rotations: District Hospital Transport Schedule',
        author: 'Sr. E. Sechele',
        date: '2026-10-20',
        content: 'The university bus departs Roma campus at 06:30 sharp on Wednesday morning for Scott Hospital, Morija.',
        isImportant: true,
        isRead: false,
      },
    ],
    modules: [
      {
        id: 'mod-nurs-1',
        week: 1,
        title: 'Outbreak Surveillance & Epidemiological Metrics',
        description: 'Calculating incidence, prevalence, odds ratios, and relative risk in rural district populations.',
        resources: [
          {
            id: 'res-nurs-1',
            courseId: 'course-nurs3104',
            title: 'Field Guide: Community Health Surveillance Protocols.pdf',
            fileName: 'FieldGuide_Health_Surveillance.pdf',
            fileSize: 4800000,
            fileType: 'pdf',
            uploadedAt: '2026-10-11',
            topic: 'Field Protocols',
            downloadUrl: '#',
            contentSnippet: `--- FACULTY OF HEALTH SCIENCES ---
Sr. E. Sechele

Field Surveillance Protocols:
1. Active vs Passive Disease Reporting
2. Case Definition & Index Case Tracing
3. Calculating Case Fatality Rate (CFR) vs Infection Fatality Rate (IFR)`,
          },
        ],
      },
    ],
    assignments: [
      {
        id: 'assign-nurs-1',
        courseId: 'course-nurs3104',
        courseCode: 'NURS3104',
        title: 'Epidemiology Field Report: Primary Health Care Audit',
        description: 'Submit your compiled clinic observation audit report with immunization coverage statistical graphs.',
        dueDate: addHours(6), // Due in 6 hours!
        points: 100,
        status: 'pending',
        allowSubmissions: true,
      },
    ],
  },
];
