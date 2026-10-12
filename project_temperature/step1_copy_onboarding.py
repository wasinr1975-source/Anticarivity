"""
Project Temperature - Step 1
Copy the onboarding survey files into Branchestafflist.xlsx:

    onboarding 30days.xlsx  ->  Branchestafflist.xlsx [sheet "30days"]
    onboarding 60days.xlsx  ->  Branchestafflist.xlsx [sheet "60days"]
    onboarding 90days.xlsx  ->  Branchestafflist.xlsx [sheet "90days"]

Behaviour (= "paste values", columns A:R only):
  * Reads columns A:R of the first sheet of each source file
    (or SOURCE_SHEET if set).
  * Formulas in the source are pasted as their last calculated values.
  * Columns A:R of the target sheet are cleared first, then the source is
    pasted from A1 (header row included). Columns S onward in the target
    sheet and all other sheets in Branchestafflist are left untouched.
  * A timestamped backup of Branchestafflist is made before writing.
  * After saving, the target is re-opened and every cell is compared with
    the source; the script exits with an error if anything differs.

Usage:
    python step1_copy_onboarding.py --folder "C:/path/to/excel/files"
"""

import argparse
import shutil
import sys
from datetime import datetime
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.utils import column_index_from_string, get_column_letter


# ---------------------------------------------------------------- config ---
# Change these if your real file names / sheet names are different.
TARGET_FILE = "Branchestafflist.xlsx"
MAPPING = {
    # source file              : target sheet
    "onboarding 30days.xlsx": "30days",
    "onboarding 60days.xlsx": "60days",
    "onboarding 90days.xlsx": "90days",
}
SOURCE_SHEET = None  # None = first sheet in each source file
FIRST_COL, LAST_COL = "A", "R"  # columns to copy
# ---------------------------------------------------------------------------

MIN_COL = column_index_from_string(FIRST_COL)
MAX_COL = column_index_from_string(LAST_COL)


def read_source(path, sheet_name):
    """Return (rows, number_formats) from the source sheet, values only."""
    wb = load_workbook(path, data_only=True, read_only=True)
    ws = wb[sheet_name] if sheet_name else wb.worksheets[0]
    rows, formats = [], []
    for row in ws.iter_rows(min_col=MIN_COL, max_col=MAX_COL):
        rows.append([c.value for c in row])
        formats.append([getattr(c, "number_format", "General") for c in row])
    wb.close()

    # Drop trailing rows that are completely empty (common in exported files)
    while rows and all(v is None for v in rows[-1]):
        rows.pop()
        formats.pop()
    return rows, formats


def paste_into(ws, rows, formats):
    """Clear columns A:R of the worksheet and write rows starting at A1."""
    for row in ws.iter_rows(min_row=1, max_row=ws.max_row,
                            min_col=MIN_COL, max_col=MAX_COL):
        for cell in row:
            cell.value = None
    for r, (values, fmts) in enumerate(zip(rows, formats), start=1):
        for c, (value, fmt) in enumerate(zip(values, fmts), start=MIN_COL):
            if value is None:
                continue
            cell = ws.cell(row=r, column=c, value=value)
            cell.number_format = fmt  # keeps dates looking like dates


def verify(target_path, expected):
    """Re-open the saved file and compare every cell with the source."""
    wb = load_workbook(target_path, data_only=False, read_only=True)
    problems = []
    for sheet, rows in expected.items():
        ws = wb[sheet]
        got = [[c.value for c in row]
               for row in ws.iter_rows(min_col=MIN_COL, max_col=MAX_COL)]
        while got and all(v is None for v in got[-1]):
            got.pop()
        if len(got) != len(rows):
            problems.append(f"{sheet}: expected {len(rows)} rows, found {len(got)}")
            continue
        for r, (exp_row, got_row) in enumerate(zip(rows, got), start=1):
            width = max(len(exp_row), len(got_row))
            exp_row = list(exp_row) + [None] * (width - len(exp_row))
            got_row = list(got_row) + [None] * (width - len(got_row))
            for c, (e, g) in enumerate(zip(exp_row, got_row), start=1):
                if e != g:
                    col = get_column_letter(c + MIN_COL - 1)
                    problems.append(f"{sheet}!{col}{r}: expected {e!r}, found {g!r}")
                    break
    wb.close()
    return problems


def main():
    ap = argparse.ArgumentParser(description="Project Temperature - Step 1")
    ap.add_argument("--folder", default=".", help="Folder that holds all 4 Excel files")
    args = ap.parse_args()
    folder = Path(args.folder)

    target = folder / TARGET_FILE
    missing = [p for p in [target, *(folder / s for s in MAPPING)] if not p.exists()]
    if missing:
        sys.exit("ERROR - file not found:\n  " + "\n  ".join(str(p) for p in missing))

    # 1) Backup
    backup_dir = folder / "backup"
    backup_dir.mkdir(exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup = backup_dir / f"{target.stem}_{stamp}{target.suffix}"
    shutil.copy2(target, backup)
    print(f"Backup : {backup}")

    # 2) Open target (keep macros if it is .xlsm)
    wb = load_workbook(target, keep_vba=target.suffix.lower() == ".xlsm")
    bad = [s for s in MAPPING.values() if s not in wb.sheetnames]
    if bad:
        sys.exit(f"ERROR - sheet(s) {bad} not in {TARGET_FILE}. Found: {wb.sheetnames}")

    # 3) Copy each source into its sheet
    expected = {}
    for src_name, sheet in MAPPING.items():
        rows, formats = read_source(folder / src_name, SOURCE_SHEET)
        paste_into(wb[sheet], rows, formats)
        expected[sheet] = rows
        data_rows = max(len(rows) - 1, 0)
        print(f"Copied : {src_name:<26} -> {sheet:<7} {FIRST_COL}:{LAST_COL}, "
              f"{data_rows} data rows (+1 header)")

    # 4) Save and verify
    try:
        wb.save(target)
    except PermissionError:
        sys.exit(f"ERROR - cannot save {target}. Close it in Excel and run again.")

    problems = verify(target, expected)
    if problems:
        print("VERIFY FAILED:")
        for p in problems[:20]:
            print("  " + p)
        sys.exit(f"Restore from backup if needed: {backup}")
    print("Verify : OK - every cell matches the source files")


if __name__ == "__main__":
    main()
