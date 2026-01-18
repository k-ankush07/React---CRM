import React, { useState, useEffect, useRef } from "react";
import RoleBasedLayout from "./RoleBasedLayout";
import { Input } from "../ui/Input";
import {
    useCreateCategory, useGetCategories, useUpdateCategoryItem, useGetPermissions, useUser,
    useReorderCategories, useDeleteCategory, useRenameCategory, useImportCategoryCSV
} from "../Use-auth";
import { GripVertical, EllipsisVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable, } from "@hello-pangea/dnd";
import SucessToast from "../ui/SucessToast";
import EditableCell from "../ui/EditableCell";

export default function Category() {
    const [newCategory, setNewCategory] = useState("");
    const { data, refetch } = useGetCategories();
    const createCategory = useCreateCategory();
    const reorderCategories = useReorderCategories();
    const renameCategory = useRenameCategory();
    const deleteCategory = useDeleteCategory();
    const importCSV = useImportCategoryCSV();
    const updateItem = useUpdateCategoryItem();
    const { data: user } = useUser();
    const { data: existingPermissions, } = useGetPermissions();
    const [categoriesOrder, setCategoriesOrder] = useState([]);
    const [expandedCategoryId, setExpandedCategoryId] = useState(null);
    const [toast, setToast] = useState({ message: "", type: "" });
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editedName, setEditedName] = useState("");
    const [importCategoryId, setImportCategoryId] = useState(null);
    const menuRef = useRef(null);
    const fileInputRef = useRef(null);

    // hide Outside click //
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: "", type: "" }), 3000);
    };

    const categories = Array.isArray(data) ? data : [];

    useEffect(() => {
        setCategoriesOrder(categories.sort((a, b) => a.order - b.order));
    }, [categories]);

    const handleSave = async () => {
        if (!newCategory.trim()) return;
        try {
            await createCategory.mutateAsync({ categoryName: newCategory.trim() });
            setNewCategory("");
            refetch();
            showToast("Category created successfully!", "success");
        } catch (err) {
            console.error("Error creating category:", err);
            showToast(err.message || "Failed to create category", "error");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSave();
    };

    const toggleCategory = (id) => {
        setExpandedCategoryId((prev) => (prev === id ? null : id));
    };

    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const newCategories = Array.from(categoriesOrder);
        const [moved] = newCategories.splice(result.source.index, 1);
        newCategories.splice(result.destination.index, 0, moved);

        setCategoriesOrder(newCategories);

        try {
            await reorderCategories.mutateAsync(newCategories.map((c) => c._id));
        } catch (err) {
            console.error("Failed to update category order:", err);
        }
    };

    const handleRemove = (id) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this category?"
        );
        if (!confirmDelete) return;

        deleteCategory.mutate(id, {
            onSuccess: () => {
                showToast("Category deleted successfully");
                setOpenMenuId(null);
            },
            onError: (err) => {
                showToast(err.message || "Delete failed", "error");
            },
        });
    };

    const startRename = (cat) => {
        setEditingCategoryId(cat._id);
        setEditedName(cat.categoryName);
        setOpenMenuId(null);
    };

    const saveRename = (catId) => {
        if (!editedName.trim()) {
            setEditingCategoryId(null);
            return;
        }

        renameCategory.mutate(
            { id: catId, categoryName: editedName.trim() },
            {
                onSuccess: () => {
                    setCategoriesOrder((prev) =>
                        prev.map((cat) =>
                            cat._id === catId
                                ? { ...cat, categoryName: editedName.trim() }
                                : cat
                        )
                    );

                    showToast("Category renamed successfully");
                    setEditingCategoryId(null);
                },
                onError: (err) => {
                    showToast(err.message || "Rename failed", "error");
                },
            }
        );
    };

    const handleImportClick = (catId) => {
        setImportCategoryId(catId);
        fileInputRef.current.click();
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !importCategoryId) return;

        importCSV.mutate(
            { id: importCategoryId, file },
            {
                onSuccess: () => {
                    showToast("CSV imported successfully");
                    setExpandedCategoryId(importCategoryId);
                    e.target.value = "";
                },
                onError: (err) => {
                    showToast(err.message || "CSV import failed", "error");
                },
            }
        );
    };

    useEffect(() => {
        if (categories.length > 0) {
            const sorted = [...categories].sort((a, b) => a.order - b.order);
            setCategoriesOrder(sorted);

            if (!expandedCategoryId) {
                setExpandedCategoryId(sorted[0]._id);
            }
        }
    }, [categories]);

    const handleUpdate = (catId, itemId, field, value) => {
        setCategoriesOrder((prevCategories) => {
            const updated = prevCategories.map((cat) => {
                if (cat._id !== catId) return cat;
                return {
                    ...cat,
                    items: cat.items.map((item) =>
                        item._id === itemId ? { ...item, [field]: value } : item
                    ),
                };
            });
            return updated;
        });

        updateItem.mutate(
            { categoryId: catId, itemId, field, value },
            {
                onSuccess: (res) => {
                    showToast("Updated successfully");
                },
                onError: (err) => {
                    showToast(err.message || "Update failed", "error");
                },
            }
        );
    };

    const currentCategory = expandedCategoryId
        ? categoriesOrder.find(cat => cat._id === expandedCategoryId)
        : null;

    const hasValue = (key) => {
        const currentCategory = categoriesOrder.find(
            (cat) => cat._id === expandedCategoryId
        );

        if (!currentCategory || !Array.isArray(currentCategory.items)) return false;

        return currentCategory.items.some(
            (item) => item[key] !== undefined && item[key] !== ""
        );
    };

    const isAdmin = user?.role === "admin";
    const currentUserPermissions = isAdmin
        ? {
            management: {
                manager_view: true,
                manager_time: true,
            },
        }
        : existingPermissions?.find(p => p.userId === user?.userId);

    const canViewHome =
        isAdmin || currentUserPermissions?.management?.category_view === true;
    const canUpdate =
        isAdmin || currentUserPermissions?.management?.category_update === true;

    if (!canViewHome) {
        return (
            <RoleBasedLayout>
                <div className="relative h-[90.7vh] overflow-hidden">
                    <div className="absolute w-full h-[100%] opacity-[0.1]
                   bg-[url('https://www.hubsyntax.com/uploads/prodcutpages.webp')] 
                  bg-cover bg-center rounded-xl shadow-md border border-gray-200">
                    </div>
                </div>
            </RoleBasedLayout>
        );
    }

    return (
        <RoleBasedLayout>
            <div className="flex h-[90.7vh]">
                <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto p-4">
                    <h3 className="text-lg font-semibold mb-4">Categories</h3>
                    {canUpdate && (<Input
                        placeholder="Add new category"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="mb-4"
                    />)}

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="categories">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {categoriesOrder.map((cat, index) => (
                                        <Draggable key={cat._id} draggableId={cat._id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="mb-2 bg-white rounded shadow-sm relative"
                                                >
                                                    <div
                                                        onClick={() => toggleCategory(cat._id)}
                                                        className={`flex items-center justify-between cursor-pointer p-2 
                                                        ${expandedCategoryId === cat._id
                                                                ? "bg-blue-100 border-l-4 border-blue-500"
                                                                : "hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {canUpdate && (<div {...provided.dragHandleProps} className="cursor-grab">
                                                                <GripVertical size={16} color="grey" />
                                                            </div>)}
                                                            {editingCategoryId === cat._id ? (
                                                                <Input
                                                                    value={editedName}
                                                                    autoFocus
                                                                    onChange={(e) => setEditedName(e.target.value)}
                                                                    onBlur={() => saveRename(cat._id)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") saveRename(cat._id);
                                                                        if (e.key === "Escape") setEditingCategoryId(null);
                                                                    }}
                                                                    className="h-7 text-sm"
                                                                />
                                                            ) : (
                                                                <span className="uppercase text-[14px]">{cat.categoryName}</span>
                                                            )}
                                                        </div>
                                                        {canUpdate && (<div
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === cat._id ? null : cat._id);
                                                            }}
                                                            className="cursor-pointer"
                                                        >
                                                            <EllipsisVertical size={16} color="grey" />
                                                        </div>)}
                                                        {openMenuId === cat._id && (
                                                            <div
                                                                ref={menuRef}
                                                                className="absolute right-2 top-10 z-50 w-40 bg-white border rounded shadow-md">
                                                                <input
                                                                    type="file"
                                                                    accept=".csv"
                                                                    ref={fileInputRef}
                                                                    className="hidden"
                                                                    onChange={handleCSVUpload}
                                                                />

                                                                <button
                                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                                    onClick={() => startRename(cat)}
                                                                >
                                                                    Rename
                                                                </button>

                                                                <button
                                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                                    onClick={() => handleRemove(cat._id)}
                                                                >
                                                                    Remove
                                                                </button>

                                                                <button
                                                                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                                                                    onClick={() => handleImportClick(cat._id)}
                                                                >
                                                                    Import CSV
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>

                <div className="w-full ">
                    {expandedCategoryId ? (
                        (() => {
                            const currentCategory = categoriesOrder.find(
                                (cat) => cat._id === expandedCategoryId
                            );

                            if (!currentCategory || currentCategory.items.length === 0) {
                                return <div className="flex items-center justify-center h-[100%]">
                                    <p className="text-center text-gray-400 mt-4">No data available</p>
                                </div>;
                            }

                            return (
                                <div className="overflow-x-auto w-[100%] max-w-[1400px] bg-gray-100 border">
                                    <div className="grid grid-cols-[80px_200px_450px_450px_450px_130px_120px] ">
                                        <div className="p-2 text-center border-r border-b">S.NO</div>
                                        {hasValue("storeName") && <div className="p-2 border-r border-b">Store Name</div>}
                                        {hasValue("storeLink") && <div className="p-2 border-r border-b">Store Link</div>}
                                        {hasValue("figmaLink") && <div className="p-2 border-r border-b">Figma Link</div>}
                                        {hasValue("testingMarkList") && <div className="p-2 border-r border-b">Testing Mark List</div>}
                                        {hasValue("status") && <div className="p-2 text-center border-r border-b">Status</div>}
                                        {hasValue("assignProject") && <div className="p-2 text-center border-b">Assign Project</div>}
                                    </div>

                                    {currentCategory.items.map((item, idx) => (
                                        <div
                                            key={item._id}
                                            className="grid grid-cols-[80px_200px_450px_450px_450px_130px_120px]  last:border-b-0 hover:bg-gray-50"
                                        >
                                            <div className="p-2 text-center border-b border-r">{idx + 1}</div>
                                            {hasValue("storeName") && (
                                                <EditableCell
                                                    value={item.storeName}
                                                    onSave={(v) =>
                                                        handleUpdate(expandedCategoryId, item._id, "storeName", v)
                                                    }
                                                    className="p-2 border-r break-words whitespace-normal"
                                                    canUpdate={canUpdate}
                                                />)}

                                            {hasValue("storeLink") && (
                                                <EditableCell
                                                    value={item.storeLink}
                                                    onSave={(v) =>
                                                        handleUpdate(expandedCategoryId, item._id, "storeLink", v)
                                                    }
                                                    className="p-2 border-r break-words whitespace-normal"
                                                    canUpdate={canUpdate}
                                                />)}

                                            {hasValue("figmaLink") && (
                                                <EditableCell
                                                    value={item.figmaLink}
                                                    onSave={(v) =>
                                                        handleUpdate(expandedCategoryId, item._id, "figmaLink", v)
                                                    }
                                                    className="p-2 border-r break-words whitespace-normal"
                                                    canUpdate={canUpdate}
                                                />)}

                                            {hasValue("testingMarkList") && (
                                                <EditableCell
                                                    value={item.testingMarkList.join(", ")}
                                                    onSave={(v) => {
                                                        const updatedList = v
                                                            .split(",")
                                                            .map((link) => link.trim())
                                                            .filter(Boolean);
                                                        handleUpdate(expandedCategoryId, item._id, "testingMarkList", updatedList);
                                                    }}
                                                    className="p-2 border-r break-words whitespace-normal"
                                                    canUpdate={canUpdate}
                                                />)}

                                            {hasValue("status") && (
                                                <EditableCell
                                                    value={item.status}
                                                    onSave={(v) =>
                                                        handleUpdate(expandedCategoryId, item._id, "status", v)
                                                    }
                                                    className="p-2 text-center border-r"
                                                    canUpdate={canUpdate}
                                                />)}

                                            {hasValue("assignProject") && (
                                                <EditableCell
                                                    value={item.assignProject}
                                                    onSave={(v) =>
                                                        handleUpdate(expandedCategoryId, item._id, "assignProject", v)
                                                    }
                                                    className="p-2 text-center"
                                                    canUpdate={canUpdate}
                                                />)}
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    ) : (
                        <p className="text-gray-500 text-center mt-4">Click a category to view items</p>
                    )}
                </div>

                {/* {toast.message && (
                    <SucessToast message={toast.message} type={toast.type} />
                )} */}
            </div>
        </RoleBasedLayout>
    );
}
