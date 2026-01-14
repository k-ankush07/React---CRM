import { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, ChevronDown } from "lucide-react";
import moment from "moment";
import { Input } from "./Input";
import { Button } from "./Button";

const options = [
    { label: "Day", value: "day" },
    { label: "Week", value: "week" },
    { label: "Month", value: "month" },
    { label: "4 Days", value: "work_week" },
];

export default function ProjectCalendar({
    project,
    activeProjectId,
    getStatusColor
}) {
    const [view, setView] = useState("month");
    const [date, setDate] = useState(moment());
    const [expandedDays, setExpandedDays] = useState({});
    const [popupDay, setPopupDay] = useState(null);
    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
    const [open, setOpen] = useState(false);

    const activeProject = project?.find(p => p._id === activeProjectId);
    const popupRef = useRef(null);
    const dropdownRef = useRef(null);

    /* ---------------- EVENTS ---------------- */
    const events = useMemo(() => {
        if (!activeProject?.statusTask) return [];
        return Object.values(activeProject.statusTask)
            .flat()
            .filter(t => t.dueDate)
            .map(t => ({ ...t, date: moment(t.dueDate) }));
    }, [activeProject]);

    /* ---------------- DAYS ---------------- */
    const calendarDays = useMemo(() => {
        let days = [];

        if (view === "month") {
            const start = date.clone().startOf("month").startOf("week");
            const end = date.clone().endOf("month").endOf("week");
            let d = start.clone();
            while (d.isSameOrBefore(end, "day")) {
                days.push(d.clone());
                d.add(1, "day");
            }
        }

        if (view === "week") {
            const start = date.clone().startOf("week");
            for (let i = 0; i < 7; i++) days.push(start.clone().add(i, "day"));
        }

        if (view === "work_week") {
            for (let i = 0; i < 4; i++) days.push(date.clone().add(i, "day"));
        }

        if (view === "day") days.push(date.clone());

        return days;
    }, [view, date]);

    /* ---------------- HOURS ---------------- */
    const hours = useMemo(
        () => Array.from({ length: 24 }, (_, i) =>
            moment().startOf("day").add(i, "hour")
        ),
        []
    );

    /* ---------------- NAV ---------------- */
    const handleNavigate = dir => {
        if (dir === "TODAY") return setDate(moment());

        const map = {
            month: [1, "month"],
            week: [7, "day"],
            work_week: [4, "day"],
            day: [1, "day"]
        };

        setDate(d =>
            d.clone()[dir === "NEXT" ? "add" : "subtract"](...map[view])
        );
    };

    const toggleDay = key => {
        setExpandedDays(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const cols =
        view === "day" ? 1 : view === "work_week" ? 4 : view === "month" ? 7 : 7;

    const handlePlusClick = (e, dayKey) => {
        setPopupDay(dayKey);

        setPopupPosition({ top: e.clientY, left: e.clientX });
    };

    useLayoutEffect(() => {
        if (popupDay && popupRef.current) {
            const rect = popupRef.current.getBoundingClientRect();

            let left = popupPosition.left;
            let top = popupPosition.top;

            if (left + rect.width > window.innerWidth) {
                left = window.innerWidth - rect.width - 10;
            }

            if (top + rect.height > window.innerHeight) {
                top = window.innerHeight - rect.height - 10;
            }

            setPopupPosition({ top, left });
        }
    }, [popupDay]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                setPopupDay(null);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    if (!activeProject) {
        return (
            <div className="h-[60vh] flex items-center justify-center text-gray-500">
                No tasks found
            </div>
        );
    }

    return (
        <div className="bg-white rounded shadow p-4">

            {/* ---------- HEADER ---------- */}
            <div className="flex gap-4 items-center mb-4">
                <div className="flex gap-2">
                    <div
                        className="px-3 py-1 bg-white rounded hover:bg-gray-200 text-sm cursor-pointer font-medium"
                        onClick={() => handleNavigate("TODAY")}
                    >
                        Today
                    </div>

                    <div className="relative w-32" ref={dropdownRef}>
                        <div
                            onClick={() => setOpen(!open)}
                            className="w-full px-3 py-1 cursor-pointer border border-gray-300 rounded text-sm font-medium text-left flex justify-between items-center"
                        >
                            {options.find((opt) => opt.value === view)?.label}
                            <ChevronDown size={18} />
                        </div>

                        {open && (
                            <ul className="absolute w-full mt-1 bg-white border border-gray-300 rounded shadow z-10">
                                {options.map((opt) => (
                                    <li
                                        key={opt.value}
                                        onClick={() => {
                                            setView(opt.value);
                                            setOpen(false);
                                        }}
                                        className="px-3 py-1 hover:bg-gray-100 cursor-pointer"
                                    >
                                        {opt.label}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 text-gray-700 font-medium text-sm">
                    <div
                        className="rounded hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleNavigate("PREV")}
                    >
                        <ChevronLeft size={18} />
                    </div>
                    <div
                        className="rounded hover:bg-gray-200 cursor-pointer"
                        onClick={() => handleNavigate("NEXT")}
                    >
                        <ChevronRight size={18} />
                    </div>
                    <span className="font-medium">
                        {view === "day"
                            ? date.format("DD MMM YYYY")
                            : view === "week"
                                ? `${date.clone().startOf("week").format("DD MMM")} - ${date
                                    .clone()
                                    .endOf("week")
                                    .format("DD MMM YYYY")}`
                                : date.format("MMMM YYYY")}
                    </span>
                </div>
            </div>

            {view === "month" && (
                <>
                    <div className="grid grid-cols-7 bg-gray-50 border text-xs">
                        {moment.weekdays().map(d => (
                            <div key={d} className="py-2 text-center border-r last:border-r-0">
                                {d}
                            </div>
                        ))}
                    </div>


                    <div className="grid grid-cols-7 border">
                        {calendarDays.map(day => {
                            const key = day.format("YYYY-MM-DD");
                            const dayEvents = events.filter(ev => ev.date.isSame(day, "day"));
                            const isToday = day.isSame(moment(), "day");

                            return (
                                <div
                                    key={key}
                                    className={`p-2 min-h-[120px] border-r border-b relative group
                        ${day.month() !== date.month() ? "bg-gray-50 text-gray-400" : ""}
                         ${isToday ? "ring-2 ring-blue-500 bg-white rounded-[5px]" : ""}`}
                                >
                                    <div className="text-xs font-medium absolute right-[5px] bottom-[5px]">
                                        {day.date()}
                                    </div>
{/* 
                                    <div
                                        className={`bg-[#513dc2] cursor-pointer inline-flex rounded-[4px] p-[3px] absolute right-[30px] bottom-[5px] 
                                  transition-opacity duration-200
                              ${popupDay === key ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}
                                        onClick={(e) => handlePlusClick(e, key)}
                                    >
                                        <Plus size={14} color="white" />
                                    </div> */}
                                    <div className="mt-2 space-y-1">
                                        {(expandedDays[key] ? dayEvents : dayEvents.slice(0, 4)).map((ev, idx) => (
                                            <div key={idx} className={`text-[11px] px-1 py-0.5 rounded truncate ${getStatusColor(ev.status)}`}>
                                                {ev.title}
                                            </div>
                                        ))}

                                        {dayEvents.length > 4 && (
                                            <button
                                                onClick={() => toggleDay(key)}
                                                className="text-[11px] text-blue-600 hover:underline"
                                            >
                                                {expandedDays[key] ? "Show less" : `+${dayEvents.length - 4} more`}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* {popupDay && (
                        <div
                            ref={popupRef}
                            className="fixed  p-3 bg-white shadow-lg rounded border z-50"
                            style={{
                                top: popupPosition.top,
                                left: popupPosition.left,
                                maxWidth: "400px",
                                width: "min(90vw, 400px)"
                            }}
                        >
                            <Input
                                type="text"
                                placeholder="Task Name or type '/' for commands"
                                className="w-full border rounded px-2 py-1 text-[12px] popup-text"
                                style={{ boxShadow: "none", outline: "none", border: "none", fontSize: "14px", }}
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-500">

                            </div>
                            <Button className="popup-text mt-2 bg-[#9b98fd] text-white text-[12px]  rounded hover:bg-[#6049e7]">
                                Save
                            </Button>
                        </div>
                    )} */}
                </>
            )}

            {view !== "month" && (
                <div
                    style={{ "--cols": cols }}
                    className="border rounded overflow-hidden"
                >

                    <div className="grid grid-cols-[80px_repeat(var(--cols),1fr)] bg-gray-50 border-b">
                        <div />
                        {calendarDays.map(day => (
                            <div key={day.format()} className="p-2 border-l">
                                <div className="text-sm font-medium">
                                    {day.format("dddd")}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {day.format("D MMM")}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-[80px_repeat(var(--cols),1fr)] border-b">
                        <div className="text-xs p-2 text-gray-500">All day</div>

                        {calendarDays.map(day => {
                            const key = day.format("YYYY-MM-DD");
                            const dayEvents = events.filter(ev =>
                                ev.date.isSame(day, "day")
                            );

                            const visibleEvents = expandedDays[key]
                                ? dayEvents
                                : dayEvents.slice(0, 4);

                            return (
                                <div
                                    key={key}
                                    className="p-1 space-y-1 border-l min-h-[48px] truncate"
                                >
                                    {visibleEvents.map((ev, idx) => (
                                        <div
                                            key={idx}
                                            className={`text-xs px-2 py-1 rounded truncate ${getStatusColor(
                                                ev.status
                                            )}`}
                                        >
                                            {ev.title}
                                        </div>
                                    ))}

                                    {dayEvents.length > 4 && (
                                        <button
                                            onClick={() => toggleDay(key)}
                                            className="text-[11px] text-blue-600 hover:underline"
                                        >
                                            {expandedDays[key]
                                                ? "Show less"
                                                : `+${dayEvents.length - 4} more`}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="h-[70vh] overflow-y-auto">
                        <div className="grid grid-cols-[80px_repeat(var(--cols),1fr)]">
                            {hours.map(hour => (
                                <>
                                    <div
                                        key={hour.format()}
                                        className="text-xs text-right pr-2 py-6 border-b text-gray-400"
                                    >
                                        {hour.format("ha")}
                                    </div>

                                    {calendarDays.map(day => (
                                        <div
                                            key={day.format() + hour.format()}
                                            className="border-l border-b h-[66px]"
                                        />
                                    ))}
                                </>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
