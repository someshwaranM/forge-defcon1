# Complete Testing Guide - MediAudit-X

## 🎯 Overview

This guide demonstrates the complete end-to-end workflow with proper role-based access control.

---

## 🔐 Access Control Summary

### Hospital Portal (Limited):
- ✅ **CAN** create claims
- ✅ **CAN** view My Claims list (basic info)
- ✅ **CAN** submit approved claims to insurance
- ❌ **CANNOT** see insurance adjudication
- ❌ **CANNOT** see AI analysis
- ❌ **CANNOT** see policy details
- ❌ **CANNOT** access claim detail pages

### Insurance Portal (Review Only):
- ✅ **CAN** view review queue
- ✅ **CAN** see automatic AI analysis
- ✅ **CAN** approve/deny/request info with comments
- ❌ **CANNOT** create claims
- ❌ **CANNOT** edit claims
- ❌ **CANNOT** access hospital creation tools

---

## 🧹 Setup: Clear Old Data

Before testing, clear browser localStorage:

1. Open browser at http://localhost:3000
2. Press **F12** (DevTools)
3. Go to **Console** tab
4. Run: `localStorage.clear()`
5. Refresh page

---

## 📋 Demo Claims Available (6 Total)

All claims are in **PENDING** status for insurance review:

| Claim ID | Patient | Procedure | Amount | AI Recommendation |
|----------|---------|-----------|---------|-------------------|
| CLM-2026-00142 | John Doe | Knee Arthroplasty | $48,000 | ✅ APPROVE |
| CLM-2026-00144 | Michael Brown | Knee Arthroplasty | $45,000 | 📋 REQUEST_INFO |
| CLM-2026-00201 | Sarah Johnson | Emergency Visit | $12,500 | ✅ APPROVE |
| CLM-2026-00198 | Robert Martinez | GI Endoscopy | $8,750 | 📋 REQUEST_INFO |
| CLM-2026-00175 | Emily Davis | Rotator Cuff | $22,000 | ✅ APPROVE |
| CLM-2026-00156 | David Thompson | Prostatectomy | $45,000 | ❌ DENY |

---

## 🏥 Test 1: Hospital Workflow (10 minutes)

### Step 1: Login
```
URL: http://localhost:3000
Username: hospital
Password: demo
Role: Click "Hospital" button
Click: Sign In
```

### Step 2: View Dashboard
- ✅ See hospital dashboard
- ✅ Navigation shows: Dashboard, My Claims, Create Claim
- ✅ No insurance options visible

### Step 3: View My Claims
```
Click: My Claims
```
**Expected:**
- ✅ See list of 6 claims
- ✅ Columns: Claim ID, Patient, Payer, Procedure, Status, Amount, Submitted
- ✅ **NO "View" link** (no detail access)
- ✅ Simple list only

### Step 4: Create New Claim
```
Click: Create Claim
Fill out form:
- Patient Name: Test Patient
- Patient ID: PAT-999999
- Date of Birth: 1980-01-01
- Gender: Male
- Contact: +1 555 555 5555
- Admission Date: 2026-09-15
- Discharge Date: 2026-09-16
- Chief Complaint: "Severe abdominal pain"
- Diagnosis: "Patient has acute appendicitis requiring surgical intervention"
- Treatment: "Emergency appendectomy performed successfully"
- Procedures: "Laparoscopic appendectomy"
- Medications: "Pain management with morphine and antibiotics"
- Hospital Name: Test Hospital
- Hospital ID: HOSP-TEST
- Department: Emergency Surgery
- Physician: Dr. Test Doctor
- Room Type: Private
- Facilities: Standard surgical suite
- Insurance: Test Insurance
- Policy Number: TEST-123
- Policy ID: POL-TEST-001
- Total Amount: 15000
- Room: 2000
- Procedure: 10000
- Medication: 2000
- Other: 1000

Click: Generate Technical Report (wait for AI)
```

**Expected:**
- ✅ AI generates ICD-10 codes
- ✅ AI generates CPT codes
- ✅ AI generates RxNorm codes
- ✅ See formatted technical report

```
Review the report
Click: Approve & Submit to Insurance
```

**Expected:**
- ✅ Claim submitted successfully
- ✅ Redirected to My Claims
- ✅ New claim appears in list

