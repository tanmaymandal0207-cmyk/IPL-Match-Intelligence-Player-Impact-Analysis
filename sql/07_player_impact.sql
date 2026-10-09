/* =====================================================================
   IPL Match Intelligence · 07 · Player impact (auction shortlist)
   Business question: which players add the most to winning, on current
   form? The analysis window lives in one parameter row (ref_window), so
   the shortlist can be re-run for any span of seasons.

   Impact is measured per innings and adjusted for tempo, because the
   winning-factor analysis (05) shows that scoring rate, not just runs,
   separates winners from losers.
   ===================================================================== */

USE ipl_project;

-- Analysis window (edit this row, then re-run the queries) --------------------
DROP TABLE IF EXISTS ref_window;
CREATE TABLE ref_window (
    from_season SMALLINT NOT NULL,
    to_season   SMALLINT NOT NULL,
    min_balls   SMALLINT NOT NULL      -- minimum balls faced / bowled in the window
);
INSERT INTO ref_window VALUES (2022, 2024, 300);

-- v_batter_impact -------------------------------------------------------------
--   impact = (0.6 × runs per innings + 0.4 × runs per innings in wins)
--            × (strike rate ÷ league strike rate in the same window)
CREATE OR REPLACE VIEW v_batter_impact AS
WITH bat AS (
    SELECT p.player,
           COUNT(*)                                            AS innings,
           SUM(p.runs)                                         AS runs,
           SUM(p.balls)                                        AS balls,
           SUM(p.dismissed)                                    AS outs,
           SUM(CASE WHEN p.team_won = 1 THEN p.runs ELSE 0 END) AS runs_in_wins,
           SUM(p.death_runs)                                   AS death_runs,
           SUM(p.death_balls)                                  AS death_balls
    FROM v_player_match p
    JOIN ref_window w ON p.season BETWEEN w.from_season AND w.to_season
    WHERE p.role = 'bat' AND p.is_decided = 1
    GROUP BY p.player
),
league AS (
    SELECT SUM(runs) * 100 / SUM(balls) AS league_sr FROM bat
)
SELECT
    b.player,
    b.innings,
    b.runs,
    b.balls,
    ROUND(b.runs / NULLIF(b.outs, 0), 1)                      AS batting_avg,
    ROUND(b.runs * 100 / b.balls, 1)                          AS strike_rate,
    ROUND(b.death_runs * 100 / NULLIF(b.death_balls, 0), 1)   AS death_strike_rate,
    ROUND(100 * b.runs_in_wins / b.runs, 1)                   AS pct_runs_in_wins,
    ROUND((0.6 * b.runs / b.innings + 0.4 * b.runs_in_wins / b.innings)
          * (b.runs * 100 / b.balls) / l.league_sr, 1)        AS impact_score
FROM bat b
CROSS JOIN league l
JOIN ref_window w ON b.balls >= w.min_balls;

-- v_bowler_impact -------------------------------------------------------------
--   impact = 2 × wickets per match + 1.5 × wickets per match in wins
--            + (league economy − bowler economy)
--   Bowler runs exclude byes and leg-byes; wickets exclude run-outs.
CREATE OR REPLACE VIEW v_bowler_impact AS
WITH bowl AS (
    SELECT p.player,
           COUNT(*)                                               AS matches,
           SUM(p.balls)                                           AS balls,
           SUM(p.runs_conceded)                                   AS runs_conceded,
           SUM(p.wickets)                                         AS wickets,
           SUM(p.dot_balls)                                       AS dots,
           SUM(CASE WHEN p.team_won = 1 THEN p.wickets ELSE 0 END) AS wickets_in_wins,
           SUM(p.death_runs)                                      AS death_runs,
           SUM(p.death_balls)                                     AS death_balls
    FROM v_player_match p
    JOIN ref_window w ON p.season BETWEEN w.from_season AND w.to_season
    WHERE p.role = 'bowl' AND p.is_decided = 1
    GROUP BY p.player
),
league AS (
    SELECT SUM(runs_conceded) * 6 / SUM(balls) AS league_econ FROM bowl
)
SELECT
    b.player,
    b.matches,
    b.balls,
    b.wickets,
    ROUND(b.runs_conceded * 6 / b.balls, 2)                    AS economy,
    ROUND(b.balls / NULLIF(b.wickets, 0), 1)                   AS strike_rate,
    ROUND(100 * b.dots / b.balls, 1)                           AS dot_ball_pct,
    ROUND(b.death_runs * 6 / NULLIF(b.death_balls, 0), 2)      AS death_economy,
    ROUND(2 * b.wickets / b.matches + 1.5 * b.wickets_in_wins / b.matches
          + (l.league_econ - b.runs_conceded * 6 / b.balls), 2) AS impact_score
FROM bowl b
CROSS JOIN league l
JOIN ref_window w ON b.balls >= w.min_balls;

-- Q8 · Batter shortlist ----------------------------------------------------------
SELECT player, innings, runs, batting_avg, strike_rate, death_strike_rate,
       pct_runs_in_wins, impact_score
FROM v_batter_impact
ORDER BY impact_score DESC, player
LIMIT 15;

-- Q9 · Bowler shortlist ----------------------------------------------------------
SELECT player, matches, wickets, economy, strike_rate, dot_ball_pct,
       death_economy, impact_score
FROM v_bowler_impact
ORDER BY impact_score DESC, player
LIMIT 15;
