# Findings

All numbers come from the scripts in [`../sql`](../sql) run against the Kaggle *IPL Complete Dataset (2008–2024)*. CSV copies are in [`../results`](../results).

**Base:** 1,076 decided matches (5 no-results and 14 ties excluded), regular innings only (super overs excluded).

---

## 05 · What wins matches

### Q1 · Winner vs loser innings profile

| innings_role | result | innings | avg_runs | avg_wickets | avg_run_rate | avg_pp_runs | avg_middle_runs | avg_death_runs |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Batting first | Won | 492 | 180.6 | 5.5 | 9.08 | 49.4 | 76.3 | 54.9 |
| Batting first | Lost | 584 | 153.3 | 6.6 | 7.75 | 43.5 | 64.5 | 45.3 |
| Chasing | Won | 584 | 154.4 | 3.8 | 8.76 | 50.5 | 69.9 | 34.0 |
| Chasing | Lost | 492 | 149.8 | 8.0 | 7.71 | 45.1 | 66.3 | 38.5 |

- **Batting first:** winners outscore losers in every phase. The biggest gap is the middle overs (+11.8) and the death (+9.6).
- **Chasing:** winners score **fewer** death-over runs than losers (34.0 vs 38.5). A winning chase usually ends before over 20, while a losing chase is still swinging at the end. Any "death overs decide matches" claim must therefore be made on the batting-first innings only.
- **Wickets:** winning chases lose half as many wickets (3.8 vs 8.0).

### Q2 · Par first-innings score by season

| season | matches | avg_first_innings | pct_200_plus | batting_first_win_pct |
|---:|---:|---:|---:|---:|
| 2008 | 58 | 161.0 | 12.1 | 37.9 |
| 2009 | 56 | 150.3 | 1.8 | 46.4 |
| 2010 | 59 | 165.3 | 8.5 | 52.5 |
| 2011 | 72 | 153.7 | 5.6 | 44.4 |
| 2012 | 74 | 157.5 | 5.4 | 45.9 |
| 2013 | 74 | 156.3 | 5.4 | 50.0 |
| 2014 | 59 | 163.3 | 8.5 | 37.3 |
| 2015 | 56 | 164.8 | 10.7 | 57.1 |
| 2016 | 60 | 162.6 | 8.3 | 31.7 |
| 2017 | 58 | 166.0 | 13.8 | 44.8 |
| 2018 | 60 | 172.5 | 18.3 | 46.7 |
| 2019 | 57 | 168.3 | 14.0 | 38.6 |
| 2020 | 56 | 169.2 | 14.3 | 48.2 |
| 2021 | 59 | 159.3 | 10.2 | 37.3 |
| 2022 | 74 | 171.1 | 17.6 | 50.0 |
| 2023 | 73 | 183.5 | 32.9 | 54.8 |
| 2024 | 71 | 189.6 | 36.6 | 49.3 |

- **2008–2022:** the par score moved in a 150–172 band.
- **2023 and 2024:** it jumped to 184 and 190. These were the first two seasons of the Impact Player rule, which lets a side add a specialist batter.
- **200+ totals:** they made up 18% of first innings in 2022 and 37% in 2024.

### Q3 · Powerplay runs and win %

| innings_role | powerplay_runs | innings | wins | win_pct |
|---|---|---:|---:|---:|
| Batting first | 1. under 40 | 307 | 104 | 33.9 |
| Batting first | 2. 40-49 | 358 | 156 | 43.6 |
| Batting first | 3. 50-59 | 277 | 143 | 51.6 |
| Batting first | 4. 60+ | 134 | 89 | 66.4 |
| Chasing | 1. under 40 | 287 | 125 | 43.6 |
| Chasing | 2. 40-49 | 328 | 163 | 49.7 |
| Chasing | 3. 50-59 | 268 | 155 | 57.8 |
| Chasing | 4. 60+ | 193 | 141 | 73.1 |

- **Trend:** win % rises with each 10-run band, in both innings.
- **Chasing:** a 60+ powerplay wins 73%.
- **Batting first:** a sub-40 powerplay wins 34%.

### Q4 · Wickets in hand after 15 overs (batting first)

