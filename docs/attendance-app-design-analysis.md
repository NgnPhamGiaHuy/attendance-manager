# **Advanced Architectures in Educational Attendance Systems: A Comparative Analysis and Design Blueprint**

## **Executive Analytical Summary**

The landscape of educational attendance tracking has evolved significantly from rudimentary manual ledgers to complex, integrated Learning Management Systems (LMS) and specialized Software-as-a-Service (SaaS) applications. A comprehensive analysis of industry leaders—including Google Classroom, Microsoft Teams, Moodle, Canvas LMS, Schoology, and modern SaaS alternatives like Qwickly and Jibble—reveals a stark dichotomy in product design philosophies. On one end of the spectrum, monolithic platforms such as Canvas and Google Classroom prioritize simplicity and seamless ecosystem integration, often at the cost of granular customization and grading flexibility. On the other end, open-source architectures like Moodle and specialized integration tools like Qwickly offer immense programmatic flexibility in grading calculations and status definitions, yet carry a substantially heavier cognitive load for end-users and administrators.

For the development of a modern, Firebase-backed attendance management application, the analysis indicates that the most significant market gap lies in combining the profound algorithmic flexibility of Moodle’s grading engine with the seamless, real-time user experience and biometric security found in modern mobile-first SaaS tools. Existing platforms universally struggle with complex edge cases, including asynchronous enrollment changes, retroactive status mutations, the preservation of historical data post-withdrawal, and complex penalty calculation logic. By leveraging a NoSQL document database structure optimized for high-read throughput, event-driven serverless functions, and real-time state synchronization via WebSockets, a new platform can circumvent the rigid architectural limitations that currently plague legacy relational systems. The following analysis details the ontological structures, permission models, data schemas, and technical architectures of existing platforms, culminating in a definitive blueprint for a next-generation attendance application.

## **1\. Product Design and Structural Ontologies**

The structural ontology of an attendance system defines how it maps real-world educational constructs—institutions, courses, sections, sessions, and students—into digital objects. The platforms analyzed exhibit varying degrees of hierarchical complexity and flexibility in their product design.

Canvas represents a strictly hierarchical model where attendance is deeply embedded into the grading architecture rather than existing as a standalone module. In Canvas, the "Roll Call" attendance tool operates as an integrated Learning Tools Interoperability (LMS LTI) application.1 It automatically generates a single assignment within the course gradebook to represent the entirety of the attendance record, defaulting to a 100-point scale.2 This design simplifies the user experience by centralizing the grade but severely limits the instructor's ability to compartmentalize attendance by grading periods, separate lecture versus laboratory sessions, or exclude specific dates without affecting the singular global assignment. The system lacks the flexibility to seamlessly drop low attendance scores or manage complex, multi-tiered attendance requirements.3

Schoology maps attendance directly to the course section level, utilizing a unique sparse data model approach for its user interface. Schoology considers empty cells in the attendance ledger as "Present" marks by default, requiring the instructor only to intervene when a student exhibits a negative status such as Absent, Late, or Excused.4 This "exception-based" reporting design significantly reduces the administrative burden on the educator, particularly in large classes, but creates systemic ambiguity in the underlying data regarding whether attendance was actively verified by the instructor or simply ignored and left to default.

Conversely, ecosystem-based platforms like Google Classroom and Microsoft Teams for Education lack native, robust attendance ledgers designed for longitudinal analysis. Google Classroom relies heavily on fragmented workflows, such as parsing Google Meet duration logs 5, utilizing Google Forms as a daily synchronous check-in mechanism 6, or depending entirely on third-party Chrome extensions like RollCall or Meet Attendance to bridge the functional gap.8 Microsoft Teams for Education similarly delegates attendance tracking to the communication layer, utilizing SharePoint lists and Microsoft Power Automate to generate flat CSV exports of meeting join and leave timestamps.10 Neither Google nor Microsoft provides a dedicated, native relational matrix for long-term classroom attendance analysis without the deployment of external data warehousing solutions.

Modern SaaS tools such as Jibble, Truein, and Qwickly divorce attendance from the rigid course structures of a traditional LMS, treating attendance tracking as an independent, continuous event stream.11 They support multifaceted data collection methodologies. Qwickly, for instance, allows for traditional "List View" batch processing by the instructor, but also introduces a "Check-In" mode where students self-authenticate via dynamically generated PINs, rotating QR codes, or physical ID card swipes.12 This dual-mode product design bridges the gap between instructor-led verification and student-led autonomous check-ins, a feature highly desirable for managing large-scale university lecture halls.

| Platform | Structural Hierarchy | Recording Methodology | System Flexibility |
| :---- | :---- | :---- | :---- |
| **Canvas LMS** | Course ![][image1] Global Assignment | Per Student, Batch "Mark All" | Low; single monolithic assignment |
| **Moodle** | Course ![][image1] Activity ![][image1] Session | Per Student, Self-Check-In | High; infinite sessions and activities |
| **Schoology** | Course ![][image1] Section | Exception-based (blanks are present) | Moderate; tied strictly to sections |
| **Google Classroom** | Extracted from Meet logs or Forms | Automated logging, external forms | Low; no native relational ledger |
| **Microsoft Teams** | Meeting Event ![][image1] CSV Export | Automated join/leave timestamps | Low; relies on external SharePoint lists |
| **Qwickly (SaaS)** | Course ![][image1] Independent Session | PIN, QR, Card Reader, Batch | Very High; decoupled input methods |

## **2\. Permission Systems and Role-Based Access Control**

A robust attendance application must enforce strict Role-Based Access Control (RBAC) to maintain data integrity, prevent academic fraud, and comply with educational privacy regulations, such as the Family Educational Rights and Privacy Act (FERPA).

In standard Learning Management Systems, roles are universally categorized into Administrator, Instructor (Owner), Teaching Assistant (Editor), and Student (Viewer). The Instructor or Owner possesses full Create, Read, Update, Delete (CRUD) capabilities over the course configuration, session creation, status definitions, and the underlying grading formulas. Teaching Assistants are typically granted scope-limited access. In Moodle and Canvas, Teaching Assistants can mark attendance and modify records for specific sections to which they are assigned, but they are generally restricted from altering the fundamental grading weights, modifying the global total points, or adding custom status enumerations.1 The Student role is restricted strictly to read-only access of their own aggregated historical data.16

