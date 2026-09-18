# Role-Based Access Control & Workflow Guide

## 🔒 Strict Access Control Implemented

Each role has specific, limited permissions. Users can ONLY perform actions appropriate to their role.

---

## 👥 Hospital Role (Claim Creator)

### What Hospital CAN Do:

#### 1. Create Claims
- Fill out simple, plain-language form
- Upload supporting documents (bills, prescriptions, reports)
- Generate AI-formatted claim with technical codes
- Review the generated technical report
- **Approve or Reject the formatted claim**

#### 2. Document Management
- Upload PDFs, images, documents
- Add bills, prescriptions, medical reports
- Remove uploaded files before submission
- Supported formats: PDF, JPG, PNG, DOC, DOCX

#### 3. View Own Claims
- See claims they've created
- Check submission status
- View approved/submitted claims

### What Hospital CANNOT Do:

❌ Edit claims after submission  
❌ Access insurance review queue  
❌ See insurance decisions before final notification  
❌ Re-submit rejected claims (must create new)  
❌ Access insurance reviewer tools  
❌ Make insurance decisions  

### Hospital Navigation:
```
✓ Dashboard
✓ My Claims
✓ Create Claim
```

---

## 🏥 Insurance Role (Reviewer)

### What Insurance CAN Do:

#### 1. View Submitted Claims
- See all claims submitted by hospitals
- Access through Review Queue
- Filter and search claims

#### 2. Review Automatic AI Analysis
- **AI analysis runs automatically** when claim arrives
- See detailed report in simple language:
  - Approve/Deny/Request Info recommendation
  - Policy compliance explanation
  - Medical necessity justification  
  - Patient history review
  - Risk factors identified
- No manual trigger needed - analysis is pre-generated

#### 3. Make Final Decision
- Accept claim (approve)
- Reject claim (deny)
- Request more information
- **Must provide comment** (mandatory)
- Confirm decision in modal

#### 4. View Audit History
- See all decisions made
- Review historical claims
- Track claim status changes

### What Insurance CANNOT Do:

❌ Create new claims  
❌ Edit claim details  
❌ Modify hospital-submitted information  
❌ Re-run AI analysis  
❌ Access hospital claim creation tools  
❌ Upload documents to existing claims  

### Insurance Navigation:
```
✓ Dashboard
✓ Review Queue
✓ Audit History
```

---

## 🔄 Complete Workflow

### Hospital Side:

**Step 1: Create Claim**
```
Navigate to: Create Claim
Fill form with plain language descriptions
```

**Step 2: Upload Documents**
```
Click "Upload files"
Select: Bills, prescriptions, medical reports
Add multiple files
Remove any incorrect uploads
```

**Step 3: Generate Technical Report**
```
Click "Generate Technical Claim Report"
Wait 3-4 seconds
AI generates:
- ICD-10 codes
- CPT codes
- RxNorm codes
- Technical diagnosis
- Medical necessity justification
- Billing breakdown
- Formal insurance letter
```

**Step 4: Review Generated Report**
```
Check all generated codes
Review technical diagnosis
Read formal letter
Verify billing breakdown
```

**Step 5: Approve or Reject**
```
Option A: Approve → Sends to insurance
Option B: Reject → Back to draft, can recreate
```

**Step 6: Submission**
```
If approved:
- Claim status: SUBMITTED
- Goes to insurance review queue automatically
- Hospital can track status
```

---

### Insurance Side:

**Step 1: Automatic Processing**
```
When hospital approves claim:
→ Claim arrives in insurance system
→ AI analysis runs AUTOMATICALLY
→ Detailed report generated immediately
→ No manual trigger needed
```

**Step 2: Review Queue**
```
Navigate to: Review Queue
See all claims with AI analysis complete
Filter by: Status, AI recommendation
Search by: Claim ID, patient, hospital
```

**Step 3: Open Claim Review**
```
Click "Review" on any claim
Navigate to: /insurance/review/[claim-id]
```

**Step 4: Review AI Analysis**
```
See pre-generated report with:

✓ AI Recommendation
  - APPROVE CLAIM
  - DENY CLAIM
  - REQUEST MORE INFORMATION

✓ Summary (Simple Language)
  "This claim meets all policy requirements..."

✓ Detailed Analysis:
  - Policy Compliance (plain explanation)
  - Medical Necessity (why it's needed)
  - Patient History (relevant background)
  - Risk Factors (concerns identified)

✓ Policy Requirements Check:
  - Each requirement with status
  - SATISFIED / NOT_SATISFIED / INSUFFICIENT_EVIDENCE
  - Explanation for each
```

