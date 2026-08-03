# Changelog

All notable changes to this project are documented here.
Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.3.0] — Delete entry, confirmation dialogs, and autosave

### Added
- **Delete an entry**: a "Delete this entry" button on the Write tab removes the currently open entry — its journal record and every photo that belonged to it — after a confirmation step. Nothing else needs to be manually refreshed: the calendar, search, stats, favorites, and insights all recompute straight from storage each time their tab opens, so simply deleting the record is sufficient.
- **Confirmation dialogs**: a new generic, reusable `showConfirmDialog()` (`components/confirmDialog.js`) — a small animated modal with Cancel/Confirm — currently used for entry deletion, ready to reuse for any future destructive action.
- **Autosave**: typing anywhere in an entry (notes, mood, any category, gratitude, highlight/lowlight, tomorrow's focus, screen time, spending, steps, favorite, Focus mode) schedules a save 2 seconds after the last change. That pending save is flushed immediately (no waiting) when switching tabs, switching to a different date, or closing the page — so nothing typed is ever lost. A subtle "Saving.../All changes saved" indicator (Notion/Google-Docs style) appears near the date picker while this happens.
- New file: `components/confirmDialog.js`.

### Changed
- `saveEntry()` and the explicit Save button's flow (`handleSaveButtonClick()`) now coordinate with the autosave engine: pressing Save cancels any pending autosave (it's about to persist directly anyway) so nothing redundant fires afterward.
- `showMilestoneToast()` refactored to call a new generic `showActionToast()` helper, also used by entry deletion — one shared toast mechanism instead of two separate ones.
- Service Worker cache bumped to `v7`.

### Verified
- Autosave genuinely waits ~2s (confirmed nothing is written prematurely) and correctly flushes the OLD date's pending change before a new date's data replaces it in memory — no cross-date leakage.
- Delete respects Cancel (entry survives) and only removes data when the destructive action is explicitly confirmed.
- All of the above tested end-to-end in a simulated browser environment, not just read through — zero runtime errors across every scenario.

## [1.2.0] — Save flow & Focus mode

### Added
- After saving TODAY's entry, the app now shows a confirmation ("✓ Today's journal is saved") and automatically returns to the Home dashboard after a short delay, with all widgets (streak, latest mood, recent entries, etc.) freshly refreshed. Saving a past date no longer auto-navigates — it behaves exactly as before.
- **Focus mode**: a "Focus mode" button next to the Notes field opens a distraction-free, fullscreen writing view with a larger textarea, its own word counter and 1000-word goal progress bar, and a Save button. Text typed there is mirrored live into the regular small textarea, so either can be used interchangeably with no data model changes.
- A small "pop" animation on the save confirmation text for clearer, more tactile feedback.
- New file: `components/focusMode.js`.

### Changed
- `saveEntry()` split into a low-level persistence function and `handleSaveButtonClick()`, which owns the confirmation/redirect behavior tied specifically to an explicit Save button press.
- Service Worker cache bumped to `v6`.

## [1.1.1] — Bug fix: photos not appearing in the gallery

### Fixed
- The Photos section header had a `data-i18n` attribute on the same element that contained the photo-count badge (`<span id="photoCount">`). Applying translations set that element's `textContent`, which silently deleted the badge from the DOM on every load and every language switch. `renderGallery()` then crashed on its very first line trying to update the now-missing badge, before it ever reached the code that actually draws the photo thumbnails — so newly added photos appeared to do nothing.
- `compressImageFile()` had no error handling around the actual canvas/image-decoding step. If that step ever failed for any reason, the returned Promise neither resolved nor rejected — it hung forever with zero feedback. It's now wrapped in a try/catch (rejects properly on failure) plus a 15-second safety timeout, and a failure is now shown to the user instead of only being logged to the console.
- Service Worker cache bumped to `v5`.

## [1.1.0] — Photo gallery

### Added
- Multiple photos per journal entry, selectable all at once or added later
- Full-screen lightbox with click/keyboard navigation between an entry's photos
- Drag-and-drop reordering of photos within an entry
- Individual photo deletion
- Photo count shown on the entry's Photos section header
- Thumbnails now shown on: the Home dashboard's recent entries, favorites, random memory, and "this day in past years"; search results; the calendar's monthly history list; and the "this day last year" card on the Write tab
- Automatic client-side image compression before storage
- New `utils/imageStore.js`: an IndexedDB-backed storage layer dedicated to photos, chosen over `localStorage` for its much larger quota, native binary (Blob) support, and fully asynchronous API — see the README's "Image storage" section for the full rationale
- Automatic one-time migration of entries saved under the old single-photo (base64, localStorage) system into the new gallery

### Changed
- `entry.photo` (single base64 string) replaced by `entry.photos` (ordered array of IndexedDB image IDs)
- Service Worker cache bumped to `v3` to include the new gallery-related files

### Known limitations
- The JSON backup export does not include photo data (see README)

## [1.0.0] — Initial public release

### Added
- Core daily entry flow: mood, feelings, sleep, energy, physical activity, hobbies, food, social, relationships, places, self-care, chores, weather, gratitude list, highlight/lowlight, tomorrow's focus, screen time, spending, steps, photo, and free-form notes with a word-count goal
- Support for custom, user-added options in every category, with removal support
- Home dashboard: greeting, streak with progress bar, latest mood, weekly trend, today's goal, daily reflection question, recent entries, favorites, random memory, and "this day in past years"
- Full month calendar view with mood-colored days and a history list
- Full-text search across all entries, in either supported language
- Statistics: mood distribution (chart and table views), most common activities, and locally-computed insights — no external AI used
- Milestone system with permanent unlocks and a celebration animation
- Life calendar: a GitHub-contribution-graph-style view of an entire estimated lifespan, zoomable into any individual year
- Wrapped: a Spotify-Wrapped-style annual report generated entirely from local data
- User-created PIN lock, changeable at any time from Settings
- Progressive Web App support: installable, offline-capable via a Service Worker, with safe update handling and an in-app "Install" prompt
- Full internationalization: English and Swedish, with all UI text and category data routed through a dedicated translation engine (`utils/i18n.js`) instead of being hardcoded
- Guided first-run onboarding: language selection, optional name, and PIN creation
- Project restructured into `translations/`, `utils/`, and `components/` for GitHub readiness

### Changed
- All category data (moods, feelings, hobbies, etc.) now stored as language-neutral English keys rather than display text, so switching languages never breaks previously saved entries
- All code identifiers, comments, and documentation translated to English to follow international open-source conventions
- Manifest and default product name changed from a personal title to a generic "Journal" — no personal references remain anywhere in the codebase

### Notes
- This release consolidates what was originally an evolving personal project into a single, documented, installable, and localizable release suitable for public sharing.
