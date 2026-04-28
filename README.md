# 🏏 IPL Match Intelligence & Player Impact Analysis

**Turning IPL ball-by-ball data into match-winning insights using SQL**

---

## 📌 Overview

This project analyzes IPL match and delivery data to uncover the key factors that influence match outcomes and evaluate player performance using data-driven impact metrics.

It follows a structured analytics pipeline:
**Raw Data → Feature Engineering → Aggregation → Insights → Dashboard Ready**

---

## 🎯 Objectives

* Identify match-winning factors using phase-wise analysis
* Evaluate team strategies (aggression vs stability)
* Measure player performance using impact-based metrics
* Build decision-ready datasets for dashboards

---

## 📊 Key Insights

* 🔥 **Death overs are the strongest predictor of winning**
  Teams scoring 60+ runs in death overs have significantly higher win probability

* ⚡ **Strong powerplays provide early advantage**
  50+ runs in powerplay increases win chances by ~17%

* 🧠 **Aggressive strategies outperform conservative play**
  Higher scoring rates, even with risk, lead to better outcomes

* 📈 **Player impact reveals true contributors**
  Performance in winning matches matters more than total runs

---

## 🧠 Methodology

* Built layered SQL views for modular analysis:

  * `ball_by_ball`
  * `ball_with_phase`
  * `team_innings`
  * `match_outcome`
  * `batsman_match_impact`
  * `bowler_match_impact`

* Applied:

  * Aggregations and conditional logic
  * Phase segmentation (Powerplay, Middle, Death)
  * Match-context performance analysis

---

## 📁 Project Structure

```id="c2c3g6"
IPL-Match-Intelligence-Player-Impact-Analysis/
│
├── sql/
│   ├── ipl_analysis.sql
│
├── data/ (optional)
│
├── dashboard/ (Power BI files)
│
└── README.md
```

---

## 🛠️ Tech Stack

* **MySQL** – Data processing & analytics
* **Power BI** – Dashboard & visualization
* **SQL** – Feature engineering & modeling

---

## 📊 Dashboard (Planned / Included)

The project is designed to be integrated with a Power BI dashboard featuring:

* Winning factors (Powerplay, Death Overs)
* Strategy analysis
* Player impact rankings
* Interactive filters (team, venue, season)

---

## 🚀 Use Cases

* Sports analytics
* Business intelligence dashboards
* Performance optimization systems
* Freelance data analytics projects

---

## 📌 Future Improvements

* Enhance strategy model with better segmentation
* Improve bowler impact metrics (strike rate accuracy)
* Add venue-based insights with refined data
* Build advanced player scoring (phase-weighted impact)

---

## 👤 Author

**Tanmay Mandal**
Data Analyst | SQL | Business Intelligence

---

## ⭐ If you found this useful

Feel free to star the repository or connect!