Preventing unauthorized state mutations is a critical challenge, particularly in systems that permit student self-reporting. Systems employ varying technical and physical security measures to mitigate fraud. When utilizing student self-check-in, the student role is granted a highly restricted, time-bound "Update" capability limited exclusively to their own boolean state for a specific, actively running session.16 To prevent proxy attendance—where a student marks an absent peer as present—Qwickly utilizes dynamic, time-expiring QR codes and rotating PINs that ensure students cannot remotely verify attendance without being physically present to observe the code.12 Moodle incorporates network-level security by allowing administrators to restrict self-marking based on specific subnet IP addresses, ensuring the student device is connected to the physical classroom's local area network.18 Furthermore, modern SaaS platforms increasingly employ geofencing parameters and biometric validation (facial recognition) as a secondary authentication layer, effectively binding the physical identity and GPS coordinates of the user to their digital identity token.11

For a Firebase-backed architecture, relying on client-side routing logic to hide administrative panels is a severe anti-pattern that leads to critical vulnerabilities. These permission tiers must be strictly enforced server-side using Firebase Custom Claims embedded within JSON Web Tokens (JWTs), coupled with granular Firestore Security Rules. A secure architecture explicitly validates the request.auth.token.role against the document ID being mutated. For instance, a security rule must verify that an incoming write request to an attendance\_records document is either originating from an authenticated owner or editor of that specific class\_id, or that the request is a self-check-in occurring within the strictly defined start and end timestamps of an active session document.

## **3\. Attendance Status Typologies and State Logic**

The analytical granularity of an attendance tracking system is inherently dictated by the flexibility of the status typologies allowed by its architecture. The platforms analyzed reveal a spectrum ranging from rigidly hardcoded enumerations to fully semantic, user-defined dictionaries.

Canvas represents the most rigid extreme of the spectrum. The Canvas Roll Call tool hardcodes four unalterable statuses: Present, Absent, Late, and Unmarked (Excused).1 While the instructor can adjust the percentage penalty applied to the "Late" status within the configuration settings, the nomenclature and the underlying binary logic cannot be expanded or renamed.23 This architectural rigidity frequently causes friction for educators who require distinct tracking for varying types of absences, such as distinguishing between a "School-sponsored athletic event," a "Medical Leave," or a "Tardy greater than 15 minutes".3 Schoology utilizes a similar four-status paradigm, mapping Present, Absent, Late, and Excused to the integer values 1, 2, 3, and 4 within its REST API architecture.26

Conversely, Moodle and Qwickly treat attendance statuses as customizable dictionaries, allowing for semantic mapping. Moodle’s attendance module allows the instructor to define an infinite array of custom statuses, assigning an acronym, a localized description, and a specific grade weight to each.16 Instructors must carefully manage the "Status Set" configuration, noting that system interfaces often require distinct "Add" and "Update" logic that can easily overwrite complex configurations if handled improperly.16

Qwickly extends this semantic concept by allowing instructors to define not just the point value associated with a status, but also an "Absence Weight".12 This dual-metric approach allows for highly nuanced tracking. For example, a custom status of "Tardy" could be configured to award 50% of the session's points for grading purposes while simultaneously accumulating 0.5 of a total absence toward a maximum allowed absence threshold.

| Platform | Fixed vs. Custom Statuses | Native Status Typologies | Grading Impact Logic |
| :---- | :---- | :---- | :---- |
| **Canvas** | Fixed | Present, Absent, Late, Unmarked | Late penalty percentage adjustable |
| **Schoology** | Fixed | Present, Absent, Late, Excused | Simple mapping (Values 1-4) |
| **Moodle** | Fully Custom | Unlimited; Default: P, A, L, E | Point multipliers per status |
| **Qwickly** | Fully Custom | Unlimited | Points assigned AND absence weight |
| **Firebase App** | Fully Custom | User-Defined JSON array | Dynamic multipliers and thresholds |

For a modern application seeking to differentiate itself, hardcoding statuses as fixed database enumerations is a critical anti-pattern. The data model should define statuses as an array of customizable configuration objects at the class or institutional level. This semantic mapping allows the underlying analytical engine to process attendance regardless of the localized string attached to the status, ensuring that statistical aggregations function flawlessly even if an instructor dynamically renames "Late" to "Tardy."

## **4\. Scoring, Penalties, and Grading Algorithmic Engines**

The translation of attendance states into a quantifiable academic grade is the most computationally complex aspect of classroom management platforms. The analysis reveals a significant architectural divide between automated proportional scaling systems and raw formulaic evaluation engines.

The Canvas Roll Call tool utilizes a strictly proportional scaling algorithm that functions continuously. A student's grade for attendance is based on the aggregate days they have been marked present or late against the total days for which attendance has been taken.28 Canvas mathematically evaluates this through a standard percentage calculation, where the instructor can define a penalty modifier specifically for the late status. The primary failure of this proportional design is mathematical volatility early in the academic term. Because the denominator is dynamic based only on sessions taken so far, a single absence in the first week of class drops a student's total attendance grade to 0% or 50%, causing immense student anxiety and generating a high volume of complaints.3 Furthermore, Canvas does not natively support an "allowed absences" threshold (a grace period), forcing instructors to either abandon the native tool or manually compute and drop lowest scores at the end of the term.3

Moodle provides an exceptionally powerful, albeit highly complex, grade calculation engine that mimics advanced spreadsheet functions.30 Instructors can map specific attendance items to variables using ID numbers enclosed in double square brackets, and apply custom algorithms using mathematical operators and conditional logic. For instance, an instructor can utilize nested conditional IF operators to establish complex threshold penalties: \= if(AND(\[\[item1\]\]\>=5, \[\[item2\]\]\>=5), (\[\[item1\]\]+\[\[item2\]\])/2, 0).30 Moodle’s underlying engine parses these string expressions into an Abstract Syntax Tree (AST) and evaluates them dynamically against the database records. While incredibly flexible and capable of modeling almost any syllabus requirement, the user experience is highly technical and often deemed too daunting for the average educator, leading to underutilization.

Qwickly strikes a functional middle ground by offering specific, pre-built penalty logic parameters that abstract the underlying mathematics.17 Instructors can choose a "Points Per Absence" model, where a baseline total grade is established, and a fixed point scalar is subtracted for every absence accumulated beyond a defined grace period.

To achieve market superiority, the proposed Firebase architecture must implement a visual logic builder that completely abstracts the mathematical AST from the end-user while retaining Moodle's computational flexibility. The algorithmic engine must natively support the configuration of grace periods (defining ![][image2] number of penalty-free absences before grade degradation occurs), progressive penalties (subtracting ![][image3] points for the first offense, and an escalating ![][image4] points for subsequent offenses), and strict capping mechanisms to ensure an attendance score cannot mathematically drop below zero or exceed 100%.

