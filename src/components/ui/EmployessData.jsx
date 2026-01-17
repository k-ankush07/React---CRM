import { useState } from "react";
import { format } from "date-fns";
import { Trash, Pencil } from "lucide-react";
import EditUserDrawer from "./EditUserDrawer";

export default function EmployessData({ totalStaff = [], deleteUser, editUser }) {
    const [editUserData, setEditUserData] = useState(null);

    const handleDelete = (user) => {
        if (user.role === "admin") return;

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${user.fullName}?`
        );

        if (confirmDelete) {
            deleteUser(user._id);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Employees ({totalStaff.length})
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                        <thead className="bg-gray-100 text-sm text-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left">Employee</th>
                                <th className="px-4 py-3 text-left">User ID</th>
                                <th className="px-4 py-3 text-left">Title</th>
                                <th className="px-4 py-3 text-left">Role</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="px-4 py-3 text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y">
                            {totalStaff.map((user) => (
                                <tr
                                    key={user._id}
                                    className="hover:bg-gray-50 transition"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            {user.image ? (
                                                <img
                                                    src={user.image}
                                                    alt={user.fullName}
                                                    className="w-10 h-10 rounded-full object-cover border"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700 border">
                                                    {user.fullName
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .slice(0, 2)
                                                        .join("")
                                                        .toUpperCase()}
                                                </div>
                                            )}

                                            <div>
                                                <p className="font-medium text-gray-800">{user.fullName}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>


                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {user.userId}
                                    </td>

                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {user.title || "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full font-medium
                                        file:${user.role === "admin"
                                                    ? "bg-red-100 text-red-700"
                                                    : user.role === "management"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : user.role === "hr"
                                                            ? "bg-purple-100 text-purple-700"
                                                            : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`px-3 py-1 text-xs rounded-full font-medium
                                     ${user.status === "active"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-gray-200 text-gray-600"
                                                }`}
                                        >
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {format(new Date(user.createdAt), "dd MMM yyyy")}
                                    </td>
                                    <td className="px-4 py-3 flex gap-3 justify-center">
                                        <button
                                            onClick={() => setEditUserData(user)}
                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(user)}
                                            disabled={user.role === "admin"}
                                            className={`p-2 rounded
                               ${user.role === "admin"
                                                    ? "text-gray-400"
                                                    : "text-red-600 hover:bg-red-100"
                                                }`}
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {totalStaff.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center py-6 text-gray-500"
                                    >
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditUserDrawer
                open={!!editUserData}
                user={editUserData}
                onClose={() => setEditUserData(null)}
                onSave={(id, formData) => {
                    editUser({ userId: id, formData });
                    setEditUserData(null);
                }}
            />
        </>
    );
}
