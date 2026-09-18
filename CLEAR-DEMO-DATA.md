# Clear Demo Data

If you don't see the new demo claims, clear the browser's localStorage:

## Option 1: In Browser Console
1. Open browser at http://localhost:3000
2. Press F12 (or right-click → Inspect)
3. Go to Console tab
4. Run this command:
```javascript
localStorage.clear()
```
5. Refresh the page

## Option 2: Application → Storage
1. Open browser at http://localhost:3000
2. Press F12 (or right-click → Inspect)
3. Go to Application tab (Chrome) or Storage tab (Firefox)
4. Click on "Local Storage" → "http://localhost:3000"
5. Click "Clear All" button
6. Refresh the page

## New Demo Claims

After clearing, you'll have **6 claims** available for insurance review:

1. **CLM-2026-00142** - John Doe - Knee Arthroplasty - $48,000 (APPROVE)
2. **CLM-2026-00144** - Michael Brown - Knee Arthroplasty - $45,000 (REQUEST_INFO)
3. **CLM-2026-00201** - Sarah Johnson - Emergency Visit - $12,500 (APPROVE)
4. **CLM-2026-00198** - Robert Martinez - GI Endoscopy - $8,750 (REQUEST_INFO)
5. **CLM-2026-00175** - Emily Davis - Rotator Cuff Repair - $22,000 (APPROVE)
6. **CLM-2026-00156** - David Thompson - Prostatectomy - $45,000 (DENY)

All set to PENDING status for insurance review!
