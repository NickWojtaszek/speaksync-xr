# Mock Test Data - Report Submission & Verification System

## Overview
Mock test data for demonstrating the complete report submission and verification workflow with 2 users, including duplicate study number detection.

## Quick Start

### Method 1: Use UI Button (Easiest)
1. Start the app with `npm run dev`
2. On the login page, click **"📥 Load Test Data"** button
3. This automatically initializes test data in localStorage
4. Click **"Admin (Test)"** or **"Verifier (Test)"** to log in

### Method 2: Browser Console
```javascript
// In browser console:
speaksyncTestUtils.loadTestData()
speaksyncTestUtils.mockDataSummary  // View summary
speaksyncTestUtils.clearTestData()  // Clean up later
```

---

## Test Data Overview

### User 1: Admin User
- **Email**: `admin@speaksync.com`
- **Role**: Admin
- **Studies**: 8 (December 2024)
- **Report Status**: ✅ **SUBMITTED & APPROVED**
- **Total Amount**: 9,750 PLN
- **Submitted**: 2024-12-21
- **Verification**: Approved on 2024-12-23

#### Studies (No Duplicates):
```
CT-2024-001    CT Head - Trauma evaluation              1,000 PLN
CT-2024-002    CT Chest - Pneumonia follow-up           1,200 PLN
MR-2024-010    MR Brain - Suspected stroke              1,500 PLN
CT-2024-003    CT Abdomen - Acute abdomen               1,100 PLN
US-2024-050    Ultrasound - Thyroid evaluation            800 PLN
CT-2024-004    CT Spine - Lower back pain               1,300 PLN
MR-2024-011    MR Knee - ACL injury assessment          1,600 PLN
CT-2024-005    CT Pelvis - Trauma imaging               1,250 PLN
────────────────────────────────────────────────────────────────
Total:                                                  9,750 PLN
```

---

### User 2: Verifier User
- **Email**: `verifier@speaksync.com`
- **Role**: Verifier
- **Studies**: 7 (December 2024)
- **Report Status**: ❌ **SUBMITTED BUT REJECTED**
- **Total Amount**: 8,850 PLN
- **Submitted**: 2024-12-22
- **Verification**: Rejected on 2024-12-23
- **Rejection Reason**: Duplicate study number `CT-2024-001`

#### Studies (1 Duplicate):
```
CT-2024-001  ⚠️ CT Head - DUPLICATE (Admin already submitted)  1,000 PLN
XR-2024-020    Chest X-Ray - Routine screening                 700 PLN
CT-2024-006    CT Thorax - Nodule follow-up                  1,150 PLN
MR-2024-012    MR Shoulder - Rotator cuff tear               1,550 PLN
US-2024-051    Ultrasound - Carotid screening                 850 PLN
CT-2024-007    CT Liver - Portal hypertension               1,350 PLN
MR-2024-013    MR Prostate - Cancer screening               1,650 PLN
────────────────────────────────────────────────────────────────
Total:                                                    8,850 PLN
```

---

## Testing Workflow

### Step 1: Load Test Data
Click "📥 Load Test Data" on login page

### Step 2: Test User 1 (Admin) - Clean Report
1. Click **"Admin (Test)"** button
2. Go to **"Reports"** tab
3. See your submitted report with:
   - ✅ All 8 studies listed
   - 📊 9,750 PLN total
   - 🔐 "Verified" badge (approved by verifier)
   - ✓ Green verification checkmark

### Step 3: Log Out & Switch to Verifier
1. Click **"Logout"** in user menu (top-right)
2. Click **"Verifier (Test)"** button
3. Go to **"Reports"** tab

### Step 4: Test Verifier Dashboard
You should see:

