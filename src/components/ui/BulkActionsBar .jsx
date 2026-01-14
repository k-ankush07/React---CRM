import { CircleStop, Copy, Trash } from "lucide-react";
import TaskEmployees from "./TaskEmployees";
import SmartDatePicker from "./SmartDatePicker";

const BulkActionsBar = ({
  allSelectedTasks = [],
  selectedTaskObjects = [],
  statuses = [],
  showStatusDropdown,
  setShowStatusDropdown,
  handleBulkStatusUpdate,
  commonAssignees = [],
  handleBulkAssigneeUpdate,
  employees = [],
  showDatePicker,
  setShowDatePicker,
  bulkDueDate,
  setBulkDueDate,
  handleBulkDateUpdate,
  handleCopyTasks,
  handleDeleteTasks,
  statusRef
}) => {

  return (
    <div
      className={`
        fixed bottom-4 left-1/2 -translate-x-[40%] w-[100%] max-w-6xl 
        p-3 bg-[#202020] text-white text-[14px] font-light border rounded gap-4
        transition-transform duration-300 ease-in-out
        ${allSelectedTasks.length > 0
          ? "translate-y-0 opacity-100"
          : "translate-y-[120%] opacity-0 pointer-events-none"
        }
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-[14px]">
          {allSelectedTasks.length} Task{allSelectedTasks.length > 1 ? "s" : ""} selected
        </span>

        <div className="flex items-center gap-[10px]" ref={statusRef}>
          {/* Status Dropdown */}
          <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] relative">
            <div
              className="flex items-center gap-[5px]"
              onClick={() => setShowStatusDropdown((prev) => !prev)}
            >
              <CircleStop size={16} />
              <span>Status</span>
            </div>

            {showStatusDropdown && (
              <div className="absolute bottom-full left-0 mb-4 w-32 bg-white border rounded shadow-lg z-50">
                {[...new Set(statuses)].map((status) => {
                  const isActive = selectedTaskObjects.every(
                    (task) => task.status === status
                  );
                  return (
                    <div
                      key={status}
                      className={`px-3 py-2 cursor-pointer text-gray-800 ${
                        isActive ? "bg-[#7df0fd] text-white font-semibold" : ""
                      }`}
                      onClick={() => handleBulkStatusUpdate(status)}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Assignees Dropdown */}
          <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] hover:bg-white hover:bg-opacity-20 rounded transition-colors">
            <TaskEmployees
              selected={commonAssignees}
              onChange={handleBulkAssigneeUpdate}
              employees={employees}
              className="task-dropdown"
            />
          </div>

          {/* Due Date Picker */}
          <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] relative text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors">
            <div className="bulkdate-calender flex">
              <SmartDatePicker
                open={showDatePicker === "bulk"}
                setOpen={(v) => setShowDatePicker(v ? "bulk" : null)}
                selected={bulkDueDate}
                setSelected={(d) => {
                  setBulkDueDate(d);
                  handleBulkDateUpdate(d);
                  setShowDatePicker(null);
                }}
              />
            </div>
          </div>

          <div
            className="px-2 py-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            onClick={handleCopyTasks}
          >
            <Copy size={16} />
          </div>

          <div
            className="px-2 py-1 text-red-600 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            onClick={handleDeleteTasks}
          >
            <Trash size={16} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
