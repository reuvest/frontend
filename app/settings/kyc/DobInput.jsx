"use client";

import { useState, useEffect, useMemo } from "react";
import { selectCls } from "./constants";

export default function DobInput({ value, onChange }) {
  const currentYear = new Date().getFullYear();
  const years  = Array.from({ length: 100 }, (_, i) => currentYear - 18 - i);
  const months = [
    { value: "01", label: "January"  }, { value: "02", label: "February" },
    { value: "03", label: "March"    }, { value: "04", label: "April"    },
    { value: "05", label: "May"      }, { value: "06", label: "June"     },
    { value: "07", label: "July"     }, { value: "08", label: "August"   },
    { value: "09", label: "September"}, { value: "10", label: "October"  },
    { value: "11", label: "November" }, { value: "12", label: "December" },
  ];

  const [year,  setYear]  = useState(value ? value.split("-")[0] : "");
  const [month, setMonth] = useState(value ? value.split("-")[1] : "");
  const [day,   setDay]   = useState(value ? value.split("-")[2] : "");

  const daysInMonth = useMemo(() => {
    if (!year || !month) return 31;
    return new Date(Number(year), Number(month), 0).getDate();
  }, [year, month]);

  const days = Array.from({ length: daysInMonth }, (_, i) =>
    String(i + 1).padStart(2, "0")
  );

  useEffect(() => {
    if (day && Number(day) > daysInMonth)
      setDay(String(daysInMonth).padStart(2, "0"));
  }, [daysInMonth, day]);

  useEffect(() => {
    if (year && month && day) onChange(`${year}-${month}-${day}`);
    else onChange("");
  }, [year, month, day]);

  const sel = selectCls + " text-sm";

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        <select value={day} onChange={e => setDay(e.target.value)} className={sel}>
          <option value="" className="bg-[#0D1F1A]">Day</option>
          {days.map(d => (
            <option key={d} value={d} className="bg-[#0D1F1A]">{Number(d)}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select value={month} onChange={e => setMonth(e.target.value)} className={sel}>
          <option value="" className="bg-[#0D1F1A]">Month</option>
          {months.map(m => (
            <option key={m.value} value={m.value} className="bg-[#0D1F1A]">{m.label}</option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select value={year} onChange={e => setYear(e.target.value)} className={sel}>
          <option value="" className="bg-[#0D1F1A]">Year</option>
          {years.map(y => (
            <option key={y} value={String(y)} className="bg-[#0D1F1A]">{y}</option>
          ))}
        </select>
      </div>
    </div>
  );
}