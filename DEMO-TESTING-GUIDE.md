# MediAudit-X - Complete Demo Testing Guide

## 🎉 New Features Implemented

### 1. Enhanced Hospital Claim Creation Workflow

**Complete AI-powered claim generation process:**

#### What Hospital Staff Do:
1. **Enter Raw Treatment Details** - Fill out a comprehensive form with:
   - Patient information (name, ID, DOB, gender, contact)
   - Treatment information (admission/discharge dates, diagnosis, procedures, medications)
   - Hospital details (department, physician, room type, facilities)
   - Insurance & billing (provider, policy, charges breakdown)

2. **Generate Report with AI** - Click one button to:
   - Automatically map terminology to standardized codes (ICD-10, CPT, RxNorm)
   - Match against insurance policy database
   - Calculate confidence scores for each code mapping
   - Generate formal claim letter
   - Compile supporting evidence

3. **Review Generated Report** - See:
   - Claim summary
   - All standardized medical codes with confidence levels
   - Matched insurance policy
   - Recommended claim amount
   - Complete formal letter ready for submission

4. **Approve & Submit** - Hospital staff reviews and approves, then:
   - Claim is transmitted to insurance company
   - Status changes to "PENDING" in insurance queue
   - Audit trail records the submission

### 2. Complete End-to-End Demo Data

**Two comprehensive demo scenarios ready to test:**

#### Scenario 1: CLM-2026-00142 (Approval Path)
- Patient: John Doe (65-year-old male)
- Procedure: Total Knee Arthroplasty
- **Complete timeline**: 187 days of physical therapy (01/12 → 07/18)
- **All requirements satisfied**:
  ✓ Diagnosis documented
  ✓ Conservative treatment 187 days (exceeds 180-day requirement)
  ✓ MRI showing severe degeneration
  ✓ Failed conservative treatment documented
- **AI Recommendation**: APPROVE
- **Expected outcome**: Smooth approval workflow

#### Scenario 2: CLM-2026-00144 (Insufficient Evidence)
- Patient: Michael Brown
- Procedure: Total Knee Arthroplasty
- **Timeline with gaps**:
  - 03/15 - 04/20: 36 days documented
  - **GAP**: 04/20 - 07/10 (81 days - no records)
  - 07/10 - 08/05: 26 days documented
- **Total**: Only 62 days vs 180 required
- **AI Recommendation**: NEEDS_REVIEW
- **Expected outcome**: Request additional information

## 🚀 How to Test the Complete Flow

### Prerequisites

```bash
# Make sure the dev server is running
cd /Users/chandakji2204/forge-defcon1/src/mediaudit-x/frontend
npm run dev
```

Open http://localhost:3000

### Step-by-Step Test Flow (30 minutes)

## Part 1: Hospital Creates Claim (10 min)

### Step 1: Access Demo Guide
Navigate to: **http://localhost:3000/demo-guide**

This page has complete step-by-step instructions!

### Step 2: Switch to Hospital Role
Click **"Switch to Hospital"** button at bottom of sidebar

You'll see:
- Sidebar changes to hospital navigation
- Role indicator shows "CityCare Hospital / Hospital Administrator"

### Step 3: Create New Claim
Click **"Create Claim"** in sidebar

OR

Dashboard → Click **"Create New Claim"** button

### Step 4: Fill Out Claim Form

Use this sample data for quick testing:

**Patient Information:**
```
Patient Name: John Doe
Patient ID: PAT-883910
Date of Birth: 1965-03-15
Gender: Male
Contact: +1 (555) 123-4567
```

**Treatment Information:**
```
Admission Date: 2026-08-10
Discharge Date: 2026-08-14
Chief Complaint: Severe right knee pain limiting mobility and daily activities

Diagnosis: Severe osteoarthritis of the right knee with Grade 4 chondromalacia, 
bone-on-bone contact, and significant joint space narrowing

Treatment: Total knee arthroplasty performed with cemented prosthesis implantation, 
postoperative pain management, physical therapy initiation

Procedures: Total knee arthroplasty, right side (Primary procedure)

Medications: Metformin 500mg, Losartan 50mg, Oxycodone 5mg for pain, 
Celecoxib 200mg for inflammation
```

**Hospital & Facilities:**
```
Department: Orthopedics
Attending Physician: Dr. Sarah Mitchell, MD
Room Type: Private
Facilities: Operating room, PACU, Private recovery room, Physical therapy, 
24-hour nursing care
```

**Insurance & Billing:**
```
Insurance Provider: ABC Health Insurance
Policy Number: ABC-POL-883910-2026
Policy ID: POL-KNEE-042
Total Amount: 48000
Room Charges: 8000
Procedure Charges: 35000
Medication Charges: 3000
Other Charges: 2000
```

### Step 5: Generate Report with AI

