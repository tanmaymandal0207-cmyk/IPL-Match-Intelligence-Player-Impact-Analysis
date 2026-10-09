"""Build dashboard/index.html from the project's MySQL views.

Run after sql/run_all.sql, from the repository root:

    python dashboard/build_dashboard.py            # uses `mysql` with your ~/.my.cnf
    MYSQL_ARGS="-u root -p" python dashboard/build_dashboard.py

Exports three slices, all columnar and integer-coded to keep the page small:
  matches  <- v_match          (one row per match)
  innings  <- v_team_innings   (one row per team innings)
  pm       <- v_player_match   (one row per player per decided match)
and injects them, with src/app.js, into src/template.html. The output is a
single self-contained HTML file (no external requests).
"""
import csv, io, json, os, shlex, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
MYSQL = ["mysql", *shlex.split(os.environ.get("MYSQL_ARGS", "")), "ipl_project", "--batch", "-e"]

ABBR = {
    "Chennai Super Kings": "CSK", "Deccan Chargers": "DCH", "Delhi Capitals": "DC", "Gujarat Lions": "GL",
    "Gujarat Titans": "GT", "Punjab Kings": "PBKS", "Kochi Tuskers Kerala": "KTK", "Kolkata Knight Riders": "KKR",
    "Lucknow Super Giants": "LSG", "Mumbai Indians": "MI", "Pune Warriors": "PWI", "Rajasthan Royals": "RR",
    "Rising Pune Supergiant": "RPS", "Royal Challengers Bengaluru": "RCB", "Sunrisers Hyderabad": "SRH",
}


def query(sql):
    out = subprocess.run(MYSQL + [sql], capture_output=True, text=True, check=True).stdout
    rows = list(csv.reader(io.StringIO(out), delimiter="\t"))
    return rows[1:]


def main():
    mrows = query("""SELECT match_id, season, ground, city, team1, team2, toss_winner, toss_decision,
                            COALESCE(winner, ''), is_decided, is_dl, chase_won, stage
                     FROM v_match ORDER BY match_date, match_id""")
    teams = sorted({r[4] for r in mrows} | {r[5] for r in mrows})
    city = {}
    for r in mrows:
        city.setdefault(r[2], r[3])
    grounds = sorted(city)
    ti = {t: i for i, t in enumerate(teams)}
    gi = {g: i for i, g in enumerate(grounds)}

    mid = {}
    M = {k: [] for k in ["season", "ground", "t1", "t2", "toss", "field", "winner", "decided", "dl", "chase", "playoff"]}
    for i, r in enumerate(mrows):
        mid[r[0]] = i
        for k, v in zip(M, [int(r[1]), gi[r[2]], ti[r[4]], ti[r[5]], ti[r[6]], int(r[7] == "field"),
                            ti[r[8]] if r[8] else -1, int(r[9]), int(r[10]), int(r[11]), int(r[12] == "Playoff")]):
            M[k].append(v)

    I = {k: [] for k in ["m", "inn", "bat", "runs", "wk", "balls", "pp", "ppw", "mid", "midw", "death", "deathw", "deathb"]}
    for r in query("""SELECT match_id, inning, batting_team, runs, wickets, legal_balls, pp_runs, pp_wickets,
                             mid_runs, mid_wickets, death_runs, death_wickets, death_balls
                      FROM v_team_innings ORDER BY match_id, inning"""):
        for k, v in zip(I, [mid[r[0]], int(r[1]), ti[r[2]], *map(int, r[3:])]):
            I[k].append(v)

    prows = query("""SELECT match_id, player, team, role, runs, balls, dismissed, wickets, runs_conceded,
                            dot_balls, death_balls, death_runs, team_won
                     FROM v_player_match WHERE is_decided = 1 ORDER BY match_id, role, player""")
    players = sorted({r[1] for r in prows})
    pi = {p: i for i, p in enumerate(players)}
    P = {k: [] for k in ["m", "p", "team", "bowl", "runs", "balls", "outs", "wk", "rc", "dots", "db", "dr", "won"]}
    for r in prows:
        for k, v in zip(P, [mid[r[0]], pi[r[1]], ti[r[2]], int(r[3] == "bowl"), *map(int, r[4:12]), int(r[12] or 0)]):
            P[k].append(v)

    data = {"teams": teams, "abbr": [ABBR.get(t, t[:3].upper()) for t in teams], "grounds": grounds,
            "cities": [city[g] for g in grounds], "players": players, "matches": M, "innings": I, "pm": P}
    page = (HERE / "src" / "template.html").read_text(encoding="utf-8")
    app = (HERE / "src" / "app.js").read_text(encoding="utf-8")
    page = page.replace("/*__DATA__*/null", json.dumps(data, separators=(",", ":"), ensure_ascii=False))
    page = page.replace("/*__APP__*/", app)
    (HERE / "index.html").write_text(page, encoding="utf-8")
    print(f"index.html: {len(mrows)} matches, {len(I['m'])} innings, {len(prows)} player rows, "
          f"{len(page) / 1024:.0f} KB", file=sys.stderr)


if __name__ == "__main__":
    main()
