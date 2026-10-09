/* =====================================================================
   IPL Match Intelligence · 04 · Core views
   Four views every analysis reads from. All cleaning rules live here,
   once, so the analysis scripts stay short and consistent.

     v_match         one row per match   (franchise and ground names, result flags)
     v_ball          one row per delivery in a regular innings (phase, legal ball,
                     runs and wickets credited to the bowler)
     v_team_innings  one row per team innings with phase splits and the result
     v_player_match  one row per player per match (batting and bowling lines)

   Phases (over_no is 0-based): Powerplay = overs 1–6, Middle = 7–15, Death = 16–20.
   ===================================================================== */

USE ipl_project;

-- v_match -----------------------------------------------------------------
CREATE OR REPLACE VIEW v_match AS
SELECT
    m.id                                    AS match_id,
    m.season,
    m.match_date,
    CASE WHEN m.match_type = 'League' THEN 'League' ELSE 'Playoff' END AS stage,
    v.ground,
    v.city,
    v.country,
    t1.franchise                            AS team1,
    t2.franchise                            AS team2,
    tw.franchise                            AS toss_winner,
    m.toss_decision,
    w.franchise                             AS winner,
    m.result,
    m.result_margin,
    m.target_runs,
    (COALESCE(m.method, '') = 'D/L')         AS is_dl,
    -- decided = won inside the two innings (no ties, no washouts)
    (m.result IN ('runs', 'wickets'))       AS is_decided,
    (m.result = 'wickets')                  AS chase_won,
    (m.result IN ('runs', 'wickets') AND tw.franchise = w.franchise) AS toss_winner_won
FROM matches m
JOIN ref_venue v       ON v.venue_raw  = m.venue
JOIN ref_team  t1      ON t1.team_raw  = m.team1
JOIN ref_team  t2      ON t2.team_raw  = m.team2
JOIN ref_team  tw      ON tw.team_raw  = m.toss_winner
LEFT JOIN ref_team w   ON w.team_raw   = m.winner;

-- v_ball ------------------------------------------------------------------
CREATE OR REPLACE VIEW v_ball AS
SELECT
    d.delivery_id,
    d.match_id,
    d.inning,
    bt.franchise                            AS batting_team,
    bw.franchise                            AS bowling_team,
    d.over_no + 1                           AS over_number,          -- 1–20
    CASE WHEN d.over_no < 6  THEN 'Powerplay'
         WHEN d.over_no < 15 THEN 'Middle'
         ELSE 'Death' END                   AS phase,
    d.batter,
    d.bowler,
    d.batsman_runs,
    d.extra_runs,
    d.total_runs,
    d.extras_type,
    -- legal ball: wides and no-balls do not count as balls faced or bowled
    (COALESCE(d.extras_type, '') NOT IN ('wides', 'noballs'))           AS is_legal,
    -- a ball the batter faced (no-balls are faced, wides are not)
    (COALESCE(d.extras_type, '') <> 'wides')                            AS is_faced,
    -- runs charged to the bowler: off the bat + wides + no-balls (not byes / leg-byes)
    d.batsman_runs
      + CASE WHEN d.extras_type IN ('wides', 'noballs') THEN d.extra_runs ELSE 0 END
                                            AS bowler_runs,
    (d.batsman_runs = 4)                    AS is_four,
    (d.batsman_runs = 6)                    AS is_six,
    -- team wicket: every dismissal except 'retired hurt' (the batter can return)
    (d.is_wicket = 1 AND d.dismissal_kind <> 'retired hurt')            AS is_team_wicket,
    -- bowler wicket: only dismissals credited to the bowler
    (d.is_wicket = 1 AND d.dismissal_kind IN
        ('caught', 'bowled', 'lbw', 'caught and bowled', 'stumped', 'hit wicket'))
                                            AS is_bowler_wicket,
    d.player_dismissed
FROM deliveries d
JOIN ref_team bt ON bt.team_raw = d.batting_team
JOIN ref_team bw ON bw.team_raw = d.bowling_team
WHERE d.inning <= 2;                        -- super-over innings excluded

