# Changelog

## v2.0 — 9 Oct 2026

Rebuild of the v1 single script into a reproducible SQL pipeline with an interactive dashboard. What changed from v1 and why is in [docs/review-of-v1.md](docs/review-of-v1.md).

### Added

- Numbered SQL pipeline in `sql/` (`00` schema → `08` strategy brief) with [`run_all.sql`](sql/run_all.sql).
- Data-quality checks and reference/mapping tables before any analysis.
- Query outputs as CSV in `results/`.
- Docs: [findings](docs/findings.md), [data dictionary](docs/data-dictionary.md), [review of v1](docs/review-of-v1.md).
- Interactive dashboard (`dashboard/index.html`), its source (`dashboard/src/`) and build script.
- README banner, dashboard screenshot and live link.

### Changed

- README rewritten for v2.
- Dashboard: minimum-balls threshold scaled for team and ground views.

### Removed

- MIT licence (all rights reserved).
- v1 `ipl_analysis.sql` single script, replaced by `sql/`.

## Repository maintenance

- 17 Oct 2026: `.gitignore` keeps the Kaggle source CSVs and Python cache out of the repo.
- 18 Oct 2026: `.gitattributes` (LF for SQL / Python / docs, PNG binary, CSV exports left as saved).
- 9 Nov 2026: `.gitattributes` sets the repo language to SQL.
- 15 Nov 2026: added this changelog.
- 16 Nov 2026: README links the changelog and related projects; repository tree lists `CHANGELOG.md`.
- 17 Nov 2026: Markdown formatting pass (markdownlint): code fences tagged with a language, blank lines around headings and lists. No content changes.

## v1.0 — 28 Apr 2026

- First version: single SQL script and README.
