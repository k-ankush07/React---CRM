import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from '../ui/Input';

// ---------------- PERMISSIONS DATA ----------------
const permissionsData = [
    { label: "Home", key: "home", children: [{ label: "Home View", key: "home_view" }] },
    {
        label: "Employees", key: "employees",
        children: [
            { label: "Employees View", key: "employees_view" },
            { label: "Employees Time Tracking", key: "employees_time" },
            { label: "Employees All Tracked Days", key: "employees_days" }
        ]
    },
    {
        label: "Project", key: "project",
        children: [
            { label: "View", key: "project_view" },
            { label: "Update Status", key: "status_update" },
        ],
    },
];

const countChecked = (permission, selected) => {
    if (!permission.children) return selected[permission.key] ? 1 : 0;
    return permission.children.reduce(
        (sum, child) => sum + countChecked(child, selected),
        selected[permission.key] ? 1 : 0
    );
};

function PermissionItem({ permission, selected, toggle, search, expandedAll }) {
    const hasChildren = permission.children?.length > 0;
    const isChecked = selected[permission.key] || false;

    const [localExpanded, setLocalExpanded] = useState(false);

    const isOpen = localExpanded;

    useEffect(() => {
        setLocalExpanded(expandedAll);
    }, [expandedAll]);


    const matchesSearch = permission.label.toLowerCase().includes(search.toLowerCase());
    const showItem =
        matchesSearch ||
        (hasChildren &&
            permission.children.some((child) =>
                child.label.toLowerCase().includes(search.toLowerCase())
            ));

    if (!showItem) return null;

    const totalChildren = hasChildren ? permission.children.length : 1;
    const checkedChildren = hasChildren ? countChecked(permission, selected) : isChecked ? 1 : 0;

    return (
        <div className="ml-4 mb-2">
            <div className="flex items-center justify-between border border-gray-300 rounded px-3 py-2 cursor-pointer permission"
                onClick={() => setLocalExpanded((prev) => !prev)}>
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                            e.stopPropagation();
                            toggle(permission.key, permission.children || []);
                        }}
                        className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-sm text-gray-700" onClick={() => setLocalExpanded((prev) => !prev)}>
                        {permission.label}</span>
                </label>

                {hasChildren && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setLocalExpanded((prev) => !prev);
                            }}
                            className="w-5 h-5 flex items-center justify-center text-gray-500"
                        >
                            {localExpanded ? <ChevronUp /> : <ChevronDown />}
                        </button>
                        <span className="text-sm text-gray-500">
                            {checkedChildren}/{totalChildren}
                        </span>
                    </div>
                )}
            </div>


            {hasChildren && isOpen && (
                <div className="mt-1 bg-white">
                    <div className="permission-child">
                        {permission.children.map((child) => (
                            <PermissionItem
                                key={child.key}
                                permission={child}
                                selected={selected}
                                toggle={toggle}
                                search={search}
                                expandedAll={expandedAll}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EmployeePermissions() {
    const [selected, setSelected] = useState({});
    const [search, setSearch] = useState("");
    const [expandedAll, setExpandedAll] = useState(false);

    const togglePermission = (key, children = []) => {
        const newSelected = { ...selected, [key]: !selected[key] };

        const toggleChildren = (list, value) => {
            list.forEach((child) => {
                newSelected[child.key] = value;
                if (child.children) toggleChildren(child.children, value);
            });
        };

        if (children.length) toggleChildren(children, newSelected[key]);
        setSelected(newSelected);
    };

    const toggleSelectAll = () => {
        const allKeys = [];
        const collectKeys = (list) => {
            list.forEach((item) => {
                allKeys.push(item.key);
                if (item.children) collectKeys(item.children);
            });
        };
        collectKeys(permissionsData);

        const allSelected = allKeys.every((k) => selected[k]);
        const next = {};
        allKeys.forEach((k) => (next[k] = !allSelected));
        setSelected(next);
    };

    return (
        <div className="p-4 border rounded bg-gray-50 text-[14px]">
            <Input
                type="text"
                placeholder="Search permissions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="mb-4 p-2 border rounded w-full"
            />

            <div className="flex justify-between items-center mb-3">
                <label className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={Object.keys(selected).length > 0 && Object.values(selected).every(Boolean)}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-blue-600"
                    />
                    <span className="font-medium">Select all permissions</span>
                </label>

                <button
                    className="text-blue-500 text-sm"
                    onClick={() => setExpandedAll((prev) => !prev)}
                >
                    {expandedAll ? "Collapse all" : "Expand all"}
                </button>
            </div>

            {permissionsData.map((perm) => (
                <PermissionItem
                    key={perm.key}
                    permission={perm}
                    selected={selected}
                    toggle={togglePermission}
                    search={search}
                    expandedAll={expandedAll}
                />
            ))}
        </div>
    );
}
