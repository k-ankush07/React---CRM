import { useProjects, useTotalStaff, useTotalHolidays, useGetPermissions, useUser } from "../Use-auth";
import { useDateRange } from "../Pages/DateRangeContext";
import { UserRound, Volleyball, Star, AlignStartVertical, EllipsisVertical, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, LabelList } from 'recharts';

export default function MainDashBoard() {
    const { start, end } = useDateRange();
    const { data: totalStaff = [] } = useTotalStaff();
    const { data: projects = [] } = useProjects();
    const { data: holidaysData, } = useTotalHolidays();
    const { data: existingPermissions, refetch } = useGetPermissions();
    const { data: user } = useUser();

    const isAdmin = user?.role === "admin";
    const currentUserPermissions = isAdmin
        ? { management: { home_view: true } }
        : existingPermissions?.find((p) => p.userId === user?.userId);

    const canViewHome = isAdmin || currentUserPermissions?.management?.home_view;

    const activeEmployees = totalStaff.filter(e => e.status === "active");
    const filteredProjects = projects.filter((p) => {
        const createdAt = new Date(p.createdAt);
        return createdAt >= start && createdAt <= end;
    });

    const filteredHolidays = holidaysData?.holidays?.filter((h) => {
        const holidayDate = new Date(h.date);
        return holidayDate >= start && holidayDate <= end;
    }) || [];

    const recentRequests = [
        { sn: 1, subject: "Leave Request", date: "2025-12-20", status: "Approved" },
        { sn: 2, subject: "Equipment Upgrade", date: "2025-12-18", status: "Pending" },
        { sn: 3, subject: "Training Session", date: "2025-12-15", status: "Rejected" },
    ];

    const budgetHistory = [
        { sn: 1, budgetNo: "B001", budgeted: "$50,000", actual: "$48,000", date: "2025-12-01" },
        { sn: 2, budgetNo: "B002", budgeted: "$30,000", actual: "$32,000", date: "2025-11-15" },
    ];

    const staffApplicationsData = [
        { month: 'Jan', applications: 10 },
        { month: 'Feb', applications: 12 },
        { month: 'Mar', applications: 15 },
        { month: 'Apr', applications: 18 },
        { month: 'May', applications: 20 },
        { month: 'Jun', applications: 22 },
        { month: 'Jul', applications: 25 },
        { month: 'Aug', applications: 28 },
        { month: 'Sep', applications: 30 },
        { month: 'Oct', applications: 32 },
        { month: 'Nov', applications: 35 },
        { month: 'Dec', applications: 38 },
    ];

    const payrollData = [
        { name: 'Salaries', value: 1500000, color: '#0088FE' },
        { name: 'Benefits', value: 500000, color: '#00C49F' },
        { name: 'Taxes', value: 300000, color: '#FFBB28' },
        { name: 'Other', value: 200000, color: '#FF8042' },
    ];

    const incomeData = [
        { month: 'Jan', income: 400000 },
        { month: 'Feb', income: 420000 },
        { month: 'Mar', income: 450000 },
        { month: 'Apr', income: 480000 },
        { month: 'May', income: 500000 },
        { month: 'Jun', income: 520000 },
        { month: 'Jul', income: 550000 },
        { month: 'Aug', income: 580000 },
        { month: 'Sep', income: 600000 },
        { month: 'Oct', income: 620000 },
        { month: 'Nov', income: 650000 },
        { month: 'Dec', income: 680000 },
    ];

    return (
        <div className="min-h-screen p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Staff</p>
                            <p className="text-3xl font-bold">{canViewHome ? activeEmployees.length : '-'}</p>
                        </div>
                        <UserRound className="w-12 h-12 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Holidays Roster</p>
                            <p className="text-3xl font-bold">
                                {canViewHome ? filteredHolidays.length : '-'}
                            </p>
                        </div>
                        <Volleyball className="w-12 h-12 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Total Projects</p>
                            <p className="text-3xl font-bold">{canViewHome ? filteredProjects.length : '-'}</p>
                        </div>
                        <Star className="w-12 h-12 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Total Departments</p>
                            <p className="text-3xl font-bold">100</p>
                        </div>
                        <AlignStartVertical className="w-12 h-12 opacity-80" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800">Staff Applications</h3>
                        <EllipsisVertical className="w-6 h-6 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="text-center mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto text-blue-500 mb-2" />
                        <p className="text-2xl font-semibold text-gray-700">+15%</p>
                        <p className="text-sm text-gray-500">Increase this month</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={staffApplicationsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="applications" fill="#3B82F6">
                                <LabelList dataKey="applications" position="top" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800">Annual Payroll</h3>
                        <EllipsisVertical className="w-6 h-6 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="text-center mb-4">
                        <DollarSign className="w-16 h-16 mx-auto text-green-500 mb-2" />
                        <p className="text-2xl font-semibold text-gray-700">$2.5M</p>
                        <p className="text-sm text-gray-500">Total expenditure</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={payrollData} cx="50%" cy="50%" outerRadius={60} fill="#8884d8" dataKey="value" label>
                                {payrollData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800">Total Income</h3>
                        <EllipsisVertical className="w-6 h-6 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="text-center mb-4">
                        <TrendingUp className="w-16 h-16 mx-auto text-purple-500 mb-2" />
                        <p className="text-2xl font-semibold text-gray-700">$5.2M</p>
                        <p className="text-sm text-gray-500">Revenue this year</p>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={incomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="income" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800">Recent Requests</h3>
                        <Calendar className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-gray-600 border-b-2 border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-2">S/N</th>
                                    <th className="text-left py-3 px-2">Subject</th>
                                    <th className="py-3 px-2">Date</th>
                                    <th className="py-3 px-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRequests.map((request) => (
                                    <tr key={request.sn} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2">{request.sn}</td>
                                        <td className="py-3 px-2 font-medium">{request.subject}</td>
                                        <td className="py-3 px-2 text-center">{request.date}</td>
                                        <td className="py-3 px-2 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                                                request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {request.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-xl text-gray-800">Budget History</h3>
                        <EllipsisVertical className="w-6 h-6 text-gray-400 cursor-pointer" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-gray-600 border-b-2 border-gray-200">
                                <tr>
                                    <th className="py-3 px-2">S/N</th>
                                    <th className="py-3 px-2">Budget No</th>
                                    <th className="py-3 px-2">Budgeted</th>
                                    <th className="py-3 px-2">Actual</th>
                                    <th className="py-3 px-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgetHistory.map((budget) => (
                                    <tr key={budget.sn} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-2 text-center">{budget.sn}</td>
                                        <td className="py-3 px-2 text-center font-medium">{budget.budgetNo}</td>
                                        <td className="py-3 px-2 text-center">{budget.budgeted}</td>
                                        <td className="py-3 px-2 text-center">{budget.actual}</td>
                                        <td className="py-3 px-2 text-center">{budget.date}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