Click **"Generate Claim Report with AI"** button

Watch the AI process:
- ✓ Analyzing treatment details
- ✓ Mapping to standardized medical codes
- ✓ Matching against policy requirements
- ✓ Generating formal claim letter

### Step 6: Review Generated Report

You'll see:
- **Claim Summary**: Narrative description
- **Standardized Medical Codes**:
  - ICD-10: M17.11 (Unilateral primary osteoarthritis, right knee) - 96% confidence
  - CPT: 27447 (Total knee arthroplasty) - 98% confidence
  - RxNorm: Medication codes with confidence
- **Policy Match**: POL-KNEE-042 - Total Knee Arthroplasty Coverage - COVERED
- **Recommended Amount**: $48,000
- **Formal Letter**: Complete insurance claim letter

### Step 7: Approve & Submit

Click **"Approve & Submit to Insurance"** button

Success screen shows:
- Claim ID generated
- Submitted to insurance company
- Status: IN REVIEW

Click **"View All Claims"** or **"Create Another Claim"**

---

## Part 2: Insurance Reviews Claim (15 min)

### Step 8: Switch to Insurance Reviewer
Click **"Switch to Insurance"** button

You'll see:
- Updated sidebar navigation
- Role shows "Dr. Sarah Mitchell / Insurance Reviewer"

### Step 9: Open Review Queue
Click **"Review Queue"** in sidebar

OR

Navigate to: **http://localhost:3000/review-queue**

You'll see:
- Stats dashboard (Needs Review, Needs Information, AI recommendations)
- Claims table with filters
- AI recommendation badges for each claim

### Step 10: Filter and Find Claim
- Try filtering by "Approve Recommended"
- Search for "John Doe" or "CLM-2026-00142"
- Click **"Review"** button

### Step 11: Review Claim Overview
You're now on the comprehensive claim review page.

See:
- **Status Timeline**: Visual workflow progress
- **Claim header**: Patient, procedure, hospital, insurance
- **Tabs**: Overview, Clinical History, Policy, AI Assistant, Adjudication, Audit Trail

### Step 12: Run AI Adjudication
Click **"Run Adjudication"** button (top right)

Watch live streaming:
1. "Policy Search" - Finding applicable policies...
2. "Policy Match Found" - Matched policy details
3. "Patient Timeline Analysis" - Analyzing treatment history...
4. "Conservative Treatment Check" - Verifying requirements...
5. "Drug Safety Check" - Checking interactions...
6. "Evidence Validation" - Validating documentation...
7. "Decision Generation" - Generating recommendation...

### Step 13: Review AI Recommendation (Overview Tab)

**AI Recommendation Card shows:**
- **APPROVE RECOMMENDED** (green)
- Policy matched: POL-KNEE-042
- Evidence sources: 4
- Drug interactions: None found
- Step therapy: Satisfied
- ⚠️ Advisory disclaimer

**Claim Summary/Letter:**
- Formal adjudication decision letter
- Lists all satisfied requirements
- Approved amount: $48,000

### Step 14: Check Clinical History Tab
Click **"Clinical History"** tab

**Patient Timeline shows:**
- 01/12: Initial Diagnosis
- 02/03: Physical Therapy - Session 1
- 03/08: PT Session 2
- 04/12: PT Session 3
- 05/20: MRI Scan (severe degeneration)
- 06/18: PT Session 4
- 07/18: PT Session 5 - **187 days total**
- 08/03: Orthopedic consultation
- 08/10: Hospital admission
- 08/10: Total knee arthroplasty performed
- 08/14: Hospital discharge

**Key insight**: 187 days exceeds 180-day requirement!

### Step 15: Review Policy Requirements (Policy & Guidelines Tab)
Click **"Policy & Guidelines"** tab

**Matched Policy:**
- POL-KNEE-042: Total Knee Arthroplasty Coverage Policy
- ABC Health Insurance
- Step therapy required: Yes

**Requirements Status:**
- ✓ **Diagnosis Requirement**: SATISFIED
  - Evidence: ICD-10 M17.11, Clinical examination
- ✓ **Conservative Treatment**: SATISFIED
  - Evidence: PT from 02/03 - 07/18 (187 days)
- ✓ **Treatment Duration**: SATISFIED
  - Evidence: 187 days > 180 days required
- ✓ **Imaging Evidence**: SATISFIED
  - Evidence: MRI 05/20 showing Grade 4 degeneration
- ✓ **Failed Conservative Treatment**: SATISFIED
  - Evidence: PT notes show minimal improvement
- ✓ **Functional Limitations**: SATISFIED
  - Evidence: Severe pain limiting mobility

### Step 16: Use AI Assistant (AI Assistant Tab)
Click **"AI Assistant"** tab

**Try these questions:**

**Q1:** "Was the conservative treatment requirement satisfied?"

