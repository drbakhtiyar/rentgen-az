"use client";

import * as React from "react";
import { Select } from "@/components/ui/field";

// Native <input type="date"> renders in the browser/OS locale (often Russian
// here), which we can't control. Three Azerbaijani dropdowns guarantee AZ.
const MONTHS_AZ = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avqust", "sentyabr", "oktyabr", "noyabr", "dekabr",
];

export function BirthDatePicker({
  name = "birthDate",
  defaultValue,
}: {
  name?: string;
  defaultValue?: string;
}) {
  const init = (defaultValue ?? "").slice(0, 10); // "YYYY-MM-DD"
  const [y0, m0, d0] = init ? init.split("-") : ["", "", ""];
  const [day, setDay] = React.useState(d0 ? String(Number(d0)) : "");
  const [month, setMonth] = React.useState(m0 ? String(Number(m0)) : "");
  const [year, setYear] = React.useState(y0 || "");

  const value =
    day && month && year
      ? `${year}-${String(Number(month)).padStart(2, "0")}-${String(Number(day)).padStart(2, "0")}`
      : "";

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 1920; y--) years.push(y);

  return (
    <div className="grid grid-cols-3 gap-2">
      <Select value={day} onChange={(e) => setDay(e.target.value)} aria-label="Gün">
        <option value="">Gün</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </Select>
      <Select value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Ay">
        <option value="">Ay</option>
        {MONTHS_AZ.map((m, i) => (
          <option key={i} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
      <Select value={year} onChange={(e) => setYear(e.target.value)} aria-label="İl">
        <option value="">İl</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
