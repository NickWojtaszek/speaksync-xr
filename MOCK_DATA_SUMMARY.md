# Mock Test Data Summary

## Files Created for Testing

```
speaksync-xr/
├── data/
│   └── mockTestData.ts                 # Mock data definitions
├── utils/
│   └── testDataLoader.ts               # Test data initialization utilities
├── pages/
│   └── LoginPage.tsx                   # Updated with data loader buttons
├── TEST_DATA_GUIDE.md                  # Complete testing guide
└── MOCK_DATA_SUMMARY.md               # This file
```

---

## Quick Reference

### Load Test Data
**UI**: Click "📥 Load Test Data" on login page  
**Console**: `speaksyncTestUtils.loadTestData()`

### What Gets Loaded
✅ **Admin User** (`admin@speaksync.com`)
- 8 studies in December 2024
- 1 submitted & approved report
- Total: 9,750 PLN

✅ **Verifier User** (`verifier@speaksync.com`)
- 7 studies in December 2024 (1 duplicate study number)
- 1 submitted & rejected report
- Total: 8,850 PLN
- **Rejection Reason**: Duplicate study #CT-2024-001

---

## Test Scenarios Covered

| Scenario | User | Status | Testing Point |
|----------|------|--------|----------------|
| Clean report submission | Admin | Approved ✅ | No duplicates |
| Duplicate detection | Verifier | Rejected ❌ | Fraud prevention |
| Verifier dashboard | Verifier | - | Red warning flags |
| Role-based UI | Both | - | Verifier vs User views |
| Partial month warning | - | - | Pre-month end alert |
| Multi-user isolation | Both | - | Separate study lists |

---

## Data Files Structure

### `mockTestData.ts`
Contains all mock data objects:
- `mockStudiesUser1` - 8 CT/MR/US studies
- `mockStudiesUser2` - 7 studies with 1 duplicate
- `mockReportUser1` - Approved report
- `mockReportUser2WithDuplicate` - Rejected report  
- `mockVerificationApproved` - Verification record (approved)
- `mockVerificationRejected` - Verification record (rejected)
- `mockDataSummary` - Console-friendly formatted summary

### `testDataLoader.ts`
Utility functions:
- `loadTestData()` - Initialize all mock data in localStorage
- `clearTestData()` - Remove mock data
- Global `window.speaksyncTestUtils` - Console access

### `LoginPage.tsx` Changes
- Added `useState` for test data state
- Added test data management buttons
- Added `handleLoadTestData()` and `handleClearTestData()` handlers
- Integrated `loadTestData` and `clearTestData` imports

---

## Test Workflow

### 1️⃣ Load Data
```
Login Page → Click "📥 Load Test Data" → ✅ Data Loaded
```

### 2️⃣ Test Admin (Clean Report)
```
Click "Admin (Test)" → Reports Tab → See ✅ Approved Report
- 8 entries, 9,750 PLN
- Green "Verified" badge
```

### 3️⃣ Test Verifier (Duplicate Detection)
```
Logout → Click "Verifier (Test)" → Reports Tab → See VerifierDashboard
- Pending: 0
- Verified: 1 (Admin's clean report)
- Rejected: 1 (Verifier's report with duplicate)
```

### 4️⃣ Examine Duplicate Flag
```
Click Verifier's report → Expand → See:
- CT-2024-001 highlighted in RED
- ⚠️ "Duplicate Study Numbers" warning box
- Conflicting user: admin@speaksync.com
- Rejection comment visible
```

---

## Duplicate Detection Example

**Study #CT-2024-001**

```
Admin Report (Submitted 2024-12-21):
├─ CT-2024-001  ✓ First submission from admin
└─ Total: 1,000 PLN

Verifier Report (Submitted 2024-12-22):
├─ CT-2024-001  ✗ DUPLICATE - flagged as conflict
├─ Shows: "Study #CT-2024-001 was previously submitted 
│          by admin@speaksync.com"
└─ Result: Report REJECTED
```

---

## Storage Locations

All data stored in browser's localStorage:

| Key | Content | User-Specific |
|-----|---------|---|
| `speaksync_studies_admin@speaksync.com` | 8 studies | ✓ Admin only |
| `speaksync_studies_verifier@speaksync.com` | 7 studies | ✓ Verifier only |
| `speaksync_reports` | 2 reports | ✗ Shared |
| `speaksync_verifications` | 2 verification records | ✗ Shared |

---

## Console Access (DevTools)

```javascript
// View all available utilities
window.speaksyncTestUtils

// Load test data
speaksyncTestUtils.loadTestData()
// Output: ✅ Test data loaded successfully!

// View summary
console.log(speaksyncTestUtils.mockDataSummary)
// Output: Formatted ASCII table with test data info

// Clear test data
speaksyncTestUtils.clearTestData()
// Output: ✅ Test data cleared

// Check localStorage
JSON.parse(localStorage.getItem('speaksync_reports'))
JSON.parse(localStorage.getItem('speaksync_verifications'))
```

---

## Key Testing Points

### ✅ Duplicate Detection
- Study #CT-2024-001 submitted by Admin
- Same number attempted by Verifier
- System flags it silently to verifier
- Shows conflicting user details
- Report rejected with reason

### ✅ Role-Based UI
- Admin sees ReportSubmissionPage
- Verifier sees VerifierDashboard
- Different data displayed per role
- Only verifier can approve/reject

### ✅ Data Isolation
- Admin's studies separate from Verifier's
- Each user sees only their own study list
- Reports linked to correct user
- Verifications track verifier email

### ✅ Partial Month Warning
- Studies dated within December 2024
- Warning triggers if today < month-end
- User can still submit with acknowledgment
- Flag visible in report metadata

---

## Cleanup Instructions

### UI Method
Click "🗑️ Clear Data" button on login page

### Console Method
```javascript
speaksyncTestUtils.clearTestData()
```

### Manual Method
DevTools → Application → LocalStorage → Delete:
- `speaksync_studies_admin@speaksync.com`
- `speaksync_studies_verifier@speaksync.com`
- Remove test report entries from `speaksync_reports`
- Remove test verification entries from `speaksync_verifications`

---

## Status

✅ **Complete** - All test data files created and integrated
✅ **Tested** - Build successful, no errors
✅ **Documented** - Full testing guide provided
✅ **Ready** - Can load, test, and clear anytime

---

**For detailed testing instructions, see [TEST_DATA_GUIDE.md](TEST_DATA_GUIDE.md)**

**Last Updated**: December 28, 2025
