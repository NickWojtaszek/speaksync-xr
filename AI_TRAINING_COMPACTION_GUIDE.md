# AI Style Training Compaction System

## Overview
Implemented a hard-stop-at-20 training data management system to prevent unbounded storage growth while maintaining user control over AI training quality.

## Implementation Details

### 1. Storage Limit Enforcement
- **Hard Limit**: 20 style training examples maximum
- **Behavior**: `addStyleExample()` silently rejects new examples when limit is reached
- **User Notification**: Toast message and disabled button state inform users when limit is hit

### 2. Context Updates (`context/SettingsContext.tsx`)

**New Interface Methods:**
```typescript
interface SettingsContextType {
  // ... existing methods ...
  removeStyleExample: (id: string) => void;
  updateStyleExamples: (examples: StyleExample[]) => void;
  isStyleTrainingLimitReached: boolean;
}
```

**Key Functions:**
- `addStyleExample()`: Enforces 20-example limit with console warning
- `removeStyleExample()`: Deletes individual examples by ID
- `updateStyleExamples()`: Batch replaces all examples (used during compaction)
- `isStyleTrainingLimitReached`: Boolean flag computed from current count

### 3. Editor Panel Updates (`components/EditorPanel.tsx`)

**Train AI Button Enhancement:**
- Disabled state when `isStyleTrainingLimitReached === true`
- Visual indicator showing count (e.g., "(20/20)")
- Tooltip explains limit and directs to Settings
- Toast message on attempted training when limit reached

**Code:**
```typescript
{lastRawText && (
  <button
    onClick={handleTrainAI}
    disabled={isStyleTrainingLimitReached}
    title={isStyleTrainingLimitReached
      ? `Training limit reached (${styleExamples.length}/20). Compact in Settings to continue.`
      : t('editor.trainAIDesc', 'Train AI from your corrections')
    }
    className={...}>
    <BrainIcon className={iconSize}/>
    {isStyleTrainingLimitReached && (
      <span className="ml-1 text-xs">({styleExamples.length}/20)</span>
    )}
  </button>
)}
```

### 4. New Component: `StyleTrainingManager`

**Location:** `components/StyleTrainingManager.tsx`

**Features:**

#### A. Warning Banner
- Appears when limit reached (20/20)
- Explains need to compact before continuing
- Recommends keeping 10-15 examples

#### B. Compact Mode
- Toggle between view-only and selection mode
- Multi-select interface with checkboxes
- Visual feedback (green border for selected items)

#### C. Duplicate Detection
- Identifies similar transformation patterns
- Groups examples with similar length-change ratios
- Visual indicator (yellow border) for duplicates

#### D. Auto-Suggest Feature
- One-click selection of diverse examples
- Algorithm:
  1. Keep one example from each duplicate group (most recent)
  2. Keep all non-duplicated examples
  3. Aims for ~10-15 examples after compaction

#### E. User Actions
- **Keep Selected**: Saves only selected examples, deletes rest
- **Delete Selected**: Removes selected, keeps rest
- **Auto-Suggest**: Intelligently selects diverse set
- **Clear All**: Nuclear option to start fresh
- **Cancel**: Exits compact mode without changes

