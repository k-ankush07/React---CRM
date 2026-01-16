import React, { useState, useEffect } from "react";
import DateRangePicker from "./DateRangePicker";
import moment from "moment";
import TaskEmployees from "./TaskEmployees";
import TaskTimeline from "./TaskTimeline ";

export default function TeamDetialis({ project, activeProjectId, user }) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tick, setTick] = useState(0);
  const activeProject = project?.find((p) => p._id === activeProjectId);
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return {
      startDate: today,
      endDate: today,
    };
  });

  const getFilteredTasks = () => {
    if (!activeProject?.statusTask) return {};
    const filtered = {};

    Object.entries(activeProject.statusTask).forEach(([status, tasks]) => {
      filtered[status] = tasks.filter((task) => {
        if (!dateRange) return true;
        const created = moment(task.createdAt);
        return (
          created.isSameOrAfter(moment(dateRange.startDate), "day") &&
          created.isSameOrBefore(moment(dateRange.endDate), "day")
        );
      });
    });

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const { totalTasks, totalTime } = (() => {
    let tasksCount = 0;
    let totalSeconds = 0;

    Object.values(filteredTasks).forEach((tasks) => {
      tasksCount += tasks.length;

      tasks.forEach((task) => {
        if (task.timeline?.length) {
          task.timeline.forEach((entry) => {
            const start = entry.startTime ? moment(entry.startTime) : null;
            const end = entry.endTime ? moment(entry.endTime) : moment();
            if (start && end) {
              totalSeconds += end.diff(start, "seconds");
            }
          });
        }
      });
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      totalTasks: tasksCount,
      totalTime: `${hours}h ${minutes}m ${seconds}s`
    };
  })();

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4">
      <div className="absolute right-[20px] top-[65px]">
        <div
          className="cursor-pointer border px-3 py-2 rounded-md text-sm bg-white"
          onClick={() => setShowDatePicker(true)}
        >
          {`${moment(dateRange.startDate).format("DD-MM-YYYY")} → ${moment(
            dateRange.endDate
          ).format("DD-MM-YYYY")}`}
        </div>

        <DateRangePicker
          open={showDatePicker}
          selectedRange={dateRange}
          onApply={(range) => {
            setDateRange(range);
            setShowDatePicker(false);
          }}
        />
      </div>

      <div className="flex px-3 py-2 mt-[20px] rounded-md font-medium text-gray-500 text-[14px] bg-gray-100">
        <div className="w-2/5">Projects</div>
        <div className="w-1/5">Assigned</div>
        <div className="w-1/5">Due Date</div>
        <div className="w-1/5">Timer</div>
        <div className="w-1/5">Status</div>
      </div>

      <div className="mt-2">
        {Object.keys(filteredTasks).length === 0 && (
          <div className="text-gray-500 text-sm p-3">No tasks found.</div>
        )}

        {Object.entries(filteredTasks).map(([status, tasks]) =>
          tasks.map((task) => (
            <div
              key={task._id}
              className="flex px-3 py-2 items-center text-sm text-gray-700 border-b bg-white hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="w-2/5 cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-gray-800 hover:text-blue-700 hover:underline transition-colors duration-200">
                {task.title}
              </div>
              <div className="w-1/5">
                <TaskEmployees
                  selected={task.assignedEmployees?.map((e) => e._id) || []}
                  employees={task.assignedEmployees || []}
                  showDropdown={false}
                  onChange={() => { }}
                />
              </div>
              <div className="w-1/5">
                {task.dueDate ? moment(task.dueDate).format("DD-MM-YYYY") : "-"}
              </div>
              <div className="w-1/5">
                <TaskTimeline task={task} user={user} showControls={false} />
              </div>
              <div className="w-1/5 capitalize">{status}</div>
            </div>
          ))
        )}
      </div>

      <div className="fixed bottom-0 left-[260px] right-0 bg-gray-50 text-gray-700 px-4 py-[24px] font-semibold border-t z-50 flex justify-between">
        <span>Total Tasks: {totalTasks}</span>
        <span>Total Time: {totalTime}</span>
      </div>
    </div>
  );
}