| wickets_in_hand_at_15 | innings | avg_death_runs | death_run_rate | avg_total | win_pct |
|---|---:|---:|---:|---:|---:|
| 1. 7+ in hand | 536 | 54.7 | 11.04 | 180.9 | 56.5 |
| 2. 5-6 in hand | 424 | 48.3 | 9.79 | 158.2 | 39.9 |
| 3. 4 or fewer | 116 | 31.5 | 7.60 | 123.8 | 17.2 |

- **Death run rate depends on wickets in hand:** 11.0 an over with 7+ wickets left, 7.6 with 4 or fewer.
- **Wickets in hand are a leading indicator, not an outcome.** v1 bucketed *total* wickets lost, which is partly a result of losing.

### Q5 · Powerplay start type

Definitions:
- **Strong:** 50+ runs and at most 1 wicket.
- **Aggressive, risky:** 50+ runs and 2+ wickets.
- **Slow, stable:** under 50 runs and at most 1 wicket.
- **Weak:** under 50 runs and 2+ wickets.

| innings_role | start_type | innings | win_pct |
|---|---|---:|---:|
| Batting first | 1. Strong start | 323 | 57.6 |
| Batting first | 2. Aggressive, risky | 88 | 52.3 |
| Batting first | 3. Slow, stable | 318 | 48.4 |
| Batting first | 4. Weak start | 347 | 30.5 |
| Chasing | 1. Strong start | 321 | 74.5 |
| Chasing | 2. Aggressive, risky | 140 | 40.7 |
| Chasing | 3. Slow, stable | 258 | 64.7 |
| Chasing | 4. Weak start | 357 | 33.9 |

- **Chasing:** a slow but stable start (64.7%) beats an aggressive start that loses wickets (40.7%). In a chase, wickets are the scarcer resource.
- **Batting first:** the two are much closer (48.4% vs 52.3%).

---

## 06 · Toss and venue

### Q6 · Toss decisions by season

| season | decided_matches | pct_toss_winners_fielding | toss_winner_win_pct | chasing_side_win_pct |
|---:|---:|---:|---:|---:|
| 2008 | 58 | 55.2 | 48.3 | 58.6 |
| 2009 | 56 | 37.5 | 58.9 | 51.8 |
| 2010 | 59 | 33.9 | 52.5 | 47.5 |
| 2011 | 72 | 66.7 | 52.8 | 54.2 |
| 2012 | 74 | 50.0 | 44.6 | 54.1 |
| 2013 | 74 | 40.5 | 47.3 | 50.0 |
| 2014 | 59 | 69.5 | 49.2 | 62.7 |
| 2015 | 56 | 55.4 | 48.2 | 42.9 |
| 2016 | 60 | 81.7 | 56.7 | 65.0 |
| 2017 | 58 | 82.8 | 58.6 | 55.2 |
| 2018 | 60 | 83.3 | 53.3 | 53.3 |
| 2019 | 57 | 84.2 | 59.6 | 61.4 |
| 2020 | 56 | 53.6 | 44.6 | 51.8 |
| 2021 | 59 | 74.6 | 57.6 | 62.7 |
| 2022 | 74 | 79.7 | 48.6 | 50.0 |
| 2023 | 73 | 71.2 | 46.6 | 45.2 |
| 2024 | 71 | 73.2 | 43.7 | 50.7 |

- **Decision:** fielding first became the default from 2016, chosen by 71–84% of toss winners in every season except 2020 (54%, played in the UAE).
- **Pay-off:** the toss winner's win rate has stayed between 44% and 60% every season, and was below 50% in each of 2022–2024.

### Q7 · Chase-friendly vs defend-friendly grounds

Rules:
- **Sample:** grounds with 20+ full matches (D/L excluded).
- **Classification:** *Chase* if chase win % ≥ 55, *Bat first* if ≤ 45, otherwise *Neutral*.

