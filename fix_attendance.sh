#!/bin/bash

# Define validRecords
sed -i '/\/\/ computed statistics/i \
  const validRecords = useMemo(() => {\n    const employeeIds = new Set(localEmployees.map(e => e.id));\n    return records.filter(r => employeeIds.has(r.employeeId));\n  }, [records, localEmployees]);\n' src/components/AttendanceManager.tsx

# Replace records.filter with validRecords.filter in the useMemo blocks
# stats
sed -i 's/const periodRecords = records.filter/const periodRecords = validRecords.filter/g' src/components/AttendanceManager.tsx
sed -i 's/const todayRecords = records.filter/const todayRecords = validRecords.filter/g' src/components/AttendanceManager.tsx
sed -i 's/const pendingApprovalsCount = records.filter/const pendingApprovalsCount = validRecords.filter/g' src/components/AttendanceManager.tsx

# attendanceChartData
sed -i 's/const dayRecs = records.filter/const dayRecs = validRecords.filter/g' src/components/AttendanceManager.tsx

# monthlyOvertimeChartData
sed -i 's/const targetRecs = records.filter/const targetRecs = validRecords.filter/g' src/components/AttendanceManager.tsx

# todayRecordsFiltered
sed -i 's/return records.filter(r => r.date === todayStr);/return validRecords.filter(r => r.date === todayStr);/g' src/components/AttendanceManager.tsx

# filteredLogs
sed -i 's/return records/return validRecords/g' src/components/AttendanceManager.tsx

# payrollExportData
sed -i 's/records.forEach/validRecords.forEach/g' src/components/AttendanceManager.tsx

