# Match Details Page States

The MatchDetails page adapts its layout based on the timing relative to the match kickoff time.

## Match State Detection

The page automatically detects the match state based on the current time and match date:

### 1. **Preview State** (`isPreview = true`)
- **Trigger**: More than 1 hour before kickoff
- **Layout**: Detailed preview with comprehensive statistics
- **Features**:
  - Full team information with logos
  - League standings comparison
  - Detailed last matches analysis with 7 statistical categories
  - Head-to-head historical data
  - Pre-season fixture detection

### 2. **Imminent State** (`isImminent = true`)
- **Trigger**: Less than 1 hour before kickoff (but match hasn't started)
- **Layout**: Urgent countdown-focused design
- **Features**:
  - **Animated gradient background** with orange/yellow colors
  - **Large countdown timer** prominently displayed
  - **"STARTING SOON" banner** with pulsing indicator
  - **Enlarged team logos** (20x20) with green status indicators
  - **Quick comparison** showing league positions and recent form
  - **Simplified recent form** display (5 matches)
  - **Limited head-to-head** (2 most recent matches only)
  - **VS indicator** centrally positioned

### 3. **Live State** (`isLive = true`)
- **Trigger**: Match is currently in progress
- **Layout**: Live match display with video/score
- **Features**: Live indicators, real-time updates

### 4. **Full Time State** (`isFullTime = true`) 🆕
- **Trigger**: Match has ended and has a score, but no video highlights available yet (regardless of how long ago it finished)
- **Layout**: Celebration-focused result display
- **Features**:
  - **Large final score display** with dramatic typography
  - **"FULL TIME" banner** with celebration emoji
  - **Result announcement** (Winner/Draw declaration)
  - **Team logos** enlarged (24x24) with league positions
  - **Match events timeline** showing goals, cards, substitutions chronologically
  - **League standings** comparison
  - **Match summary stats** from recent form
  - **Immediate post-match analysis** sections

### 5. **Finished State** (`isFinished = true`)
- **Trigger**: Match has ended (more than 2 hours ago or has video highlights)
- **Layout**: Post-match with highlights and final score
- **Features**: Video highlights, final statistics

## Visual Design Differences

### Preview Layout
- **Color scheme**: Gradient diagonal (black to dark gray)
- **Emphasis**: Comprehensive data and analysis
- **Pace**: Calm, informational

### Imminent Layout
- **Color scheme**: Animated gradient (orange, yellow, amber)
- **Emphasis**: Urgency and excitement
- **Pace**: Dynamic, countdown-focused
- **Animations**: 
  - Gradient background shift
  - Pulsing status indicators
  - Animated countdown

### Full Time Layout 🆕
- **Color scheme**: Dark gradient with golden accents
- **Emphasis**: Celebration and final result
- **Pace**: Triumphant, result-focused
- **Styling**:
  - Golden border with glow effect
  - Large 6xl score typography
  - Winner/draw announcements
  - Celebration emojis and context

### Finished Layout
- **Color scheme**: Standard dark theme
- **Emphasis**: Video highlights and post-match analysis
- **Pace**: Retrospective, highlight-focused

## Auto-Detection Logic

```javascript
const getMatchTiming = () => {
  const timeDiff = matchDate.getTime() - now.getTime();
  const hoursUntilMatch = timeDiff / (1000 * 60 * 60);
  
  if (hoursUntilMatch > 1) return 'preview';          // > 1 hour before
  if (hoursUntilMatch > 0) return 'imminent';         // < 1 hour before, > 0
  if (isCurrentlyLive) return 'live';                 // Live match
  if (hoursUntilMatch < 0 && hasScore && !hasVideo) return 'fullTime';  // Completed, no video
  if (hoursUntilMatch < 0 && hasVideo) return 'finished';               // Completed with video
  return 'finished';                                  // Default fallback
};
```

## Responsive Behavior

All layouts are fully responsive and adapt to:
- Mobile devices (simplified layouts)
- Tablet screens (balanced information)
- Desktop displays (full feature set)

The full-time state prioritizes the final score visibility and celebration context across all screen sizes, with a focus on immediate post-match satisfaction. 