/* ============================================================
   IPL MATCH INTELLIGENCE SYSTEM
   PROJECT: IPL_ANALYTICS | AUTHOR: TANMAY MANDAL
   ============================================================ */

-- --------------------- QUERIES START ------------------------

use ipl_project;

/* ----------- FEATURE TABLE ----------*/

CREATE VIEW ball_by_ball AS
SELECT 
    d.match_id,
    m.season,
    m.venue,
    m.city,
    m.winner,
    m.toss_winner,
    m.toss_decision,

    d.inning,
    d.batting_team,
    d.bowling_team,

    d.overs,
    d.ball,

    d.batsman,
    d.bowler,

    d.total_runs,
    d.batsman_runs,
    d.extra_runs,

    d.player_dismissed,

    CASE 
        WHEN d.player_dismissed IS NOT NULL THEN 1 
        ELSE 0 
    END AS is_wicket

FROM deliveries d
JOIN Matches m 
ON d.match_id = m.id;



/* ----------- DEFINING PHASES (Powerplay, Middle, Death) ----------*/

create view ball_with_phase as
select *,
	case 
		when overs between 0 and 6 then 'Powerplay'
		when overs between 7 and 15 then 'Middle'
		else 'Death'
	end as phase
from ball_by_ball;


/* ----------- TEAM INNINGS AGGREGATION ----------*/

CREATE or replace VIEW team_innings AS
SELECT
    match_id,
    inning,
    batting_team,
    
    SUM(total_runs) AS total_runs,

    -- ✅ THIS is the missing column
    SUM(CASE 
        WHEN player_dismissed IS NOT NULL THEN 1 
        ELSE 0 
    END) AS wickets_lost,

    COUNT(*) AS balls_faced,
    
    ROUND(SUM(total_runs) * 6.0 / COUNT(*), 2) AS run_rate

FROM ball_by_ball
GROUP BY match_id, inning, batting_team;

/* ----------- PHASE-WISE PERFORMANCE ----------*/

create  view phase_performance as
select
	match_id,
	inning,
	batting_team,
	phase,
	
	sum(total_runs) as runs_scored,
	sum(is_wicket) as  wickets_lost,
	count(*) as balls,
	
	round(sum(total_runs) * 6.0 / count(*), 2) as run_rate
from ball_with_phase
group by match_id, inning, batting_team, Phase;


/* ----------- IDENTIFY WINNING VS LOSING TEAM ----------*/

CREATE OR REPLACE VIEW match_outcome AS
SELECT
    t.match_id,
    t.inning,
    t.batting_team,

    t.total_runs,
    t.wickets_lost,
    t.run_rate,

    m.winner,

    CASE 
        WHEN t.batting_team = m.winner THEN 1
        ELSE 0
    END AS is_winner

FROM team_innings t
JOIN Matches m 
ON t.match_id = m.id;

	
/* ----------- WINNING FACTOR ANALYSIS ----------*/

select
	is_winner,
	
	round(avg(total_runs), 2) as avg_runs,
	round(avg(wickets_lost), 2) as avg_wickets,
	round(avg(run_rate), 2) as avg_run_rate
	
from match_outcome
group by is_winner;

/* ----------- 	PHASE IMPACT ON WINNING ----------*/

select 
	p.phase,
	mo.is_winner,
	
	round(avg(p.runs_scored), 2) as avg_runs,
	round(avg(p.wickets_lost), 2) as avg_wickets,
	round(avg(p.run_rate), 2) as avg_run_rate
from phase_performance as p
join match_outcome as mo
on p.match_id = mo.match_id
and p.batting_team = mo.batting_team

group by p.phase, mo.is_winner
order by p.phase, mo.is_winner;


/* ----------- POWERPLAY WINNING CORELATION ----------*/

SELECT
    CASE 
        WHEN runs_scored >= 50 THEN '50+ Runs'
        ELSE '<50 Runs'
    END AS powerplay_bucket,

    COUNT(*) AS matches,
    SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) AS wins,

    ROUND(
        SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 
    2) AS win_percentage

