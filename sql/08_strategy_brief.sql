/* =====================================================================
   IPL Match Intelligence · 08 · Strategy brief
   One result set that pulls the findings of 05–07 together into the
   recommendations a franchise analyst would put in front of the
   coaching staff. Every number is calculated live from the views.
   ===================================================================== */

USE ipl_project;

WITH
latest AS (SELECT MAX(season) AS season FROM v_match),
par AS (                      -- par first-innings score: latest season vs three seasons earlier
    SELECT ROUND(AVG(CASE WHEN t.season = l.season THEN t.runs END))                AS avg_total,
           ROUND(100 * AVG(CASE WHEN t.season = l.season THEN t.runs >= 200 END))  AS pct_200,
           ROUND(AVG(CASE WHEN t.season = l.season THEN t.runs END)
               - AVG(CASE WHEN t.season = l.season - 2 THEN t.runs END))           AS rise,
           l.season - 2                                                             AS base_season
    FROM v_team_innings t JOIN latest l
    WHERE t.inning = 1 AND t.is_decided = 1
    GROUP BY l.season
),
pp AS (                       -- powerplay: 60+ vs under 40 (all innings)
    SELECT ROUND(100 * AVG(CASE WHEN pp_runs >= 60 THEN won END)) AS win_60,
           ROUND(100 * AVG(CASE WHEN pp_runs <  40 THEN won END)) AS win_u40
    FROM v_team_innings WHERE is_decided = 1
),
hand AS (                     -- wickets in hand after 15 overs, batting first
    SELECT ROUND(100 * AVG(CASE WHEN 10 - pp_wickets - mid_wickets >= 7 THEN won END)) AS win_7plus,
           ROUND(100 * AVG(CASE WHEN 10 - pp_wickets - mid_wickets <= 4 THEN won END)) AS win_4less
    FROM v_team_innings WHERE inning = 1 AND is_decided = 1
),
toss AS (                     -- toss and chase, last three seasons
    SELECT ROUND(100 * AVG(m.toss_winner_won)) AS toss_win,
           ROUND(100 * AVG(m.chase_won))       AS chase_win
    FROM v_match m JOIN latest l ON m.season BETWEEN l.season - 2 AND l.season
    WHERE m.is_decided = 1
),
grounds AS (                  -- grounds with 20+ full matches
    SELECT m.ground, COUNT(*) AS n, AVG(m.chase_won) AS chase_rate
    FROM v_match m
    WHERE m.is_decided = 1 AND m.is_dl = 0
    GROUP BY m.ground HAVING COUNT(*) >= 20
),
bat AS (SELECT player, impact_score, ROW_NUMBER() OVER (ORDER BY impact_score DESC, player) AS rk FROM v_batter_impact),
bowl AS (SELECT player, impact_score, ROW_NUMBER() OVER (ORDER BY impact_score DESC, player) AS rk FROM v_bowler_impact)

SELECT 1 AS seq, 'Batting target' AS area,
       CONCAT('Par first-innings score in ', (SELECT season FROM latest), ' is ', avg_total,
              '; ', pct_200, '% of totals reached 200') AS finding,
       CONCAT('Plan for 200: par has risen ', rise, ' runs since ', base_season) AS recommendation
FROM par
UNION ALL
SELECT 2, 'Powerplay',
       CONCAT('Teams scoring 60+ in overs 1-6 win ', win_60, '% vs ', win_u40, '% when under 40'),
       'Pick openers on powerplay strike rate; 60 is the target'
FROM pp
UNION ALL
SELECT 3, 'Death overs',
       CONCAT('Batting first with 7+ wickets in hand at 15 overs wins ', win_7plus,
              '% vs ', win_4less, '% with 4 or fewer'),
       'Protect wickets through the middle; death-over runs depend on them'
FROM hand
UNION ALL
SELECT 4, 'Toss',
       CONCAT('Last 3 seasons: toss winner wins ', toss_win, '%, chasing side wins ', chase_win, '%'),
       'The toss is close to a coin flip; decide by ground, not habit'
FROM toss
UNION ALL
SELECT 5, 'Venue',
       CONCAT('Best chasing ground: ',
              (SELECT CONCAT(ground, ' (', ROUND(100 * chase_rate), '%)') FROM grounds ORDER BY chase_rate DESC LIMIT 1),
              '; best for batting first: ',
              (SELECT CONCAT(ground, ' (', ROUND(100 * (1 - chase_rate)), '%)') FROM grounds ORDER BY chase_rate ASC LIMIT 1)),
       'Use the ground table (06 Q7) for the toss call'
UNION ALL
SELECT 6, 'Batting shortlist',
       (SELECT GROUP_CONCAT(CONCAT(player, ' (', impact_score, ')') ORDER BY rk SEPARATOR ', ') FROM bat WHERE rk <= 5),
       'Top 5 by batting impact, current window'
UNION ALL
SELECT 7, 'Bowling shortlist',
       (SELECT GROUP_CONCAT(CONCAT(player, ' (', impact_score, ')') ORDER BY rk SEPARATOR ', ') FROM bowl WHERE rk <= 5),
       'Top 5 by bowling impact, current window'
ORDER BY seq;
