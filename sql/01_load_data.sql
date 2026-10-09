/* =====================================================================
   IPL Match Intelligence · 01 · Load
   Loads the two CSV files. Every field is trimmed (some copies of the
   dataset pad values with spaces) and the text 'NA' becomes NULL.

   Before running:
     1. Download matches.csv and deliveries.csv (see data/README.md).
     2. Replace <DATA_DIR> below with the folder that holds them.
     3. Connect with local_infile enabled:  mysql --local-infile=1 -u root -p
   ===================================================================== */

USE ipl_project;
SET GLOBAL local_infile = 1;

LOAD DATA LOCAL INFILE '<DATA_DIR>/matches.csv'
INTO TABLE matches
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@id, @season, @city, @date, @match_type, @pom, @venue, @team1, @team2,
 @toss_winner, @toss_decision, @winner, @result, @margin, @target_runs,
 @target_overs, @super_over, @method, @ump1, @ump2)
SET id              = TRIM(@id),
    season          = TRIM(@season),
    city            = NULLIF(TRIM(@city), 'NA'),
    match_date      = TRIM(@date),
    match_type      = TRIM(@match_type),
    player_of_match = NULLIF(TRIM(@pom), 'NA'),
    venue           = TRIM(@venue),
    team1           = TRIM(@team1),
    team2           = TRIM(@team2),
    toss_winner     = TRIM(@toss_winner),
    toss_decision   = TRIM(@toss_decision),
    winner          = NULLIF(TRIM(@winner), 'NA'),
    result          = TRIM(@result),
    result_margin   = NULLIF(TRIM(@margin), 'NA'),
    target_runs     = NULLIF(TRIM(@target_runs), 'NA'),
    target_overs    = NULLIF(TRIM(@target_overs), 'NA'),
    super_over      = TRIM(@super_over),
    method          = NULLIF(TRIM(@method), 'NA'),
    umpire1         = NULLIF(TRIM(@ump1), 'NA'),
    umpire2         = NULLIF(TRIM(REPLACE(@ump2, '\r', '')), 'NA');

LOAD DATA LOCAL INFILE '<DATA_DIR>/deliveries.csv'
INTO TABLE deliveries
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@match_id, @inning, @batting_team, @bowling_team, @over, @ball, @batter,
 @bowler, @non_striker, @batsman_runs, @extra_runs, @total_runs,
 @extras_type, @is_wicket, @player_dismissed, @dismissal_kind, @fielder)
SET match_id         = TRIM(@match_id),
    inning           = TRIM(@inning),
    batting_team     = TRIM(@batting_team),
    bowling_team     = TRIM(@bowling_team),
    over_no          = TRIM(@over),
    ball             = TRIM(@ball),
    batter           = TRIM(@batter),
    bowler           = TRIM(@bowler),
    non_striker      = TRIM(@non_striker),
    batsman_runs     = TRIM(@batsman_runs),
    extra_runs       = TRIM(@extra_runs),
    total_runs       = TRIM(@total_runs),
    extras_type      = NULLIF(NULLIF(TRIM(@extras_type), 'NA'), ''),
    is_wicket        = TRIM(@is_wicket),
    player_dismissed = NULLIF(TRIM(@player_dismissed), 'NA'),
    dismissal_kind   = NULLIF(TRIM(@dismissal_kind), 'NA'),
    fielder          = NULLIF(TRIM(REPLACE(@fielder, '\r', '')), 'NA');

-- Expected: 1,095 matches · 260,920 deliveries
SELECT (SELECT COUNT(*) FROM matches) AS matches_loaded,
       (SELECT COUNT(*) FROM deliveries) AS deliveries_loaded;
