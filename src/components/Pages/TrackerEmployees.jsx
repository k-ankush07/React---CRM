import { useState, useEffect } from "react";
import { useUserDetails } from "../Use-auth";
import { format } from "date-fns";
import MonthlyCalendar from "../ui/MonthlyCalendar";
import { useDateRange } from "./DateRangeContext";
import RoleBasedLayout from "./RoleBasedLayout";

function formatMinutes(minutes = 0) {
  if (!minutes || minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours} hr` : `${hours} hr ${mins} min`;
}

// Hook to calculate live minutes for an active session
function useLiveTime(startTime, endTime) {
  const [time, setTime] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (endTime) return;

    function update() {
      const start = new Date(startTime);
      const now = new Date();
      const diffMs = now - start;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      setTime({ minutes, seconds });
    }

    update(); // run immediately
    const interval = setInterval(update, 1000); // every second
    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return time;
}

// Session Card
function SessionCard({ session }) {
  const liveTime = useLiveTime(session.startTime, session.endTime);

  return (
    <div className="border border-gray-300 rounded-lg p-4 mb-3 bg-white shadow-sm hover:shadow-md transition">

      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600 font-medium">Login:</span>
        <span className="text-gray-800">
          {format(new Date(session.startTime), "HH:mm:ss EEEE dd MMM yyyy")}
        </span>
      </div>

      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600 font-medium">Logout:</span>
        <span className="text-gray-800">
          {session.endTime
            ? format(new Date(session.endTime), "HH:mm:ss EEEE dd MMM yyyy")
            : "Active"}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-gray-600 font-medium">Duration:</span>
        <span className="text-blue-600">
          {session.endTime
            ? formatMinutes(session.durationMinutes ?? 0)
            : `${liveTime.minutes} min ${liveTime.seconds}s (Active)`}
        </span>
      </div>
    </div>
  );
}

// Employees Component
export default function Employees() {
  const { start, end } = useDateRange();
  const { data: entries } = useUserDetails();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openUserId, setOpenUserId] = useState(null);

  const handleSelectDate = (date) => setSelectedDate(date);

  const employees =
    entries?.filter(entry => {
      if (entry.role !== "employee") return false;

      const workDate = new Date(entry.workDate);
      return (
        workDate >= start &&
        workDate <= end &&
        workDate.toDateString() === selectedDate.toDateString()
      );
    }) || [];

  const groupedByDate = employees.reduce((acc, employee) => {
    const date = format(new Date(employee.workDate), "EEEE dd MMM yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(employee);
    return acc;
  }, {});

  const allEmployees =
    entries?.filter(entry => {
      if (entry.role !== "employee") return false;

      const workDate = new Date(entry.workDate);
      return workDate >= start && workDate <= end;
    }) || [];

  const allGroupedByDate = allEmployees.reduce((acc, employee) => {
    const date = format(new Date(employee.workDate), "EEEE dd MMM yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(employee);
    return acc;
  }, {});

  function calculateUniqueMinutes(sessions = [], workDate) {
    if (!sessions.length) return 0;

    const isToday =
      new Date(workDate).toDateString() === new Date().toDateString();

    const ranges = sessions
      .map(s => {
        const start = new Date(s.startTime).getTime();

        let end;
        if (s.endTime) {
          end = new Date(s.endTime).getTime();
        } else if (isToday) {
          end = Date.now();
        } else {
          return null;
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
    return Math.floor(total / 60000);
  }

  return (
    <RoleBasedLayout>
      <div className="relative h-[90.7vh] overflow-hidden">
        <div className="absolute w-full h-[100%] opacity-[0.2] bg-[url('https://www.hubsyntax.com/uploads/clock-wise.jpeg')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"></div>
        <div className="relative z-20 h-full overflow-y-auto p-6">
          <h2 className="text-[20px] font-semibold mb-4">
            Employees — Time Tracking
          </h2>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <p className="text-gray-600 font-medium mb-3">
                Showing records for:{" "}
                <span className="font-semibold text-blue-600">
                  {format(selectedDate, "EEEE, dd MMM yyyy")}
                </span>
              </p>

              {Object.keys(groupedByDate).length > 0 ? (
                Object.keys(groupedByDate).map((date) => (
                  <div key={date} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                      {date}
                    </h3>

                    {groupedByDate[date].map((emp) => {
                      const isActive = selectedEmployeeId === emp.userId;
                     const totalWorked = calculateUniqueMinutes(emp.sessions, emp.workDate);


                      return (
                        <div key={emp.userId}>
                          <div
                            className={`border rounded p-4 mb-3 bg-white shadow-sm cursor-pointer transition
                              ${isActive
                                ? "border-blue-500 shadow-md"
                                : "border-gray-300 hover:shadow-md hover:border-blue-400"
                              }`}
                            onClick={() =>
                              setSelectedEmployeeId(
                                isActive ? null : emp.userId
                              )
                            }
                          >
                            <p className="font-semibold text-gray-800">
                              {emp.username}
                            </p>
                            <p className="text-gray-600 text-sm">
                              User ID: {emp.userId}
                            </p>
                          </div>

                          <div
                            className={`overflow-hidden transition-all duration-500 ${isActive ? "max-h-[1000px]" : "max-h-0"
                              }`}
                          >
                            <div className="mb-[12px] p-4 border border-gray-300 rounded bg-gray-50 shadow max-h-[300px] overflow-y-auto">
                              <div className="border border-gray-300 rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-600 font-medium">
                                    Username:
                                  </span>
                                  <span className="text-gray-800 ">
                                    {emp.username}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600 font-medium">
                                    Total Worked:
                                  </span>
                                  <span className="text-blue-600 ">
                                    {formatMinutes(totalWorked)}
                                  </span>
                                </div>
                              </div>

                              <div className="mt-3">
                                <h4 className="mb-2 font-semibold">
                                  Sessions
                                </h4>

                                {emp.sessions?.map((s, i) => (
                                  <SessionCard key={i} session={s} />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">
                  No records found for this date.
                </p>
              )}
            </div>

            <div className="calendar-wrapper">
              <MonthlyCalendar onSelectDate={handleSelectDate} />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-[18px] font-semibold mb-3">All Tracked Days</h2>
            {Object.keys(allGroupedByDate).length > 0 ? (
              Object.keys(allGroupedByDate).map(date => (
                <div key={date} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-800">{date}</h3>

                  {allGroupedByDate[date].map(emp => {
                    const totalWorked = calculateUniqueMinutes(emp.sessions, emp.workDate);
                    const key = `${date}_${emp.userId}`;

                    return (
                      <div key={key}>
                        <div
                          className={`border rounded p-4 mb-3 bg-white shadow-sm cursor-pointer transition
                          ${openUserId === key
                              ? "border-blue-500 shadow-md"
                              : "border-gray-300 hover:border-blue-400 hover:shadow-md"
                            }`}
                          onClick={() =>
                            setOpenUserId(openUserId === key ? null : key)
                          }
                        >
                          <p className="font-semibold text-gray-800">
                            {emp.username} — {key}
                          </p>
                        </div>

                        <div
                          className={`overflow-hidden transition-all duration-500 
                        ${openUserId === key ? "max-h-[1000px]" : "max-h-0"}
                        `}
                        >
                          <div className="border rounded p-4 mb-3 bg-gray-50 shadow max-h-[400px] overflow-y-auto">
                            <p className="text-blue-600 font-medium">
                              Total Worked: {formatMinutes(totalWorked)}
                            </p>
                            <div className="mt-2">
                              {emp.sessions?.map((s, i) => (
                                <SessionCard key={i} session={s} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No tracked records.</p>
            )}
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
}