## **5\. Data Modeling: Relational vs. NoSQL Paradigms**

The underlying database schema determines the system's ability to scale elastically, query historical records for compliance audits, and push real-time updates to mobile clients. The architectural analysis of Moodle’s open-source SQL implementation versus Canvas Data 2 and modern SaaS infrastructure highlights the profound technical trade-offs between Relational Database Management Systems (RDBMS) and NoSQL Document stores.

Moodle utilizes a highly normalized relational schema characteristic of traditional enterprise applications.32 The core tables for the attendance module map directly to the application's domain logic. The attendance table stores the instance configuration at the course level. The attendance\_sessions table stores the metadata for a specific meeting instance, utilizing a foreign key linked to the attendance.id, alongside duration and timestamp data.18 The attendance\_log table acts as the granular transactional ledger mapping the many-to-many relationship between user.id and attendance\_sessions.id. It records the statusid, the timetaken, the takenby ID (to establish an audit trail of who recorded the mark), and the originating IP address.18 This strict database normalization ensures absolute ACID (Atomicity, Consistency, Isolation, Durability) compliance and data integrity, preventing orphaned records.35 However, rendering a full classroom matrix—for example, a grid of 100 students across 30 sessions—requires massive SQL JOIN operations across these tables. As the dataset grows, these complex reads degrade performance exponentially, necessitating heavy middleware caching.

Canvas similarly relies on a highly structured relational backend, exposing its raw datasets to institutions via the Canvas Data 2 API.37 This API is designed to provide efficient access to high-fidelity source data for institutional data warehouses.38 While effective for backend analytics, parsing relational schemas over REST APIs introduces latency that is incompatible with the instant feedback loops required by modern mobile applications.

Firebase Firestore, the target architecture for the new application, operates as a NoSQL, document-oriented database that prioritizes horizontal scalability, real-time client synchronization, and extremely high read throughput.35 Unlike relational systems, NoSQL heavily favors denormalization and data duplication to optimize for flat client-side reads.40 Under the PACELC theorem, which extends the CAP theorem for distributed systems, Firebase is designed to manage trade-offs between latency and consistency, prioritizing high availability and partition tolerance—crucial for mobile applications operating in physical classrooms with intermittent Wi-Fi connectivity.39

A highly optimized Firebase schema for an attendance application must strictly avoid deep nesting, which is a common beginner anti-pattern that leads to bloated document retrieval.41 Instead, the architecture should utilize top-level collections with document references duplicating essential metadata.

### **Proposed Firebase NoSQL Schema Blueprint**

**Collection: classes**

This collection stores the core configuration, completely decoupled from specific sessions.

JSON

{  
  "class\_id\_123": {  
    "name": "Advanced Data Structures",  
    "owner\_id": "user\_456",  
    "status\_definitions": {  
      "status\_A": {"label": "Present", "multiplier": 1.0, "absence\_weight": 0.0, "color": "\#00FF00"},  
      "status\_B": {"label": "Absent", "multiplier": 0.0, "absence\_weight": 1.0, "color": "\#FF0000"}  
    },  
    "scoring\_rules": {  
      "base\_points": 100,  
      "allowed\_absences": 2,  
      "penalty\_per\_absence": 5  
    }  
  }  
}

**Collection: class\_enrollments**

Acting as a mapping table to avoid arrays that could exceed Firestore's 1MB document limit, this collection tracks individual student progress within a class.

JSON

{  
  "enrollment\_789": {  
    "class\_id": "class\_id\_123",  
    "student\_id": "user\_999",  
    "student\_name": "Jane Doe",  
    "role": "student",  
    "aggregated\_score": 95.0,  
    "total\_absences": 1.0  
  }  
}

**Collection: sessions**

JSON

{  
  "session\_abc": {  
    "class\_id": "class\_id\_123",  
    "date": "2026-04-24T10:00:00Z",  
    "is\_active": true,  
    "qr\_secret": "dynamic\_hash\_string"  
  }  
}

**Collection: attendance\_records**

This transactional collection stores the immutable facts of attendance. By duplicating the class\_id into this document, the system can perform a single, flat query to retrieve all historical records for a specific class without needing to query the sessions collection first.

JSON

{  
  "record\_xyz": {  
    "session\_id": "session\_abc",  
    "class\_id": "class\_id\_123",  
    "student\_id": "user\_999",  
    "status\_id": "status\_A",  
    "timestamp": "2026-04-24T10:05:12Z",  
    "marked\_by": "user\_999",  
    "audit\_trail":  
  }  
}

By flattening the data structure, the application optimizes for the most common operation: reading attendance data. However, the trade-off is the complexity of managing updates. To maintain the aggregated\_score in the class\_enrollments document without forcing the client device to download the entire attendance history to perform a calculation, the system must deploy Firebase Cloud Functions. When an attendance\_records document is created or mutated, a background trigger asynchronously calculates the new score based on the scoring\_rules and updates the enrollment document, ensuring eventual consistency while keeping the client interface instantaneous.

## **6\. Real-Time Synchronization and UX Behavior**

Traditional LMS platforms operate on stateless HTTP Request/Response cycles. When an instructor takes attendance in Canvas or Moodle, the page must reload, or a discrete asynchronous JSON payload is fired to a REST endpoint, requiring a manual page refresh for other users (such as a co-teacher or a student viewing their grade) to observe the state change. Schoology relies on a similar API architecture, passing XML or JSON payloads to mutate status states via explicit PUT requests to endpoints such as /v1/sections/{section\_id}/attendance.26 This paradigm introduces systemic friction and data latency.

Firebase eliminates this latency entirely via WebSockets, pushing state mutations to subscribed clients instantaneously.42 This architectural shift allows for dynamic, collaborative user interfaces. For example, if a Teaching Assistant marks the left side of a lecture hall on their tablet, and the Professor marks the right side on their laptop, both interfaces update in real-time without locking conflicts or the need for continuous API polling.

A critical bottleneck in Firebase User Experience (UX) occurs during bulk actions, such as executing a "Mark All Present" command. If a university class contains 300 students, firing 300 simultaneous set() or update() network operations from the client device will quickly hit Firebase network rate limits, throttle bandwidth, and exhaust mobile battery life. The application must utilize Firestore Batched Writes, which group up to 500 individual operations into a single atomic commit, ensuring that either all records are updated or none are. If the roster exceeds 500 students, the client must programmatically chunk the array and utilize pagination.

