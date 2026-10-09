/* =====================================================================
   IPL Match Intelligence · 03 · Reference (mapping) tables
   Franchises were renamed and grounds appear under several spellings.
   Without these maps, Delhi Daredevils and Delhi Capitals count as two
   teams and Wankhede Stadium appears twice in the venue ranking.
   ===================================================================== */

USE ipl_project;

-- Team → franchise ---------------------------------------------------------
DROP TABLE IF EXISTS ref_team;
CREATE TABLE ref_team (
    team_raw   VARCHAR(40) NOT NULL PRIMARY KEY,
    franchise  VARCHAR(40) NOT NULL,
    is_active  TINYINT     NOT NULL           -- still playing in 2024
);

INSERT INTO ref_team (team_raw, franchise, is_active) VALUES
('Chennai Super Kings',         'Chennai Super Kings',         1),
('Delhi Capitals',              'Delhi Capitals',              1),
('Delhi Daredevils',            'Delhi Capitals',              1),   -- renamed 2019
('Gujarat Titans',              'Gujarat Titans',              1),
('Kolkata Knight Riders',       'Kolkata Knight Riders',       1),
('Lucknow Super Giants',        'Lucknow Super Giants',        1),
('Mumbai Indians',              'Mumbai Indians',              1),
('Kings XI Punjab',             'Punjab Kings',                1),   -- renamed 2021
('Punjab Kings',                'Punjab Kings',                1),
('Rajasthan Royals',            'Rajasthan Royals',            1),
('Royal Challengers Bangalore', 'Royal Challengers Bengaluru', 1),   -- renamed 2024
('Royal Challengers Bengaluru', 'Royal Challengers Bengaluru', 1),
('Sunrisers Hyderabad',         'Sunrisers Hyderabad',         1),
('Deccan Chargers',             'Deccan Chargers',             0),   -- separate franchise, not SRH
('Gujarat Lions',               'Gujarat Lions',               0),
('Kochi Tuskers Kerala',        'Kochi Tuskers Kerala',        0),
('Pune Warriors',               'Pune Warriors',               0),
('Rising Pune Supergiant',      'Rising Pune Supergiant',      0),
('Rising Pune Supergiants',     'Rising Pune Supergiant',      0);   -- spelling variant

-- Venue → ground -----------------------------------------------------------
DROP TABLE IF EXISTS ref_venue;
CREATE TABLE ref_venue (
    venue_raw  VARCHAR(100) NOT NULL PRIMARY KEY,
    ground     VARCHAR(80)  NOT NULL,
    city       VARCHAR(40)  NOT NULL,
    country    VARCHAR(20)  NOT NULL
);

