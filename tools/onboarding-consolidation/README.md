# Onboarding consolidation (Excel VBA)

Copies Microsoft Forms exports (columns A:R, row 2 to last row) into
`Branchstafflist.xlsx`, sheets `30 DAYS`, `60 DAYS`, `90 DAYS`.

## Install (once)
1. Open Excel -> `Alt+F11` (VBA editor).
2. `File > Import File...` -> choose `OnboardingConsolidation.bas`
   (import into **PERSONAL.XLSB** so it works from any workbook, or into a
   `.xlsm` control workbook — not into `Branchstafflist.xlsx`, which is `.xlsx`
   and cannot hold macros).
3. Check the file paths at the top of the module.

## Run
`Alt+F8` ->
- `Step_A_30Days` — 30-day form -> sheet `30 DAYS`
- `Step_B_60Days` — 60-day form -> sheet `60 DAYS`
- `Step_C_90Days` — 90-day form -> sheet `90 DAYS`
- `Run_All_Steps` — A, B, C in sequence (stops at the first failure)

## Behaviour
- Pastes **values only** at `A2`, after clearing old data in target `A2:R`
  (full refresh — Forms exports are cumulative, so appending would duplicate).
- Source file is opened read-only and closed without saving.
- Target file is saved after each step.
- Header row (row 1) and columns S+ in the target are not touched.
