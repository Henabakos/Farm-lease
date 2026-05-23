I have everything I need from the doc already. Here's the full end-to-end logical flow for all three of your tasks:

---

# 🔔 TASK 1: Notification & Email Service

## Logical Flow

```
TRIGGER EVENT OCCURS
        │
        ▼
Event Emitter / Socket.io fires event
        │
        ▼
Notification Service receives event
        │
        ├──────────────────────────────┐
        ▼                              ▼
 In-App Notification             Email Notification
 (stored in DB)                  (sent via Nodemailer/SendGrid)
        │                              │
        ▼                              ▼
 Frontend polls or            Email delivered to
 Socket pushes to user         user's inbox
        │
        ▼
 User sees notification bell
 (unread count badge)
        │
        ▼
 User clicks → marks as read
 → DB updated
```

---

## All Trigger Events You Must Handle

### A. Proposal Events
| Event | Who Gets Notified | Channel |
|---|---|---|
| Investor submits proposal | Cluster Representative | In-app + Email |
| Representative reviews proposal | Investor | In-app |
| Representative sends counter-offer | Investor | In-app + Email |
| Investor responds to counter | Representative | In-app + Email |
| Proposal accepted | Investor | In-app + Email |
| Proposal rejected | Investor | In-app + Email |
| Proposal withdrawn | Representative | In-app |

### B. Agreement Events
| Event | Who Gets Notified | Channel |
|---|---|---|
| Agreement draft generated | Both parties | In-app + Email |
| One party signs | Other party | In-app + Email |
| Both parties signed | Both parties | In-app + Email |
| Agreement cancelled | Both parties | In-app + Email |

### C. Payment Events
| Event | Who Gets Notified | Channel |
|---|---|---|
| Investor uploads receipt | Representative + Admin | In-app + Email |
| Receipt verified | Investor | In-app + Email |
| Receipt rejected | Investor | In-app + Email |
| Agreement becomes ACTIVE | Both parties | In-app + Email |

---

## Detailed Step-by-Step Flow

### Step 1 — Event is Triggered
```
User performs action (e.g., submits proposal)
→ Controller layer processes the action
→ After DB write succeeds, NotificationService.emit(event, payload) is called
```

### Step 2 — Notification Service
```
NotificationService receives:
  {
    type: "PROPOSAL_SUBMITTED",
    triggeredBy: investorId,
    recipients: [representativeId],
    metadata: { proposalId, clusterName, investorName }
  }
→ Determines which channels to use (in-app, email, or both)
→ Calls InAppNotificationHandler + EmailNotificationHandler in parallel
```

### Step 3 — In-App Notification Handler
```
→ Creates Notification record in DB:
   {
     notificationId, userId (recipient), type,
     message, isRead: false, createdAt, metadata
   }
→ Emits via Socket.io to recipient's active socket room
→ Frontend receives event → updates bell icon count
→ User opens notification panel → fetches unread list from DB
→ User clicks notification → navigates to relevant page
→ PATCH /notifications/:id/read → isRead: true
```

### Step 4 — Email Notification Handler
```
→ Loads email template based on event type
→ Injects dynamic variables (investorName, clusterName, proposalId, etc.)
→ Sends email via Nodemailer/SendGrid to recipient's email
→ Logs email send status (success/failed) in DB
→ Retry logic if send fails (up to 3 attempts)
```

### Step 5 — Socket.io Real-Time Push
```
→ On user login: socket.join(`user_${userId}`)
→ On event: io.to(`user_${recipientId}`).emit("notification", payload)
→ Frontend listener updates UI without page refresh
→ If user is offline: notification stays in DB, shown on next login
```

---

# 💬 TASK 2: Proposal Submission & Negotiation

## Logical Flow

```
INVESTOR views verified clusters
        │
        ▼
Selects a cluster → views details
        │
        ▼
Clicks "Submit Proposal"
        │
        ▼
Multi-step proposal form
        │
        ▼
Proposal saved to DB (status: SUBMITTED)
        │
        ▼
Notification → Representative
        │
        ▼
Representative reviews proposal
        │
        ├─── Accepts ──────────────────────► Move to Agreement flow
        │
        ├─── Rejects ──────────────────────► Notify Investor (REJECTED)
        │
        └─── Counter-offer ────────────────► Status: UNDER_NEGOTIATION
                    │
                    ▼
          Negotiation Messaging Loop
                    │
              ┌─────┴─────┐
              ▼           ▼
         Investor      Representative
         responds       responds
              │           │
              └─────┬─────┘
                    ▼
           Both agree on terms?
                    │
            ┌───────┴───────┐
           YES              NO
            │               │
            ▼               ▼
     Status: ACCEPTED   Continue loop
            │           or WITHDRAWN
            ▼
    Trigger Agreement Generation
```

---

## Detailed Step-by-Step Flow

