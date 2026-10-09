/* =====================================================================
   IPL Match Intelligence · 06 · Toss and venue
   Business question: after winning the toss, should the captain bat or
   field, and does the answer change by ground?
   ===================================================================== */

USE ipl_project;

-- Q6 · Toss decision and its pay-off by season -----------------------------
SELECT
    season,
    COUNT(*)                                                  AS decided_matches,
    ROUND(100 * AVG(toss_decision = 'field'), 1)              AS pct_toss_winners_fielding,
    ROUND(100 * AVG(toss_winner_won), 1)                      AS toss_winner_win_pct,
    ROUND(100 * AVG(chase_won), 1)                            AS chasing_side_win_pct
FROM v_match
WHERE is_decided = 1
GROUP BY season
ORDER BY season;

-- Q7 · Chase-friendly vs defend-friendly grounds ---------------------------
-- Rain-adjusted (D/L) matches are excluded: the target is not a full chase.
SELECT
    m.ground,
    m.city,
    COUNT(*)                                       AS matches,
    ROUND(AVG(t.runs), 1)                          AS avg_first_innings,
    ROUND(100 * AVG(m.chase_won), 1)               AS chase_win_pct,
    CASE WHEN AVG(m.chase_won) >= 0.55 THEN 'Chase'
         WHEN AVG(m.chase_won) <= 0.45 THEN 'Bat first'
         ELSE 'Neutral' END                        AS toss_call
FROM v_match m
JOIN v_team_innings t ON t.match_id = m.match_id AND t.inning = 1
WHERE m.is_decided = 1 AND m.is_dl = 0
GROUP BY m.ground, m.city
HAVING COUNT(*) >= 20
ORDER BY chase_win_pct DESC;
