import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "../ui/Input";
import {
  useUpdatePermission,
  useCreatePermission,
  useGetPermissions,
  useTotalStaff,
  useProjects
} from "../Use-auth";
import SucessToast from "./SucessToast";

const permissionsData = [
  { label: "Home", key: "home", children: [{ label: "Home View", key: "home_view" }] },
  {
    label: "Employees",
    key: "employees",
    children: [
      { label: "Employees View", key: "employees_view" },
      { label: "Employees Time Tracking", key: "employees_time" },
      { label: "Employees All Tracked Days", key: "employees_days" },
    ],
  },
  {
    label: "Project",
    key: "project",
    children: [
      { label: "View", key: "project_view" },
      {
        label: "Project Show", key: "project_show",
      },
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

function PermissionItem({
  permission,
  selected,
  toggle,
  search,
  expandedAll,
  indeterminate,
  projects,
  selectedProjects,
  setSelectedProjects,
  userId
}) {
  const hasChildren = permission.children?.length > 0;
  const isChecked = !!selected[permission.key];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(expandedAll);
  }, [expandedAll]);

  const matches =
    permission.label.toLowerCase().includes(search.toLowerCase()) ||
    permission.children?.some(c =>
      c.label.toLowerCase().includes(search.toLowerCase())
    );

  if (!matches) return null;

  const totalChildren = hasChildren ? permission.children.length : 1;
  const checkedChildren = hasChildren ? countChecked(permission, selected) : isChecked ? 1 : 0;

  return (
    <div className="ml-4 mb-2">
      <div
        className="flex justify-between items-center border rounded px-3 py-2 cursor-pointer"
        onClick={() => setOpen(p => !p)}
      >
        <label className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={isChecked}
            ref={el => {
              if (el) el.indeterminate = indeterminate?.[permission.key] || false;
            }}
            onChange={e => {
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
          {permission.children.map(child => (
            <div key={child.key}>
              <PermissionItem
                permission={child}
                selected={selected}
                toggle={toggle}
                search={search}
                expandedAll={expandedAll}
                indeterminate={indeterminate}
                projects={projects}
                selectedProjects={selectedProjects}
                setSelectedProjects={setSelectedProjects}
                userId={userId}
              />

              {/* Show projects when Project Show is checked */}
              {child.key === "project_show" && selected[child.key] && (
                <div className="ml-8 mt-2 flex flex-wrap gap-2 mb-[10px]">
                  {projects.map(p => (
                    <label key={p._id} className="flex items-center gap-2 border rounded px-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProjects[userId]?.includes(p._id.toString()) || false}
                        onChange={e => {
                          setSelectedProjects(prev => {
                            const current = prev[userId] || [];
                            let nextList = [];
                            if (e.target.checked) {
                              nextList = [...current, p._id.toString()];
                            } else {
                              nextList = current.filter(id => id !== p._id.toString());
                            }
                            return { ...prev, [userId]: nextList };
                          });
                        }}
                      />
                      {p.projectName}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmployeePermissions({ adminId }) {
  const [selected, setSelected] = useState({});
  const [search, setSearch] = useState("");
  const [expandedAll, setExpandedAll] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const { data: staffData = [] } = useTotalStaff();
  const { data: permissionsApi = [], refetch } = useGetPermissions();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const { data: projects = [] } = useProjects();
  const [selectedProjects, setSelectedProjects] = useState({});

  const employeeUsers = staffData.filter(u => u.role === "employee");

  // Initialize selected projects per employee
  useEffect(() => {
    const next = {};
    selectedEmployeeIds.forEach(userId => {
      const existing = permissionsApi.find(p => p.userId === userId);
      next[userId] = existing?.employees?.project_id?.map(id => id.toString()) || [];
    });
    setSelectedProjects(next);
  }, [selectedEmployeeIds, permissionsApi]);

  useEffect(() => {
    const next = {};
    selectedEmployeeIds.forEach(userId => {
      next[userId] = permissionsApi.find(p => p.userId === userId)?.employees || {};
    });
    setSelected(next);
  }, [selectedEmployeeIds, permissionsApi]);

  const togglePermissionForUser = (userId, key, children = []) => {
    setSelected(prev => {
      const userPerm = { ...(prev[userId] || {}) };
      let value = !userPerm[key];
      userPerm[key] = value;

      if (children.length) {
        const toggleChildren = list => {
          list.forEach(c => {
            userPerm[c.key] = value;
            if (c.children) toggleChildren(c.children);
          });
        };
        toggleChildren(children);
      }

      return { ...prev, [userId]: userPerm };
    });
  };

  const toggleSelectAll = () => {
    const keys = [];
    const collect = list =>
      list.forEach(i => {
        keys.push(i.key);
        if (i.children) collect(i.children);
      });
    collect(permissionsData);

    const next = { ...selected };

    selectedEmployeeIds.forEach(userId => {
      const allChecked = keys.every(k => next[userId]?.[k]);
      const perms = {};
      keys.forEach(k => (perms[k] = !allChecked));
      next[userId] = perms;
    });

    setSelected(next);
  };

  const getMergedSelected = () => {
    const merged = {};
    const indeterminate = {};

    const walk = perm => {
      let all = true;
      let some = false;

      selectedEmployeeIds.forEach(uid => {
        const p = selected[uid] || {};
        if (p[perm.key]) some = true;
        else all = false;
      });

      merged[perm.key] = all;
      indeterminate[perm.key] = some && !all;

      perm.children?.forEach(walk);
    };

    permissionsData.forEach(walk);
    return { merged, indeterminate };
  };

  const { merged, indeterminate } = getMergedSelected();

  const handleSave = () => {
    if (!selectedEmployeeIds.length) {
      setToast({ show: true, message: "Select at least one employee", type: "error" });
      return;
    }

    selectedEmployeeIds.forEach(userId => {
      const perms = selected[userId] || {};
      const employees = {};

      Object.keys(perms).forEach(k => {
        if (perms[k]) employees[k] = true;
      });

      if (employees.project_show) {
        employees.project_id = selectedProjects[userId] || [];
      }

      const existing = permissionsApi.find(p => p.userId === userId);

      if (existing) {
        updatePermission.mutate(
          {
            id: existing._id,
            employees,
            management: {}
          },
          { onSuccess: refetch }
        );
      } else {
        createPermission.mutate(
          {
            adminBy: adminId,
            userId,
            role: "employee",
            employees,
            management: {}
          },
          { onSuccess: refetch }
        );
      }
    });

    setToast({ show: true, message: "Employee permissions saved", type: "success" });
  };


  return (
    <>
      <div className="mb-6">
        <label className="font-semibold text-lg block mb-3 text-gray-700">
          Select Employee(s)
        </label>

        <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
          <label className="inline-flex items-center gap-3 cursor-pointer mb-3 px-3 py-2 rounded-md border">
            <input
              type="checkbox"
              checked={selectedEmployeeIds.length === employeeUsers.length}
              onChange={e =>
                setSelectedEmployeeIds(
                  e.target.checked ? employeeUsers.map(u => u.userId) : []
                )
              }
            />
            Select All Users
          </label>

          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {employeeUsers.map(u => (
              <label key={u.userId} className="flex items-baseline gap-3 px-3 py-2 border rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.includes(u.userId)}
                  onChange={e =>
                    setSelectedEmployeeIds(
                      e.target.checked
                        ? [...selectedEmployeeIds, u.userId]
                        : selectedEmployeeIds.filter(id => id !== u.userId)
                    )
                  }
                />
                <div>
                  <div>{u.fullName}</div>
                  <div className="text-sm text-gray-500">({u.username})</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {selectedEmployeeIds.length === 0 ? (
        <div className="p-4 border rounded bg-gray-100 text-sm">
          Select at least one employee to assign permissions
        </div>
      ) : (
        <div className="p-4 border rounded bg-gray-50 text-sm">
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="mb-4"
          />

          <div className="flex justify-between items-center mb-3">
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                checked={Object.values(merged).every(Boolean)}
                ref={el => {
                  if (el) {
                    const some = Object.values(merged).some(v => v);
                    const all = Object.values(merged).every(v => v);
                    el.indeterminate = some && !all;
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

          {selectedEmployeeIds.map(userId => (
            <div key={userId} className="mb-4 border p-3 rounded bg-white">
              <div className="font-semibold mb-2">
                {employeeUsers.find(u => u.userId === userId)?.fullName}
              </div>
              {permissionsData.map(perm => (
                <PermissionItem
                  key={perm.key}
                  permission={perm}
                  selected={selected[userId] || {}}
                  toggle={(key, children) => togglePermissionForUser(userId, key, children)}
                  search={search}
                  expandedAll={expandedAll}
                  indeterminate={{}}
                  projects={projects}
                  selectedProjects={selectedProjects}
                  setSelectedProjects={setSelectedProjects}
                  userId={userId}
                />
              ))}
            </div>
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