### Step 1 — Investor Views Verified Clusters
```
GET /api/clusters?status=VERIFIED
→ Returns list with: name, location, geodata, 
  farmerCount, representativeInfo, landSize
→ Investor filters by region, size, crop type
→ Clicks cluster → GET /api/clusters/:clusterId (full details)
→ Optionally requests AI recommendation or yield prediction first
```

### Step 2 — Proposal Form (Multi-Step)
```
Step 1: Lease Terms
  - Proposed duration (months)
  - Start date
  - Budget/offer amount (ETB)
  - Crop type intended

Step 2: Conditions & Details
  - Custom conditions text
  - Revenue sharing terms
  - Special requirements

Step 3: Supporting Documents
  - Upload via Multer → stored in Cloudinary
  - File types: PDF, images
  - Returns: documentUrl[]

Step 4: Review & Submit
  - Shows full summary
  - Draft auto-saved at each step (status: DRAFT)
  - Investor clicks "Submit" → status: SUBMITTED
```

### Step 3 — Proposal Saved to DB
```
POST /api/proposals
Body: {
  clusterId, investorId, terms (JSON),
  budget, durationMonths, documents[], status: "SUBMITTED"
}
→ Prisma creates Proposal record
→ Returns proposalId
→ Triggers: NotificationService.emit("PROPOSAL_SUBMITTED")
→ Socket.io pushes to representative's room
→ Email sent to representative
```

### Step 4 — Representative Reviews Proposal
```
GET /api/proposals?clusterId=X&status=SUBMITTED
→ Representative sees proposal dashboard
→ Opens proposal → views all terms, documents, investor profile

Decision options:
  a) ACCEPT → PATCH /api/proposals/:id { status: "ACCEPTED" }
  b) REJECT → PATCH /api/proposals/:id { status: "REJECTED", reason }
  c) COUNTER → PATCH /api/proposals/:id { status: "UNDER_NEGOTIATION" }
              + POST /api/negotiations/:proposalId/messages
```

### Step 5 — Negotiation Messaging Loop
```
Both parties now in negotiation room

POST /api/negotiations/:proposalId/messages
Body: { senderId, message, attachments?, counterTerms? }
→ Saved to NegotiationLog DB table
→ Socket.io emits to other party's room instantly
→ Notification triggered for recipient

Each message can include:
  - Plain text chat
  - Revised term proposals (JSON diff of terms)
  - Document attachments
  - Meeting scheduling request

GET /api/negotiations/:proposalId/messages
→ Returns full paginated log (for audit trail)
```

### Step 6 — Negotiation Resolution
```
Option A — Representative Accepts:
  PATCH /api/proposals/:id { status: "ACCEPTED" }
  → Notify investor
  → Trigger Agreement Generation (Task 3)

Option B — Investor Withdraws:
  PATCH /api/proposals/:id { status: "WITHDRAWN" }
  → Notify representative
  → Negotiation ends

Option C — Representative Rejects:
  PATCH /api/proposals/:id { status: "REJECTED", reason }
  → Notify investor with reason
  → Investor can submit new proposal if desired
```

### Proposal State Machine
```
DRAFT → SUBMITTED → UNDER_NEGOTIATION → ACCEPTED → (Agreement flow)
                                      → REJECTED
                  → REJECTED
                  → WITHDRAWN
```

---

# 📄 TASK 3: Agreement & Contract

## Logical Flow

```
Proposal status = ACCEPTED
        │
        ▼
System auto-generates Agreement draft
        │
        ▼
Agreement: status = DRAFT
        │
        ▼
Both parties review draft terms
        │
        ▼
Representative signs first
        │
        ▼
Agreement: status = PENDING_SIGNATURES
        │
        ▼
Investor signs
        │
        ▼
Agreement: status = PENDING_SIGNATURES (awaiting payment)
        │
        ▼
Investor uploads payment receipt (offline payment)
        │
        ▼
Receipt: status = PENDING
        │
        ▼
Representative/Admin verifies receipt
        │
        ├─── VERIFIED ──────────────────► Agreement: ACTIVE
        │                                 Notify both parties
        └─── REJECTED ──────────────────► Notify investor to re-upload
```

---

## Detailed Step-by-Step Flow

### Step 1 — Agreement Auto-Generation
```
Triggered when: Proposal status → ACCEPTED

AgreementService.generate(proposalId):
  → Fetches proposal: terms, budget, duration, startDate
  → Fetches cluster: name, location, geospatial info
  → Fetches investor: name, contact, ID
  → Fetches representative: name, cluster authority

→ Populates Agreement Template with:
   - Party details (investor + representative info)
   - Lease start/end dates (calculated from duration)
   - Financial terms (amount, payment schedule)
   - Land details (cluster name, coordinates, area)
   - Custom conditions from negotiation
   - Standard legal clauses (auto-included)
   - Revenue sharing terms (if any)

POST /api/agreements
→ Creates Agreement record:
  {
    agreementId, proposalId, startDate, endDate,
    terms (JSON), signatures: [], status: "DRAFT"
  }
→ Notifies both parties: "Agreement draft is ready for review"
```