**Step 5: Make Decision**
```
Three buttons available:
1. Approve Claim
2. Deny Claim
3. Request Info

Click your choice
```

**Step 6: Add Comment (Mandatory)**
```
Modal opens
Enter your reasoning
Comment is required
Cannot submit without comment
```

**Step 7: Confirm**
```
Review confirmation modal:
- Claim ID
- Patient name
- AI recommendation
- Your decision
- Your comment

Click "Confirm"
```

**Step 8: Decision Recorded**
```
Claim status updates
Audit trail records decision
Redirect to Review Queue
```

---

## 📊 AI Analysis Details

### What AI Analyzes (Automatic):

#### 1. Policy Compliance
```
Checks if claim follows insurance policy rules
Example:
"The claim satisfies all requirements under Policy POL-KNEE-042. 
Conservative treatment was documented for 187 days through physical 
therapy, exceeding the mandatory 180-day requirement..."
```

#### 2. Medical Necessity
```
Determines if procedure is medically needed
Example:
"Medical necessity is well-established. The patient has severe 
osteoarthritis with Grade 4 chondromalacia confirmed by MRI. 
Conservative management failed over 6 months. Total knee 
arthroplasty is appropriate standard of care..."
```

#### 3. Patient History
```
Reviews relevant medical background
Example:
"Patient is 65-year-old with 2+ year history of progressive knee pain. 
Initial diagnosis January 12, 2026. Completed 5 documented PT sessions 
over 187 days. MRI shows severe degenerative changes. No 
contraindications documented..."
```

#### 4. Risk Factors
```
Identifies concerns or issues
Example (if problems found):
"⚠ Only 62 days of documented treatment (118 days short)"
"⚠ 81-day gap in medical records"
"⚠ Insufficient evidence of continuous treatment"
```

#### 5. Policy Requirements
```
Each requirement gets a status:

✓ SATISFIED
  "Diagnosis of osteoarthritis properly documented with 
  clinical examination and imaging."

⚠ INSUFFICIENT_EVIDENCE
  "Only 62 days documented. Records needed for April 20 - July 10."

✗ NOT_SATISFIED
  "Conservative treatment requirement not met."
```

---

## 🎯 Key Differences from Before

### OLD Way (Before Update):

**Hospital:**
- Had to enter ICD-10, CPT codes manually ❌
- Needed medical coding knowledge ❌
- Could access review queue ❌
- Saw all claims ❌

**Insurance:**
- Had to click "Run Adjudication" button ❌
- Could create claims ❌
- Could edit claim details ❌
- Manual trigger for AI ❌

### NEW Way (Current):

**Hospital:**
- Only plain language input ✅
- No coding knowledge needed ✅
- Can ONLY see own claims ✅
- Limited to creation role ✅
- Document upload included ✅

**Insurance:**
- AI runs automatically ✅
- Cannot create/edit claims ✅
- Pre-generated analysis ✅
- Simple language reports ✅
- Limited to review role ✅

---

## 📂 Document Upload Feature

### Supported File Types:
- PDF documents
- JPG/JPEG images
- PNG images
- DOC/DOCX documents

### What to Upload:
- Hospital bills
- Medical prescriptions
- Lab reports
- Imaging reports (MRI, X-ray)
- Treatment records
- Doctor's notes

### How to Upload:
```
1. In Create Claim form, find "Supporting Documents" section
2. Click the upload area
3. Select files from computer
4. Multiple files can be added
5. See uploaded file list with sizes
6. Remove any file by clicking X button
7. Files included when claim is submitted
```

### File Display:
```
📎 hospital_bill.pdf (234 KB)
📎 prescription.jpg (156 KB)
📎 mri_report.pdf (1.2 MB)
```

---

## 🚀 Testing the New Flow

### Test Hospital Flow (10 minutes):

1. **Switch to Hospital Role**
   - Click "Switch to Hospital" in sidebar

2. **Create Claim**
   - Click "Create Claim"
   - Fill out form with plain language
   - Use sample data from previous guides

3. **Upload Documents**
   - Click upload area
   - Select 2-3 test files
   - Verify they appear in list
   - Try removing one

4. **Generate Report**
   - Click "Generate Technical Claim Report"
   - Watch AI processing
   - Review all generated codes