Alternatively, for massive classes, the client can simply mutate a single field on the sessions document (e.g., default\_status: 'Present'). This mutation triggers a server-side Cloud Function to handle the massive fan-out write operation behind the scenes. This architectural pattern leaves the client UI incredibly snappy and unblocked, as the heavy lifting is delegated entirely to Google's cloud infrastructure.

Furthermore, integrating robust offline persistence is paramount. Mobile devices operated in thick-walled concrete lecture halls frequently lose cellular and Wi-Fi connectivity. Enabling Firestore's local caching capabilities ensures the UI remains highly available. Educators can continue to tap and mark attendance statuses without an active connection; the Firebase SDK will queue the mutations locally and synchronize them automatically and sequentially upon network reconnection.39

## **7\. Edge Cases Handling and State Reconciliation**

The hallmark of an expert-tier educational system is its resilience against complex edge cases and asynchronous timeline mutations. Standard platforms frequently fail to maintain data integrity when human error or administrative changes disrupt the linear flow of time.

### **Post-Session Roster Modifications**

A frequent vulnerability in rigid systems like Canvas occurs when handling students who withdraw or are dropped from a course after attendance has been recorded for several weeks. If a student is deleted from the active Canvas roster, their historical attendance data often vanishes or becomes orphaned, breaking the total percentage calculations for the rest of the class and corrupting analytical reports.24 Schoology encounters similar friction when integrating with Student Information Systems (SIS) like PowerSchool or eSchoolPlus via the OneRoster standard, where cross-listed sections or remote student synchronization can result in students appearing in attendance ledgers but not in the main course roster, or vice versa.44 Furthermore, if a student enrolls late in the semester, simplistic systems will mathematically penalize them for being absent during sessions that occurred before their existence in the system.

To resolve this, the proposed database must strictly prohibit "hard deletes" on user and enrollment records. If a student is removed from a class, their class\_enrollments document must undergo a "soft delete" by updating a boolean flag (e.g., is\_active: false). This mechanism preserves the relational integrity of the attendance\_records for historical audits, financial aid compliance, and institutional truancy reporting.46 Additionally, the server-side grading algorithm must dynamically adjust the denominator (Total Scored Sessions) based on the student's specific enrollment\_date, ensuring they are only evaluated mathematically for sessions they were legally eligible to attend.

### **Retroactive Edits and Immutable Audit Logs**

When a student provides a valid medical excuse three weeks after an absence, the instructor must alter a historical attendance record. If the system immediately alters the grade without preserving a paper trail, it violates academic data integrity and leaves the institution vulnerable to grade disputes.

Every mutation to an attendance\_records document must be captured. In a Firebase NoSQL structure, this is achieved by appending an object to a nested audit\_trail array within that specific document. This object must capture the previous state, the new state, the exact UTC timestamp, and the user\_id of the modifying editor. This architectural pattern provides an immutable history of grade changes, mirroring the granular timemodified and lasttakenby fields found in Moodle's SQL schemas.18 Crucially, altering historical data must trigger the Firebase Cloud Function to recalculate the student's aggregated score and propagate that update to the enrollment document.

### **Dynamic Status Definition Mutation**

A complex architectural dilemma arises if an instructor changes the mathematical configuration of a status halfway through the semester—for example, altering the "Late" penalty from a 0.8 point multiplier to a more severe 0.5 multiplier. Standard systems struggle to reconcile this: do they retroactively punish previous infractions, thereby altering grades students thought were finalized, or do they only apply the rule moving forward?

To handle this edge case gracefully, the attendance\_records document must capture a *snapshot* of the multiplier at the exact time the record was created. The grading algorithm calculates the score based on the document-level snapshots rather than querying the global class configuration. If an instructor alters the global configuration, the system should prompt the user: "Apply new weighting retroactively?" If yes, a server-side batch job iterates through all historical records for the class and updates the snapshots. If no, the new multiplier only applies to attendance\_records generated after the timestamp of the rule change, perfectly preserving historical grade states.

## **8\. Technical Architecture and Scalability Inferences**

Inferring the architecture of legacy platforms reveals a heavy reliance on monolithic, REST-driven web servers communicating with highly indexed SQL databases. Canvas utilizes standard REST endpoints requiring OAuth2 Bearer tokens passed via request headers for authentication.47 Schoology similarly relies on a REST API, providing explicit endpoints (/v1/sections/{section\_id}/attendance) for programmatic interaction.26 While REST architectures are highly predictable and standardized, they fundamentally require constant client polling to simulate real-time behavior, consuming substantial network resources and server compute time.

### **The Event-Driven Microservices Paradigm**

For the proposed application, an Event-Driven Architecture (EDA) utilizing Google Cloud Functions and Firebase Pub/Sub represents a drastically more scalable approach. Schoology attempts to implement event-driven concepts via its API Event Triggers, allowing school administrators to configure target URLs to listen for specific actions.50 However, Firebase enables this natively at the database layer.

By embracing Command Query Responsibility Segregation (CQRS), the architecture acknowledges that reads (such as a student viewing their attendance dashboard) occur at an order of magnitude higher frequency than writes (an instructor marking a student absent). Therefore, the read models must be segregated from the write models. A Cloud Function triggered by an attendance mutation acts as an asynchronous worker; it independently calculates the class's daily attendance percentage and saves it to a dedicated analytics\_aggregates collection. When an instructor loads the analytical dashboard, the client application simply executes a single read against the pre-calculated analytics document, rather than downloading tens of thousands of individual historical attendance records to execute an expensive client-side reduce() aggregation function.

### **Bulk Export and Interoperability**

As observed with Canvas Data 2, modern educational institutions demand low-latency, high-fidelity bulk data exports for data warehousing and predictive analytics.37 A Firebase architecture facilitates this by continuously streaming Firestore data to Google BigQuery via native Firebase Extensions. This allows data scientists and institutional researchers to run complex SQL aggregations on the raw NoSQL data, identifying cross-departmental absenteeism trends and deploying AI early-warning agents without imposing any compute load on the operational database driving the live mobile application.51

## **9\. Platform Strengths, Weaknesses, and Institutional Friction**

A direct narrative and comparative analysis of the existing marketplace reveals distinct user frustrations, systemic technical debt, and areas ripe for disruption by a superior application.

### **Canvas LMS and Schoology: The Rigidity of Monoliths**

Canvas and Schoology excel through ubiquitous institutional adoption and seamless integration with core gradebooks and Student Information Systems. Schoology’s exception-based reporting (where blanks equal present) inherently saves instructors time during roll call.4 Furthermore, Canvas automates the creation of the attendance assignment natively, reducing initial setup friction.1