**Pending Reports**: 0 (none)
**Verified Reports**: 1 (Admin's clean report)
**Rejected Reports**: 1 (Verifier's report with duplicate)

Click on the **Verifier's report**:
- See all 7 entries
- **CT-2024-001** highlighted in RED with warning icon
- ⚠️ **"Duplicate Study Numbers"** section visible
- Shows: "Study #CT-2024-001 was previously submitted by admin@speaksync.com"
- Rejection comment visible: "Study number CT-2024-001 conflicts with report from admin@speaksync.com..."

---

## Files Involved

### Mock Data Definition
- **`data/mockTestData.ts`** - Contains:
  - `mockStudiesUser1` - 8 studies for admin
  - `mockStudiesUser2` - 7 studies for verifier (1 duplicate)
  - `mockReportUser1` - Approved report
  - `mockReportUser2WithDuplicate` - Rejected report
  - `mockVerificationApproved` - Verification record (approved)
  - `mockVerificationRejected` - Verification record (rejected)

### Test Utilities
- **`utils/testDataLoader.ts`** - Contains:
  - `loadTestData()` - Initializes all mock data in localStorage
  - `clearTestData()` - Removes mock data
  - `mockDataSummary` - Formatted output for console
  - Global `window.speaksyncTestUtils` object for console access

### UI Integration
- **`pages/LoginPage.tsx`** - Updated with:
  - "📥 Load Test Data" button
  - "🗑️ Clear Data" button
  - Test data state management

---

## Key Testing Scenarios

### ✅ Scenario 1: User Submission with Duplicates (Blocked)
1. Log in as Verifier
2. Go to Reports tab
3. Try to resubmit report with CT-2024-001
4. **Result**: Submit button **disabled** with red warning
5. **Message**: "Cannot submit: Duplicate study numbers detected"

### ✅ Scenario 2: Verifier Views Duplicate Flag
1. Log in as Verifier (role: verifier)
2. Go to Reports tab
3. Click on pending report (User 2's with duplicate)
4. **Result**: 
   - Red border on CT-2024-001 entry
   - ⚠️ Warning icon + "Duplicate Study Numbers" section
   - Shows conflicting user email and original report ID
5. **Silently flagged** - User not aware of why it's flagged

### ✅ Scenario 3: Approve Clean Report
1. Log in as Admin
2. Submit new report or use pre-loaded one
3. Switch to Verifier
4. Click on Admin's report
5. Click "Review & Verify"
6. Add comment (optional)
7. Click "✅ Approve & Verify"
8. **Result**: Report moves to "Verified Reports" section

### ✅ Scenario 4: Reject with Comments
1. From verifier dashboard
2. Click on Verifier's duplicate report
3. Click "Review & Verify"
4. Enter comment: "Resolve duplicate with admin before resubmitting"
5. Click "❌ Reject"
6. **Result**: 
   - Report moves to "Rejected Reports"
   - Shows rejection comment and verifier name/date

---

## Data Structure Examples

### Report Entry
```typescript
{
  numerBadania: "CT-2024-001",           // Study number (UNIQUE across all users)
  opis: "CT Head - Trauma evaluation",   // Description
  dataWykonania: "2024-12-05T10:30:00Z", // Execution date
  kwota: 1000,                           // Amount (PLN)
  contentHash: "aGVhZC10cmF"             // Hash for duplicate detection
}
```

### Report
```typescript
{
  id: "report_admin_2024_12_1704067200000",
  userId: "admin@speaksync.com",
  userName: "Dr. Admin User",
  year: 2024,
  month: 12,
  entries: [...],
  status: "submitted",
  submittedAt: "2024-12-21T09:00:00Z",
  isPartialMonth: false,
  duplicateStudyNumbers: [
    {
      numerBadania: "CT-2024-001",
      existingReportId: "...",
      existingUserId: "...",
      existingUserEmail: "..."
    }
  ]
}
```

### Verification Record
```typescript
{
  id: "verification_...",
  reportId: "report_...",
  verifierId: "verifier@speaksync.com",
  status: "approved" | "rejected" | "pending",
  comments: "All entries verified...",
  verifiedAt: "2024-12-23T10:15:00Z"
}
```

---

## Cleanup

### Method 1: UI Button
Click **"🗑️ Clear Data"** button on login page

### Method 2: Console
```javascript
speaksyncTestUtils.clearTestData()
```

### Method 3: Manual
In browser DevTools → Application → LocalStorage:
- Delete: `speaksync_studies_admin@speaksync.com`
- Delete: `speaksync_studies_verifier@speaksync.com`
- Remove from `speaksync_reports`: entries with IDs starting with `report_admin_2024_12` and `report_verifier_2024_12`
- Remove from `speaksync_verifications`: verification records with matching report IDs

---

## Troubleshooting

### Test data not showing
- Check browser console for errors during `loadTestData()`
- Verify localStorage isn't full (clear cache if needed)
- Check that test accounts are enabled: `VITE_ENABLE_TEST_ACCOUNTS=true`

### Duplicate detection not working
- Ensure studies are in same month/year
- Study numbers must be **exact** string matches
- Check that both reports are in "submitted" status

### Verifier can't see reports
- Verify role is set to "verifier"
- Check Reports tab - you should see VerifierDashboard UI
- Ensure reports are actually in localStorage (check console: `localStorage.getItem('speaksync_reports')`)

---

## Next Steps for Testing

1. ✅ Test data loaded with 2 users
2. ✅ Verify duplicate detection works
3. ⏭️ Test accounting role viewing only approved reports
4. ⏭️ Test multi-month submissions
5. ⏭️ Test entry content hash collision detection
6. ⏭️ Test partial month warnings
7. ⏭️ Test role-based UI restrictions

---

## Console Access

In browser developer tools console, you can access:

```javascript
// Load test data
speaksyncTestUtils.loadTestData()

// View summary
console.log(speaksyncTestUtils.mockDataSummary)

// Clear test data  
speaksyncTestUtils.clearTestData()

// Check what's in localStorage
JSON.parse(localStorage.getItem('speaksync_reports'))
JSON.parse(localStorage.getItem('speaksync_verifications'))
```

---

**Last Updated**: December 28, 2025
**Test Data Version**: 1.0
**Status**: ✅ Ready for testing