### Step 2 — Both Parties Review Draft
```
GET /api/agreements/:agreementId
→ Returns full agreement object + rendered template

Both investor and representative can:
  - Read all clauses
  - Request minor text edits (goes back to DRAFT with log)
  - Confirm readiness to sign

If edits requested:
  PATCH /api/agreements/:id/terms { updatedTerms }
  → Logs change in AuditLog
  → Notifies other party of revision
  → Resets signing status (both must re-confirm)
```

### Step 3 — Digital Signing Workflow
```
Representative signs first:
  POST /api/agreements/:id/sign
  Body: { signerId: representativeId }
  → System records:
    signatures: [{ signerId, role: "REPRESENTATIVE", timestamp }]
  → Status remains DRAFT (waiting for investor)
  → Notifies investor: "Representative has signed. Your turn."

Investor signs:
  POST /api/agreements/:id/sign
  Body: { signerId: investorId }
  → System records:
    signatures: [
      { signerId: repId, role: "REPRESENTATIVE", timestamp },
      { signerId: investorId, role: "INVESTOR", timestamp }
    ]
  → Status → "PENDING_SIGNATURES" (now awaiting payment verification)
  → AuditLog entry created
  → Notifies both parties: "Agreement fully signed. Please upload payment receipt."
```

### Step 4 — Payment Receipt Upload
```
Investor makes payment OFFLINE (bank/mobile money)

POST /api/receipts
Body (multipart form):
  {
    agreementId,
    amount,
    datePaid,
    receiptImage (via Multer → Cloudinary)
  }

→ Cloudinary returns imageUrl
→ Creates PaymentReceipt record:
  {
    receiptId, agreementId, uploaderId: investorId,
    amount, datePaid, imageUrl,
    verificationStatus: "PENDING"
  }
→ Notifies representative + admin:
  "Payment receipt uploaded. Please verify."
```

### Step 5 — Receipt Verification
```
Representative/Admin opens receipt:
GET /api/receipts/:receiptId
→ Views uploaded image + claimed amount + date

Cross-checks:
  - Amount matches agreed payment
  - Date is valid
  - Receipt appears authentic

Decision:

A) VERIFY:
  PATCH /api/receipts/:receiptId
  Body: { verificationStatus: "VERIFIED", verifiedBy: repId }
  → PaymentReceipt.verificationStatus = "VERIFIED"
  → AgreementService.activate(agreementId)
      → Agreement.status = "ACTIVE"
  → AuditLog entry created
  → NotificationService fires:
      - Investor: "Your payment is verified. Agreement is now ACTIVE!"
      - Both: Full agreement summary + confirmation email sent

B) REJECT:
  PATCH /api/receipts/:receiptId
  Body: { verificationStatus: "REJECTED", rejectionReason }
  → Notifies investor with reason
  → Investor must re-upload corrected receipt
  → Agreement stays in PENDING_SIGNATURES state
```

### Step 6 — Agreement Storage & Retrieval
```
All agreements stored in PostgreSQL with:
  - Full terms JSON
  - Signed parties + timestamps
  - Linked payment receipts
  - Status history (AuditLog)

GET /api/agreements?investorId=X     → investor's contracts
GET /api/agreements?clusterId=X      → cluster's contracts
GET /api/agreements/:id/download     → exports as PDF

Search:
  GET /api/agreements?status=ACTIVE&clusterId=X
  → Admin can audit all active agreements

PDF Export (for admin/legal purposes):
  → PDFKit or Puppeteer renders agreement template
  → Returns downloadable PDF file
```

### Agreement State Machine
```
DRAFT
  → (both review & request edits) → back to DRAFT
  → (both sign) → PENDING_SIGNATURES
      → (receipt uploaded & verified) → ACTIVE
          → (lease term ends) → COMPLETED
          → (cancelled by admin/both parties) → CANCELLED
      → (receipt rejected) → stays PENDING_SIGNATURES
```

---

## How All 3 Tasks Connect

```
[Investor submits Proposal]
         │
         ▼
   TASK 2 handles it
         │
   ┌─────┴──────┐
   ▼            ▼
TASK 1       TASK 2
(notify      (proposal
  rep)        logic)
         │
   Negotiation loop
         │
   Proposal ACCEPTED
         │
         ▼
   TASK 3 handles it
         │
   ┌─────┴──────┐
   ▼            ▼
TASK 1       TASK 3
(notify     (agreement
 both)       + signing
              + payment)
```

Every state change in Tasks 2 and 3 fires a notification from Task 1. Think of Task 1 as the **nervous system** that connects everything together.