However, their limitations are profound. Canvas suffers from highly inflexible status logic and a percentage-only grading mechanism that creates wild grade fluctuations early in the semester.3 Canvas handles excused absences and late enrollments poorly, and its interface is universally disliked by educators managing large, multi-hundred student lecture halls.24 Schoology’s attendance passback to SIS databases can be highly brittle, particularly when relying on the OneRoster protocol which historically struggles with attendance data synchronization.45 Both systems lack deep native analytics, treating attendance as a static administrative chore rather than a dynamic dataset.

### **Moodle: The Burden of Complexity**

Moodle’s open-source architecture offers unparalleled customization. Its highly advanced grade calculation engine, which evaluates spreadsheet-style mathematical formulas, allows instructors to model virtually any attendance policy imaginable.16

The primary weakness of Moodle is its archaic, dense user interface and reliance on a highly normalized SQL structure that scales poorly under load without heavy database tuning and caching.33 The platform requires extensive manual configuration from administrators, and the cognitive load placed on a teacher to utilize its advanced mathematical features results in massive underutilization of the platform's actual capabilities.

### **Microsoft Teams and Google Classroom: Ecosystem Convenience over Functionality**

Both Google and Microsoft provide excellent platforms for remote and hybrid synchronous learning at zero extra cost for institutions already embedded in their respective workspaces.5

Yet, neither platform possesses dedicated, semantic grading functionality for attendance. They rely entirely on parsing unstructured data—such as generating CSV dumps of join/leave timestamps or utilizing Google Forms as a workaround mechanism.7 This pushes the entire analytical and grading burden onto the educator, who must manually reconcile spreadsheet exports with their official gradebook, a process highly susceptible to human error.

### **Dedicated SaaS (Qwickly, Jibble, Truein)**

Modern SaaS tools represent the vanguard of attendance tracking technology. They are hardware agnostic and support modern input methodologies such as dynamic QR codes, biometric facial recognition, and geolocation parameters.12 They offer granular absence weighting and automated reporting mechanisms.17

Their primary weakness is that they operate as separate, siloed platforms requiring substantial integration overhead (often via LTI) and distinct, ongoing subscription costs. Moving data from a dedicated SaaS platform back into the institution's primary LMS gradebook can sometimes introduce synchronization errors.

## **10\. Innovation Opportunities and Architectural Blueprint**

Based on the deep synthesis of these systems, there is a clear and persistent market gap. No single platform natively combines the *algorithmic grading depth* of Moodle with the *real-time, mobile-first, biometric-enabled UX* of modern SaaS apps, built atop a scalable *NoSQL real-time engine* like Firebase. The following architectural directives outline how to differentiate and build a superior application.

### **Design Patterns to Adopt**

1. **Semantic Custom Statuses:** Utilize the object-oriented configuration pattern. Never hardcode strings like "Late" into the core logic. Map visual identifiers directly to mathematical multipliers and absence weights dynamically via user-defined JSON arrays.  
2. **Flat NoSQL Structures with Fan-out Writes:** Structure Firestore to explicitly avoid deeply nested arrays. Rely on top-level collections linked by document ID strings. Use batch writes for operations affecting multiple documents simultaneously, ensuring atomicity across the database.  
3. **CQRS and Cloud Function Aggregators:** Shift heavy mathematical lifting—including penalty logic calculations, continuous percentage aggregations, and threshold monitoring—to the server via Firebase Cloud Functions. This ensures the mobile client remains lightweight, highly performant, and immune to client-side manipulation.  
4. **Optimistic UI with Offline Persistence:** Enable Firebase’s local cache to register UI interactions instantly. This mitigates network latency and provides a seamless user experience in physical classrooms with poor cellular reception, queuing mutations until a connection is restored.39  
5. **Multi-Modal Authentication:** Adopt SaaS innovations by allowing simultaneous instructor-led grid views *and* student-led QR code scanning. Implement rotating cryptographic hashes for QR codes to prevent remote proxy attendance.41

### **Anti-Patterns to Avoid**

1. **The Monolithic Assignment Trap:** Do not force attendance to exist as a single, immutable assignment in a gradebook. Allow instructors to categorize attendance by distinct time periods, session types, or specific modules.  
2. **Destructive State Mutations (Hard Deletes):** Never execute a delete command on a student enrollment document. Implement boolean status flags to preserve immutable audit trails and ensure historical reporting accuracy.  
3. **Client-Side Trust and Evaluation:** Do not execute grading logic, mathematical algorithms, or permission validation on the client device. Rely exclusively on Firestore Security Rules and HTTP-triggered Cloud Functions to prevent malicious API manipulation by tech-savvy users.  
4. **Synchronous Bulk Loading:** Do not design interfaces that require loading all historical attendance records to render a single day's dashboard view. Paginate queries aggressively and leverage pre-calculated server-side aggregates to populate high-level views.

### **Comparative Matrix of Educational Attendance Systems**

| Feature / Architecture | Canvas LMS (Roll Call) | Moodle (mod\_attendance) | Schoology | Microsoft Teams / Google | Modern SaaS (e.g., Qwickly) | Proposed Firebase Blueprint |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Status Customization** | Rigid (4 fixed statuses) | Infinite (Custom acronyms) | Rigid (4 fixed statuses) | None (Timestamp based) | Infinite (Custom names & weights) | Infinite (Semantic JSON objects) |
| **Grading Algorithm** | Proportional continuous percentage | Advanced spreadsheet AST formulas | SIS-dependent passback | None | Configurable threshold penalties | Event-driven Cloud Functions |
| **Data Architecture** | Relational / Canvas Data 2 API | Relational normalized SQL tables | Relational REST API | SharePoint / Google Drive (CSV) | Cloud-hosted Relational/NoSQL | Flattened NoSQL (Firestore) |
| **Edge Case: Null Values** | Fails to compute accurately | Configurable evaluation | Assumes "Present" natively | Ignored | Highly configurable | Evaluated via enrollment timestamps |
| **Real-Time Synchronization** | Requires HTTP page refresh | Requires HTTP page refresh | Requires HTTP page refresh | API Polling/Refresh required | Varies (Some WebSockets) | Native WebSockets (Sub-second sync) |
| **Student Self-Check-In** | Not supported natively | Supported (Static Passwords/QR) | Not supported natively | Native (Meeting join tracking) | Dynamic QR, PIN, Biometrics | Dynamic QR / Geofencing supported |
| **Bulk Action Scalability** | Prone to timeouts on large classes | Slows down due to complex SQL JOINs | Efficient via sparse matrix logic | N/A (Export based logic) | High efficiency | Firestore Batched Writes |

