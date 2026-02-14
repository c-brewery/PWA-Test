# Data Persistence Debug Guide

This guide will help you test if data persistence is working correctly.

## Prerequisites
- Server running: `npm start` at http://localhost:3000
- Browser DevTools available (F12)
- A test JSON file with inventory items

## Test Steps

### 1. Open the App and DevTools
1. Open http://localhost:3000 in your browser
2. Open Developer Tools: Press **F12** (or right-click → Inspect)
3. Click the **Console** tab

### 2. Load Inventory Data
1. Click the **Upload** button or menu option
2. Select a JSON file (like `stock.json`)
3. Wait for the data to load into the table
4. In the Console, you should see: `✅ Data saved to localStorage`

### 3. Make Changes and Save
1. Click any **row** in the table to open the edit modal
2. Change one or more fields (e.g., change stock numbers, notes)
3. Click the **Save Changes** button
4. Watch the Console for log messages

### 4. Check Console Output for "SAVE FORM SUBMIT"
You should see logs like:

```
=== SAVE FORM SUBMIT ===
QR Code from form: ABC123
Current inventory data length: 5
Found item: {qr_code: "ABC123", ...}
Item is in array: true
Validation passed, updating item...
  current_stock: "10" → 15
  expected_stock: "20" → 25
Item after update: {qr_code: "ABC123", current_stock: 15, ...}
Item changed: true
✅ Data saved to localStorage
   Key: cachedInventoryData
   Size: 2841 bytes
   Items: 5
Data saved to localStorage
```

### 5. Reload and Verify
1. Press **F5** or **Ctrl+R** to reload the page
2. Check Console for: `=== LOADING CACHED DATA ON STARTUP ===`
3. You should see:
   ```
   ✅ Loaded cached inventory with 5 items
   ```
4. **Check the table** - your changes should be there!

## What to Look For - Success Indicators

✅ **Save Phase:**
- [ ] `Found item: {object}` appears (not undefined/null)
- [ ] `Item is in array: true` is logged
- [ ] `Item changed: true` confirms values changed
- [ ] `✅ Data saved to localStorage` appears with size and item count
- [ ] No error messages in red

✅ **Reload Phase:**
- [ ] `✅ Loaded cached inventory with X items` appears on reload
- [ ] Table shows your modified data (not original)

## What to Look For - Error Indicators

❌ **These indicate a problem:**

1. **"Item not found with QR Code:"**
   - QR code in form doesn't match any item
   - Problem: Item reference might not be in array

2. **"Item is in array: false"**
   - Item was found but isn't in the master data array
   - Problem: Item object lost reference to original array

3. **"Item changed: false"**
   - Form submission didn't update any fields
   - Problem: Form parsing or field matching issue

4. **No "Data saved to localStorage" message**
   - saveToCache() wasn't called
   - Problem: Validation might have failed

5. **After reload, old data shows**
   - Changes were saved to wrong place
   - Problem: Different item was edited, or cache key mismatch

## Additional Testing

### Test localStorage Directly
In the Console, paste:
```javascript
// Check what's stored
const cached = localStorage.getItem('cachedInventoryData');
const data = JSON.parse(cached);
console.log("Items in localStorage:", data.length);
console.log("First item:", data[0]);
```

### Clear Cache and Start Over
```javascript
localStorage.clear();
console.log("Cache cleared - reload the page");
```

### Check if Changes Actually Saved
After making changes and saving:
```javascript
const stored = JSON.parse(localStorage.getItem('cachedInventoryData'));
const item = stored.find(x => x.qr_code === 'ABC123'); // Use actual QR code
console.log("Item in storage:", item);
```

## Common Issues and Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Changes disappear after reload | Not saving to localStorage | Check console for "saved" message |
| Can't find item in form | QR code mismatch | Check that form QR code matches table |
| Page shows old data after edit | Cache not loaded on startup | Check "LOADING CACHED DATA" logs |
| Form fields won't save | Validation error | Check alerts, look for validation errors |

## Next Steps if Issue Found

1. **Share the console output** from Steps 3-5 above
2. **Note which specific log message is missing** or shows an error
3. **Check that your QR codes in the JSON file are unique**
4. **Try with a simple test file** with just 1-2 items