#### F. Example Display
Each example shows:
- Sequential number (#20, #19, etc.)
- Original text preview (50 chars)
- Edited text preview (50 chars)
- Character counts and delta
- Duplicate indicator if applicable
- Individual delete button (non-compact mode)

### 5. Settings Page Integration

**Location:** `pages/SettingsPage.tsx`

Replaced old simple "Clear Style Memory" section with full `StyleTrainingManager` component.

## User Workflow

### Normal Operation (< 20 examples)
1. User edits report in editor
2. Clicks "Train AI" button
3. Example saved to training data
4. Button shows example count in hover tooltip

### At Limit (= 20 examples)
1. User attempts to click "Train AI"
2. Button is disabled, shows "(20/20)" badge
3. Toast message: "⚠️ Training limit reached (20/20). Compact examples in Settings to continue."
4. User navigates to Settings

### Compaction Process
1. Open Settings → AI Style Training section
2. See warning banner (yellow) explaining limit
3. Click "Compact Examples" button
4. System enters selection mode:
   - All examples displayed with checkboxes
   - Duplicates highlighted in yellow
   - Selected items highlighted in green
5. User chooses approach:
   - **Manual**: Click individual examples to keep
   - **Auto-Suggest**: Click to auto-select diverse set
6. Review selection count (e.g., "Keep Selected (12)")
7. Click "Keep Selected" to compact
8. System keeps only selected examples, deletes rest
9. Training capacity restored (e.g., 12/20)

### After Compaction
- "Train AI" button re-enabled
- User can continue collecting examples
- Process repeats when limit hit again

## Benefits

### ✅ Prevents Storage Bloat
- Hard limit prevents unbounded growth
- With 200 studies/month/user, prevents 2400+ examples/year/user
- Multiple users won't exponentially increase storage

### ✅ Improves Data Quality
- Forces periodic review of training examples
- Removes duplicate/redundant patterns
- Keeps only diverse, representative samples

### ✅ User Control
- No automatic deletion
- User decides what to keep
- Full visibility into all examples

### ✅ Smart Assistance
- Duplicate detection highlights redundancy
- Auto-suggest provides starting point
- Character-delta stats help identify patterns

### ✅ Scalable Architecture
- Fixed storage footprint per user
- Works across multiple users
- Compaction as intentional workflow step

## Technical Details

### Duplicate Detection Algorithm
```typescript
// Similarity based on length-change percentage
const exampleLengthChange = ((example.final.length - example.raw.length) / example.raw.length) * 100;
const otherLengthChange = ((other.final.length - other.raw.length) / other.raw.length) * 100;

// Within 10% threshold = similar
if (Math.abs(exampleLengthChange - otherLengthChange) < 10) {
  // Mark as duplicate
}
```

### Auto-Suggest Logic
1. Identify all duplicate groups
2. Select first (most recent) from each group
3. Add all non-duplicated examples
4. Result: Diverse set without redundancy

## Future Enhancements (Optional)

### Possible Additions:
1. **Similarity Score**: More sophisticated NLP-based duplicate detection
2. **Preview Diff**: Show before/after comparison for each example
3. **Categorization**: Group by transformation type (grammar, style, medical terminology)
4. **Export/Import**: Share training sets between users
5. **Usage Stats**: Show which examples influenced recent AI outputs
6. **Date-based Filtering**: Keep most recent X examples
7. **Quality Rating**: User-rated examples (keep highest quality)

## Configuration

### Constants (can be adjusted)
```typescript
// In context/SettingsContext.tsx
const TRAINING_LIMIT = 20; // Currently hardcoded

// In components/StyleTrainingManager.tsx
const SIMILARITY_THRESHOLD = 10; // % length change difference
const RECOMMENDED_COMPACT_TARGET = 10-15; // Suggested kept examples
```

## Testing Checklist

- [ ] Train AI button disabled at 20 examples
- [ ] Toast message appears on attempted training when limit reached
- [ ] Settings page shows warning banner at limit
- [ ] Compact mode activates correctly
- [ ] Selection/deselection works for individual examples
- [ ] Auto-suggest identifies duplicates correctly
- [ ] Keep Selected reduces example count
- [ ] Delete Selected removes correct items
- [ ] Clear All removes everything
- [ ] Cancel exits without changes
- [ ] Train AI re-enabled after compaction
- [ ] Example counter updates in real-time

## Migration Notes

### Existing Users
- Users with < 20 examples: No impact
- Users with > 20 examples (shouldn't exist, but if data restored from backup):
  - System won't accept new examples
  - Must compact to continue
  - No data loss, just workflow interruption

### Backward Compatibility
- Fully compatible with existing `StyleExample` type
- No schema changes required
- Works with localStorage persistence
