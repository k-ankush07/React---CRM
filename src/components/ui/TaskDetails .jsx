const TaskDetails = ({ editData, setEditData }) => {
    if (!editData?.description) return null;
    console.log("editData on render:", editData);
    return (
        <div className="w-full mx-auto mt-10">
            <h3 className="text-sm mb-2 font-medium">Task Details</h3>

            <div className="mb-4 space-y-4">
                {["storeLink", "referenceLink", "figmaLink"].map((key) => (
                    <div key={key}>
                        <label className="text-gray-600 text-sm flex items-center gap-2">
                            {key !== "storeLink" && (
                                <input
                                    type="checkbox"
                                    className="h-4 w-4"
                                    checked={editData.description[0]?.[`${key}Enabled`] || false}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setEditData((prev) => ({
                                            ...prev,
                                            description: prev.description.map((desc, dIdx) =>
                                                dIdx === 0 ? { ...desc, [`${key}Enabled`]: checked } : desc
                                            ),
                                        }));
                                    }}
                                />
                            )}
                            {key === "storeLink"
                                ? "Store Link"
                                : key === "referenceLink"
                                    ? "Reference Link"
                                    : "Figma Link"}
                        </label>
                        <input
                            type="text"
                            className="w-full border rounded px-2 py-1 text-[14px]"
                            placeholder={`Enter ${key === "storeLink" ? "store" : key === "referenceLink" ? "reference" : "Figma"
                                } link...`}
                            value={editData.description[0]?.[key] || ""}
                            // For storeLink, always enabled
                            disabled={key !== "storeLink" && editData.description[0]?.[`${key}Enabled`] || false}
                            onChange={(e) => {
                                const value = e.target.value;
                                setEditData((prev) => ({
                                    ...prev,
                                    description: prev.description.map((desc, dIdx) =>
                                        dIdx === 0 ? { ...desc, [key]: value } : desc
                                    ),
                                }));
                            }}
                        />
                    </div>
                ))}

                <div>
                    <label className="text-gray-600 text-sm mb-1 block">Task Description</label>
                    {(editData.description[0]?.taskdescription || []).map((desc, idx) => (
                        <div key={idx} className="flex gap-2 items-center mb-2">
                            <input
                                type="text"
                                className="flex-1 border rounded px-2 py-1 text-[14px]"
                                value={desc.value}
                                placeholder="Enter task description..."
                                disabled={desc.enabled}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setEditData((prev) => ({
                                        ...prev,
                                        description: prev.description.map((d, dIdx) =>
                                            dIdx === 0
                                                ? {
                                                    ...d,
                                                    taskdescription: d.taskdescription.map((t, i) =>
                                                        i === idx ? { ...t, value } : t
                                                    ),
                                                }
                                                : d
                                        ),
                                    }));
                                }}
                            />
                            <button
                                type="button"
                                className="px-2 py-1 bg-red-500 text-white rounded text-[12px] h-fit"
                                onClick={() => {
                                    setEditData((prev) => ({
                                        ...prev,
                                        description: prev.description.map((d, dIdx) =>
                                            dIdx === 0
                                                ? { ...d, taskdescription: d.taskdescription.filter((_, i) => i !== idx) }
                                                : d
                                        ),
                                    }));
                                }}
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-[13px]"
                        onClick={() => {
                            setEditData((prev) => ({
                                ...prev,
                                description: prev.description.map((d, dIdx) =>
                                    dIdx === 0
                                        ? { ...d, taskdescription: [...(d.taskdescription || []), { value: "", enabled: false }] }
                                        : d
                                ),
                            }));
                        }}
                    >
                        Add Description
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;
