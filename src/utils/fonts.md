# Segoe UI Font Configuration

This project now uses Segoe UI and all its variants as the primary font family.

## Available Font Classes

### Default Font
- `font-sans` - Uses the full Segoe UI stack with fallbacks

### Specific Segoe UI Variants
- `font-segoe-light` - Segoe UI Light/Semilight
- `font-segoe-semibold` - Segoe UI Semibold
- `font-segoe-bold` - Segoe UI Bold
- `font-segoe-black` - Segoe UI Black

## Usage Examples

```jsx
// Default font (already applied globally)
<p className="text-base">Regular text using Segoe UI</p>

// Light weight
<p className="font-segoe-light text-lg">Light text for subtle elements</p>

// Semibold weight
<h3 className="font-segoe-semibold text-xl">Semibold headings</h3>

// Bold weight
<h2 className="font-segoe-bold text-2xl">Bold headings</h2>

// Black weight
<h1 className="font-segoe-black text-3xl">Heavy display text</h1>
```

## Font Stack Priority

1. Segoe UI (primary)
2. Segoe UI Web (West European)
3. Segoe UI weight variants
4. System UI fonts
5. Apple system fonts
6. Fallback sans-serif fonts

## Browser Support

- **Windows**: Full Segoe UI support
- **macOS**: Falls back to system-ui (San Francisco)
- **Linux**: Falls back to system fonts
- **Mobile**: Uses system fonts with proper fallbacks

## Font Features

The configuration includes:
- Kerning and ligatures enabled
- Optical sizing for better readability
- Antialiasing for smoother text rendering
- Optimized text rendering 