5. **Approve & Submit**
   - Click "Approve & Submit to Insurance"
   - Confirm submission
   - Note the claim ID

6. **Check Claims List**
   - Go to "My Claims"
   - See your submitted claim
   - Notice you can't access review queue

---

### Test Insurance Flow (10 minutes):

1. **Switch to Insurance Role**
   - Click "Switch to Insurance" in sidebar

2. **Open Review Queue**
   - Click "Review Queue"
   - See submitted claims
   - Notice AI analysis is already done (no button to run it)

3. **Open Claim Review**
   - Click "Review" on CLM-2026-00142
   - Goes to `/insurance/review/CLM-2026-00142`

4. **Review AI Analysis**
   - See automatic recommendation (APPROVE)
   - Read simple language summary
   - Check policy compliance section
   - Review medical necessity
   - Read patient history
   - Check policy requirements

5. **Make Decision**
   - Click "Approve Claim"
   - Modal opens

6. **Add Comment**
   - Enter: "All policy requirements satisfied. Medical necessity clearly documented. Conservative treatment duration exceeds requirement."

7. **Confirm Decision**
   - Click "Confirm APPROVE"
   - See success message
   - Redirected to review queue

8. **Test Access Control**
   - Try to go to "Create Claim" - should see it's not in navigation
   - Go to "My Claims" - see warning about read-only access

---

## 🔐 Access Control Alerts

### Hospital Trying to Access Insurance Features:
```
⚠ This page is only available to Insurance Reviewers
```

### Insurance Trying to Create Claims:
```
⚠ Read-Only Access
You are viewing claims as an Insurance Reviewer. 
Claims can only be created by hospitals.
Use the Review Queue to process submitted claims.
```

---

## 📍 Route Structure

### Hospital Routes:
```
/                          → Dashboard
/claims                    → My Claims (read-only list)
/hospital/create-claim     → Create New Claim
```

### Insurance Routes:
```
/                          → Dashboard
/review-queue              → Claims Review Queue
/insurance/review/[id]     → Review Specific Claim (automatic AI analysis)
/audit-trail               → Audit History
```

### Restricted Routes:
```
/claims/new                → Removed (use /hospital/create-claim)
/claims/[id]               → Removed for insurance (use /insurance/review/[id])
/patient-timeline          → Removed
/policy-lookup             → Removed
/reports                   → Removed
```

---

## 💡 Design Philosophy

### Separation of Concerns:

**Hospital:**
- Focus on patient care
- Describe treatment in simple terms
- Provide documentation
- Let AI handle technical coding

**Insurance:**
- Focus on policy compliance
- Review pre-analyzed claims
- Make informed decisions
- Cannot modify claim data

### Automatic vs Manual:

**Automatic** (No user action needed):
- AI analysis on claim submission
- Code generation from plain language
- Policy matching
- Requirement checking

**Manual** (Requires user action):
- Hospital approving generated claim
- Insurance final decision
- Adding reviewer comments
- Document uploads

---

## 🎓 Training Tips

### For Hospital Staff:
1. You don't need to know medical codes
2. Just describe treatment in plain English
3. Upload all relevant documents
4. Review the AI-generated report carefully
5. Only approve if everything looks correct
6. You can reject and start over

### For Insurance Reviewers:
1. AI has already analyzed when you open the claim
2. Read the simple language summary first
3. Check the detailed reasoning sections
4. Review policy requirements checklist
5. Your decision is final - choose carefully
6. Always explain your reasoning in comments

---

## ✅ Success Criteria

### Hospital:
✓ Can create claims without medical coding knowledge
✓ Can upload supporting documents
✓ Gets properly formatted technical claim
✓ Can approve or reject before submission
✓ Claim goes to insurance automatically when approved

### Insurance:
✓ Receives pre-analyzed claims
✓ Sees simple language AI report
✓ Understands policy compliance clearly
✓ Can make informed decision
✓ Decision is recorded with comment

---

## 🚀 Quick Links

- **Hospital Create Claim**: http://localhost:3000/hospital/create-claim
- **Insurance Review Queue**: http://localhost:3000/review-queue
- **Demo Claim #1 (Approval)**: http://localhost:3000/insurance/review/CLM-2026-00142
- **Demo Claim #2 (Insufficient)**: http://localhost:3000/insurance/review/CLM-2026-00144

---

**Role-based access control is now fully implemented!** 🎉

Each role has clear boundaries and appropriate tools for their job.
