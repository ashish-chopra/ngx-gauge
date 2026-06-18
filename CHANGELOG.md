# Changelog

All notable changes to **ngx-gauge** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [13.3.1] - 2026-06-17

### Added
- `NgxGaugeMarker.labelColor?: string` — color used for a marker's label
  text. Defaults to the marker's `color` when omitted, so labels stay
  visible on dark themes and `line` markers no longer inherit whatever
  `fillStyle` happened to be set from a previously drawn marker.
  (#123, #145)

### Fixed
- `cap: 'round'` now also rounds the outer ends of the background bar when
  `thresholds` are configured. Previously the segment loop forced
  `lineCap: 'butt'` so only the foreground value bar was rounded; the
  background ends stayed square. Two extra round-capped arcs are now
  stroked at the leading edge of the first range and the trailing edge of
  the last range, leaving inner segment joints untouched. (#127)
- `.reading-block` and `.reading-label` no longer clip the top/bottom of
  tall digits. The default `overflow` changed from `hidden` to `visible`
  (and the now-inert `text-overflow: ellipsis` was removed). Consumers
  that prefer the old clip-with-ellipsis behaviour for long
  prepend/append text can restore it via a global style override (see
  CSS comment in `gauge.css`). (#100)

## [13.3.0] - 2026-06-15

### Fixed
- Crisp rendering on high-DPR (Retina) displays. The canvas backing store is
  now scaled by `window.devicePixelRatio` and the 2D context is pre-scaled so
  drawing routines continue to work in CSS-pixel coordinates. (#13, #156)
- `ngOnDestroy` no longer throws a `TypeError` when the gauge is destroyed
  before `ngAfterViewInit` runs (e.g. route change during initial render).
  `_clear` is now null-guarded and `_destroy` is idempotent. (#87)
- `foregroundColor`, `backgroundColor`, `thresholds`, and `markers` now
  refresh the canvas when their input bindings change. Color / threshold /
  marker only changes redraw synchronously and skip the entry animation, so
  theme switches don't re-run the `0 → value` animation. (#97, #151)
- `value=0` with `animate=true` and `cap='round'` no longer renders a small
  rounded sliver at the minimum position; `_drawFill` now early-returns on a
  zero-length arc. (#150)
- Updating `max` (or `min`) after `value` has changed no longer leaves the
  previous animation displacement baked into the next render.
  `_oldChangeVal` is reset to the current value when `min` or `max` change,
  and `_create` clamps the previous value to the active `(min, max)` bounds
  defensively. (#150)

### Notes
- **Reactivity for `thresholds` / `markers` is identity-based.** Replace the
  object reference (immutable update) when you want a redraw — in-place
  mutation is not detected, consistent with Angular's `OnChanges` lifecycle.
- The retina fix changes the canvas backing-store size to `size × dpr`. The
  CSS dimensions are unchanged, so layout is unaffected; consumers reading
  `canvas.width` / `canvas.height` directly (e.g. for screenshotting) will
  see the device-scaled value.
- Issue #85 (shrink `type='semi'` height to remove the empty band above the
  arc) is **deferred to `14.0.0`** since it changes the host element's
  height for existing consumers.

## [13.2.0] - 2026-06-10

### Added
- Public type exports for stronger consumer typing — these can now be imported
  from `ngx-gauge` and used to type your own variables:
  - `NgxGaugeType` — `'full' | 'arch' | 'semi'`
  - `NgxGaugeCap` — `'round' | 'butt'`
  - `NgxGaugeThreshold` — shape of a single threshold entry (`color?`, `backgroundColor?`, `bgOpacity?`)
  - `NgxGaugeThresholds` — `Record<string, NgxGaugeThreshold>`
  - `NgxGaugeMarker` — shape of a single marker entry (`color?`, `type?`, `size?`, `label?`, `font?`)
  - `NgxGaugeMarkers` — `Record<string, NgxGaugeMarker>`

### Changed
- **Repository housekeeping** (invisible to npm consumers — no runtime/API impact):
  - Aligned workspace layout with the standard Angular CLI library convention:
    demo app moved from `apps/demo/` to `projects/demo/`, library barrel renamed
    `public_api.ts` → `public-api.ts`, polyfills inlined in `angular.json` as
    `["zone.js"]`, `environments/` + `fileReplacements` removed, static assets
    moved to `projects/demo/public/`, manual `enableProdMode()` dropped (the
    application builder handles this automatically). (#200)
  - Lint cleanup across the library and demo; lint is now gated in CI. (#199)
  - Removed unused dead code and stale configuration. (#198)
  - Added GitHub Actions CI workflow with Node 20/22 build & test matrix, plus
    Dependabot grouping for npm + Actions updates. (#193)

### Notes
- The compiled `dist/ngx-gauge` output is byte-identical to `13.1.0` except for
  one renamed `sources` entry in the `.mjs.map` file (`public_api.ts` →
  `public-api.ts`). Runtime behaviour is unchanged.
- `@Input` types for `thresholds` and `markers` remain `Object` in this
  release; the corresponding type-tightening change is bundled with the
  upcoming `14.0.0` modernization release alongside other breaking changes.

## [13.1.0] - earlier

See the [GitHub Releases](https://github.com/ashish-chopra/ngx-gauge/releases)
page for the history of releases prior to `13.2.0`.

[Unreleased]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.3.1...HEAD
[13.3.1]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.3.0...v13.3.1
[13.3.0]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.2.0...v13.3.0
[13.2.0]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.1.0...v13.2.0
[13.1.0]: https://github.com/ashish-chopra/ngx-gauge/releases/tag/v13.1.0