**Expected Answer:**
```
Yes. The available clinical records support the requirement.

Why:
The applicable policy requires at least 180 days of conservative treatment.

The patient timeline contains:
• Jan 12 — Physical therapy started
• Jul 18 — Physical therapy documented

Observed interval: 187 days

Conclusion:
Requirement: SATISFIED

Evidence:
[EV-18291] PT note — Jan 12, 2026
[EV-19281] PT note — Jul 18, 2026
[POL-042-4.2] Policy section 4.2
```

**Q2:** "Why is this claim recommended for approval?"

**Expected Answer:**
```
This claim is recommended for approval because the required policy criteria 
identified for this claim are supported by the available evidence.

Verified:
✓ Diagnosis requirement satisfied
✓ Conservative treatment documented
✓ Treatment duration requirement met
✓ Imaging evidence available

Important:
The recommendation remains advisory and requires final reviewer approval.
```

**Q3:** "Are there any medication interaction concerns?"

**Expected Answer:**
```
No relevant drug interactions were identified in the available interaction 
dataset for the medications reviewed.

Note:
This does not establish that the medications are universally safe for the patient.
The reviewer should consider the complete clinical context.

Medications checked:
• Metformin 500mg
• Losartan 50mg

Interaction database:
FDA RxNorm interaction pairs
```

### Step 17: Make Final Decision (Back to Overview Tab)
Go back to **"Overview"** tab

Scroll down to **"Final Reviewer Decision"** section

**Complete the decision:**

1. **Select Decision**: Click **"Approve Claim"**

2. **Enter Comment** (required):
```
Medical necessity criteria verified against applicable policy and clinical records. 
All requirements documented and satisfied. Conservative treatment duration of 187 days 
exceeds policy requirement. Imaging confirms severe degenerative changes. 
Patient appropriate candidate for total knee arthroplasty.
```

3. **Submit**: Click **"Submit Decision"** button

4. **Confirmation Modal** shows:
   - Claim ID: CLM-2026-00142
   - AI recommendation: APPROVE RECOMMENDED
   - Your decision: APPROVED
   - Your comment
   - **Click "Confirm Approval"**

### Step 18: View Final State

**Success!** Claim is now **APPROVED**

See:
- Status changed to APPROVED
- AI recommendation still visible (for comparison)
- Human decision recorded
- Reviewer comment preserved
- Timestamp and reviewer name logged

**Check Audit Trail tab:**
- Complete chronological record
- Submission time
- AI analysis steps
- Reviewer actions
- Final decision
- Hash-chained ledger entry

---

## Part 3: Test Insufficient Evidence Scenario (5 min)

### Step 19: Open Second Demo Claim
Navigate to: **http://localhost:3000/claims/CLM-2026-00144**

OR

Go to Review Queue → Find "Michael Brown" claim

### Step 20: Run Adjudication
Click **"Run Adjudication"**

**AI will return**: NEEDS_REVIEW

### Step 21: Check Clinical History
Go to **"Clinical History"** tab

**Timeline shows gaps:**
- 03/15: Diagnosis
- 03/15: PT Session 1
- 04/20: PT Session 2 (36 days from start)
- **GAP: 04/20 - 07/10 (81 days - no documentation)**
- 07/10: PT Session 3 (resumed after gap)
- 08/05: PT Session 4 (26 days in this period)

**Total documented: 62 days** (far short of 180 required)

### Step 22: Review Policy Requirements
Click **"Policy & Guidelines"** tab

**Requirements show:**
- ✓ Diagnosis: SATISFIED
- ? Conservative Treatment: **INSUFFICIENT_EVIDENCE**
  - Only 62 days documented
  - Gap in records cannot be verified
- ? Treatment Duration: **INSUFFICIENT_EVIDENCE**
  - Cannot establish continuous 180-day period

### Step 23: Ask AI About the Issue
Go to **"AI Assistant"** tab

**Ask:** "Why is this claim flagged for human review?"

**Expected Answer:**
```
The claim requires human review because the available records do not establish 
continuous 6-month conservative treatment.

Issue:
The policy requires at least 180 days of documented conservative treatment.

Available evidence:
• Mar 15 - Apr 20: 36 days documented
• Apr 20 - Jul 10: Gap in records (81 days)
• Jul 10 - Aug 5: 26 days documented

Total documented: 62 days

Conclusion:
Insufficient evidence to establish the requirement. The gap period is not 
documented, so we cannot determine if treatment continued during that time.
```

**Key learning:** System says "insufficient evidence" NOT "requirement failed"

### Step 24: Test Request Information
Go back to **"Overview"** tab

**In Final Reviewer Decision:**
1. Select **"Request Information"**
2. Enter comment:
```
Unable to establish 180-day continuous conservative treatment requirement. 
Clinical records show 36 days (03/15-04/20) and 26 days (07/10-08/05) for 
total of 62 documented days. Please provide documentation for the period 
04/20 through 07/10 (81-day gap).
```
3. Click **"Submit Decision"**
4. Confirm

