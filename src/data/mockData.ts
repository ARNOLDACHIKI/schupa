export interface Result {
  id?: string;
  semester: string;
  gpa: number;
  year: number;
}

export interface FeeRecord {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: "payment" | "charge";
}

export interface Remark {
  date: string;
  text: string;
  by: string;
}

export interface StudentDocument {
  id: string;
  type: "result" | "fee_statement" | "school_id";
  name: string;
  mimeType?: string;
  sizeBytes?: number;
  uploadedAt: string;
  url: string;
}

export interface Student {
  id: string;
  userId?: string;
  name: string;
  email: string;
  approved?: boolean;
  photo: string;
  bio?: string;
  course: string;
  institution: string;
  yearJoined: number;
  currentYear: number;
  totalYears: number;
  results: Result[];
  feeRecords: FeeRecord[];
  feeBalance: number;
  remarks: Remark[];
  documents?: StudentDocument[];
}

export const mockStudents: Student[] = [
  {
    id: "student-1",
    name: "Amina Wanjiku",
    email: "amina@example.com",
    photo: "",
    course: "Computer Science",
    institution: "University of Nairobi",
    yearJoined: 2023,
    currentYear: 3,
    totalYears: 4,
    results: [
      { semester: "Y1 S1", gpa: 3.2, year: 1 },
      { semester: "Y1 S2", gpa: 3.5, year: 1 },
      { semester: "Y2 S1", gpa: 3.7, year: 2 },
      { semester: "Y2 S2", gpa: 3.8, year: 2 },
      { semester: "Y3 S1", gpa: 3.9, year: 3 },
    ],
    feeRecords: [
      { date: "2023-01-15", description: "Tuition Fee Y1", amount: 150000, type: "charge" },
      { date: "2023-02-01", description: "Sponsorship Payment", amount: 120000, type: "payment" },
      { date: "2024-01-15", description: "Tuition Fee Y2", amount: 155000, type: "charge" },
      { date: "2024-02-01", description: "Sponsorship Payment", amount: 155000, type: "payment" },
      { date: "2025-01-15", description: "Tuition Fee Y3", amount: 160000, type: "charge" },
      { date: "2025-02-01", description: "Sponsorship Payment", amount: 140000, type: "payment" },
    ],
    feeBalance: 50000,
    remarks: [
      { date: "2024-06-15", text: "Excellent academic progress. Keep it up!", by: "Admin" },
      { date: "2025-01-20", text: "Fee balance needs attention for Y3.", by: "Admin" },
    ],
  },
  {
    id: "student-2",
    name: "Brian Kipchoge",
    email: "brian@example.com",
    photo: "",
    course: "Mechanical Engineering",
    institution: "Jomo Kenyatta University",
    yearJoined: 2022,
    currentYear: 4,
    totalYears: 5,
    results: [
      { semester: "Y1 S1", gpa: 3.0, year: 1 },
      { semester: "Y1 S2", gpa: 3.1, year: 1 },
      { semester: "Y2 S1", gpa: 3.3, year: 2 },
      { semester: "Y2 S2", gpa: 3.4, year: 2 },
      { semester: "Y3 S1", gpa: 3.6, year: 3 },
      { semester: "Y3 S2", gpa: 3.5, year: 3 },
      { semester: "Y4 S1", gpa: 3.7, year: 4 },
    ],
    feeRecords: [
      { date: "2022-01-10", description: "Tuition Fee Y1", amount: 180000, type: "charge" },
      { date: "2022-02-01", description: "Sponsorship Payment", amount: 180000, type: "payment" },
      { date: "2023-01-10", description: "Tuition Fee Y2", amount: 185000, type: "charge" },
      { date: "2023-02-01", description: "Sponsorship Payment", amount: 185000, type: "payment" },
      { date: "2024-01-10", description: "Tuition Fee Y3", amount: 190000, type: "charge" },
      { date: "2024-02-01", description: "Sponsorship Payment", amount: 190000, type: "payment" },
      { date: "2025-01-10", description: "Tuition Fee Y4", amount: 195000, type: "charge" },
      { date: "2025-02-01", description: "Sponsorship Payment", amount: 195000, type: "payment" },
    ],
    feeBalance: 0,
    remarks: [{ date: "2025-03-01", text: "All fees cleared. Good standing.", by: "Admin" }],
  },
  {
    id: "student-3",
    name: "Catherine Achieng",
    email: "catherine@example.com",
    photo: "",
    course: "Medicine",
    institution: "Moi University",
    yearJoined: 2021,
    currentYear: 5,
    totalYears: 6,
    results: [
      { semester: "Y1 S1", gpa: 3.8, year: 1 },
      { semester: "Y1 S2", gpa: 3.9, year: 1 },
      { semester: "Y2 S1", gpa: 3.7, year: 2 },
      { semester: "Y2 S2", gpa: 3.9, year: 2 },
      { semester: "Y3 S1", gpa: 4.0, year: 3 },
      { semester: "Y3 S2", gpa: 3.8, year: 3 },
      { semester: "Y4 S1", gpa: 3.9, year: 4 },
      { semester: "Y4 S2", gpa: 4.0, year: 4 },
      { semester: "Y5 S1", gpa: 3.9, year: 5 },
    ],
    feeRecords: [
      { date: "2021-01-10", description: "Tuition Fee Y1", amount: 250000, type: "charge" },
      { date: "2021-02-01", description: "Sponsorship Payment", amount: 250000, type: "payment" },
      { date: "2025-01-10", description: "Tuition Fee Y5", amount: 280000, type: "charge" },
      { date: "2025-02-01", description: "Sponsorship Payment", amount: 250000, type: "payment" },
    ],
    feeBalance: 30000,
    remarks: [{ date: "2025-02-20", text: "Top performer. Outstanding student.", by: "Admin" }],
  },
  {
    id: "student-4",
    name: "Daniel Mutua",
    email: "daniel@example.com",
    photo: "",
    course: "Business Administration",
    institution: "Strathmore University",
    yearJoined: 2024,
    currentYear: 2,
    totalYears: 4,
    results: [
      { semester: "Y1 S1", gpa: 2.8, year: 1 },
      { semester: "Y1 S2", gpa: 3.0, year: 1 },
      { semester: "Y2 S1", gpa: 3.2, year: 2 },
    ],
    feeRecords: [
      { date: "2024-01-15", description: "Tuition Fee Y1", amount: 200000, type: "charge" },
      { date: "2024-02-01", description: "Sponsorship Payment", amount: 170000, type: "payment" },
      { date: "2025-01-15", description: "Tuition Fee Y2", amount: 210000, type: "charge" },
      { date: "2025-02-01", description: "Sponsorship Payment", amount: 150000, type: "payment" },
    ],
    feeBalance: 90000,
    remarks: [{ date: "2025-03-10", text: "Fee balance is high. Needs follow-up with sponsor.", by: "Admin" }],
  },
  {
    id: "student-5",
    name: "Esther Njeri",
    email: "esther@example.com",
    photo: "",
    course: "Education",
    institution: "Kenyatta University",
    yearJoined: 2023,
    currentYear: 3,
    totalYears: 4,
    results: [
      { semester: "Y1 S1", gpa: 3.4, year: 1 },
      { semester: "Y1 S2", gpa: 3.6, year: 1 },
      { semester: "Y2 S1", gpa: 3.5, year: 2 },
      { semester: "Y2 S2", gpa: 3.7, year: 2 },
      { semester: "Y3 S1", gpa: 3.8, year: 3 },
    ],
    feeRecords: [
      { date: "2023-01-10", description: "Tuition Fee Y1", amount: 120000, type: "charge" },
      { date: "2023-02-01", description: "Sponsorship Payment", amount: 120000, type: "payment" },
      { date: "2024-01-10", description: "Tuition Fee Y2", amount: 125000, type: "charge" },
      { date: "2024-02-01", description: "Sponsorship Payment", amount: 125000, type: "payment" },
      { date: "2025-01-10", description: "Tuition Fee Y3", amount: 130000, type: "charge" },
      { date: "2025-02-01", description: "Sponsorship Payment", amount: 130000, type: "payment" },
    ],
    feeBalance: 0,
    remarks: [{ date: "2025-01-25", text: "Consistent performance. All fees paid.", by: "Admin" }],
  },
];