-- v_team_innings ----------------------------------------------------------
CREATE OR REPLACE VIEW v_team_innings AS
SELECT
    b.match_id,
    m.season,
    m.ground,
    b.inning,
    CASE WHEN b.inning = 1 THEN 'Batting first' ELSE 'Chasing' END  AS innings_role,
    b.batting_team,
    b.bowling_team,
    SUM(b.total_runs)                                     AS runs,
    SUM(b.is_team_wicket)                                 AS wickets,
    SUM(b.is_legal)                                       AS legal_balls,
    ROUND(SUM(b.total_runs) * 6 / SUM(b.is_legal), 2)     AS run_rate,
    SUM(CASE WHEN b.phase = 'Powerplay' THEN b.total_runs     ELSE 0 END) AS pp_runs,
    SUM(CASE WHEN b.phase = 'Powerplay' THEN b.is_team_wicket ELSE 0 END) AS pp_wickets,
    SUM(CASE WHEN b.phase = 'Middle'    THEN b.total_runs     ELSE 0 END) AS mid_runs,
    SUM(CASE WHEN b.phase = 'Middle'    THEN b.is_team_wicket ELSE 0 END) AS mid_wickets,
    SUM(CASE WHEN b.phase = 'Death'     THEN b.total_runs     ELSE 0 END) AS death_runs,
    SUM(CASE WHEN b.phase = 'Death'     THEN b.is_team_wicket ELSE 0 END) AS death_wickets,
    SUM(CASE WHEN b.phase = 'Death'     THEN b.is_legal       ELSE 0 END) AS death_balls,
    m.is_decided,
    m.is_dl,
    (m.winner = b.batting_team)                           AS won
FROM v_ball b
JOIN v_match m ON m.match_id = b.match_id
GROUP BY b.match_id, m.season, m.ground, b.inning, b.batting_team, b.bowling_team,
         m.is_decided, m.is_dl, m.winner;

-- v_player_match ----------------------------------------------------------
-- Batting and bowling lines per player per match, with the match result for
-- the player's team. Used for player impact.
CREATE OR REPLACE VIEW v_player_match AS
SELECT
    x.match_id, m.season, x.player, x.team, x.role,
    SUM(x.runs) AS runs, SUM(x.balls) AS balls, SUM(x.fours) AS fours, SUM(x.sixes) AS sixes,
    SUM(x.dismissed) AS dismissed,
    SUM(x.wickets) AS wickets, SUM(x.runs_conceded) AS runs_conceded,
    SUM(x.dot_balls) AS dot_balls,
    SUM(x.death_balls) AS death_balls, SUM(x.death_runs) AS death_runs,
    m.is_decided,
    (m.winner = x.team) AS team_won
FROM (
    -- batting
    SELECT b.match_id, b.batter AS player, b.batting_team AS team, 'bat' AS role,
           b.batsman_runs AS runs, b.is_faced AS balls, b.is_four AS fours, b.is_six AS sixes,
           0 AS dismissed, 0 AS wickets, 0 AS runs_conceded, 0 AS dot_balls,
           CASE WHEN b.phase = 'Death' THEN b.is_faced     ELSE 0 END AS death_balls,
           CASE WHEN b.phase = 'Death' THEN b.batsman_runs ELSE 0 END AS death_runs
    FROM v_ball b
    UNION ALL
    -- dismissals (credited to the dismissed player, who may be the non-striker)
    SELECT b.match_id, b.player_dismissed, b.batting_team, 'bat',
           0, 0, 0, 0, 1, 0, 0, 0, 0, 0
    FROM v_ball b
    WHERE b.is_team_wicket = 1
    UNION ALL
    -- bowling
    SELECT b.match_id, b.bowler, b.bowling_team, 'bowl',
           0, b.is_legal, 0, 0, 0, b.is_bowler_wicket, b.bowler_runs,
           (b.is_legal = 1 AND b.total_runs = 0),
           CASE WHEN b.phase = 'Death' THEN b.is_legal    ELSE 0 END,
           CASE WHEN b.phase = 'Death' THEN b.bowler_runs ELSE 0 END
    FROM v_ball b
) x
JOIN v_match m ON m.match_id = x.match_id
GROUP BY x.match_id, m.season, x.player, x.team, x.role, m.is_decided, m.winner;
