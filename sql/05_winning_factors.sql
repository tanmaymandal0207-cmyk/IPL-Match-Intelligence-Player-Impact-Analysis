/* =====================================================================
   IPL Match Intelligence · 05 · What wins matches
   Business question: which innings patterns separate winners from losers,
   and which targets should a batting unit plan for?
   Base: decided matches only (no ties, no washouts), 2008-2024.

   Rule used throughout: batting first and chasing are analysed SEPARATELY.
   A chase stops when the target is reached, so a winning chase often scores
   fewer death-over runs than a losing one. Mixing the two hides that.
   ===================================================================== */

USE ipl_project;

-- Q1 · Winner vs loser innings profile ------------------------------------
SELECT
    innings_role,
    CASE WHEN won = 1 THEN 'Won' ELSE 'Lost' END   AS result,
    COUNT(*)                                       AS innings,
    ROUND(AVG(runs), 1)                            AS avg_runs,
    ROUND(AVG(wickets), 1)                         AS avg_wickets,
    ROUND(AVG(run_rate), 2)                        AS avg_run_rate,
    ROUND(AVG(pp_runs), 1)                         AS avg_pp_runs,
    ROUND(AVG(mid_runs), 1)                        AS avg_middle_runs,
    ROUND(AVG(death_runs), 1)                      AS avg_death_runs
FROM v_team_innings
WHERE is_decided = 1
GROUP BY innings_role, won
ORDER BY innings_role, won DESC;

-- Q2 · Par score by season ------------------------------------------------
-- How big must a first-innings total be? The target moves season to season,
-- and jumps in 2023-24 when the Impact Player rule added a batter.
SELECT
    season,
    COUNT(*)                                                   AS matches,
    ROUND(AVG(runs), 1)                                        AS avg_first_innings,
    ROUND(100 * AVG(runs >= 200), 1)                           AS pct_200_plus,
    ROUND(100 * AVG(won), 1)                                   AS batting_first_win_pct
FROM v_team_innings
WHERE inning = 1 AND is_decided = 1
GROUP BY season
ORDER BY season;

-- Q3 · Powerplay score and win % ------------------------------------------
SELECT
    innings_role,
    CASE WHEN pp_runs < 40 THEN '1. under 40'
         WHEN pp_runs < 50 THEN '2. 40-49'
         WHEN pp_runs < 60 THEN '3. 50-59'
         ELSE                   '4. 60+' END   AS powerplay_runs,
    COUNT(*)                                   AS innings,
    SUM(won)                                   AS wins,
    ROUND(100 * AVG(won), 1)                   AS win_pct
FROM v_team_innings
WHERE is_decided = 1
GROUP BY innings_role, powerplay_runs
ORDER BY innings_role, powerplay_runs;

-- Q4 · Death overs need wickets in hand (batting first only) ---------------
-- Wickets in hand after 15 overs decide how hard a side can hit in overs 16-20.
SELECT
    CASE WHEN 10 - pp_wickets - mid_wickets >= 7 THEN '1. 7+ in hand'
         WHEN 10 - pp_wickets - mid_wickets >= 5 THEN '2. 5-6 in hand'
         ELSE                                         '3. 4 or fewer' END AS wickets_in_hand_at_15,
    COUNT(*)                                                     AS innings,
    ROUND(AVG(death_runs), 1)                                    AS avg_death_runs,
    ROUND(SUM(death_runs) * 6 / NULLIF(SUM(death_balls), 0), 2)  AS death_run_rate,
    ROUND(AVG(runs), 1)                                          AS avg_total,
    ROUND(100 * AVG(won), 1)                                     AS win_pct
FROM v_team_innings
WHERE inning = 1 AND is_decided = 1
GROUP BY wickets_in_hand_at_15
ORDER BY wickets_in_hand_at_15;

-- Q5 · Powerplay start type (runs × wickets) ------------------------------
SELECT
    innings_role,
    CASE WHEN pp_runs >= 50 AND pp_wickets <= 1 THEN '1. Strong start'
         WHEN pp_runs >= 50                      THEN '2. Aggressive, risky'
         WHEN pp_wickets <= 1                    THEN '3. Slow, stable'
         ELSE                                         '4. Weak start' END AS start_type,
    COUNT(*)                                   AS innings,
    ROUND(100 * AVG(won), 1)                   AS win_pct
FROM v_team_innings
WHERE is_decided = 1
GROUP BY innings_role, start_type
ORDER BY innings_role, start_type;
