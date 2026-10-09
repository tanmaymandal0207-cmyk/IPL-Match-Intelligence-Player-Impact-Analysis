# Data

The data is **not stored in this repository**. Download it from Kaggle:

**[IPL Complete Dataset (2008–2024)](https://www.kaggle.com/datasets/patrickb1912/ipl-complete-dataset-20082020)**: `matches.csv` and `deliveries.csv`.

| File | Rows | Grain |
|---|---:|---|
| `matches.csv` | 1,095 | one match, 2008–2024 |
| `deliveries.csv` | 260,920 | one delivery, including 161 super-over balls |

Put both files in one folder and replace `<DATA_DIR>` in [`../sql/01_load_data.sql`](../sql/01_load_data.sql) with that folder's path.

`01_load_data.sql` prints the loaded row counts. If they differ from the table above, the dataset version has changed, and some numbers in [`../docs/findings.md`](../docs/findings.md) will differ.
