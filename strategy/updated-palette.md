# Updated Color Palette — Based on Hussain Ahn Study

## Before (Current)
- Sand: `#f6dc95` → `#d39a43` (مملة شوي)
- Roman red: `#c0392b` (غامق)
- Bronze: `#c4913a` (غامق)

## After (Bold & Vibrant — like Hussain Ahn)

| Color | Hex | Use | Change |
|---|---|---|---|
| **Sky** | `#FFD700` → `#FFC700` | Background | More golden, more vibrant |
| **Ground** | `#8B7355` → `#6B4423` | Landscape | Darker, richer |
| **Roman Red** | `#C0392B` → `#E63946` | Armor, crest | Brighter, more saturated |
| **Bronze** | `#C4913A` → `#FFB81C` | Helmet | More golden, brighter |
| **Carthage Purple** | `#6B3F8F` → `#9D4EDD` | Outfit | Brighter, more saturated |
| **Sobius Red** | `#C0392B` → `#FF5C5C` | Body | Brighter, more eye-catching |
| **Outline** | `#1A1A1A` | Lines | Keep same (black) |
| **Tears** | `#5DB7EE` | Emotion | `#00D4FF` (brighter cyan) |
| **Gold accents** | Add | Details | `#FFD700` for belt, medallion |

## Implementation

Update `assets/brand/sobius.svg`:
- Replace all hex colors with new palette
- Increase stroke-width by 2px (8→10)
- Add gold accents to the uniform (belt buckle, etc)

Re-export with: `node assets/brand/export.js`