### Step 5: Verify Access Restrictions
```
Try to access: http://localhost:3000/claims/CLM-2026-00142
```

**Expected:**
- ✅ Immediately redirected to /claims (My Claims list)
- ✅ **CANNOT** access claim detail page
- ✅ No insurance processing visible

### Step 6: Logout
```
Click: Logout button (bottom of sidebar)
```

**Expected:**
- ✅ Redirected to login page
- ✅ Session cleared

---

## 🏢 Test 2: Insurance Workflow (15 minutes)

### Step 1: Login
```
URL: http://localhost:3000/login
Username: insurance
Password: demo
Role: Click "Insurance" button
Click: Sign In
```

### Step 2: View Dashboard
- ✅ See insurance dashboard
- ✅ Navigation shows: Dashboard, Review Queue, Audit History
- ✅ No hospital creation options visible

### Step 3: Open Review Queue
```
Click: Review Queue
```

**Expected:**
- ✅ See 6 claims in PENDING status
- ✅ All submitted by hospitals
- ✅ Filter options available
- ✅ Search functionality

### Step 4: Review Claim #1 (Approval Case)
```
Find: CLM-2026-00142 (John Doe - Knee Arthroplasty)
Click: Review
```

**Expected:**
- ✅ Page loads with "Loading claim and generating AI analysis..."
- ✅ After 1 second, AI analysis appears automatically
- ✅ See alert: "Automatic AI Analysis Complete"

**Review the AI Analysis:**
- ✅ **Recommendation:** APPROVE (green badge)
- ✅ **Summary:** Clear explanation in simple language
- ✅ **Claim Information:**
  - Patient: John Doe
  - Hospital: CityCare Hospital
  - Procedure: Total Knee Arthroplasty
  - Amount: $48,000
  
- ✅ **AI Analysis Sections:**
  1. **Policy Compliance:** 
     - Explains 187 days PT exceeds 180-day requirement
     - Policy POL-KNEE-042 satisfied
  
  2. **Medical Necessity:**
     - Grade 4 chondromalacia on MRI
     - Failed conservative treatment
     - Procedure appropriate for condition
  
  3. **Patient History:**
     - 65-year-old with 2+ year progressive pain
     - 5 PT sessions documented
     - No contraindications
  
  4. **Risk Factors:** None listed

- ✅ **Policy Requirements Checklist:**
  - ✅ Diagnosis Documentation: SATISFIED
  - ✅ Conservative Treatment (180 days): SATISFIED (187 days)
  - ✅ Imaging Evidence: SATISFIED (MRI 05/20/2026)
  - ✅ Failed Conservative Treatment: SATISFIED
  - ✅ Medical Necessity: SATISFIED

**Make Decision:**
```
Click: Approve Claim
Modal opens
Enter Comment: "All policy requirements met. Conservative treatment well documented over 187 days. MRI confirms severe degenerative changes. Approval granted."
Click: Confirm Approval
```

**Expected:**
- ✅ Shows submitting state
- ✅ Success message appears
- ✅ Redirected to Review Queue
- ✅ Claim status updated (if you refresh data)

### Step 5: Review Claim #2 (Request Info Case)
```
Find: CLM-2026-00144 (Michael Brown - Knee Arthroplasty)
Click: Review
```

**Expected:**
- ✅ Automatic AI analysis loads
- ✅ **Recommendation:** REQUEST INFO (yellow badge)
- ✅ **Summary:** Only 62 days documented vs 180 required

**Review the Analysis:**
- ✅ **Policy Compliance:** NOT satisfied
  - Only 62 days documented
  - 81-day gap: April 20 - July 10
  - Cannot verify continuous treatment
  
- ✅ **Risk Factors:**
  - "Only 62 days of documented conservative treatment"
  - "81-day gap in medical records cannot be verified"
  - "Insufficient evidence of continuous treatment"
  
- ✅ **Policy Requirements:**
  - ✅ Diagnosis: SATISFIED
  - ⚠️ Conservative Treatment: INSUFFICIENT_EVIDENCE
  - ⚠️ Treatment Duration: INSUFFICIENT_EVIDENCE
  - ✅ Imaging: SATISFIED

**Make Decision:**
```
Click: Request Additional Information
Modal opens
Enter Comment: "Please provide physical therapy records for the period April 20, 2026 to July 10, 2026. Current documentation shows only 62 days of conservative treatment. Policy requires 180 continuous days."
Click: Confirm Request
```