**Result:** Claim status becomes **REQUEST_INFO**

---

## 📊 What You Can Test

### ✅ Hospital Features
- [x] Create claim with comprehensive form
- [x] AI-powered code mapping
- [x] Confidence scoring
- [x] Policy matching
- [x] Formal letter generation
- [x] Review generated report
- [x] Edit and regenerate
- [x] Approve and submit workflow
- [x] Success confirmation

### ✅ Insurance Features
- [x] Review queue with filters
- [x] AI recommendation badges
- [x] Claim status timeline
- [x] AI adjudication streaming
- [x] Policy requirements with evidence
- [x] Patient timeline analysis
- [x] Interactive AI chat
- [x] Evidence citations
- [x] Temporal reasoning (day calculations)
- [x] Human decision workflow
- [x] Mandatory comments
- [x] Confirmation dialogs
- [x] Approve/Deny/Request Info
- [x] Complete audit trail
- [x] Hash-chained ledger

### ✅ Edge Cases
- [x] Insufficient evidence handling
- [x] Treatment gaps visualization
- [x] Missing vs failed requirements
- [x] Request information workflow

### ✅ UX Excellence
- [x] Role-based navigation
- [x] Progressive disclosure
- [x] Loading states
- [x] Empty states
- [x] Error handling
- [x] Responsive design
- [x] Keyboard navigation
- [x] Visual feedback
- [x] Clear data hierarchy

## 🎯 Key Demo Points to Emphasize

### 1. AI Assists, Humans Decide
- AI recommendation clearly marked as "advisory"
- Human decision section completely separate
- Mandatory reviewer comment
- Both decisions visible for comparison

### 2. Evidence-Based
- Every conclusion linked to source documents
- Evidence IDs and citations throughout
- Timeline shows exact dates and durations
- Policy requirements mapped to evidence

### 3. Zero-Hallucination Design
- Temporal calculations shown explicitly (187 days vs 180 required)
- "Insufficient evidence" vs "requirement not satisfied" distinction
- No fabricated confidence percentages
- Deterministic decision logic

### 4. Complete Audit Trail
- Every action recorded
- Hash-chained for tamper evidence
- Timestamps and actors
- Comments preserved

### 5. Professional Healthcare UI
- Clean, trustworthy design
- Not a generic admin dashboard
- Healthcare-appropriate colors and typography
- Dense information presentation when needed

## 🔧 Configuration

### Toggle Demo Data
In the code, you can switch between demo and real API:

```typescript
// app/claims/page.tsx
const USE_DEMO_DATA = true; // Set to false when backend is available

// app/claims/[id]/page.tsx
const USE_DEMO_DATA = true; // Set to false when backend is available
```

### Demo Data Storage
All demo data is stored in browser localStorage under key `mediaudit_demo_claims`.

To reset demo data:
```javascript
// In browser console
localStorage.removeItem('mediaudit_demo_claims');
// Refresh page
```

## 📝 Demo Data Scenarios

### Available Claims:
1. **CLM-2026-00142** - Complete approval path (John Doe)
2. **CLM-2026-00144** - Insufficient evidence (Michael Brown)

### Add More Scenarios:
Edit `app/lib/completeDemoData.ts` to add more scenarios with complete:
- Patient timelines
- Policy requirements
- AI responses
- Evidence citations

## 🚀 Next Steps

1. **Test the complete flow** (30 min)
2. **Customize demo data** for your specific use case
3. **Add more scenarios** as needed
4. **Connect real backend** when ready (change USE_DEMO_DATA to false)
5. **Deploy and demo** to stakeholders

## 🎬 Quick Demo Script (5 min)

For a quick 5-minute demo:

1. **Start at demo guide page**: http://localhost:3000/demo-guide
2. **Show hospital flow**: Create claim → Generate → Review → Submit (2 min)
3. **Switch to insurance**: Review queue → Open CLM-2026-00142 (1 min)
4. **Run adjudication**: Show AI streaming analysis (1 min)
5. **Approve claim**: Make decision with comment (1 min)

Done! Complete end-to-end flow demonstrated.

---

## 💡 Tips

- Use the **Demo Guide page** (`/demo-guide`) as a reference during demos
- Keep both browser windows open (one for hospital, one for insurance)
- The role switcher makes it easy to toggle between experiences
- All data persists in localStorage, so you can refresh without losing state
- Timeline dates are realistic and calculations are accurate
- Evidence citations work even though documents don't exist (shows the pattern)

## 🎉 You're Ready!

Everything is set up for complete end-to-end testing. No backend required!

Open http://localhost:3000 and start testing! 🚀
