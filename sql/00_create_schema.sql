/* =====================================================================
   IPL Match Intelligence · 00 · Schema
   Raw landing tables for the Kaggle "IPL Complete Dataset (2008–2024)".
   Column names follow the source files, except `over` → `over_no`
   (OVER is a reserved word in MySQL 8).
   ===================================================================== */

DROP DATABASE IF EXISTS ipl_project;
CREATE DATABASE ipl_project CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE ipl_project;

-- One row per match -------------------------------------------------------
CREATE TABLE matches (
    id               INT          NOT NULL PRIMARY KEY,
    season           SMALLINT     NOT NULL,
    city             VARCHAR(40)  NULL,
    match_date       DATE         NOT NULL,
    match_type       VARCHAR(30)  NOT NULL,        -- League, Qualifier 1, Final, …
    player_of_match  VARCHAR(60)  NULL,
    venue            VARCHAR(100) NOT NULL,
    team1            VARCHAR(40)  NOT NULL,
    team2            VARCHAR(40)  NOT NULL,
    toss_winner      VARCHAR(40)  NOT NULL,
    toss_decision    VARCHAR(5)   NOT NULL,        -- bat | field
    winner           VARCHAR(40)  NULL,            -- NULL = no result
    result           VARCHAR(10)  NOT NULL,        -- runs | wickets | tie | no result
    result_margin    SMALLINT     NULL,
    target_runs      SMALLINT     NULL,
    target_overs     DECIMAL(4,1) NULL,
    super_over       CHAR(1)      NOT NULL,        -- Y | N
    method           VARCHAR(5)   NULL,            -- D/L or NULL
    umpire1          VARCHAR(60)  NULL,
    umpire2          VARCHAR(60)  NULL,
    KEY ix_matches_season (season),
    KEY ix_matches_venue  (venue)
) ENGINE = InnoDB;

-- One row per delivery (extras re-use the ball number, so a surrogate key is used)
CREATE TABLE deliveries (
    delivery_id      INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    match_id         INT          NOT NULL,
    inning           TINYINT      NOT NULL,        -- 1–2 regular, 3+ super over
    batting_team     VARCHAR(40)  NOT NULL,
    bowling_team     VARCHAR(40)  NOT NULL,
    over_no          TINYINT      NOT NULL,        -- 0-based: 0 = first over
    ball             TINYINT      NOT NULL,
    batter           VARCHAR(60)  NOT NULL,
    bowler           VARCHAR(60)  NOT NULL,
    non_striker      VARCHAR(60)  NOT NULL,
    batsman_runs     TINYINT      NOT NULL,
    extra_runs       TINYINT      NOT NULL,
    total_runs       TINYINT      NOT NULL,
    extras_type      VARCHAR(10)  NULL,            -- wides | noballs | byes | legbyes | penalty
    is_wicket        TINYINT      NOT NULL,
    player_dismissed VARCHAR(60)  NULL,
    dismissal_kind   VARCHAR(25)  NULL,
    fielder          VARCHAR(80)  NULL,
    KEY ix_del_match  (match_id, inning, over_no),
    KEY ix_del_batter (batter),
    KEY ix_del_bowler (bowler)
) ENGINE = InnoDB;
