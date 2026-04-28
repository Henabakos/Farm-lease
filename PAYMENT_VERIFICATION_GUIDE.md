# Payment Verification System

## Overview

The payment verification system adds enterprise-grade payment security with receipt uploads, admin review workflow, and comprehensive audit logging.

## Features

### Receipt Management
- Users upload payment receipts (PDFs, images)
- File validation and storage via Blob
- Receipt metadata tracking (filename, size, type, timestamp)
- Multiple receipts per payment

### Verification Workflow
- **Pending**: Initial state when payment submitted
- **Under Review**: Admin is reviewing documents
- **Verified**: Payment approved and verified
- **Rejected**: Payment failed verification
- **Disputed**: User disputes verification result

### Admin Dashboard
- View all pending payments
- Review uploaded receipts
- Compare declared vs verified amount
- Add notes and approval/rejection
- Statistics on verification rates and timeline

### Security Features
- Row-Level Security (RLS) at database level
- Only payers can upload receipts
- Only admins can verify payments
- Complete audit trail of all changes
- Automatic logging of verification actions

## Database Schema

### payment_receipts
Stores individual receipt files for payments.

```sql
CREATE TABLE payment_receipts (
  id UUID PRIMARY KEY,
  payment_id UUID REFERENCES payments,
  file_name VARCHAR,
  file_url TEXT,
  file_type VARCHAR,
  file_size BIGINT,
  mime_type VARCHAR,
  uploaded_by UUID REFERENCES auth.users,
  uploaded_at TIMESTAMP,
  is_verified BOOLEAN,
  verified_by UUID,
  verified_at TIMESTAMP,
  verification_notes TEXT
);
```

### payment_verifications
Tracks the verification status and results.

```sql
CREATE TABLE payment_verifications (
  id UUID PRIMARY KEY,
  payment_id UUID UNIQUE REFERENCES payments,
  status VARCHAR (pending, under_review, verified, rejected, disputed),
  verified_by UUID,
  verified_at TIMESTAMP,
  declared_amount DECIMAL,
  verified_amount DECIMAL,
  amount_matches BOOLEAN,
  receipt_count INT,
  all_receipts_verified BOOLEAN
);
```

## API Endpoints

### Get Pending Verifications (Admin)
```
GET /api/payment-verification/pending
Response: [ { id, payment, status, submitted_at, ... } ]
```

### Get Verification Details
```
GET /api/payment-verification/:paymentId
Response: { id, status, verified_amount, receipts, ... }
```

### Upload Receipt
```
POST /api/payment-verification/:paymentId/receipts
Body: { fileName, fileUrl, fileType, fileSize, mimeType }
Response: { receipt, message }
```

### Get Receipts
```
GET /api/payment-verification/:paymentId/receipts
Response: [ { id, file_name, uploaded_at, is_verified, ... } ]
```

### Delete Receipt
```
DELETE /api/payment-verification/receipts/:receiptId
Response: { message }
```

### Verify Payment (Admin)
```
POST /api/payment-verification/:paymentId/verify
Body: { verifiedAmount, notes, status }
Response: { verification, message }
```

### Get Statistics
```
GET /api/payment-verification/stats/summary
Response: {
  total_payments,
  pending_verification,
  verified_count,
  rejected_count,
  average_verification_time_hours,
  verification_success_rate
}
```

## Frontend Integration

### Payment Verification Service
```typescript
import { paymentVerificationService } from '@/src/services/payment-verification';

// Upload receipt
await paymentVerificationService.uploadReceipt(paymentId, formData);

// Get verification status
const verification = await paymentVerificationService.getVerification(paymentId);

// Admin: verify payment
await paymentVerificationService.verifyPayment(paymentId, {
  verifiedAmount: 1000,
  notes: 'Receipts verified',
  status: 'verified'
});
```

## Component: PaymentVerificationWidget

Shows verification status in payment view.

```tsx
<PaymentVerificationWidget paymentId={paymentId} />
```

## Component: ReceiptUploader

Allows users to upload receipts.

```tsx
<ReceiptUploader paymentId={paymentId} onUploadSuccess={handleSuccess} />
```

## Component: AdminVerificationPanel

Admin panel for reviewing and verifying payments.

```tsx
<AdminVerificationPanel />
```

## Component: VerificationStats

Shows verification metrics dashboard.

```tsx
<VerificationStats />
```

## Usage Flow

### Tenant User Flow
1. Makes payment
2. Receives notification to upload receipt
3. Navigates to payment detail
4. Uploads receipt PDF/image
5. Waits for admin verification
6. Receives notification when verified

### Admin User Flow
1. Opens admin dashboard
2. Sees "Pending Verifications" tab
3. Clicks on pending payment
4. Reviews uploaded receipts
5. Checks amount matches
6. Adds verification notes
7. Clicks "Approve" or "Reject"
8. System sends notification to payer

## Security Features

- **RLS Policies**: Database-level access control
  - Users can only view their own payments
  - Only admins can verify
  - Only uploaders can delete own receipts

- **Audit Logging**: Complete change history
  - WHO made change (user_id)
  - WHAT changed (action, entity, details)
  - WHEN it happened (timestamp)
  - Can be reviewed in admin panel

- **File Validation**: Type and size checks
  - Accept: PDF, JPEG, PNG
  - Max size: 10MB
  - Virus scan: Configurable

## Statistics & Reporting

Verification stats available via API:
- Total payments processed
- Pending verifications count
- Verified vs rejected rates
- Average verification time (hours)
- Success rate percentage

## Configuration

Environment variables needed:
```
VITE_API_URL=http://localhost:3001/api
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

## Troubleshooting

**Receipt upload fails**
- Check file size (max 10MB)
- Verify file format (PDF/JPG/PNG)
- Ensure payment_id is correct

**Verification not appearing**
- Ensure user is admin
- Check RLS policies are enabled
- Verify payment exists in database

**Amount mismatch warning**
- Double-check declared amount
- Verify document contents
- Add note explaining discrepancy

## Future Enhancements

- Automatic receipt analysis via OCR
- Blockchain receipt hashing
- Multiple verification approvers
- Dispute resolution workflow
- Receipt batch processing
