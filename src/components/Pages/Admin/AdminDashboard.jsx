import AdminLayout from "../AdminLayout";
import MainDashBoard from "../../ui/Main-DashBoard";

export default function AdminDashboard() {

  return (
    <AdminLayout>
      <MainDashBoard />
    </AdminLayout>
  );
}

// import AdminLayout from "../AdminLayout";
// import { useEmployees, useProjects } from "../../Use-auth";
// import { useDateRange } from "../DateRangeContext";
// import { UserRound, TableCellsSplit, Star, AlignStartVertical, EllipsisVertical } from "lucide-react";

// export default function AdminDashboard() {
//   const { start, end } = useDateRange();
//   const { data: employees = [] } = useEmployees();
//   const { data: projects = [] } = useProjects();

//   const filteredProjects = projects.filter((p) => {
//     const createdAt = new Date(p.createdAt);
//     return createdAt >= start && createdAt <= end;
//   });

//   return (
//     <AdminLayout>
//       <div className="flex justify-between gap-5 mb-5">
//         <div className="w-1/4 flex gap-2 border rounded-lg px-4 py-6 text-sm text-[#070707] hover:bg-gray-100">
//           <UserRound />
//           <div>
//             <span className="block text-[20px]">{employees.length}</span>
//             <span>Total number of staff</span>
//           </div>
//         </div>

//         <div className="w-1/4 flex gap-2 border rounded-lg px-4 py-6 text-sm text-[#070707] hover:bg-gray-100">
//           <TableCellsSplit />
//           <div>
//             <span className="block text-[20px]">40</span>
//             <span>Total application</span>
//           </div>
//         </div>

//         <div className="w-1/4 flex gap-2 border rounded-lg px-4 py-6 text-sm text-[#070707] hover:bg-gray-100">
//           <Star />
//           <div>
//             <span className="block text-[20px]">{filteredProjects.length}</span>
//             <span>Total projects</span>
//           </div>
//         </div>

//         <div className="w-1/4 flex gap-2 border rounded-lg px-4 py-6 text-sm text-[#070707] hover:bg-gray-100">
//           <AlignStartVertical />
//           <div>
//             <span className="block text-[20px]">100</span>
//             <span>Total departments</span>
//           </div>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
//         <div className="bg-white border rounded-xl p-5 shadow-sm">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-semibold text-lg">Staff applications card</h3>
//             <span className="text-xl"><EllipsisVertical /></span>
//           </div>
//         </div>

//         <div className="bg-white border rounded-xl p-5 shadow-sm">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-semibold text-lg">Annual payroll summary</h3>
//             <span className="text-xl"><EllipsisVertical /></span>
//           </div>
//         </div>

//         <div className="bg-white border rounded-xl p-5 shadow-sm">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-semibold text-lg">Total income</h3>
//             <span className="text-xl"><EllipsisVertical /></span>
//           </div>
//         </div>
//       </div>
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
//         <div className="bg-white border rounded-xl p-5 shadow-sm">
//           <h3 className="font-semibold mb-4">Recent requests</h3>
//           <table className="w-full text-sm">
//             <thead className="text-gray-500 border-b">
//               <tr>
//                 <th className="text-left py-2">S/N</th>
//                 <th className="text-left">Subject</th>
//                 <th>Date</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//             </tbody>
//           </table>
//         </div>

//         <div className="bg-white border rounded-xl p-5 shadow-sm">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="font-semibold">Budget history</h3>
//             <span><EllipsisVertical /></span>
//           </div>
//           <table className="w-full text-sm">
//             <thead className="text-gray-500 border-b">
//               <tr>
//                 <th>S/N</th>
//                 <th>Budget No</th>
//                 <th>Budgeted</th>
//                 <th>Actual</th>
//                 <th>Date</th>
//               </tr>
//             </thead>
//           </table>
//         </div>
//       </div>
//     </AdminLayout>
//   );
// }.