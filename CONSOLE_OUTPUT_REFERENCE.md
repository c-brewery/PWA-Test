# Console Output Reference - What You Should See

When testing the data persistence fix, here's what the console should show at each stage:

## Stage 1: Page Load (Startup)

```
=== LOADING CACHED DATA ON STARTUP ===
Last loaded file: stock.json
Cached data exists: true
✅ Loaded cached inventory with 5 items
```

Or if no cached data yet:
```
=== LOADING CACHED DATA ON STARTUP ===
Last loaded file: null
Cached data exists: false
ℹ️ No cached data found - starting fresh
```

## Stage 2: Upload/Load a File

```
=== SAVE FORM SUBMIT ===
```

Wait, that's wrong. When you **upload** a file, you should NOT see SAVE FORM SUBMIT. Let me correct this...

Actually, when you upload a file via the file input, there's no form submission. The file just loads. You should see:

```
✅ Data saved to localStorage
   Key: cachedInventoryData
   Size: 2850 bytes
   Items: 5
```

Then the table displays the data.

## Stage 3: Edit and Save an Item

### When you click a row to open the edit modal:
```
Added hidden qr_code field: ABC-123-XYZ
```

### When you click "Save Changes":
```
=== SAVE FORM SUBMIT ===
QR Code from form: ABC-123-XYZ
FormData entries: ["qr_code", "name", "current_stock", "expected_stock", "notes", "last_updated"]
Current inventory data length: 5
Found item: {
  qr_code: "ABC-123-XYZ",
  name: "Widget A",
  current_stock: 10,
  expected_stock: 20,
  notes: "In stock",
  last_updated: "2024-01-15T10:30:00"
}
Item is in array: true ✓
Validation passed, updating item...
  name: "Widget A" → "Widget A Updated"
  current_stock: "10" → 15
  expected_stock: "20" → 25
  notes: "In stock" → "Recently checked"
Item after update: {
  qr_code: "ABC-123-XYZ",
  name: "Widget A Updated",
  current_stock: 15,
  expected_stock: 25,
  notes: "Recently checked",
  last_updated: "2024-01-15T10:30:00"
}
Item changed: true ✓
✅ Data saved to localStorage
   Key: cachedInventoryData
   Size: 2892 bytes
   Items: 5
Data saved to localStorage
```

## Stage 4: Reload Page

```
=== LOADING CACHED DATA ON STARTUP ===
Last loaded file: stock.json
Cached data exists: true
✅ Loaded cached inventory with 5 items
```

Then the table displays the data (with your changes still there!)

## Error Scenarios

### If QR Code is Missing from Form

```
=== SAVE FORM SUBMIT ===
QR Code from form: null
FormData entries: ["name", "current_stock", ...]
(notice "qr_code" is NOT in the list)
❌ ERROR: QR Code not in form data!
```

Then an alert shows: `Error: Missing QR code in form`

**Solution:** Hard refresh the page (Ctrl+Shift+R) to reload the latest code

### If Item Not Found

```
=== SAVE FORM SUBMIT ===
QR Code from form: ABC-123-XYZ
Current inventory data length: 5
Found item: undefined
Item is in array: false
❌ ERROR: Item not found with QR Code: ABC-123-XYZ
```

**Possible causes:**
- QR code in JSON file doesn't match what's in the form
- Data corruption
- Item was deleted from inventory

### If Validation Fails

```
=== SAVE FORM SUBMIT ===
QR Code from form: ABC-123-XYZ
...
Found item: {...}
Item is in array: true
(then an alert appears saying: "Validation Error: current_stock must be a number")
```

**Solution:** Fix the field that failed validation (e.g., enter a number for stock fields)

## Success Indicators - What You Want to See

✅ **All of these should appear:**
- [ ] `Added hidden qr_code field: ABC-123-XYZ` (when opening modal)
- [ ] `QR Code from form: ABC-123-XYZ` (when saving)
- [ ] `FormData entries:` includes `"qr_code"` at the start
- [ ] `Item is in array: true`
- [ ] At least one field shows a change: `field_name: "old" → "new"`
- [ ] `Item changed: true`
- [ ] `✅ Data saved to localStorage`
- [ ] After reload: `✅ Loaded cached inventory with X items`
- [ ] Table shows your updated values (not original)

## How to Read the Console

### Opening Developer Tools
- **Chrome/Edge/Firefox:** Press `F12`
- **Safari:** Cmd + Option + I
- **Mobile/Android:** Usually accessed through browser menu → Developer Tools

### Finding Console Messages
1. Click on the **Console** tab
2. You might see many messages - look for ones starting with:
   - `===` (these are our section markers)
   - `✅` (success messages)
   - `❌` (error messages)
   - `ℹ️` (info messages)

### Clearing Console
- Click the 🚫 icon to clear all messages
- Or type: `console.clear()` and press Enter

### Filtering Messages
You can filter to only show our messages:
1. In the Console, look for a filter box (usually at top)
2. Type: `SAVE FORM` or `LOADING CACHED`
3. This shows only relevant messages

## Timing

- **File upload to display:** Should be instant (< 1 second)
- **Click row to modal display:** Should be instant (< 100ms)
- **Save click to console output:** Should be instant (< 100ms)
- **Page reload to cached data display:** Should be instant (< 1 second)

## Mobile/Android Specific

On mobile devices, the console is accessed differently:
- **Android Chrome:** Menu → More Tools → Developer Tools, then Console tab
- **iOS Safari:** Settings → Safari → Advanced → Web Inspector (then inspect in desktop Safari)

The console output should be the same as desktop.

## Log Retention

Console messages are only shown in the current session. If you reload, previous messages disappear (but the cached data persists on disk).

To keep a record of console output for debugging:
1. Select all console text (Ctrl+A)
2. Copy (Ctrl+C)
3. Paste into a text file
4. Save the file

This is helpful if you need to report any issues.

---

**Expected Outcome:** After making changes, saving, and reloading, you should see all the success indicators above and your changes should still be in the table.

