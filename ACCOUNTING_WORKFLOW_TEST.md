# Accounting Workflow - Testing Guide

## Quick Start - Load Test Data

Open browser console and run:
```javascript
// Load test data (creates verified reports and accounting records)
loadTestData()

// Clear test data when done
clearTestData()
```

## Test Workflow Steps

### Step 1: Load Test Data
1. Open browser DevTools (F12)
2. Go to Console tab
3. Run: `loadTestData()`
4. Verify output shows "✅ Test data loaded successfully!"

### Step 2: Access Verifier Dashboard
1. Click "Verifier" test button (top-right)
2. Should see:
   - Pending Reports: 0
   - Verified (Approved): 1
   - Rejected: 1

### Step 3: View Approved Report in Verifier
1. Click "Verified" tab to see approved reports
2. Click the "Expand" button on the Admin report
3. Can view Specification, Invoice, and Summary documents
4. See "Send to Accounting" button

### Step 4: Access Accounting Dashboard
1. Click "Accounting" button (💰) in the header
2. Should see approved reports listed with filters
3. Can toggle Status, User filters
4. See "Received" status on the approved report

### Step 5: Test Accounting Status Tracking
1. In Accounting Dashboard, click the report to expand it
2. Click status buttons:
   - Yellow "Received" button (current status)
   - Blue "Mark as Processed" button
   - Green "Mark as Sent to Bank" button
3. Watch status change and update in real-time
4. Click "View History" to see status change timeline with timestamps

### Step 6: Test Internal Notes
1. In expanded report, scroll to "Internal Notes" section
2. Type a note in the textarea
3. Click "Add Note" button
4. See note appear with author name and timestamp
5. Click "Delete" to remove notes

### Step 7: Test Financial Reports
1. Scroll down in Accounting Dashboard to "Financial Reports" section
2. Click the expand button
3. Select date range:
   - Monthly: December 2024 (shows 1 approved report)
   - Yearly: 2024
   - Custom: Custom date picker
4. Select views to display:
   - ☑ Summary
   - ☑ By User
   - ☑ By Code
   - ☐ Detailed (optional)
5. Click "Generate Report"
6. See financial data displayed in tables
7. Click "Export to CSV" to download report

## Accounting Dashboard Features

### Filters
- **User Filter**: Filter reports by user name (case-insensitive)
- **Status Filter**: Show all, received, processed, or sent_to_bank

### Report List
- Each report shows:
  - User name and email
  - Month/Year submitted
  - Total amount in PLN
  - Current accounting status (badge)
  - Report count

### Expanded Report View
- **Specification Tab**: Full study details
- **Invoice Tab**: Formatted billing information
- **Summary Tab**: Summary of amounts and codes
- **Status History**: Timeline of all status changes with:
  - Previous status
  - New status
  - Who changed it (email)
  - When it changed (timestamp)
- **Internal Notes**: Add/view/delete notes with author and timestamp

### Financial Report Generator
- **Date Range Selection**: Monthly, Yearly, Custom
- **Multiple Views**: Summary, By User, By Code, Detailed
- **Toggle Views**: Show/hide different aggregations
- **CSV Export**: Export filtered report data
- **Amount Formatting**: PLN currency with locale formatting

## Data Being Tested

### Mock Report Data (User 1 - Admin)
- **Report ID**: report_admin_2024_12_1704067200000
- **User**: admin@speaksync.com (Mikołaj Wojtaszek)
- **Month/Year**: December 2024
- **Status**: Submitted
- **Verification**: Approved (Dec 23, 2024 by verifier@speaksync.com)
- **Amount**: Total from December 2024 studies

### Mock Verification Data
- **Approved Report**: Verified by verifier@speaksync.com
  - Comments: "All entries verified. Amounts match submitted studies. No issues found."
  - Status: approved
- **Rejected Report**: Rejected by accounting@speaksync.com
  - Comments: "Study number CT-2024-001 conflicts with admin report. Cannot approve duplicate billing."
  - Status: rejected

### Mock Accounting Record
- **Report**: Approved report (admin)
- **Initial Status**: received
- **Created**: Dec 23, 2024
- **Ready for workflow updates**: status → processed → sent_to_bank

## Workflow Validation Checklist

- [ ] Test data loads successfully
- [ ] Verifier sees 1 approved and 1 rejected report
- [ ] Accounting Dashboard shows approved report
- [ ] Status can be updated (Received → Processed → Sent to Bank)
- [ ] Status history shows all changes with timestamps
- [ ] Internal notes can be added and deleted
- [ ] Financial reports generate correctly
- [ ] CSV export works and contains expected data
- [ ] All UI elements are visible and responsive
- [ ] Filters work correctly
- [ ] Currency formatting is correct (PLN)

## Troubleshooting

### Accounting Dashboard Shows No Reports
1. Check browser console for errors
2. Verify verifications are loaded: `JSON.parse(localStorage.getItem('speaksync_verifications'))`
3. Ensure status is 'approved': `JSON.parse(localStorage.getItem('speaksync_reports')).find(r => r.id === 'report_admin_2024_12_1704067200000')`
4. Check: `JSON.parse(localStorage.getItem('speaksync_verifications')).filter(v => v.status === 'approved')`

### No Test Data Loaded
1. Open DevTools Console
2. Run: `loadTestData()`
3. Check for any error messages
4. Verify all localStorage items were created:
   ```javascript
   console.log('Reports:', JSON.parse(localStorage.getItem('speaksync_reports')))
   console.log('Verifications:', JSON.parse(localStorage.getItem('speaksync_verifications')))
   console.log('Accounting:', JSON.parse(localStorage.getItem('speaksync_accounting')))
   ```

### Status Updates Not Persisting
1. Check localStorage for accounting records
2. Verify useEffect dependencies include verificationRecords
3. Look for TypeScript errors in console

### Financial Reports Not Calculating
1. Ensure approved reports are visible in accounting dashboard
2. Check that selected date range includes report dates
3. Verify view options are selected (checkboxes)
4. Look for calculation errors in browser console

## Testing User Roles

### Admin Role
- Can access reports section
- Can generate reports
- Can submit to verifier

### Verifier Role
- Access via "Verifier" test button
- Can see pending, approved, rejected tabs
- Can approve/reject reports
- Can send approved reports to accounting

### Accounting Role
- Access via 💰 button (only visible for accounting role)
- Can view approved reports only
- Can update status (Received → Processed → Sent to Bank)
- Can add internal notes
- Can generate financial reports
- Can export to CSV

## Next Steps for Manual Testing

1. **Create New Report**
   - Login as admin
   - Generate December 2025 report
   - Submit to verifier

2. **Verify Report**
   - Approve/Reject in verifier dashboard
   - See it appear in accounting if approved

3. **Process in Accounting**
   - Update status through workflow
   - Add notes about processing
   - Generate financial reports
   - Export for bank submission

4. **Verify End-to-End**
   - Confirm all status changes are recorded
   - Verify notes are persistent
   - Check financial calculations
   - Test CSV export formatting