In conclusion, the synthesis of contemporary educational technology reveals that attendance tracking has fundamentally shifted from a mere administrative checkbox to a critical, high-frequency data stream that directly informs student retention strategies, pedagogical efficacy, and institutional legal compliance. Legacy systems encumbered by rigid relational databases and monolithic codebases are inherently ill-equipped to provide the granular customization, biometric security, and real-time responsiveness demanded by modern educators. By strategically deploying a Firebase NoSQL architecture—capitalizing on flat data models, real-time socket listeners, and serverless event-driven functions—developers can effectively circumvent the processing bottlenecks and user-experience frictions that define current market leaders, establishing a new paradigm in classroom management technology.

#### **Works cited**

1. What is the Roll Call Attendance Tool? \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/662770-what-is-the-roll-call-attendance-tool](https://community.instructure.com/en/kb/articles/662770-what-is-the-roll-call-attendance-tool)  
2. How do I edit the Roll Call Attendance assignment? \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/660705-how-do-i-edit-the-roll-call-attendance-assignment](https://community.instructure.com/en/kb/articles/660705-how-do-i-edit-the-roll-call-attendance-assignment)  
3. Attendance : r/canvas \- Reddit, accessed April 24, 2026, [https://www.reddit.com/r/canvas/comments/1pwqgct/attendance/](https://www.reddit.com/r/canvas/comments/1pwqgct/attendance/)  
4. SCHOOLOGY, accessed April 24, 2026, [https://observatorio.umh.es/files/2013/10/Instructor-Guide-Schoology-enterprise-version.pdf](https://observatorio.umh.es/files/2013/10/Instructor-Guide-Schoology-enterprise-version.pdf)  
5. Track attendance & view Live stream report \- Classroom Help, accessed April 24, 2026, [https://support.google.com/edu/classroom/answer/10090454?hl=en](https://support.google.com/edu/classroom/answer/10090454?hl=en)  
6. Taking Attendance in Google Classroom \- Teq, accessed April 24, 2026, [https://www.teq.com/attendance-google-classroom/](https://www.teq.com/attendance-google-classroom/)  
7. Track Google Classroom attendance automatically \- Sheetgo, accessed April 24, 2026, [https://www.sheetgo.com/blog/education-templates/track-google-classroom-attendance-automatically/](https://www.sheetgo.com/blog/education-templates/track-google-classroom-attendance-automatically/)  
8. Meet Attendance \- Chrome Web Store \- Google, accessed April 24, 2026, [https://chromewebstore.google.com/detail/meet-attendance/nenibigflkdikhamlnekfppbganmojlg](https://chromewebstore.google.com/detail/meet-attendance/nenibigflkdikhamlnekfppbganmojlg)  
9. Google Meet Attendance Tracker Setup Guide for Teachers, accessed April 24, 2026, [https://meet-attendance.com/blog/google-meet-attendance-tracker-setup-guide.html](https://meet-attendance.com/blog/google-meet-attendance-tracker-setup-guide.html)  
10. Taking Class Attendance on Teams for Education | Microsoft ..., accessed April 24, 2026, [https://techcommunity.microsoft.com/blog/microsoftteamsblog/taking-class-attendance-on-teams-for-education/1472549](https://techcommunity.microsoft.com/blog/microsoftteamsblog/taking-class-attendance-on-teams-for-education/1472549)  
11. Contactless Attendance System: What It Is, How It Works, And Best Software For 2025, accessed April 24, 2026, [https://truein.com/blogs/contactless-attendance-system](https://truein.com/blogs/contactless-attendance-system)  
12. Qwickly Attendance Classic | Blackboard, Canvas and D2L Brightspace Attendance and Participation Tracking with Automatic Grading, accessed April 24, 2026, [https://www.goqwickly.com/attendance-classic/](https://www.goqwickly.com/attendance-classic/)  
13. 100% FREE School Attendance App | Jibble, accessed April 24, 2026, [https://www.jibble.io/school-attendance-app](https://www.jibble.io/school-attendance-app)  
14. Qwickly Attendance | Course Tools \- Answers, accessed April 24, 2026, [https://answers.atlassian.syr.edu/wiki/spaces/\_/pages/184878397?atlOrigin=eyJpIjoiZWMxOWQ2ODFhNTBkNGUzYmFmNzA4MDNiYjgzYWNlYWYiLCJwIjoiYyJ9](https://answers.atlassian.syr.edu/wiki/spaces/_/pages/184878397?atlOrigin=eyJpIjoiZWMxOWQ2ODFhNTBkNGUzYmFmNzA4MDNiYjgzYWNlYWYiLCJwIjoiYyJ9)  
15. Getting Started with Qwickly Attendance | Canvas for Faculty, accessed April 24, 2026, [https://ats-techdocs.rutgers.edu/m/98237/l/1352720-getting-started-with-qwickly-attendance](https://ats-techdocs.rutgers.edu/m/98237/l/1352720-getting-started-with-qwickly-attendance)  
16. Attendance activity \- MoodleDocs, accessed April 24, 2026, [https://docs.moodle.org/en/Attendance\_activity](https://docs.moodle.org/en/Attendance_activity)  
17. Setting Up Qwickly Attendance, accessed April 24, 2026, [https://about.colum.edu/information-technology/pdf/qwickly-attendance-setup-guide.pdf](https://about.colum.edu/information-technology/pdf/qwickly-attendance-setup-guide.pdf)  
18. Moodle in English: Attendance Fields for Configurable Report, accessed April 24, 2026, [https://moodle.org/mod/forum/discuss.php?d=453619](https://moodle.org/mod/forum/discuss.php?d=453619)  
19. Best Attendance Management Systems in 2025: Features & Reviews, accessed April 24, 2026, [https://spintly.com/best-attendance-management-systems-in-2025-features-reviews/](https://spintly.com/best-attendance-management-systems-in-2025-features-reviews/)  
20. Biometric Attendance System Guide For Smarter Workforce Tracking, accessed April 24, 2026, [https://payrun.app/blog/biometric-attendance-system](https://payrun.app/blog/biometric-attendance-system)  
21. How do I take roll call using the Attendance tool? \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/660707-how-do-i-take-roll-call-using-the-attendance-tool](https://community.instructure.com/en/kb/articles/660707-how-do-i-take-roll-call-using-the-attendance-tool)  
22. Roll Call Attendance in Canvas \- Faculty & Staff Support \- St. Petersburg College, accessed April 24, 2026, [https://staffsupport.spcollege.edu/hc/en-us/articles/39934235002395-Roll-Call-Attendance-in-Canvas](https://staffsupport.spcollege.edu/hc/en-us/articles/39934235002395-Roll-Call-Attendance-in-Canvas)  
23. Attendance in Canvas \- Ohio University, accessed April 24, 2026, [https://help.ohio.edu/TDClient/30/Portal/KB/ArticleDet?ID=1103](https://help.ohio.edu/TDClient/30/Portal/KB/ArticleDet?ID=1103)  
24. Students concerned more about attendance : r/Professors \- Reddit, accessed April 24, 2026, [https://www.reddit.com/r/Professors/comments/1qrm6wn/students\_concerned\_more\_about\_attendance/](https://www.reddit.com/r/Professors/comments/1qrm6wn/students_concerned_more_about_attendance/)  
25. I have had it with the attendance fraud and just sent my students this email \- Reddit, accessed April 24, 2026, [https://www.reddit.com/r/Professors/comments/1j34zgj/i\_have\_had\_it\_with\_the\_attendance\_fraud\_and\_just/](https://www.reddit.com/r/Professors/comments/1j34zgj/i_have_had_it_with_the_attendance_fraud_and_just/)  
26. Attendance \- Schoology Developers, accessed April 24, 2026, [https://developers.schoology.com/api-documentation/rest-api-v1/attendance/](https://developers.schoology.com/api-documentation/rest-api-v1/attendance/)  
27. Qwickly Attendance: Custom System Statuses, accessed April 24, 2026, [https://qwickly.zendesk.com/hc/en-us/articles/360038274792-Qwickly-Attendance-Custom-System-Statuses](https://qwickly.zendesk.com/hc/en-us/articles/360038274792-Qwickly-Attendance-Custom-System-Statuses)  
28. Canvas How-To: Course Attendance | California State University Stanislaus, accessed April 24, 2026, [https://www.csustan.edu/office-academic-technology/canvas-lms/canvas-how-course-attendance](https://www.csustan.edu/office-academic-technology/canvas-lms/canvas-how-course-attendance)  
29. Tracking Attendance with Canvas \- Emerson College Technology & Media, accessed April 24, 2026, [https://support.emerson.edu/hc/en-us/articles/360000184763-Tracking-Attendance-with-Canvas](https://support.emerson.edu/hc/en-us/articles/360000184763-Tracking-Attendance-with-Canvas)  
30. Grade calculations \- MoodleDocs, accessed April 24, 2026, [https://docs.moodle.org/en/Grade\_calculations](https://docs.moodle.org/en/Grade_calculations)  
31. Grade calculations \- MoodleDocs, accessed April 24, 2026, [https://docs.moodle.org/2x/ca/Grade\_calculations](https://docs.moodle.org/2x/ca/Grade_calculations)  
32. Database schema \- Moodle Developer Resources, accessed April 24, 2026, [https://moodledev.io/docs/5.0/apis/core/dml/database-schema](https://moodledev.io/docs/5.0/apis/core/dml/database-schema)  
33. Database schema introduction \- MoodleDocs, accessed April 24, 2026, [https://docs.moodle.org/dev/Database\_schema\_introduction](https://docs.moodle.org/dev/Database_schema_introduction)  
34. Database schema introduction \- MoodleDocs, accessed April 24, 2026, [https://docs.moodle.org/4x/sv/Database\_schema\_introduction](https://docs.moodle.org/4x/sv/Database_schema_introduction)  
35. What's the Difference Between Relational and Non-relational Databases? \- AWS, accessed April 24, 2026, [https://aws.amazon.com/compare/the-difference-between-relational-and-non-relational-databases/](https://aws.amazon.com/compare/the-difference-between-relational-and-non-relational-databases/)  
36. Relational vs. Non-relational Database: Key Differences for Modern Data Management, accessed April 24, 2026, [https://www.intersystems.com/resources/relational-vs-non-relational-database-key-differences-for-modern-data-management/](https://www.intersystems.com/resources/relational-vs-non-relational-database-key-differences-for-modern-data-management/)  
37. What is Canvas Data 2? \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/661444-what-is-canvas-data-2](https://community.instructure.com/en/kb/articles/661444-what-is-canvas-data-2)  
38. Canvas Data 2 Frequently Asked Questions \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/661450-canvas-data-2-frequently-asked-questions](https://community.instructure.com/en/kb/articles/661450-canvas-data-2-frequently-asked-questions)  
39. Relational vs. NoSQL data \- .NET \- Microsoft Learn, accessed April 24, 2026, [https://learn.microsoft.com/en-us/dotnet/architecture/cloud-native/relational-vs-nosql-data](https://learn.microsoft.com/en-us/dotnet/architecture/cloud-native/relational-vs-nosql-data)  
40. Relational and NoSQL databases comparison | by Alexey Samoshkin \- Medium, accessed April 24, 2026, [https://medium.com/hackernoon/relational-and-nosql-databases-comparison-1d374a828ea9](https://medium.com/hackernoon/relational-and-nosql-databases-comparison-1d374a828ea9)  
41. Designing an attendance system using QR code with Firebase \- Stack Overflow, accessed April 24, 2026, [https://stackoverflow.com/questions/52748236/designing-an-attendance-system-using-qr-code-with-firebase](https://stackoverflow.com/questions/52748236/designing-an-attendance-system-using-qr-code-with-firebase)  
42. General best practices for setting up Firebase projects \- Google, accessed April 24, 2026, [https://firebase.google.com/docs/projects/dev-workflows/general-best-practices](https://firebase.google.com/docs/projects/dev-workflows/general-best-practices)  
43. yuchen5564/attendance-system: A modern enterprise attendance management system built with React and Firebase, providing comprehensive employee attendance tracking, leave management, and reporting features. \- GitHub, accessed April 24, 2026, [https://github.com/yuchen5564/attendance-system](https://github.com/yuchen5564/attendance-system)  
44. Using eSchoolPlus SIS Attendance with Schoology, accessed April 24, 2026, [https://uc.powerschool-docs.com/en/schoology/latest/using-eschoolplus-sis-attendance-with-schoology](https://uc.powerschool-docs.com/en/schoology/latest/using-eschoolplus-sis-attendance-with-schoology)  
45. Schoology SIS Connect App: Implementation and Configuration Guide, accessed April 24, 2026, [https://docs.powerschool.com/SGYH/system-administrators/schoology-sis-integrations-enterprise-only/schoology-sis-connect-app-implementation-and-configuration-guide](https://docs.powerschool.com/SGYH/system-administrators/schoology-sis-integrations-enterprise-only/schoology-sis-connect-app-implementation-and-configuration-guide)  
46. US20180005330A1 \- System and method for student attendance management \- Google Patents, accessed April 24, 2026, [https://patents.google.com/patent/US20180005330A1/en](https://patents.google.com/patent/US20180005330A1/en)  
47. Canvas LMS \- Instructure Developer Documentation Portal, accessed April 24, 2026, [https://developerdocs.instructure.com/services/canvas](https://developerdocs.instructure.com/services/canvas)  
48. Canvas LMS \- REST API and Extensions Documentation, accessed April 24, 2026, [https://canvas.krsu.kg/doc/api/index.html](https://canvas.krsu.kg/doc/api/index.html)  
49. How do I make API calls in an account with an access token? \- Instructure Community, accessed April 24, 2026, [https://community.instructure.com/en/kb/articles/661425-how-do-i-make-api-calls-in-an-account-with-an-access-token](https://community.instructure.com/en/kb/articles/661425-how-do-i-make-api-calls-in-an-account-with-an-access-token)  
50. Event Triggers \- Schoology Developers, accessed April 24, 2026, [https://developers.schoology.com/api-documentation/rest-api-triggers-v1/](https://developers.schoology.com/api-documentation/rest-api-triggers-v1/)  
51. AI Attendance Tracking: How Technology Can Help K–12 Districts Combat Chronic Absenteeism \- EdTech Magazine, accessed April 24, 2026, [https://edtechmagazine.com/k12/article/2026/03/ai-attendance-tracking-how-technology-can-help-k-12-districts-combat-chronic-absenteeism-perfcon](https://edtechmagazine.com/k12/article/2026/03/ai-attendance-tracking-how-technology-can-help-k-12-districts-combat-chronic-absenteeism-perfcon)  
52. Use exceptions in the gradebook | PowerSchool Learning and Engagement, accessed April 24, 2026, [https://uc.powerschool-docs.com/en/schoology/latest/use-exceptions-in-the-gradebook](https://uc.powerschool-docs.com/en/schoology/latest/use-exceptions-in-the-gradebook)  
53. Using the Moodle Attendance Activity, accessed April 24, 2026, [https://it.hanover.edu/tech\_docs/moodle\_resources/Attendance/Using%20the%20Moodle%20Attendance%20Activity.pdf](https://it.hanover.edu/tech_docs/moodle_resources/Attendance/Using%20the%20Moodle%20Attendance%20Activity.pdf)  
54. Manage the attendance and engagement report for meetings and events in Microsoft Teams, accessed April 24, 2026, [https://learn.microsoft.com/en-us/microsoftteams/teams-analytics-and-reports/meeting-attendance-report](https://learn.microsoft.com/en-us/microsoftteams/teams-analytics-and-reports/meeting-attendance-report)  
55. Introduction | Google Classroom, accessed April 24, 2026, [https://developers.google.com/workspace/classroom/tutorials/assignment-workflows](https://developers.google.com/workspace/classroom/tutorials/assignment-workflows)  
56. How AI is Transforming Attendance Tracking: Features, Benefits, and Use Cases \- Asanify, accessed April 24, 2026, [https://asanify.com/blog/ai/ai-powered-attendance-tracking-guide-features-benefits-use-cases/](https://asanify.com/blog/ai/ai-powered-attendance-tracking-guide-features-benefits-use-cases/)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAXCAYAAADpwXTaAAAAiElEQVR4XmNgGAWjgGqAA4jTgJgHXYIcwAjErUBsjC5BLgAZ1AvELOgS5ACQ6wqAOA7KRgECQCxJIpYD4vlAPBmI+RiggBuIq4F4Fhl4BxB/BeJmIGZnoACYAPFqIJZBlyAVCAPxYiCWR5cgB2QBcQS6IDkAlGinArE0ugQ5AJQUeKH0KBhMAABVixNKp22j3QAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAYCAYAAAD3Va0xAAABGUlEQVR4Xu2TsWoCQRCGR7BRQRECYmkpCBZiIdgkWATsbJPeRhDyBNfaaKGVVlY2Yi15Ap/AvICdiI1NLEz+310ve3vkvKu9Dz5YdpbZmbk9kZioPMM9/NGuYcqIZ+GnEacrmDHOuCTgFJ7hN2x4w1c6cCneS3zk4Rz2Rd04EZXc5AO+WXs+qnAEi/AL7mDJiCfhTJ8LhDd19doRVVXPjYo8iaqYlQcyhDW9rsAj3MCc3mvCsV7/y20+vJWwjQW8wFe9x2pDz8ccLhMwERPyK0Wezw22xNbY4ouEmA+rYO91OwDeRQ19CwdWzIc9H5OCqKfAZHfnw7L53NN2QOPAAyxb+y4teJK/f4e/RdtzQsGnwH8vcD4xD8kvcTMzNIxbkGYAAAAASUVORK5CYII=>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAXCAYAAAAGAx/kAAAA30lEQVR4XmNgGAWkAi0gvgPE/5HwNyC2hcpPRpO7D8RqUDmswBKIfwLxbSCWRBJnB+L1QFwPxNxI4jgBJxDvAOJ/QOwBFWME4lIoBrGJBhEMEOcvB2JWBogB3VA2SUAciK8D8XsgbmaAhA/JhsBAKwPEVYeAmB9NjiTgxQAJpxMMFBikCcT7gPgWA2qgEw1ANq8CYjMoHzmsdGCKCAGQIeuA2BtNvIEBElYgmiBQBOKNQFyILgEENkD8G4hPAbEwmhwcxALxLwZEsv8LxP5I8llQMWT5nUAshKRmFIxsAADUlTDEUF3cxQAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAXCAYAAAAC9s/ZAAAA0klEQVR4XmNgGAUg4AfEX4D4PxK+BcRqSGqEgPgEkvxfII5HkgeDHAaI5BogZkGTAwEdID4DxE5AzIgmBwZKQPwciJ8AsSKaHD8QrwJiMzRxFACydTkDxBXRSOLcQDwHiIORxHCCCAZUb7AC8QwgLmPA4Wx0AHI6yAtvgVgbiEuBuI4BYhBRAGTLfAaIKw4C8WQGEjTDAChaQQYcYoAEHslgEhB/A2JTdAligCAQnwbiq0AsgiZHFDAG4q9AvJSByFCHARcgfsaAmpxfQcVHwfAHACMaKLHQXhNhAAAAAElFTkSuQmCC>