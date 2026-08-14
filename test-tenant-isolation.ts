import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

console.log("=================================================");
console.log("🔒 AUTOMATED MULTI-TENANT ISOLATION TEST SUITE");
console.log("=================================================");

// Mock multi-tenant evaluation logic
interface EmployeeRecord {
  id: string;
  name: string;
  company_id: string;
  companyName: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  company_id: string;
  timestamp: string;
}

// Simulated tenant datasets
const companyA_ID = "company_gep_123";
const companyB_ID = "company_interaffaires_456";

const databaseStore: Record<string, { employees: EmployeeRecord[]; attendance: AttendanceRecord[] }> = {
  [companyA_ID]: {
    employees: [
      { id: "emp_a1", name: "GEP Staff 1", company_id: companyA_ID, companyName: "GEP S.A." },
      { id: "emp_a2", name: "GEP Staff 2", company_id: companyA_ID, companyName: "GEP S.A." }
    ],
    attendance: [
      { id: "att_a1", employeeId: "emp_a1", company_id: companyA_ID, timestamp: "2026-08-02T08:00:00Z" }
    ]
  },
  [companyB_ID]: {
    employees: [
      { id: "emp_b1", name: "Mohamed Zied Ben Miled", company_id: companyB_ID, companyName: "Inter-Affaires" }
    ],
    attendance: [
      { id: "att_b1", employeeId: "emp_b1", company_id: companyB_ID, timestamp: "2026-08-02T08:30:00Z" }
    ]
  }
};

/**
 * Multi-tenant Scoped Query Function
 */
function queryTenantData(requestingCompanyId: string, targetCollection: "employees" | "attendance") {
  if (!requestingCompanyId) {
    throw new Error("SECURITY_VIOLATION: Missing tenant company_id context!");
  }
  const tenantData = databaseStore[requestingCompanyId];
  if (!tenantData) return [];
  
  // Enforce strict company_id filtering
  return tenantData[targetCollection].filter(item => item.company_id === requestingCompanyId);
}

let testFailures = 0;

function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ [PASS] ${testName}`);
  } catch (err: any) {
    testFailures++;
    console.error(`❌ [FAIL] ${testName} -> ${err.message}`);
  }
}

// TEST 1: Tenant B querying its own data
runTest("Tenant B (Inter-Affaires) retrieves its own employees", () => {
  const results = queryTenantData(companyB_ID, "employees") as EmployeeRecord[];
  if (results.length !== 1 || results[0].name !== "Mohamed Zied Ben Miled") {
    throw new Error(`Unexpected employee query result count: ${results.length}`);
  }
});

// TEST 2: Tenant A querying its own data
runTest("Tenant A (GEP) retrieves strictly 0 records belonging to Tenant B", () => {
  const gepEmployees = queryTenantData(companyA_ID, "employees") as EmployeeRecord[];
  const leakedRecord = gepEmployees.find(e => e.name.includes("Zied Ben Miled") || e.company_id === companyB_ID);
  if (leakedRecord) {
    throw new Error(`CRITICAL SECURITY FAILURE: Tenant A saw Tenant B record: ${JSON.stringify(leakedRecord)}`);
  }
});

// TEST 3: Attempting cross-tenant data query
runTest("Attempting to query data without company_id throws Security Violation", () => {
  try {
    queryTenantData("", "employees");
    throw new Error("Should have thrown security violation!");
  } catch (err: any) {
    if (!err.message.includes("SECURITY_VIOLATION")) {
      throw err;
    }
  }
});

// TEST 4: Verifying attendance record isolation
runTest("Attendance records are strictly isolated by company_id", () => {
  const gepAttendance = queryTenantData(companyA_ID, "attendance") as AttendanceRecord[];
  const hasInterAffairesPunch = gepAttendance.some(a => a.company_id === companyB_ID || a.employeeId === "emp_b1");
  if (hasInterAffairesPunch) {
    throw new Error("CRITICAL SECURITY FAILURE: GEP saw Inter-Affaires pointages!");
  }
});

console.log("\n-------------------------------------------------");
if (testFailures === 0) {
  console.log("🎉 ALL MULTI-TENANT ISOLATION TESTS PASSED PERFECTLY (4/4)");
} else {
  console.log(`🚨 ${testFailures} TEST(S) FAILED. CHECK LOGS ABOVE.`);
  process.exit(1);
}
console.log("-------------------------------------------------\n");
