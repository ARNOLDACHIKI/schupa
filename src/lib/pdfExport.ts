import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Student } from "@/data/mockData";

export function exportStudentsPdf(students: Student[]) {
  const doc = new jsPDF({ orientation: "landscape" });
  doc.setFontSize(14);
  doc.text("SCHUPA Student Summary", 14, 16);

  autoTable(doc, {
    startY: 24,
    head: [["Name", "Email", "Course", "Year", "Fee Balance", "Latest GPA"]],
    body: students.map((student) => [
      student.name,
      student.email,
      student.course,
      `${student.currentYear}/${student.totalYears}`,
      `KES ${student.feeBalance.toLocaleString()}`,
      student.results[student.results.length - 1]?.gpa?.toFixed(1) || "N/A",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [27, 94, 32] },
  });

  doc.save("schupa_students.pdf");
}