FROM phase_performance p
JOIN match_outcome mo
ON p.match_id = mo.match_id
AND p.batting_team = mo.batting_team

WHERE phase = 'Powerplay'

GROUP BY powerplay_bucket;


/* ----------- DEATH OVER IMPACT ----------*/	

SELECT
    CASE 
        WHEN runs_scored >= 60 THEN '60+ Runs'
        WHEN runs_scored BETWEEN 40 AND 59 THEN '40–59 Runs'
        ELSE '<40 Runs'
    END AS death_bucket,

    COUNT(*) AS matches,
    SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) AS wins,

    ROUND(
        SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2) AS win_percentage

FROM phase_performance p
JOIN match_outcome mo
ON p.match_id = mo.match_id
AND p.batting_team = mo.batting_team

WHERE phase = 'Death'

GROUP BY death_bucket
ORDER BY win_percentage DESC;
	

/* ----------- WICKETS TIMING IMPACT ----------*/	

SELECT
    CASE 
        WHEN t.wickets_lost <= 2 THEN 'Low (0-2)'
        WHEN t.wickets_lost <= 5 THEN 'Medium (3-5)'
        ELSE 'High (6+)'
    END AS wicket_bucket,

    COUNT(*) AS matches,

    SUM(CASE 
        WHEN mo.is_winner = 1 THEN 1 
        ELSE 0 
    END) AS wins,

    ROUND(
        SUM(CASE 
            WHEN mo.is_winner = 1 THEN 1 
            ELSE 0 
        END) * 100.0 / COUNT(*)
    , 2) AS win_percentage

FROM team_innings t
JOIN match_outcome mo
ON t.match_id = mo.match_id
AND t.batting_team = mo.batting_team

GROUP BY wicket_bucket
ORDER BY win_percentage DESC;
	

/* ----------- COMBINED STRATERGY MODEL ----------*/

SELECT
    CASE 
        WHEN p.runs_scored >= 50 AND p.wickets_lost <= 2 THEN 'Strong Start'
        WHEN p.runs_scored >= 50 AND p.wickets_lost > 2 THEN 'Aggressive Risky'
        WHEN p.runs_scored < 50 AND p.wickets_lost <= 2 THEN 'Slow Stable'
        ELSE 'Weak Start'
    END AS strategy_type,

    COUNT(*) AS matches,
    SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) AS wins,

    ROUND(
        SUM(CASE WHEN mo.is_winner = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*),
    2) AS win_percentage

FROM phase_performance p
JOIN match_outcome mo
ON p.match_id = mo.match_id
AND p.batting_team = mo.batting_team

WHERE phase = 'Powerplay'

GROUP BY strategy_type
ORDER BY win_percentage DESC;


/* ----------- VENUE BASED STRATERGY ----------*/

SELECT
    venue,

    COUNT(*) AS matches,

    SUM(CASE 
        WHEN win_by_wickets > 0 THEN 1 
        ELSE 0 
    END) AS chasing_wins,

    ROUND(
        SUM(CASE 
            WHEN win_by_wickets > 0 THEN 1 
            ELSE 0 
        END) * 100.0 / COUNT(*)
    , 2) AS chasing_win_percentage

FROM Matches
GROUP BY venue
ORDER BY chasing_win_percentage DESC;


/* ----------- PLAYER IMPACT INDEX -----------*/

CREATE VIEW batsman_stats AS
SELECT
    batsman,

    COUNT(*) AS balls_faced,
    SUM(batsman_runs) AS total_runs,

    ROUND(SUM(batsman_runs) * 100.0 / COUNT(*), 2) AS strike_rate,

    SUM(CASE 
        WHEN player_dismissed = batsman THEN 1 
        ELSE 0 
    END) AS dismissals

FROM deliveries
GROUP BY batsman;

DROP VIEW IF EXISTS batsman_match_impact;

