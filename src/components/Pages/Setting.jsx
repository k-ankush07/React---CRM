import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import ManagementPermissions from "../ui/ManagementPermissions";
import EmployeePermissions from "../ui/EmployeePermissions";
import EmployessData from "../ui/EmployessData";
import { useUser, useTotalStaff, useDeleteUser, useEditUser, useGetPermissions } from "../Use-auth";

export default function Setting() {
    const { data: user } = useUser();
    const { data: totalStaff = [] } = useTotalStaff();
    const { mutate: deleteUser, isLoading } = useDeleteUser();
    const { mutate: editUser, } = useEditUser();
    const { data: existingPermissions, refetch } = useGetPermissions();

    const isAdmin = user?.role === "admin";
    const currentUserPermissions = isAdmin
        ? { management: { account_update: true } }
        : existingPermissions?.find((p) => p.userId === user?.userId);

    const canViewUpdate = isAdmin || currentUserPermissions?.management?.account_update;

    const isManager = user?.role === "management";

    const [activeTab, setActiveTab] = useState(
        isManager ? "employees" : "management"
    );

    useEffect(() => {
        if (isManager) {
            setActiveTab("employees");
        }
    }, [isManager]);

    return (
        <AdminLayout>
            <div className="relative h-[90.7vh] bg-gray-50 overflow-hidden">
                <div
                    className="absolute w-full h-[100%] opacity-[0.1] bg-[url('https://www.hubsyntax.com/uploads/setting-ing.png')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
                ></div>
                <div className="relative z-[99] h-full overflow-y-auto p-6">
                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                        Permissions
                    </h3>
                    <div className="flex border-b border-gray-300 mb-6">
                        {!isManager && (
                            <div
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer
                                ${activeTab === "management"
                                        ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                                        : "text-gray-600 hover:text-blue-600"
                                    }`}
                                onClick={() => setActiveTab("management")}
                            >
                                Management
                            </div>
                        )}

                        <div
                            className={`ml-2 px-4 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer
                            ${activeTab === "employees"
                                    ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                                    : "text-gray-600 hover:text-blue-600"
                                }`}
                            onClick={() => setActiveTab("employees")}
                        >
                            Employees
                        </div>
                        {canViewUpdate && (
                            <div
                                className={`ml-2 px-4 py-2 font-medium text-sm rounded-t-lg transition cursor-pointer
                                ${activeTab === "employees_data"
                                        ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                                        : "text-gray-600 hover:text-blue-600"
                                    }`}
                                onClick={() => setActiveTab("employees_data")}
                            >
                                Employees Data
                            </div>
                        )}
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white border border-gray-300 rounded-b-lg p-6 min-h-[300px] rounded-lg">

                        {!isManager && activeTab === "management" && (
                            <ManagementPermissions adminId={user.username} />
                        )}

                        {activeTab === "employees" && (
                            <EmployeePermissions adminId={user.username} />
                        )}
                        {activeTab === "employees_data" && (
                            <EmployessData
                                totalStaff={totalStaff}
                                deleteUser={deleteUser}
                                editUser={editUser}
                            />
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