| ground | city | matches | avg_first_innings | chase_win_pct | toss_call |
|---|---|---:|---:|---:|---|
| Sawai Mansingh Stadium | Jaipur | 56 | 161.7 | 66.1 | Chase |
| Sharjah Cricket Stadium | Sharjah | 28 | 159.0 | 64.3 | Chase |
| Zayed Cricket Stadium | Abu Dhabi | 35 | 159.0 | 60.0 | Chase |
| Eden Gardens | Kolkata | 89 | 167.5 | 57.3 | Chase |
| PCA Stadium | Mohali | 60 | 167.9 | 56.7 | Chase |
| Narendra Modi Stadium | Ahmedabad | 34 | 169.7 | 55.9 | Chase |
| Wankhede Stadium | Mumbai | 117 | 170.3 | 54.7 | Neutral |
| DY Patil Stadium | Navi Mumbai | 37 | 159.6 | 54.1 | Neutral |
| Rajiv Gandhi International Stadium | Hyderabad | 74 | 164.3 | 54.1 | Neutral |
| M Chinnaswamy Stadium | Bengaluru | 87 | 175.3 | 54.0 | Neutral |
| Dubai International Stadium | Dubai | 43 | 162.8 | 51.2 | Neutral |
| Arun Jaitley Stadium | Delhi | 85 | 171.1 | 50.6 | Neutral |
| Brabourne Stadium | Mumbai | 27 | 178.5 | 48.1 | Neutral |
| MCA Stadium | Pune | 51 | 162.4 | 45.1 | Neutral |
| MA Chidambaram Stadium | Chennai | 83 | 164.3 | 43.4 | Bat first |

---

## 07 · Player impact (2022–2024, minimum 300 balls)

### Q8 · Batters

`impact = (0.6 × runs per innings + 0.4 × runs per innings in wins) × (strike rate ÷ league strike rate)`

| player | innings | runs | batting_avg | strike_rate | death_strike_rate | pct_runs_in_wins | impact_score |
|---|---:|---:|---:|---:|---:|---:|---:|
| Shubman Gill | 45 | 1799 | 45.0 | 147.7 | 176.5 | 78.1 | 37.9 |
| DP Conway | 22 | 924 | 48.6 | 141.3 | 153.6 | 71.8 | 37.1 |
| SA Yadav | 35 | 1253 | 40.4 | 167.5 | 209.7 | 56.7 | 34.9 |
| RM Patidar | 20 | 728 | 38.3 | 165.1 | 240.0 | 54.8 | 34.7 |
| PD Salt | 21 | 653 | 34.4 | 175.5 | 184.2 | 71.7 | 34.1 |
| H Klaasen | 26 | 927 | 44.1 | 173.9 | 201.1 | 44.2 | 33.9 |
| JC Buttler | 42 | 1614 | 42.5 | 144.6 | 210.7 | 64.3 | 33.5 |
| B Sai Sudharsan | 25 | 1034 | 47.0 | 139.2 | 201.2 | 49.0 | 32.3 |
| YBK Jaiswal | 39 | 1318 | 35.6 | 154.2 | 213.3 | 63.0 | 31.2 |
| F du Plessis | 45 | 1636 | 38.0 | 147.0 | 178.2 | 55.3 | 30.9 |
| V Kohli | 45 | 1721 | 44.1 | 139.9 | 172.4 | 55.3 | 30.9 |
| RD Gaikwad | 43 | 1541 | 39.5 | 139.6 | 152.6 | 59.4 | 29.5 |
| KL Rahul | 38 | 1410 | 41.5 | 130.7 | 157.3 | 60.3 | 28.7 |
| N Pooran | 41 | 1143 | 42.3 | 171.1 | 177.1 | 58.6 | 28.0 |
| Q de Kock | 30 | 901 | 31.1 | 143.2 | 250.0 | 78.0 | 27.6 |

### Q9 · Bowlers

`impact = 2 × wickets per match + 1.5 × wickets per match in wins + (league economy − economy)`

