import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "../ui/Input";
import {
    useUpdatePermission,
    useCreatePermission,
    useGetPermissions,
    useTotalStaff,
} from "../Use-auth";
import SucessToast from "./SucessToast";

/* ---------------- PERMISSIONS DATA ---------------- */
const permissionsData = [
    { label: "Home", key: "home", children: [{ label: "Home View", key: "home_view" }] },
    {
        label: "Manager Employees Page",
        key: "manager",
        children: [
            { label: "Manager View", key: "manager_view" },
            { label: "Manager Time Tracking", key: "manager_time" },
            { label: "Manager All Tracked Days", key: "manager_days" },
        ],
    },
    {
        label: "Project",
        key: "project",
        children: [
            { label: "View", key: "project_view" },
            { label: "Add New Project", key: "project_new" },
        ],
    },
    {
        label: "Transaction",
        key: "transaction",
        children: [
            { label: "Transaction View", key: "transaction_view" },
            { label: "Add New Transaction", key: "transaction_new" },
        ],
    },
    {
        label: "Account",
        key: "account",
        children: [
            { label: "Create New Account", key: "account_new" },
            { label: "Update Account", key: "account_update" },
        ],
    },
];

/* ---------------- HELPER ---------------- */
const countChecked = (permission, selected) => {
    if (!permission.children) return selected[permission.key] ? 1 : 0;
    return permission.children.reduce(
        (sum, child) => sum + countChecked(child, selected),
        selected[permission.key] ? 1 : 0
    );
};

