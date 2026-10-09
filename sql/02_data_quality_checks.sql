/* =====================================================================
   IPL Match Intelligence · 02 · Data-quality checks
   Run after loading. Each check returns one row: what was tested, what
   was found, and what the later scripts do about it. Nothing is changed.
   ===================================================================== */

USE ipl_project;

WITH
innings AS (            -- regular innings only; super-over innings are 3+
    SELECT match_id, inning, SUM(total_runs) AS runs
    FROM deliveries
    WHERE inning <= 2
    GROUP BY match_id, inning
),
target_check AS (       -- target = first-innings total + 1 (D/L matches excepted)
    SELECT m.id
    FROM matches m
    JOIN innings i ON i.match_id = m.id AND i.inning = 1
    WHERE m.method IS NULL
      AND m.result IN ('runs', 'wickets')
      AND m.target_runs <> i.runs + 1
),
overs_check AS (        -- an over should hold 6 legal deliveries; 7-ball overs are umpire miscounts
    SELECT match_id, inning, over_no
    FROM deliveries
    WHERE inning <= 2
    GROUP BY match_id, inning, over_no
    HAVING SUM(COALESCE(extras_type, '') NOT IN ('wides', 'noballs')) > 6
)
SELECT 'Matches loaded' AS check_name, COUNT(*) AS found,
       'expected 1,095' AS treatment
FROM matches
UNION ALL
SELECT 'Deliveries loaded', COUNT(*), 'expected 260,920' FROM deliveries
UNION ALL
SELECT 'Deliveries with no matching match', COUNT(*), 'must be 0'
FROM deliveries d LEFT JOIN matches m ON m.id = d.match_id WHERE m.id IS NULL
UNION ALL
SELECT 'Matches with no deliveries', COUNT(*), 'must be 0'
FROM matches m WHERE NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.match_id = m.id)
UNION ALL
SELECT 'No-result matches', COUNT(*), 'excluded from every win-rate'
FROM matches WHERE result = 'no result'
UNION ALL
SELECT 'Tied matches (decided by super over)', COUNT(*), 'excluded: not decided by the two innings'
FROM matches WHERE result = 'tie'
UNION ALL
SELECT 'Super-over deliveries (inning 3+)', COUNT(*), 'excluded from all innings and player figures'
FROM deliveries WHERE inning > 2
UNION ALL
SELECT 'D/L (rain-adjusted) matches', COUNT(*), 'kept for results; excluded from venue chase rates'
FROM matches WHERE method = 'D/L'
UNION ALL
SELECT 'Raw team names', COUNT(DISTINCT team1), 'mapped to franchises in ref_team'
FROM matches
UNION ALL
SELECT 'Raw venue names', COUNT(DISTINCT venue), 'mapped to grounds in ref_venue'
FROM matches
UNION ALL
SELECT 'Matches with city missing', COUNT(*), 'city taken from ref_venue'
FROM matches WHERE city IS NULL
UNION ALL
SELECT 'Target ≠ first-innings total + 1', COUNT(*), 'reconciliation; must be 0'
FROM target_check
UNION ALL
SELECT 'Overs with 7 legal balls', COUNT(*), 'umpire miscounts, kept as bowled'
FROM overs_check
UNION ALL
SELECT 'Wides + no-balls (not legal balls)', COUNT(*), 'excluded from balls faced / bowled'
FROM deliveries WHERE extras_type IN ('wides', 'noballs')
UNION ALL
SELECT 'Byes + leg-byes (not charged to bowler)', COUNT(*), 'excluded from bowler runs'
FROM deliveries WHERE extras_type IN ('byes', 'legbyes')
UNION ALL
SELECT 'Dismissals not credited to the bowler', COUNT(*), 'run out, retired, obstructing'
FROM deliveries
WHERE is_wicket = 1
  AND dismissal_kind IN ('run out', 'retired hurt', 'retired out', 'obstructing the field');
