# Verify Demo Data is Loading

## Issue: Review Queue Empty

If you're not seeing the 6 demo claims in the insurance review queue, follow these steps:

---

## Step 1: Clear Browser Data

Open browser console (F12) and run:

```javascript
// Clear all localStorage
localStorage.clear();

// Verify it's empty
console.log('LocalStorage cleared:', localStorage.length === 0);
```

---

## Step 2: Refresh and Initialize Data

1. Refresh the page (`Ctrl+R` or `Cmd+R`)
2. The app should automatically initialize demo data
3. Open console and verify:

```javascript
// Check if demo data exists
const claims = JSON.parse(localStorage.getItem('demo_insurance_claims') || '[]');
console.log('Number of demo claims:', claims.length);
console.log('Demo claims:', claims);
```

**Expected:** Should show **6 claims**

---

## Step 3: Manually Initialize if Needed

If still empty, run this in console to force initialization:

```javascript
// Force initialize demo data
const demoData = [
  {
    claim_id: "CLM-2026-00142",
    patient_id: "PAT-883910",
    patient_name: "John Doe",
    hospital: "CityCare Hospital",
    payer_name: "ABC Health Insurance",
    cpt_code: "27447",
    icd10_code: "M17.11",
    claim_amount: 48000,
    status: "PENDING",
    submitted_date: "2026-08-15",
    ai_recommendation: "APPROVE",
    policy_id: "POL-KNEE-042",
    procedure_name: "Total Knee Arthroplasty",
    diagnosis_description: "Unilateral primary osteoarthritis, right knee",
    admission_date: "2026-08-10",
    discharge_date: "2026-08-14",
    attending_physician: "Dr. Sarah Mitchell",
    department: "Orthopedics"
  },
  {
    claim_id: "CLM-2026-00144",
    patient_id: "PAT-772901",
    patient_name: "Michael Brown",
    hospital: "Regional Medical Center",
    payer_name: "HealthPlus Insurance",
    cpt_code: "27447",
    icd10_code: "M17.12",
    claim_amount: 45000,
    status: "PENDING",
    submitted_date: "2026-08-18",
    ai_recommendation: "REQUEST_INFO",
    policy_id: "POL-KNEE-042",
    procedure_name: "Total Knee Arthroplasty",
    diagnosis_description: "Unilateral primary osteoarthritis, left knee",
    admission_date: "2026-08-14",
    discharge_date: "2026-08-17",
    attending_physician: "Dr. James Chen",
    department: "Orthopedics"
  },
  {
    claim_id: "CLM-2026-00201",
    patient_id: "PAT-445623",
    patient_name: "Sarah Johnson",
    hospital: "Metro General Hospital",
    payer_name: "HealthFirst Insurance",
    cpt_code: "99285",
    icd10_code: "I21.09",
    claim_amount: 12500,
    status: "PENDING",
    submitted_date: "2026-09-10",
    ai_recommendation: "APPROVE",
    policy_id: "POL-EMRG-089",
    procedure_name: "Emergency Department Visit - High Complexity",
    diagnosis_description: "Acute myocardial infarction",
    admission_date: "2026-09-08",
    discharge_date: "2026-09-09",
    attending_physician: "Dr. James Wilson",
    department: "Emergency Medicine"
  },
  {
    claim_id: "CLM-2026-00198",
    patient_id: "PAT-772341",
    patient_name: "Robert Martinez",
    hospital: "St. Mary's Medical Center",
    payer_name: "United Care Insurance",
    cpt_code: "43239",
    icd10_code: "K92.2",
    claim_amount: 8750,
    status: "PENDING",
    submitted_date: "2026-09-12",
    ai_recommendation: "REQUEST_INFO",
    policy_id: "POL-ENDO-034",
    procedure_name: "Upper GI Endoscopy with Biopsy",
    diagnosis_description: "Gastrointestinal hemorrhage, unspecified",
    admission_date: "2026-09-11",
    discharge_date: "2026-09-11",
    attending_physician: "Dr. Lisa Chen",
    department: "Gastroenterology"
  },
  {
    claim_id: "CLM-2026-00175",
    patient_id: "PAT-889012",
    patient_name: "Emily Davis",
    hospital: "Riverside Medical Center",
    payer_name: "BlueCross BlueShield",
    cpt_code: "29826",
    icd10_code: "M75.120",
    claim_amount: 22000,
    status: "PENDING",
    submitted_date: "2026-09-05",
    ai_recommendation: "APPROVE",
    policy_id: "POL-ORTH-067",
    procedure_name: "Arthroscopic Rotator Cuff Repair",
    diagnosis_description: "Complete rotator cuff tear, right shoulder",
    admission_date: "2026-09-03",
    discharge_date: "2026-09-04",
    attending_physician: "Dr. Michael Torres",
    department: "Orthopedic Surgery"
  },
  {
    claim_id: "CLM-2026-00156",
    patient_id: "PAT-334567",
    patient_name: "David Thompson",
    hospital: "Valley View Hospital",
    payer_name: "Aetna Insurance",
    cpt_code: "00630",
    icd10_code: "C61",
    claim_amount: 45000,
    status: "PENDING",
    submitted_date: "2026-08-28",
    ai_recommendation: "DENY",
    policy_id: "POL-SURG-123",
    procedure_name: "Radical Prostatectomy",
    diagnosis_description: "Malignant neoplasm of prostate",
    admission_date: "2026-08-25",
    discharge_date: "2026-08-27",
    attending_physician: "Dr. Patricia Anderson",
    department: "Urology"
  }
];

localStorage.setItem('demo_insurance_claims', JSON.stringify(demoData));
console.log('✅ Demo data initialized! Refresh the page.');
```

