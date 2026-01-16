import { useEffect, useState } from "react";
import EmployeeLayout from "../EmployeeLayout";
import { useUserDetails, useUser } from "../../Use-auth";
import MonthlyCalendar from "../../ui/MonthlyCalendar";

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function TimeTracker() {
  const { data: user } = useUser();
  const { data: entries } = useUserDetails();
  const [now, setNow] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectDate = (date) => setSelectedDate(date);

  // All entries of the user
  const userEntries =
    entries?.filter(entry => entry.userId === user?.userId) || [];

  // Filter by WORK DATE (not createdAt)
  const filteredEntries = userEntries.filter(entry => {
    const workDate = new Date(entry.workDate);
    return workDate.toDateString() === selectedDate.toDateString();
  });

  function isSameDay(a, b) {
    return a.toDateString() === b.toDateString();
  }

  function calculateUniqueMs(sessions = [], workDate, now = new Date()) {
    if (!sessions.length) return 0;

    const isToday = isSameDay(new Date(workDate), new Date());

    const ranges = sessions
      .map(s => {
        const start = new Date(s.startTime).getTime();

        let end;
        if (s.endTime) {
          end = new Date(s.endTime).getTime();
        } else if (isToday) {
          end = now.getTime(); // ✅ only today is live
        } else {
          return null; // ❌ ignore broken past sessions
        }

        return { start, end };
      })
      .filter(Boolean)
      .sort((a, b) => a.start - b.start);

    if (!ranges.length) return 0;

    let total = 0;
    let currentStart = ranges[0].start;
    let currentEnd = ranges[0].end;

    for (let i = 1; i < ranges.length; i++) {
      const { start, end } = ranges[i];

      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        total += currentEnd - currentStart;
        currentStart = start;
        currentEnd = end;
      }
    }

    total += currentEnd - currentStart;
    return total;
  }

  return (
    <EmployeeLayout>
      <div className="relative h-[90.7vh] overflow-hidden">
        <div
          className="absolute w-full h-[100%] opacity-[0.2] bg-[url('https://www.hubsyntax.com/uploads/clock-wise.jpeg')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
        >
        </div>
        <div className="relative z-20 h-full overflow-y-auto p-6">
          <h2 className="text-[20px] font-semibold mb-4">Time Tracker</h2>

          <div className="flex flex-col md:flex-row gap-6  z-[9999]">

            {/* LEFT SIDE */}
            <div className="flex-1 space-y-8">

              {/* ================= TOP SECTION — FILTERED ================= */}
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Selected Date Summary
                </h3>

                {filteredEntries.length > 0 ? (
                  filteredEntries.map(entry => {
                    const formattedDate = new Date(entry.workDate)
                      .toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                      .replace(/,/g, "");

                    const totalMs = calculateUniqueMs(
                      entry.sessions,
                      entry.workDate,
                      now
                    );
                    return (
                      <div key={entry._id} className="border border-[#8bd4f4] rounded p-4">
                        <p className="text-gray-700 font-medium mb-1">
                          {formattedDate}
                        </p>

                        <p className="text-4xl font-bold text-[#35b6ee] tracking-wide">
                          {formatDuration(totalMs)}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">
                    No entries for selected date
                  </p>
                )}
              </div>

              {/* ================= BOTTOM SECTION — ALL DATA ================= */}
              <div>
                <h3 className="text-lg font-semibold mt-6 mb-2">
                  All Tracked Days
                </h3>

                {userEntries.map(entry => {
                  const formattedDate = new Date(entry.workDate)
                    .toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .replace(/,/g, "");

                  const totalMs = calculateUniqueMs(
                    entry.sessions,
                    entry.workDate,
                    now
                  );
                  return (
                    <div key={entry._id} className="border border-[#8bd4f4] rounded p-3 mb-2">
                      <p className="font-medium">{formattedDate}</p>
                      <p className="text-xl font-semibold text-gray-800">
                        {formatDuration(totalMs)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDE CALENDAR */}
            <div className="calendar-wrapper">
              <MonthlyCalendar onSelectDate={handleSelectDate} />
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