| player | matches | wickets | economy | strike_rate | dot_ball_pct | death_economy | impact_score |
|---|---:|---:|---:|---:|---:|---:|---:|
| M Pathirana | 19 | 32 | 7.94 | 13.5 | 35.7 | 8.42 | 6.13 |
| JR Hazlewood | 15 | 23 | 8.16 | 14.5 | 44.7 | 10.32 | 5.48 |
| JJ Bumrah | 27 | 35 | 6.84 | 18.0 | 43.9 | 7.11 | 5.47 |
| Mohammed Shami | 33 | 48 | 8.00 | 15.8 | 46.6 | 10.22 | 5.47 |
| PWH de Silva | 24 | 35 | 8.00 | 14.7 | 37.0 | 7.43 | 5.05 |
| YS Chahal | 46 | 66 | 8.42 | 16.3 | 29.9 | 9.46 | 4.87 |
| Rashid Khan | 45 | 56 | 7.68 | 18.7 | 31.6 | 8.43 | 4.86 |
| SP Narine | 42 | 37 | 6.69 | 25.8 | 36.1 | 6.45 | 4.74 |
| CV Varun | 39 | 47 | 8.18 | 18.1 | 37.8 | 8.89 | 4.50 |
| MM Sharma | 25 | 40 | 9.45 | 12.5 | 27.9 | 10.01 | 4.43 |
| M Prasidh Krishna | 17 | 19 | 8.29 | 21.0 | 48.4 | 10.58 | 4.24 |
| Kuldeep Yadav | 39 | 47 | 8.13 | 18.1 | 30.4 | 8.26 | 4.23 |
| Harshit Rana | 19 | 25 | 9.05 | 15.4 | 38.4 | 9.89 | 4.03 |
| Mohsin Khan | 23 | 27 | 8.51 | 18.0 | 43.0 | 10.17 | 4.02 |
| TA Boult | 41 | 45 | 8.13 | 20.4 | 44.0 | 11.92 | 4.00 |

**Caveats:**
- **Weights:** the impact weights are a modelling choice, kept from v1 and documented, not fitted.
- **Sample size:** players with few innings (for example DP Conway, 22) carry more uncertainty than those with 40+.

---

## 08 · Strategy brief

| seq | area | finding | recommendation |
|---:|---|---|---|
| 1 | Batting target | Par first-innings score in 2024 is 190; 37% of totals reached 200 | Plan for 200: par has risen 18 runs since 2022 |
| 2 | Powerplay | Teams scoring 60+ in overs 1-6 win 70% vs 39% when under 40 | Pick openers on powerplay strike rate; 60 is the target |
| 3 | Death overs | Batting first with 7+ wickets in hand at 15 overs wins 57% vs 17% with 4 or fewer | Protect wickets through the middle; death-over runs depend on them |
| 4 | Toss | Last 3 seasons: toss winner wins 46%, chasing side wins 49% | The toss is close to a coin flip; decide by ground, not habit |
| 5 | Venue | Best chasing ground: Sawai Mansingh Stadium (66%); best for batting first: MA Chidambaram Stadium (57%) | Use the ground table (06 Q7) for the toss call |
| 6 | Batting shortlist | Shubman Gill (37.9), DP Conway (37.1), SA Yadav (34.9), RM Patidar (34.7), PD Salt (34.1) | Top 5 by batting impact, current window |
| 7 | Bowling shortlist | M Pathirana (6.13), JR Hazlewood (5.48), JJ Bumrah (5.47), Mohammed Shami (5.47), PWH de Silva (5.05) | Top 5 by bowling impact, current window |

---

## 02 · Data-quality report

| check_name | found | treatment |
|---|---:|---|
| Matches loaded | 1095 | expected 1,095 |
| Deliveries loaded | 260920 | expected 260,920 |
| Deliveries with no matching match | 0 | must be 0 |
| Matches with no deliveries | 0 | must be 0 |
| No-result matches | 5 | excluded from every win-rate |
| Tied matches (decided by super over) | 14 | excluded: not decided by the two innings |
| Super-over deliveries (inning 3+) | 161 | excluded from all innings and player figures |
| D/L (rain-adjusted) matches | 21 | kept for results; excluded from venue chase rates |
| Raw team names | 19 | mapped to franchises in ref_team |
| Raw venue names | 58 | mapped to grounds in ref_venue |
| Matches with city missing | 51 | city taken from ref_venue |
| Target ≠ first-innings total + 1 | 0 | reconciliation; must be 0 |
| Overs with 7 legal balls | 29 | umpire miscounts, kept as bowled |
| Wides + no-balls (not legal balls) | 9449 | excluded from balls faced / bowled |
| Byes + leg-byes (not charged to bowler) | 4674 | excluded from bowler runs |
| Dismissals not credited to the bowler | 1135 | run out, retired, obstructing |
