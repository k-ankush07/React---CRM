import { useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { addDays, addWeeks, startOfWeek, format } from "date-fns";
import { Calendar } from "lucide-react";

export default function SmartDatePicker({ open, setOpen, selected, setSelected, }) {
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("pointerdown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [open, setOpen]);

  const shortcuts = [
    { label: "Today", value: new Date() },
    { label: "Tomorrow", value: addDays(new Date(), 1) },
    { label: "This weekend", value: addDays(new Date(), 6 - new Date().getDay()) },
    { label: "Next week", value: addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), 1) },
    { label: "2 weeks", value: addWeeks(new Date(), 2) },
    { label: "4 weeks", value: addWeeks(new Date(), 4) },
  ];

  return (
    <div className="relative inline-flex">
      <div onClick={() => setOpen(!open)} >
        {selected ? (
          <span className="text-white text-[14px] date-formatess">{format(selected, "dd MMM yyyy")}</span>
        ) : (
          <div className="cursor-pointer text-gray-600 border border-gray-300 rounded p-[2px] bg-white">
            <Calendar size={18} className="text-gray-500" />
          </div>
        )}
      </div>
      {open && (
        <div
          ref={pickerRef}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-full mt-2 left-[-200px] bg-white shadow-xl border rounded-lg z-50 flex text-[14px] calender-container"
        >
          <div className="w-40 border-r">
            {shortcuts.map((s) => (
              <div
                key={s.label}
                className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  setSelected(s.value);
                  setOpen(false);
                }}
              >
                {s.label}
              </div>
            ))}
          </div>

          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(date) => {
              setSelected(date);
              setOpen(false);
            }}
            disabled={{ before: new Date() }}
          />
        </div>
      )}
    </div>
  );
}