**Expected:**
- ✅ Request submitted
- ✅ Back to Review Queue

### Step 6: Review Claim #3 (Emergency - Approve)
```
Find: CLM-2026-00201 (Sarah Johnson - Emergency Visit)
Click: Review
```

**Expected:**
- ✅ AI Recommendation: APPROVE
- ✅ Reason: Acute MI, emergency condition, appropriate level of care
- ✅ Policy: POL-EMRG-089 (Emergency Services)
- ✅ No pre-authorization required for emergencies

**Make Decision:**
```
Click: Approve Claim
Comment: "Emergency condition appropriately handled. Acute MI requires immediate high-complexity ED care. CPT 99285 correctly coded."
Confirm
```

### Step 7: Review Claim #4 (GI - Request Info)
```
Find: CLM-2026-00198 (Robert Martinez - GI Endoscopy)
Click: Review
```

**Expected:**
- ✅ AI Recommendation: REQUEST_INFO
- ✅ Issue: No documentation of conservative management first
- ✅ Policy: POL-ENDO-034 requires conservative attempts first

**Make Decision:**
```
Click: Request Additional Information
Comment: "Please provide documentation showing: 1) Severity of presentation, 2) Hemodynamic status, 3) Any conservative treatments attempted. Required to determine if immediate endoscopy was emergently indicated."
Confirm
```

### Step 8: Review Claim #5 (Rotator Cuff - Approve)
```
Find: CLM-2026-00175 (Emily Davis - Rotator Cuff Repair)
Click: Review
```

**Expected:**
- ✅ AI Recommendation: APPROVE
- ✅ Complete rotator cuff tear on MRI
- ✅ Conservative treatment attempted (PT + injections)
- ✅ Failed conservative management documented

**Make Decision:**
```
Click: Approve Claim
Comment: "Complete rotator cuff tear confirmed by imaging. Conservative treatment with PT and corticosteroid injections attempted without adequate response. Surgical repair medically appropriate. Approved."
Confirm
```

### Step 9: Review Claim #6 (Prostatectomy - Deny)
```
Find: CLM-2026-00156 (David Thompson - Prostatectomy)
Click: Review
```

**Expected:**
- ✅ AI Recommendation: DENY (red badge)
- ✅ Reason: **No pre-authorization obtained**
- ✅ Policy: POL-SURG-123 requires pre-auth 5+ days before procedure
- ✅ Policy violation regardless of medical appropriateness

**Review the Analysis:**
- ✅ Risk Factors:
  - "No pre-authorization obtained (required per policy)"
  - "Policy violation: POL-SURG-123 Section 4.2"
  - "Provider responsibility to obtain authorization"

**Make Decision:**
```
Click: Deny Claim
Modal opens
Enter Comment: "Claim denied due to lack of required pre-authorization. Policy POL-SURG-123 mandates pre-authorization at least 5 business days prior to all major oncologic surgical procedures. No authorization request was submitted. Provider must resubmit with proper authorization for consideration."
Click: Confirm Denial
```

**Expected:**
- ✅ Denial submitted
- ✅ Back to Review Queue

### Step 10: Verify Access Restrictions
```
Try to access: http://localhost:3000/hospital/create-claim
```

**Expected:**
- ✅ Should show "You are viewing as insurance" or redirect
- ✅ Cannot create claims

### Step 11: Review Queue Summary
```
Go to: Review Queue
```

**Expected:**
- ✅ See updated statuses
- ✅ Fewer PENDING claims (some now APPROVED/DENIED/REQUEST_INFO)
- ✅ Can filter by status

### Step 12: Logout
```
Click: Logout
```

**Expected:**
- ✅ Redirected to login
- ✅ Session cleared

---

## ✅ Test 3: Access Control Verification

### Test Hospital Cannot Access Insurance Pages
1. Login as **hospital**
2. Try to visit: `http://localhost:3000/review-queue`
3. **Expected:** Redirected away or blocked
4. Try to visit: `http://localhost:3000/insurance/review/CLM-2026-00142`
5. **Expected:** Blocked or redirected
6. Try to visit: `http://localhost:3000/claims/CLM-2026-00142`
7. **Expected:** Redirected to /claims list immediately

