const TaskDescriptionPopup = ({
    showDescriptionPopup, currentTask, CircleDot, textareaRef, editData, handleInput, CircleStop,
    setEditData, Calendar, setShowDatePicker, showDatePicker, Flag, TaskPriority, Users, TaskEmployees,
    ClockFading, TaskTimeline, TaskDetails, X, handleClosePopup, CommentsSection, handleAddComment,
    setCommentText, commentText, setCommentEmployees, SendHorizontal, getStatusColor, SmartDatePicker,
    employees, timelineArray, commentEmployees, Input, currentUser
}) => {

    return (
        <>
            {showDescriptionPopup && currentTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded p-6 w-[90%] h-[90vh] shadow-lg relative overflow-y-auto max-w-[90%]">
                        <div className="w-full mx-auto flex justify-between h-[100%] border border-gray-300">
                            <div className="w-[70%] border-r border-gray-400 p-[40px] overflow-auto scrollbar-hide">
                                <h2 className="mb-4 text-gray-500 font-light inline-flex gap-[5px] items-center justify-center text-[16px] p-[5px] w-[80px] border border-gray-300 rounded-md">
                                    <CircleDot size={12} /> Task
                                </h2>
                                <textarea
                                    ref={textareaRef}
                                    className="w-full rounded px-2 py-1 mb-4 text-[25px] border-gray-400 outline-none focus:ring-1 focus:ring-gray-200 resize-none overflow-hidden"
                                    value={editData.title}
                                    onChange={handleInput}
                                    rows={1}
                                    placeholder="Enter text..."
                                />

                                <div className="text-[14px]">
                                    <div className="flex items-center gap-[50px] mb-4">
                                        <span className="flex items-center gap-[5px] min-w-[150px]">
                                            <CircleStop size={16} />
                                            <span className="font-medium text-gray-700">
                                                Status
                                            </span>
                                        </span>
                                        <span
                                            className={`px-2 py-1 rounded text-sm font-semibold uppercase ${getStatusColor(editData.status || "")}`}
                                        >
                                            {editData.status || "-"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-[50px] mb-4 date-popup">
                                        <span className="flex items-center gap-[5px] min-w-[150px]">
                                            <Calendar size={16} />
                                            <span className="font-medium text-gray-700">
                                                Dates
                                            </span>
                                        </span>
                                        <div className="relative date-filter">
                                            <div
                                                className="w-full border rounded px-2 py-1 cursor-pointer hover:bg-gray-50"
                                                onClick={() => setShowDatePicker("edit")}
                                            >
                                                {editData.dueDate
                                                    ? new Date(editData.dueDate).toLocaleDateString()
                                                    : "Select due date"}
                                            </div>
                                            {showDatePicker === "edit" && (
                                                <SmartDatePicker
                                                    open={true}
                                                    setOpen={() => setShowDatePicker(null)}
                                                    selected={
                                                        editData.dueDate
                                                            ? new Date(editData.dueDate)
                                                            : null
                                                    }
                                                    setSelected={(d) => {
                                                        setEditData((prev) => ({
                                                            ...prev,
                                                            dueDate: d,
                                                        }));
                                                        setShowDatePicker(null);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[50px] mb-4">
                                        <span className="flex items-center gap-[5px] min-w-[150px]">
                                            <Flag size={16} />
                                            <span className="font-medium text-gray-700">
                                                Priority
                                            </span>
                                        </span>
                                        <div className="relative">
                                            <TaskPriority
                                                value={editData.priority}
                                                onChange={(level) =>
                                                    setEditData((d) => ({
                                                        ...d,
                                                        priority: level,
                                                    }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[50px] mb-4">
                                        <span className="flex items-center gap-[5px] min-w-[150px]">
                                            <Users size={16} />
                                            <span className="font-medium text-gray-700">
                                                Assigned
                                            </span>
                                        </span>
                                        <div className="relative flex items-center gap-[10px]">
                                            <TaskEmployees
                                                selected={editData.assignedEmployees}
                                                onChange={(arr) =>
                                                    setEditData((d) => ({
                                                        ...d,
                                                        assignedEmployees: arr,
                                                    }))
                                                }
                                                employees={employees}
                                            />
                                            {editData.assignedEmployees
                                                .map(
                                                    (id) =>
                                                        employees.find((e) => e._id === id)?.fullName ||
                                                        employees.find((e) => e._id === id)?.username
                                                )
                                                .filter(Boolean)
                                                .join(", ")}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-[50px] mb-4">
                                        <span className="flex items-center gap-[5px] min-w-[150px]">
                                            <ClockFading size={16} />
                                            <span className="font-medium text-gray-700">
                                                Track time
                                            </span>
                                        </span>
                                        <TaskTimeline
                                            task={{ timeline: timelineArray }}
                                            user={currentUser}
                                            showControls={false}
                                        />
                                    </div>
                                </div>
                                <div className="w-full mx-auto mt-10">
                                    <TaskDetails editData={editData} setEditData={setEditData} user={currentUser} />
                                </div>
                                <button
                                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold transition-colors"
                                    onClick={handleClosePopup}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="w-[30%]">
                                <div className="p-[20px] border-b border-gray-400 text-sm font-medium">
                                    Activity
                                </div>
                                <div className="p-[20px] text-[12px] bg-[#f9f9f9]">
                                    <CommentsSection comments={editData.comments || []} />
                                    <div className="flex gap-2 mt-2">
                                        <Input
                                            type="text"
                                            className="flex-1 outline-none border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                                            placeholder="Add a comment"
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyPress={(e) => {
                                                if (e.key === "Enter") {
                                                    handleAddComment();
                                                }
                                            }}
                                        />
                                        <div>
                                            <TaskEmployees
                                                employees={employees}
                                                selected={commentEmployees}
                                                onChange={(arr) => {
                                                    setCommentEmployees(arr);
                                                }}
                                                className="comment-dropdown"
                                            />
                                        </div>
                                        <button
                                            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors flex justify-center h-[35px] w-[35px]"
                                            onClick={handleAddComment}
                                        >
                                            <SendHorizontal size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TaskDescriptionPopup;
