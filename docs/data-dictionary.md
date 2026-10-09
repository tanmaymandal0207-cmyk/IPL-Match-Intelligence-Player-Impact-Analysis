# Data dictionary

## Raw tables (`00_create_schema.sql`)

| Table | Grain | Key columns |
|---|---|---|
| `matches` | one match | `id`, `season`, `match_date`, `match_type`, `venue`, `team1`, `team2`, `toss_winner`, `toss_decision`, `winner` (NULL = no result), `result` (runs / wickets / tie / no result), `result_margin`, `target_runs`, `super_over`, `method` (D/L or NULL) |
| `deliveries` | one delivery | `delivery_id` (surrogate), `match_id`, `inning` (3+ = super over), `batting_team`, `bowling_team`, `over_no` (0-based), `ball`, `batter`, `bowler`, `batsman_runs`, `extra_runs`, `total_runs`, `extras_type`, `is_wicket`, `player_dismissed`, `dismissal_kind` |

## Reference tables

| Table | Purpose |
|---|---|
| `ref_team` | `team_raw` → `franchise`, `is_active`. Delhi Daredevils → Delhi Capitals, Kings XI Punjab → Punjab Kings, Royal Challengers Bangalore → Bengaluru, and the two spellings of Rising Pune Supergiant. Deccan Chargers stay separate from Sunrisers Hyderabad (different franchise). |
| `ref_venue` | `venue_raw` → `ground`, `city`, `country`. 58 spellings → 36 grounds, including renamed grounds (Feroz Shah Kotla → Arun Jaitley Stadium, Sardar Patel Stadium → Narendra Modi Stadium, Subrata Roy Sahara Stadium → MCA Stadium) and missing cities for Dubai and Sharjah. |
| `ref_window` | One row: `from_season`, `to_season`, `min_balls` for the player-impact views. |

## Views (`04_core_views.sql`, `07_player_impact.sql`)

### `v_match` (one row per match)

| Column | Rule |
|---|---|
| `stage` | `League` or `Playoff` |
| `ground`, `city`, `country` | from `ref_venue` |
| `team1`, `team2`, `toss_winner`, `winner` | franchise names from `ref_team` |
| `is_decided` | 1 when the result is by runs or wickets. Ties and no-results are excluded from every win rate |
| `chase_won` | 1 when the side batting second won |
| `toss_winner_won` | 1 when the toss winner won a decided match |
| `is_dl` | 1 for rain-adjusted (D/L) matches |

### `v_ball` (one row per delivery, innings 1–2 only)

| Column | Rule |
|---|---|
| `phase` | Powerplay = overs 1–6, Middle = 7–15, Death = 16–20 |
| `is_legal` | not a wide or no-ball. Counts as a ball bowled |
| `is_faced` | not a wide. Counts as a ball faced (no-balls are faced) |
| `bowler_runs` | batter runs + wides + no-balls. Byes and leg-byes are not charged to the bowler |
| `is_team_wicket` | any dismissal except *retired hurt* |
| `is_bowler_wicket` | caught, bowled, lbw, caught and bowled, stumped, hit wicket. Run-outs are not credited to the bowler |

### `v_team_innings` (one row per team innings)

`runs`, `wickets`, `legal_balls`, `run_rate` (runs × 6 ÷ legal balls), phase splits (`pp_`, `mid_`, `death_` runs and wickets, `death_balls`), `innings_role` (Batting first / Chasing), `won`, `is_decided`, `is_dl`.

### `v_player_match` (one row per player × match × role)

**Batting (`role = 'bat'`):**
- `runs`, `balls` (faced), `fours`, `sixes`
- `dismissed`: credited to the dismissed player, who may be the non-striker in a run-out
- `death_runs`, `death_balls`

**Bowling (`role = 'bowl'`):**
- `balls` (legal), `runs_conceded`, `wickets`, `dot_balls`
- `death_runs`, `death_balls`

**Both roles:** `team_won` and `is_decided` from the match.

### `v_batter_impact` / `v_bowler_impact` (one row per player in `ref_window`)

| Metric | Formula |
|---|---|
| Batting impact | (0.6 × runs per innings + 0.4 × runs per innings in wins) × (strike rate ÷ league strike rate) |
| Bowling impact | 2 × wickets per match + 1.5 × wickets per match in wins + (league economy − economy) |

Both are filtered to players with at least `ref_window.min_balls` balls.
