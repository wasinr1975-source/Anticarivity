Attribute VB_Name = "OnboardingConsolidation"
Option Explicit

' ============================================================================
' Onboarding survey consolidation (Microsoft Forms -> Branchstafflist.xlsx)
'
'   Step A : ONBOARDING30Days.xlsx  -> sheet "30 DAYS"
'   Step B : ONBOARDING60Days.xlsx  -> sheet "60 DAYS"
'   Step C : ONBOARDING90Days.xlsx  -> sheet "90 DAYS"
'
' Each step copies columns A:R from row 2 to the last row with data in the
' source (first worksheet) and pastes VALUES into the target sheet at A2.
' The old data in target A2:R is cleared first, so re-running a step never
' leaves stale rows (Forms exports are cumulative = full refresh).
'
' Run: Alt+F8 -> choose Step_A_30Days / Step_B_60Days / Step_C_90Days
'      or Run_All_Steps to do A, B, C in sequence.
' ============================================================================

Private Const BASE_PATH As String = "D:\Bank Wasin\Project\GB TurnOVER RATE\Pha\Project temperature\"
Private Const TARGET_FILE As String = BASE_PATH & "Branchstaff\Branchstafflist.xlsx"

' NOTE: the original instruction for Step C pointed at the "30days" folder.
' This assumes the file lives in "90days". If it really is in "30days",
' change the folder name below.
Private Const SRC_30 As String = BASE_PATH & "microsoftform\30days\ONBOARDING30Days.xlsx"
Private Const SRC_60 As String = BASE_PATH & "microsoftform\60days\ONBOARDING60Days.xlsx"
Private Const SRC_90 As String = BASE_PATH & "microsoftform\90days\ONBOARDING90Days.xlsx"

Private Const FIRST_COL As String = "A"
Private Const LAST_COL As String = "R"
Private Const FIRST_ROW As Long = 2

Public Sub Step_A_30Days()
    CopyOnboarding SRC_30, "30 DAYS", "Step A"
End Sub

Public Sub Step_B_60Days()
    CopyOnboarding SRC_60, "60 DAYS", "Step B"
End Sub

Public Sub Step_C_90Days()
    CopyOnboarding SRC_90, "90 DAYS", "Step C"
End Sub

Public Sub Run_All_Steps()
    Dim ok As Boolean
    ok = CopyOnboarding(SRC_30, "30 DAYS", "Step A", False)
    If ok Then ok = CopyOnboarding(SRC_60, "60 DAYS", "Step B", False)
    If ok Then ok = CopyOnboarding(SRC_90, "90 DAYS", "Step C", False)
    If ok Then MsgBox "Steps A, B, C completed.", vbInformation
End Sub

' ----------------------------------------------------------------------------
Private Function CopyOnboarding(ByVal srcPath As String, ByVal targetSheet As String, _
                                ByVal stepName As String, _
                                Optional ByVal showDone As Boolean = True) As Boolean
    Dim wbSrc As Workbook, wbTgt As Workbook
    Dim wsSrc As Worksheet, wsTgt As Worksheet
    Dim srcOpenedHere As Boolean, tgtOpenedHere As Boolean
    Dim lastRow As Long, tgtLastRow As Long, nRows As Long
    Dim data As Variant

    On Error GoTo Fail

    If Dir(srcPath) = "" Then Err.Raise vbObjectError + 1, , "Source file not found:" & vbLf & srcPath
    If Dir(TARGET_FILE) = "" Then Err.Raise vbObjectError + 2, , "Target file not found:" & vbLf & TARGET_FILE

    Application.ScreenUpdating = False
    Application.DisplayAlerts = False

    Set wbSrc = GetOrOpen(srcPath, True, srcOpenedHere)
    Set wbTgt = GetOrOpen(TARGET_FILE, False, tgtOpenedHere)

    Set wsSrc = wbSrc.Worksheets(1)
    On Error Resume Next
    Set wsTgt = wbTgt.Worksheets(targetSheet)
    On Error GoTo Fail
    If wsTgt Is Nothing Then Err.Raise vbObjectError + 3, , "Sheet """ & targetSheet & """ not found in " & wbTgt.Name

    ' Last data row in source across A:R
    lastRow = LastUsedRow(wsSrc)

    ' Clear old data in target A2:R
    tgtLastRow = LastUsedRow(wsTgt)
    If tgtLastRow >= FIRST_ROW Then
        wsTgt.Range(FIRST_COL & FIRST_ROW & ":" & LAST_COL & tgtLastRow).ClearContents
    End If

    If lastRow >= FIRST_ROW Then
        nRows = lastRow - FIRST_ROW + 1
        data = wsSrc.Range(FIRST_COL & FIRST_ROW & ":" & LAST_COL & lastRow).Value
        wsTgt.Range(FIRST_COL & FIRST_ROW).Resize(nRows, 18).Value = data
    Else
        nRows = 0
    End If

    wbTgt.Save
    If srcOpenedHere Then wbSrc.Close SaveChanges:=False

    Application.DisplayAlerts = True
    Application.ScreenUpdating = True

    If showDone Then MsgBox stepName & " done: " & nRows & " rows pasted to """ & targetSheet & """.", vbInformation
    CopyOnboarding = True
    Exit Function

Fail:
    Application.DisplayAlerts = True
    Application.ScreenUpdating = True
    If srcOpenedHere And Not wbSrc Is Nothing Then wbSrc.Close SaveChanges:=False
    MsgBox stepName & " FAILED:" & vbLf & Err.Description, vbCritical
    CopyOnboarding = False
End Function

' Return the workbook if already open, otherwise open it.
Private Function GetOrOpen(ByVal fullPath As String, ByVal readOnly As Boolean, _
                           ByRef openedHere As Boolean) As Workbook
    Dim wb As Workbook
    For Each wb In Application.Workbooks
        If StrComp(wb.FullName, fullPath, vbTextCompare) = 0 Then
            Set GetOrOpen = wb
            openedHere = False
            Exit Function
        End If
    Next wb
    Set GetOrOpen = Application.Workbooks.Open(Filename:=fullPath, ReadOnly:=readOnly, UpdateLinks:=0)
    openedHere = True
End Function

' Last row that has any value in columns A:R (0 if the sheet is empty).
Private Function LastUsedRow(ByVal ws As Worksheet) As Long
    Dim c As Range
    Set c = ws.Range(FIRST_COL & ":" & LAST_COL).Find(What:="*", LookIn:=xlFormulas, _
            SearchOrder:=xlByRows, SearchDirection:=xlPrevious)
    If c Is Nothing Then LastUsedRow = 0 Else LastUsedRow = c.Row
End Function
