# Changelog

All notable changes to **ngx-gauge** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.2.0...HEAD
[13.2.0]: https://github.com/ashish-chopra/ngx-gauge/compare/v13.1.0...v13.2.0
[13.1.0]: https://github.com/ashish-chopra/ngx-gauge/releases/tag/v13.1.0