### Test Insurance Cannot Access Hospital Pages
1. Login as **insurance**
2. Try to visit: `http://localhost:3000/hospital/create-claim`
3. **Expected:** Blocked or see access warning
4. Try to visit: `http://localhost:3000/claims`
5. **Expected:** Redirected to /review-queue
6. Verify: No "Create Claim" button anywhere

---

## 🎯 Test 4: Role Switching (Logout Required)

### Hospital → Insurance
```
1. Login as hospital
2. Work on claims
3. Click Logout (NO direct switch)
4. Login as insurance
5. Access review queue
```

**Expected:**
- ✅ Cannot switch without logging out
- ✅ Must re-authenticate
- ✅ No "Switch to Insurance" button

### Insurance → Hospital
```
1. Login as insurance
2. Review claims
3. Click Logout
4. Login as hospital
5. Access My Claims
```

**Expected:**
- ✅ Must logout first
- ✅ Proper session separation
- ✅ No data leakage between sessions

---

## 📊 Expected Results Summary

### Hospital Side:
- ✅ Simple My Claims list (no detail links)
- ✅ Can create new claims
- ✅ Can see basic status
- ❌ Cannot see insurance adjudication
- ❌ Cannot see AI analysis
- ❌ Cannot access claim detail pages

### Insurance Side:
- ✅ Review queue shows 6 claims
- ✅ Automatic AI analysis on every claim
- ✅ Detailed reasoning in simple language
- ✅ Policy compliance details
- ✅ Can approve/deny/request info
- ✅ Must add comments
- ❌ Cannot create claims
- ❌ Cannot access hospital tools

### AI Analysis Quality:
- ✅ Simple, non-technical language
- ✅ Clear recommendations
- ✅ Detailed policy references
- ✅ Medical necessity explained
- ✅ Patient history summarized
- ✅ Risk factors identified
- ✅ Requirements checklist included

---

## 🐛 Troubleshooting

### Problem: Login page shows blank screen
**Solution:** 
```javascript
// Browser console:
localStorage.clear()
// Refresh page
```

### Problem: Don't see 6 claims
**Solution:**
```javascript
// Browser console:
localStorage.clear()
// Refresh and login again
```

### Problem: Claims show old data
**Solution:**
```javascript
// Browser console:
localStorage.removeItem('demo_insurance_claims')
// Refresh page
```

### Problem: Hospital can see insurance pages
**Solution:**
- Logout completely
- Clear localStorage
- Login again as hospital
- Should be blocked from insurance URLs

### Problem: Insurance can create claims
**Solution:**
- This should NOT be possible
- Check that you're really logged in as insurance
- Navigation should not show "Create Claim"

---

## 📖 Key Features Demonstrated

1. **Strict Role Separation**
   - Hospital and Insurance have completely different access
   - No cross-contamination of features

2. **Automatic AI Analysis**
   - No manual trigger needed
   - Loads automatically when insurance opens claim
   - 1-second simulated AI processing

3. **Simple Language Reports**
   - Non-technical explanations
   - Clear recommendations
   - Policy compliance in plain English
   - Medical reasoning explained simply

4. **Comprehensive Demo Data**
   - 6 different scenarios
   - Mix of approve/deny/request info
   - Different medical procedures
   - Different policy violations

5. **Proper Authentication**
   - Must login to access system
   - Must logout to switch roles
   - No direct role switching
   - Session management

6. **Real-World Workflow**
   - Hospital creates and submits
   - Insurance reviews and decides
   - Mimics actual healthcare claims process

---

## 🎉 Success Criteria

After completing all tests, you should have:

✅ Created a new claim as hospital  
✅ Verified hospital cannot see insurance processing  
✅ Logged in as insurance  
✅ Reviewed all 6 claims with automatic AI analysis  
✅ Made decisions: approve, deny, request info  
✅ Verified insurance cannot create claims  
✅ Confirmed proper role separation  
✅ Tested logout and re-login flow  

---

## 📞 Summary

**This implementation provides:**

1. ✅ **Complete role-based access control**
2. ✅ **Automatic AI analysis** for insurance
3. ✅ **Simple language** explanations
4. ✅ **6 comprehensive demo claims**
5. ✅ **Proper authentication** flow
6. ✅ **Realistic workflow** simulation

**Ready for production demonstration!** 🚀
