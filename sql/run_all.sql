/* =====================================================================
   IPL Match Intelligence · run everything in order
   From the repository root:  mysql --local-infile=1 -u root -p < sql/run_all.sql
   (edit <DATA_DIR> in 01_load_data.sql first)
   ===================================================================== */
SOURCE sql/00_create_schema.sql;
SOURCE sql/01_load_data.sql;
SOURCE sql/02_data_quality_checks.sql;
SOURCE sql/03_reference_tables.sql;
SOURCE sql/04_core_views.sql;
SOURCE sql/05_winning_factors.sql;
SOURCE sql/06_toss_and_venue.sql;
SOURCE sql/07_player_impact.sql;
SOURCE sql/08_strategy_brief.sql;