CREATE VIEW batsman_match_impact AS
SELECT
    d.batsman,
    d.match_id,

    SUM(d.batsman_runs) AS runs,

    MAX(
        CASE 
            WHEN m.winner = d.batting_team THEN 1 
            ELSE 0 
        END
    ) AS is_winner

FROM deliveries d
JOIN Matches m
ON d.match_id = m.id

GROUP BY d.batsman, d.match_id;

select * from batsman_match_impact limit 10;


---- BATSMAN IMPACT SCORE
SELECT
    batsman,

    COUNT(*) AS matches_played,

    ROUND(AVG(runs), 2) AS avg_runs,

    ROUND(
        AVG(CASE 
            WHEN is_winner = 1 THEN runs 
            ELSE 0 
        END)
    , 2) AS winning_contribution,

    ROUND(
        AVG(runs) * 0.6 + 
        AVG(CASE WHEN is_winner = 1 THEN runs ELSE 0 END) * 0.4
    , 2) AS impact_score

FROM batsman_match_impact
GROUP BY batsman
HAVING COUNT(*) > 20
ORDER BY impact_score DESC;

----- Bowler Impact

CREATE VIEW bowler_match_impact AS
SELECT
    d.bowler,
    d.match_id,

    COUNT(*) AS balls_bowled,
    SUM(d.total_runs) AS runs_conceded,

    -- count only bowler-attributed dismissals
    SUM(
        CASE 
            WHEN d.player_dismissed IS NOT NULL 
             AND d.dismissal_kind NOT IN ('run out', 'retired hurt', 'obstructing the field')
            THEN 1 ELSE 0 
        END
    ) AS wickets,

    MAX(
        CASE 
            WHEN m.winner = d.bowling_team THEN 1 
            ELSE 0 
        END
    ) AS is_winner

FROM deliveries d
JOIN Matches m
ON d.match_id = m.id

GROUP BY d.bowler, d.match_id;

------ Derive Bowling metrics

SELECT
    bowler,

    COUNT(*) AS matches_played,

    ROUND(SUM(wickets) * 1.0 / COUNT(*), 2) AS avg_wickets_per_match,

    ROUND(SUM(runs_conceded) * 6.0 / SUM(balls_bowled), 2) AS economy,

    ROUND(SUM(balls_bowled) * 1.0 / NULLIF(SUM(wickets), 0), 2) AS strike_rate,

    -- contribution in wins (wickets in matches won)
    ROUND(
        AVG(CASE WHEN is_winner = 1 THEN wickets ELSE 0 END)
    , 2) AS winning_wickets,

    -- 🔥 composite impact (tune weights later)
    ROUND(
          (SUM(wickets) * 2.0 / COUNT(*))            -- wicket-taking
        + (AVG(CASE WHEN is_winner = 1 THEN wickets ELSE 0 END) * 1.5)  -- clutch wickets
        - (SUM(runs_conceded) * 6.0 / SUM(balls_bowled))                -- economy penalty
    , 2) AS impact_score

FROM bowler_match_impact
GROUP BY bowler
HAVING SUM(balls_bowled) >= 120   -- filter noise
ORDER BY impact_score DESC;

------ Phase-weighted bowling

-- requires ball_with_phase view you created earlier
SELECT
    d.bowler,
    d.match_id,

    SUM(CASE WHEN p.phase='Death' THEN d.total_runs ELSE 0 END) AS death_runs,
    SUM(CASE WHEN p.phase='Death' THEN 1 ELSE 0 END) AS death_balls,

    SUM(CASE WHEN p.phase='Death'
              AND d.player_dismissed IS NOT NULL
              AND d.dismissal_kind NOT IN ('run out','retired hurt','obstructing the field')
        THEN 1 ELSE 0 END) AS death_wkts

FROM deliveries d
JOIN ball_with_phase p
  ON d.match_id=p.match_id AND d.inning=p.inning AND d.overs=p.overs AND d.ball=p.ball
GROUP BY d.bowler, d.match_id;