INSERT INTO ref_venue (venue_raw, ground, city, country) VALUES
('Arun Jaitley Stadium',                                              'Arun Jaitley Stadium',               'Delhi',         'India'),
('Arun Jaitley Stadium, Delhi',                                       'Arun Jaitley Stadium',               'Delhi',         'India'),
('Feroz Shah Kotla',                                                  'Arun Jaitley Stadium',               'Delhi',         'India'),  -- renamed 2019
('Barabati Stadium',                                                  'Barabati Stadium',                   'Cuttack',       'India'),
('Barsapara Cricket Stadium, Guwahati',                               'Barsapara Cricket Stadium',          'Guwahati',      'India'),
('Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium, Lucknow', 'Ekana Cricket Stadium',          'Lucknow',       'India'),
('Brabourne Stadium',                                                 'Brabourne Stadium',                  'Mumbai',        'India'),
('Brabourne Stadium, Mumbai',                                         'Brabourne Stadium',                  'Mumbai',        'India'),
('Dr DY Patil Sports Academy',                                        'DY Patil Stadium',                   'Navi Mumbai',   'India'),
('Dr DY Patil Sports Academy, Mumbai',                                'DY Patil Stadium',                   'Navi Mumbai',   'India'),
('Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium',               'ACA-VDCA Stadium',                   'Visakhapatnam', 'India'),
('Dr. Y.S. Rajasekhara Reddy ACA-VDCA Cricket Stadium, Visakhapatnam', 'ACA-VDCA Stadium',                  'Visakhapatnam', 'India'),
('Eden Gardens',                                                      'Eden Gardens',                       'Kolkata',       'India'),
('Eden Gardens, Kolkata',                                             'Eden Gardens',                       'Kolkata',       'India'),
('Green Park',                                                        'Green Park',                         'Kanpur',        'India'),
('Himachal Pradesh Cricket Association Stadium',                      'HPCA Stadium',                       'Dharamsala',    'India'),
('Himachal Pradesh Cricket Association Stadium, Dharamsala',          'HPCA Stadium',                       'Dharamsala',    'India'),
('Holkar Cricket Stadium',                                            'Holkar Cricket Stadium',             'Indore',        'India'),
('JSCA International Stadium Complex',                                'JSCA International Stadium',         'Ranchi',        'India'),
('M Chinnaswamy Stadium',                                             'M Chinnaswamy Stadium',              'Bengaluru',     'India'),
('M Chinnaswamy Stadium, Bengaluru',                                  'M Chinnaswamy Stadium',              'Bengaluru',     'India'),
('M.Chinnaswamy Stadium',                                             'M Chinnaswamy Stadium',              'Bengaluru',     'India'),
('MA Chidambaram Stadium',                                            'MA Chidambaram Stadium',             'Chennai',       'India'),
('MA Chidambaram Stadium, Chepauk',                                   'MA Chidambaram Stadium',             'Chennai',       'India'),
('MA Chidambaram Stadium, Chepauk, Chennai',                          'MA Chidambaram Stadium',             'Chennai',       'India'),
('Maharaja Yadavindra Singh International Cricket Stadium, Mullanpur', 'Mullanpur Stadium',                 'Mullanpur',     'India'),
('Maharashtra Cricket Association Stadium',                           'MCA Stadium',                        'Pune',          'India'),
('Maharashtra Cricket Association Stadium, Pune',                     'MCA Stadium',                        'Pune',          'India'),
('Subrata Roy Sahara Stadium',                                        'MCA Stadium',                        'Pune',          'India'),  -- same ground, former name
('Narendra Modi Stadium, Ahmedabad',                                  'Narendra Modi Stadium',              'Ahmedabad',     'India'),
('Sardar Patel Stadium, Motera',                                      'Narendra Modi Stadium',              'Ahmedabad',     'India'),  -- rebuilt and renamed
('Nehru Stadium',                                                     'Nehru Stadium',                      'Kochi',         'India'),
('Punjab Cricket Association IS Bindra Stadium',                      'PCA Stadium',                        'Mohali',        'India'),
('Punjab Cricket Association IS Bindra Stadium, Mohali',              'PCA Stadium',                        'Mohali',        'India'),
('Punjab Cricket Association IS Bindra Stadium, Mohali, Chandigarh',  'PCA Stadium',                        'Mohali',        'India'),
('Punjab Cricket Association Stadium, Mohali',                        'PCA Stadium',                        'Mohali',        'India'),
('Rajiv Gandhi International Stadium',                                'Rajiv Gandhi International Stadium', 'Hyderabad',     'India'),
('Rajiv Gandhi International Stadium, Uppal',                         'Rajiv Gandhi International Stadium', 'Hyderabad',     'India'),
('Rajiv Gandhi International Stadium, Uppal, Hyderabad',              'Rajiv Gandhi International Stadium', 'Hyderabad',     'India'),
('Saurashtra Cricket Association Stadium',                            'SCA Stadium',                        'Rajkot',        'India'),
('Sawai Mansingh Stadium',                                            'Sawai Mansingh Stadium',             'Jaipur',        'India'),
('Sawai Mansingh Stadium, Jaipur',                                    'Sawai Mansingh Stadium',             'Jaipur',        'India'),
('Shaheed Veer Narayan Singh International Stadium',                  'SVNS International Stadium',         'Raipur',        'India'),
('Vidarbha Cricket Association Stadium, Jamtha',                      'VCA Stadium',                        'Nagpur',        'India'),
('Wankhede Stadium',                                                  'Wankhede Stadium',                   'Mumbai',        'India'),
('Wankhede Stadium, Mumbai',                                          'Wankhede Stadium',                   'Mumbai',        'India'),
('Dubai International Cricket Stadium',                               'Dubai International Stadium',        'Dubai',         'UAE'),
('Sharjah Cricket Stadium',                                           'Sharjah Cricket Stadium',            'Sharjah',       'UAE'),
('Sheikh Zayed Stadium',                                              'Zayed Cricket Stadium',              'Abu Dhabi',     'UAE'),
('Zayed Cricket Stadium, Abu Dhabi',                                  'Zayed Cricket Stadium',              'Abu Dhabi',     'UAE'),
('Buffalo Park',                                                      'Buffalo Park',                       'East London',   'South Africa'),
('De Beers Diamond Oval',                                             'De Beers Diamond Oval',              'Kimberley',     'South Africa'),
('Kingsmead',                                                         'Kingsmead',                          'Durban',        'South Africa'),
('New Wanderers Stadium',                                             'Wanderers Stadium',                  'Johannesburg',  'South Africa'),
('Newlands',                                                          'Newlands',                           'Cape Town',     'South Africa'),
('OUTsurance Oval',                                                   'OUTsurance Oval',                    'Bloemfontein',  'South Africa'),
('St George''s Park',                                                 'St George''s Park',                  'Gqeberha',      'South Africa'),
('SuperSport Park',                                                   'SuperSport Park',                    'Centurion',     'South Africa');

-- Coverage check: every raw name must be mapped (both rows should show 0)
SELECT 'unmapped teams' AS check_name, COUNT(*) AS found
FROM (SELECT team1 AS t FROM matches UNION SELECT team2 FROM matches
      UNION SELECT batting_team FROM deliveries) x
LEFT JOIN ref_team r ON r.team_raw = x.t WHERE r.team_raw IS NULL
UNION ALL
SELECT 'unmapped venues', COUNT(*)
FROM (SELECT DISTINCT venue FROM matches) v
LEFT JOIN ref_venue r ON r.venue_raw = v.venue WHERE r.venue_raw IS NULL;