Then **refresh the page**.

---

## Step 4: Test Insurance Login

1. Go to: http://localhost:3000/login
2. Login:
   - Username: `insurance`
   - Password: `demo`
   - Click **Insurance** button
   - Click **Sign In**

3. Click **Review Queue** in sidebar

**Expected Result:**
- ✅ See 6 claims in the table
- ✅ Each with Patient name, Procedure, Amount
- ✅ Status: PENDING
- ✅ AI Recommendation badges visible
- ✅ "Review" button on each row

---

## Step 5: Verify Statistics

At the top of Review Queue page, you should see:

- **Needs Review:** 6
- **Needs Information:** 0
- **AI: Approve Recommended:** 3 (Claims 142, 201, 175)
- **AI: Needs Human Review:** 0 or varies

---

## Step 6: Test Review Flow

Click **Review** on any claim:

1. Should redirect to `/insurance/review/CLM-2026-XXXXX`
2. See "Loading claim and generating AI analysis..."
3. After 1 second, AI analysis appears
4. See claim details, AI recommendation, reasoning
5. Decision buttons at bottom

---

## Troubleshooting

### Problem: Still see empty review queue

**Check Console for Errors:**
```javascript
// Open browser console (F12)
// Look for any red error messages
```

**Verify App is Running:**
```bash
# In terminal, make sure dev server is running
cd /Users/chandakji2204/forge-defcon1/src/mediaudit-x/frontend
npm run dev
```

### Problem: Console shows "claims is not iterable"

The data structure might be corrupted. Clear and reinitialize:
```javascript
localStorage.removeItem('demo_insurance_claims');
// Refresh page
```

### Problem: Shows "No claims match your filters"

Reset filters:
- Status filter: Click **"All"**
- AI filter: Select **"All AI Recommendations"**
- Clear search box

---

## Success Checklist

✅ localStorage has 6 claims  
✅ Review Queue shows 6 rows  
✅ Each row has patient name and procedure  
✅ "Review" button works  
✅ AI analysis loads on review page  
✅ Can make decisions  

---

## Quick Test Commands

Copy and paste in browser console:

```javascript
// 1. Check demo data
const claims = JSON.parse(localStorage.getItem('demo_insurance_claims') || '[]');
console.log('✅ Claims loaded:', claims.length);

// 2. Show claim IDs
claims.forEach(c => console.log(c.claim_id, '-', c.patient_name, '-', c.status));

// 3. Verify all are PENDING
const pending = claims.filter(c => c.status === 'PENDING');
console.log('✅ PENDING claims:', pending.length);

// 4. Check AI recommendations
console.log('Approve:', claims.filter(c => c.ai_recommendation === 'APPROVE').length);
console.log('Deny:', claims.filter(c => c.ai_recommendation === 'DENY').length);
console.log('Request Info:', claims.filter(c => c.ai_recommendation === 'REQUEST_INFO').length);
```

**Expected output:**
```
✅ Claims loaded: 6
CLM-2026-00142 - John Doe - PENDING
CLM-2026-00144 - Michael Brown - PENDING
CLM-2026-00201 - Sarah Johnson - PENDING
CLM-2026-00198 - Robert Martinez - PENDING
CLM-2026-00175 - Emily Davis - PENDING
CLM-2026-00156 - David Thompson - PENDING
✅ PENDING claims: 6
Approve: 3
Deny: 1
Request Info: 2
```

---

## If All Else Fails

1. **Restart the dev server:**
```bash
# Stop with Ctrl+C
# Start again
npm run dev
```

2. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Firefox: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)

3. **Try different browser:**
   - Use Chrome, Firefox, or Edge
   - Make sure it's a standard browser (not Brave with aggressive blocking)

---

✅ **After following these steps, you should see all 6 claims in the Review Queue!**
