import EmployeeLayout from "../EmployeeLayout";
import { useUser, useProjects, useTotalHolidays } from "../../Use-auth";
import { useDateRange } from "../DateRangeContext";
import { UserRound, TableCellsSplit, Star, Volleyball } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, LabelList } from 'recharts';
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function EmployeeDashboard() {
  const { start, end } = useDateRange();
  const { data: projects = [] } = useProjects();
  const { data: user } = useUser();
  const { data: holidaysData, refetch } = useTotalHolidays();


  console.log(projects)
  // Filter projects in date range
  const filteredProjects = projects.filter(p => {
    const createdAt = new Date(p.createdAt);
    return createdAt >= start && createdAt <= end;
  });

  // Flatten all tasks across statuses and include their status
  const allTasks = filteredProjects.flatMap(project => {
    return Object.entries(project.statusTask || {}).flatMap(([status, tasks]) => {
      return tasks.map(task => ({
        ...task,
        projectId: project._id,
        projectName: project.projectName,
        status, // <--- preserve the status from the key
      }));
    });
  });

  // Tasks assigned to the current user
  const assignedTasks = allTasks.filter(task =>
    task.assignedEmployees?.some(
      emp => emp.username === user.username || emp.username === user.fullName
    )
  );

  // Total completed tasks
  const completedTasks = assignedTasks.filter(task => task.status === "complete").length;

  // Total assigned tasks
  const totalAssignedTasks = assignedTasks.length;

  // Total projects where user has assigned tasks
  const assignedProjects = Array.from(new Set(assignedTasks.map(t => t.projectId)));


  // Monthly tasks breakdown
  const monthlyTasks = months.map((m, index) => {
    const count = assignedTasks.filter(task => {
      const created = new Date(task.createdAt || task.projectCreatedAt || new Date());
      return created.getMonth() === index;
    }).length;

    return { month: m, task: count };
  });

  const totalProjects = assignedProjects.length || 0;

  const payrollData = [
    { name: 'Salaries', value: 5000, color: '#0088FE' },
    { name: 'Bonuses', value: 2000, color: '#00C49F' },
    { name: 'Other', value: 1000, color: '#FFBB28' },
  ];

  return (
    <EmployeeLayout>
      <div className="h-[90vh] p-6">
        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Completed Tasks</p>
                <p className="text-3xl font-bold">{completedTasks}</p>
              </div>
              <UserRound className="w-12 h-12 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Holidays Roster</p>
                <p className="text-3xl font-bold">{holidaysData?.holidays?.length || 0}
                </p>
              </div>
              <Volleyball className="w-12 h-12 opacity-80" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Assigned Tasks</p>
                <p className="text-3xl font-bold">{totalAssignedTasks}</p>
              </div>
              <TableCellsSplit className="w-12 h-12 opacity-80" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Projects</p>
                <p className="text-3xl font-bold">{assignedProjects.length}</p>
              </div>
              <Star className="w-12 h-12 opacity-80" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Monthly Tasks</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyTasks} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />

                <YAxis allowDecimals={false} interval={0} />

                <Tooltip />
                <Bar dataKey="task" fill="#22c55e">
                  <LabelList dataKey="task" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-bold text-xl text-gray-800 mb-4">Payroll Breakdown</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={payrollData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label>
                  {payrollData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
}