/* ---------------- PERMISSION ITEM ---------------- */
function PermissionItem({ permission, selected, toggle, search, expandedAll, indeterminate }) {
    const hasChildren = permission.children?.length > 0;
    const isChecked = !!selected[permission.key];
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setOpen(expandedAll);
    }, [expandedAll]);

    const matches =
        permission.label.toLowerCase().includes(search.toLowerCase()) ||
        permission.children?.some((c) =>
            c.label.toLowerCase().includes(search.toLowerCase())
        );

    if (!matches) return null;

    const totalChildren = hasChildren ? permission.children.length : 1;
    const checkedChildren = hasChildren ? countChecked(permission, selected) : isChecked ? 1 : 0;

    return (
        <div className="ml-4 mb-2">
            <div
                className="flex justify-between items-center border rounded px-3 py-2 cursor-pointer"
                onClick={() => setOpen((p) => !p)}
            >
                <label className="flex gap-2 items-center">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        ref={el => {
                            if (el) el.indeterminate = indeterminate?.[permission.key] || false;
                        }}
                        onChange={(e) => {
                            e.stopPropagation();
                            toggle(permission.key, permission.children || []);
                        }}
                    />
                    {permission.label}
                </label>

                {hasChildren && (
                    <div className="flex items-center gap-3 text-gray-500">
                        <span className="text-sm">{checkedChildren}/{totalChildren}</span>
                        {open ? <ChevronUp /> : <ChevronDown />}
                    </div>
                )}
            </div>

            {hasChildren && open && (
                <div className="mt-1">
                    {permission.children.map((child) => (
                        <PermissionItem
                            key={child.key}
                            permission={child}
                            selected={selected}
                            toggle={toggle}
                            search={search}
                            expandedAll={expandedAll}
                            indeterminate={indeterminate}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

/* ---------------- MAIN COMPONENT ---------------- */
export default function ManagementPermissions({ adminId }) {
    const [selected, setSelected] = useState({});
    const [search, setSearch] = useState("");
    const [expandedAll, setExpandedAll] = useState(false);
    const [selectedManagementId, setSelectedManagementId] = useState([]);

    const { data: staffData = [] } = useTotalStaff();
    const { data: permissionsDataApi = [], refetch } = useGetPermissions();
    const createPermission = useCreatePermission();
    const updatePermission = useUpdatePermission();

    const managementUsers = staffData.filter((u) => u.role === "management");

    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    useEffect(() => {
        if (!selectedManagementId.length) return;

        const next = {};

        selectedManagementId.forEach((userId) => {
            const existing = permissionsDataApi.find(p => p.userId === userId);
            next[userId] = existing?.management || {};
        });

        setSelected(next);
    }, [selectedManagementId]);

    /* -------- TOGGLE INDIVIDUAL PERMISSIONS -------- */
    const togglePermission = (key, children = []) => {
        const next = { ...selected };

        selectedManagementId.forEach((userId) => {
            const userPerm = next[userId] ? { ...next[userId] } : {};
            const value = !userPerm[key];
            userPerm[key] = value;

            const toggleChildren = (list) => {
                list.forEach((c) => {
                    userPerm[c.key] = value;
                    if (c.children) toggleChildren(c.children);
                });
            };

            if (children.length) toggleChildren(children);
            next[userId] = userPerm;
        });

        setSelected(next);
    };

    /* -------- SELECT ALL PERMISSIONS -------- */
    const toggleSelectAll = () => {
        const keys = [];
        const collectKeys = (list) => list.forEach((item) => {
            keys.push(item.key);
            if (item.children) collectKeys(item.children);
        });
        collectKeys(permissionsData);

        selectedManagementId.forEach(userId => {
            const allChecked = keys.every(k => selected[userId]?.[k]);
            const nextUserPerm = {};
            keys.forEach(k => (nextUserPerm[k] = !allChecked));
            selected[userId] = nextUserPerm;
        });

        setSelected({ ...selected });
    };

    /* -------- MERGE PERMISSIONS & INDTERMINATE -------- */
    const getMergedSelected = () => {
        const merged = {};
        const indeterminate = {};

        const mergePerm = (perm) => {
            if (!selectedManagementId.length) return;

            let allChecked = true;
            let someChecked = false;

            selectedManagementId.forEach((userId) => {
                const userPerm = selected[userId] || {};
                if (userPerm[perm.key]) someChecked = true;
                else allChecked = false;
            });

            merged[perm.key] = allChecked;
            indeterminate[perm.key] = someChecked && !allChecked;

            if (perm.children) perm.children.forEach(c => mergePerm(c));
        };

        permissionsData.forEach(perm => mergePerm(perm));

        return { merged, indeterminate };
    };

    const { merged: mergedSelected, indeterminate } = getMergedSelected();

    /* -------- SAVE PERMISSIONS -------- */
    const handleSave = () => {
        if (!selectedManagementId.length) {
            setToast({
                show: true,
                message: "Select at least one management user first",
                type: "error",
            });
            return;
        }

        selectedManagementId.forEach((userId) => {
            const userPerms = selected[userId] || {};
            const managementPermissions = {};
            Object.keys(userPerms).forEach((key) => {
                if (userPerms[key]) managementPermissions[key] = true;
            });

            const existing = permissionsDataApi.find((p) => p.userId === userId);

            const payload = {
                adminBy: adminId,
                userId,
                role: "management",
                management: managementPermissions,
                employees: {},
            };

            if (existing) {
                updatePermission.mutate(
                    { id: existing._id, management: managementPermissions, employees: {} },
                    {
                        onSuccess: () => {
                            setToast({
                                show: true,
                                message: "Permissions updated successfully",
                                type: "success",
                            });
                            refetch();
                        },
                        onError: (err) => {
                            setToast({
                                show: true,
                                message: err.message || "Failed to update permissions",
                                type: "error",
                            });
                        },
                    }
                );
            } else {
                createPermission.mutate(payload, {
                    onSuccess: () => {
                        setToast({
                            show: true,
                            message: "Permissions created successfully",
                            type: "success",
                        });
                        refetch();
                    },
                    onError: (err) => {
                        setToast({
                            show: true,
                            message: err.message || "Failed to create permissions",
                            type: "error",
                        });
                    },
                });
            }
        });
    };

    return (
        <>
            <div className="mb-6">
                <label className="font-semibold text-lg block mb-3 text-gray-700">
                    Select Management User(s)
                </label>

                <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
                    {/* Select All Users */}
                    <label
                        className="inline-flex items-center gap-3 cursor-pointer mb-3 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
                    >
                        <input
                            type="checkbox"
                            className="text-blue-600 focus:ring-blue-500 rounded"
                            checked={selectedManagementId.length === managementUsers.length}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedManagementId(managementUsers.map(u => u.userId));
                                } else {
                                    setSelectedManagementId([]);
                                }
                            }}
                        />
                        <span className="font-medium text-gray-800">Select All Users</span>
                    </label>

                    <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
                        {managementUsers.map((u) => (
                            <label
                                key={u.userId}
                                className="flex gap-3 items-baseline cursor-pointer px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    className="text-blue-600 focus:ring-blue-500 rounded"
                                    checked={selectedManagementId.includes(u.userId)}
                                    onChange={(e) => {
                                        const next = e.target.checked
                                            ? [...selectedManagementId, u.userId]
                                            : selectedManagementId.filter(id => id !== u.userId);
                                        setSelectedManagementId(next);
                                    }}
                                />
                                <div className="grid gap-[5px]">
                                    <span className="font-medium text-gray-800">{u.fullName}</span>
                                    <span className="text-gray-500 text-sm">({u.username})</span>
                                </div>
                            </label>
                        ))}
                    </div>

                </div>
            </div>

            {/* ---------------- Permissions Section ---------------- */}
            {selectedManagementId.length === 0 ? (
                <div className="p-4 border rounded bg-gray-100 text-sm">
                    Select at least one management user to assign permissions
                </div>
            ) : (
                <div className="p-4 border rounded bg-gray-50 text-sm">
                    <Input
                        placeholder="Search permissions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mb-4"
                    />

                    <div className="flex justify-between items-center mb-3">
                        <label className="flex gap-2 items-center">
                            <input
                                type="checkbox"
                                checked={Object.keys(mergedSelected).length > 0 && Object.values(mergedSelected).every(Boolean)}
                                ref={el => {
                                    if (el) {
                                        const someChecked = Object.values(mergedSelected).some(v => v);
                                        const allChecked = Object.values(mergedSelected).every(v => v);
                                        el.indeterminate = someChecked && !allChecked;
                                    }
                                }}
                                onChange={toggleSelectAll}
                            />
                            Select All Permissions
                        </label>

                        <div className="flex gap-4">
                            <button onClick={handleSave} className="text-green-600">Save</button>
                            <button onClick={() => setExpandedAll(p => !p)} className="text-blue-600">
                                {expandedAll ? "Collapse All" : "Expand All"}
                            </button>
                        </div>
                    </div>

                    {permissionsData.map((perm) => (
                        <PermissionItem
                            key={perm.key}
                            permission={perm}
                            selected={mergedSelected}
                            toggle={togglePermission}
                            search={search}
                            expandedAll={expandedAll}
                            indeterminate={indeterminate}
                        />
                    ))}
                </div>
            )}

            {toast.show && (
                <SucessToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </>
    );
}
