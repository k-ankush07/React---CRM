import AdminLayout from "../Pages/AdminLayout";
import ManagementLayout from "../Pages/ManagementLayout";
import EmployeeLayout from "../Pages/EmployeeLayout";
import HrLayout from "../Pages/HrLayout";
import { useUser } from "../Use-auth";

export default function RoleBasedLayout({ children }) {
  const { data: user } = useUser();

  if (!user) return null;

  switch (user.role) {
    case "admin":
      return <AdminLayout>{children}</AdminLayout>;

    case "management":
      return <ManagementLayout>{children}</ManagementLayout>;

    case "hr":
      return <HrLayout>{children}</HrLayout>;

    case "employee":
      return <EmployeeLayout>{children}</EmployeeLayout>;

    default:
      return <>{children}</>;
  }
}
