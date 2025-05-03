import { atomWithImmer } from 'jotai-immer';
import { atom } from 'jotai';
import { Employee, EmployeePresent, AttendanceLog, TabType } from '@/components/dashboard/types/attendance-types';

export const employeeListAtom = atomWithImmer<Employee[]>([]);
export const activeTabAtom = atomWithImmer<TabType>('all');
export const employeeLogsAtom = atomWithImmer<Record<number, AttendanceLog[]>>({});
// Using regular atom for Date since Date objects are not compatible with Immer
export const currentSelectedDateAtom = atom<Date>(new Date());
export const userPositionAtom = atomWithImmer<string>('employee');
export const employeePresentRecordsAtom = atomWithImmer<Record<number, EmployeePresent | null>>({});
export const employeeSearchAtom = atomWithImmer<string>('');

// Derived atom for filtered employees based on active tab and search query
export const filteredEmployeesAtom = atom((get) => {
  const employees = get(employeeListAtom);
  const activeTab = get(activeTabAtom);
  const searchQuery = get(employeeSearchAtom);
  const employeeLogs = get(employeeLogsAtom);
  const employeePresentRecords = get(employeePresentRecordsAtom);
  
  // Filter by search query first
  let filtered = employees;
  if (searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase();
    filtered = employees.filter(emp => 
      emp.name.toLowerCase().includes(query) || 
      emp.position.toLowerCase().includes(query) || 
      emp.department.toLowerCase().includes(query)
    );
  }
  
  // Then filter by tab
  if (activeTab !== 'all') {
    filtered = filtered.filter(emp => {
      const presentRecord = employeePresentRecords[emp.id];
      const logs = employeeLogs[emp.id] || [];
      const lastLog = logs.length > 0 ? logs[0] : null;
      
      switch (activeTab) {
        case 'present':
          return presentRecord !== null && presentRecord.status === 'present';
        case 'absent':
          return presentRecord === null || presentRecord.status === 'absent';
        case 'clockedOut':
          return presentRecord !== null && lastLog && lastLog.status === 'clock-out';
        default:
          return true;
      }
    });
  }
  
  return filtered;
});