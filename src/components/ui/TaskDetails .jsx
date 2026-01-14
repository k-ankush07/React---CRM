import {
    GripVertical
} from "lucide-react";
import { ReactSortable } from "react-sortablejs";
import { Input } from "./Input";
import { useUpload } from "../Use-auth";
import { useState } from "react";

const TaskDetails = ({ editData, setEditData, user }) => {
    const { mutateAsync: uploadFile, isLoading } = useUpload();
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const isEmployee = user?.role === "employee";

    if (!Array.isArray(editData?.description)) return null;

    const handleFileChange = async (files, index) => {
        const uploadedFiles = [];

        for (const file of files) {
            try {
                const data = await uploadFile(file);
                if (data.success) {
                    uploadedFiles.push({ name: file.name, url: data.url, type: file.type });
                }
            } catch (err) {
                console.error("Upload error:", err);
            }
        }

        setEditData((prev) => {
            const updated = [...prev.description];
            updated[index] = {
                ...updated[index],
                files: [...(updated[index].files || []), ...uploadedFiles],
            };
            return { ...prev, description: updated };
        });
    };

    return (
        <div className="w-full mx-auto mt-10">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
                Task Details
            </h3>
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
                {editData.description.map((desc, index) => (
                    <div
                        key={index}
                        className="bg-white shadow-sm border border-gray-200 rounded-lg p-5 space-y-5"
                    >
                        <div>
                            <label className="text-gray-600 text-sm font-medium block mb-1">
                                Store Link
                            </label>
                            <Input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                value={desc.storeLink || ""}
                                disabled={isEmployee}
                                onChange={(e) =>
                                    setEditData((prev) => {
                                        const updated = [...prev.description];
                                        updated[index] = {
                                            ...updated[index],
                                            storeLink: e.target.value,
                                        };
                                        return { ...prev, description: updated };
                                    })
                                }
                            />
                        </div>

                        {/* Reference Link */}
                        {!(isEmployee && desc.referenceLinkEnabled) && (
                        <div>
                            <label className="flex items-center text-gray-600 text-sm font-medium mb-1">
                                Reference Link
                            </label>
                            <div className="flex items-center">
                                {!isEmployee && (
                                    <input
                                        type="checkbox"
                                        className="mr-2 w-4 h-4"
                                        checked={!!desc.referenceLinkEnabled}
                                        onChange={(e) =>
                                            setEditData((prev) => {
                                                const updated = [...prev.description];
                                                updated[index].referenceLinkEnabled = e.target.checked;
                                                return { ...prev, description: updated };
                                            })
                                        }
                                    />
                                )}

                                <Input
                                    type="text"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm transition focus:outline-none ${desc.referenceLinkEnabled
                                        ? "bg-gray-100 cursor-not-allowed"
                                        : "focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        }`}
                                    value={desc.referenceLink || ""}
                                    disabled={isEmployee || desc.referenceLinkEnabled}
                                    onChange={(e) =>
                                        setEditData((prev) => {
                                            const updated = [...prev.description];
                                            updated[index] = {
                                                ...updated[index],
                                                referenceLink: e.target.value,
                                            };
                                            return { ...prev, description: updated };
                                        })
                                    }
                                />
                            </div>
                        </div>)}

                        {/* Figma Link */}
                       {!(isEmployee && desc.figmaLinkDisabled) && (
                        <div>
                            <label className="flex items-center text-gray-600 text-sm font-medium mb-1">
                                Figma Link
                            </label>
                            <div className="flex items-center">
                                {!isEmployee && (
                                    <input
                                        type="checkbox"
                                        className="mr-2 w-4 h-4"
                                        checked={!!desc.figmaLinkDisabled}
                                        onChange={(e) =>
                                            setEditData((prev) => {
                                                const updated = [...prev.description];
                                                updated[index].figmaLinkDisabled = e.target.checked;
                                                return { ...prev, description: updated };
                                            })
                                        }
                                    />
                                )}
                                <Input
                                    type="text"
                                    className={`w-full border rounded-lg px-3 py-2 text-sm transition focus:outline-none ${desc.figmaLinkDisabled
                                        ? "bg-gray-100 cursor-not-allowed"
                                        : "focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                                        }`}
                                    value={desc.figmaLink || ""}
                                    disabled={isEmployee || desc.figmaLinkDisabled}
                                    onChange={(e) =>
                                        setEditData((prev) => {
                                            const updated = [...prev.description];
                                            updated[index] = {
                                                ...updated[index],
                                                figmaLink: e.target.value,
                                            };
                                            return { ...prev, description: updated };
                                        })
                                    }
                                />
                            </div>
                        </div>)}

                        {/* Task Descriptions */}
                        <div>
                            <label className="text-gray-600 text-sm font-medium block mb-2">
                                Task Description
                            </label>
                            <ReactSortable
                                list={desc.taskdescription || []}
                                setList={(newList) =>
                                    !isEmployee &&
                                    setEditData((prev) => {
                                        const updated = [...prev.description];
                                        updated[index].taskdescription = newList;
                                        return { ...prev, description: updated };
                                    })
                                }
                                handle={isEmployee ? null : ".handle"}
                                disabled={isEmployee}
                            >
                                {(desc.taskdescription || []).map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 mb-2"
                                    >
                                        {!isEmployee && (
                                            <GripVertical size={18} className="handle cursor-grab active:cursor-grabbing" />
                                        )}
                                        <Input
                                            type="text"
                                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                            value={item}
                                            disabled={isEmployee}
                                            onChange={(e) =>
                                                setEditData((prev) => {
                                                    const updated = [...prev.description];
                                                    const taskDesc = [...updated[index].taskdescription];
                                                    taskDesc[i] = e.target.value;
                                                    updated[index] = {
                                                        ...updated[index],
                                                        taskdescription: taskDesc,
                                                    };
                                                    return { ...prev, description: updated };
                                                })
                                            }
                                        />
                                        {!isEmployee && (
                                            <button
                                                type="button"
                                                className="px-3 py-1 text-red-600 font-medium rounded hover:bg-red-100 transition"
                                                onClick={() =>
                                                    setEditData((prev) => {
                                                        const updated = [...prev.description];
                                                        updated[index] = {
                                                            ...updated[index],
                                                            taskdescription: updated[index].taskdescription.filter(
                                                                (_, idx) => idx !== i
                                                            ),
                                                        };
                                                        return { ...prev, description: updated };
                                                    })
                                                }
                                            >
                                                ✕
                                            </button>)}
                                    </div>
                                ))}
                            </ReactSortable>

                            {!isEmployee && (<button
                                type="button"
                                className="mt-2 text-blue-600 hover:underline text-sm font-medium"
                                onClick={() =>
                                    setEditData((prev) => {
                                        const updated = [...prev.description];
                                        updated[index] = {
                                            ...updated[index],
                                            taskdescription: [
                                                ...(updated[index].taskdescription || []),
                                                "",
                                            ],
                                        };
                                        return { ...prev, description: updated };
                                    })
                                }
                            >
                                + Add Task Description
                            </button>)}
                        </div>
                        <div>
                            {!isEmployee && (
                                <>
                                    <label className="text-gray-600 text-sm font-medium block mb-1">
                                        Upload Files
                                    </label>
                                    <input
                                        type="file"
                                        multiple
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                        onChange={(e) => handleFileChange(e.target.files, index)}
                                    />
                                </>)}
                            <div>
                                <label className="text-gray-600 text-sm mt-[20px] font-medium block mb-2">
                                    Images
                                </label>
                                <div className="flex items-center flex-wrap">

                                    {(desc.files || []).map((file, i) => {
                                        const src = file.url ? file.url : URL.createObjectURL(file);
                                        if (file.type?.startsWith("image/")) {
                                            return (
                                                <img
                                                    key={i}
                                                    src={src}
                                                    alt={file.name}
                                                    className="w-[200px] h-[200px] object-cover rounded border m-[10px] cursor-pointer"
                                                    onClick={() => setFullscreenImage(src)}
                                                />
                                            );
                                        }
                                        return (
                                            <div
                                                key={i}
                                                className="w-20 h-20 flex items-center justify-center border rounded text-xs text-gray-600 text-center p-1"
                                            >
                                                {file.name}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            {fullscreenImage && (
                                <div
                                    className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
                                    onClick={() => setFullscreenImage(null)}
                                >
                                    <div className="relative">
                                        <img
                                            src={fullscreenImage}
                                            alt="Fullscreen"
                                            className="max-h-[90vh] max-w-[90vw] object-contain rounded"
                                        />
                                        <button
                                            onClick={() => setFullscreenImage(null)}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TaskDetails;
