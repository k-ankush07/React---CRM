import { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import ManagementPermissions from "../ui/ManagementPermissions";
import EmployeePermissions from "../ui/EmployeePermissions";
import { useUser } from "../Use-auth";

export default function Setting() {
    const { data: user } = useUser();

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
                <div className="relative z-[99] h-full overflow-y-auto p-6">

                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                        Permissions
                    </h3>
                    <div className="flex border-b border-gray-300 mb-6">
                        {!isManager && (
                            <button
                                className={`px-4 py-2 font-medium text-sm rounded-t-lg transition
                                ${activeTab === "management"
                                        ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                                        : "text-gray-600 hover:text-blue-600"
                                    }`}
                                onClick={() => setActiveTab("management")}
                            >
                                Management
                            </button>
                        )}

                        <button
                            className={`ml-2 px-4 py-2 font-medium text-sm rounded-t-lg transition
                            ${activeTab === "employees"
                                    ? "bg-white border border-b-0 border-gray-300 text-blue-600"
                                    : "text-gray-600 hover:text-blue-600"
                                }`}
                            onClick={() => setActiveTab("employees")}
                        >
                            Employees
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="bg-white border border-gray-300 rounded-b-lg p-6 min-h-[300px]">

                        {!isManager && activeTab === "management" && (
                            <ManagementPermissions adminId={user.username} />
                        )}

                        {activeTab === "employees" && (
                            <EmployeePermissions adminId={user.username} />
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
