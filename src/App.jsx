import { Router, Route, Redirect, Switch } from "wouter";
import Login from "./components/Pages/Login";
import AdminDashboard from "./components/Pages/Admin/AdminDashboard";
import ManagementDashboard from "./components/Pages/Management/ManagementDashboard";
import Transactions from "./components/Pages/Transactions";
import EmployeeDashboard from "./components/Pages/Employees/EmployeeDashboard";
import Projects from "./components/Pages/Projects";
import TimeTracker from "./components/Pages/Employees/TimeTracker";
import EmployeeProject from "./components/Pages/Employees/EmployeeProject";
import { useUser } from "./components/Use-auth";
import Employees from "./components/Pages/TrackerEmployees";
import Account from "./components/Pages/Account";
import { DateRangeProvider } from "./components/Pages/DateRangeContext";
import ResetPassword from "./components/Pages/ResetPassword";
import HeartbeatAndAutoLogout from "./components/HeartbeatAndAutoLogout";
import HrDashBoard from "./components/Pages/Hr/HrDashBoard";
import HolidaysAndPolicies from "./components/Pages/Holidays & Policies";
import Setting from "./components/Pages/Setting";
import Category from "./components/Pages/Category";
import NotFound from "./components/Pages/not-found";

function ProtectedRoute({ component: Component, allowedRoles }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) return <div></div>;

  if (!user) return <Redirect to="/login" />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") return <Redirect to="/admin" />;
    if (user.role === "management") return <Redirect to="/management" />;
    if (user.role === "hr") return <Redirect to="/hr-dashboard" />;
    return <Redirect to="/dashboard" />;
  }

  return <Component />;
}

function HomeRedirect() {
  const { data: user, isLoading } = useUser();

  if (isLoading) return <div></div>;

  if (!user) return <Redirect to="/login" />;

  switch (user.role) {
    case "admin":
      return <Redirect to="/admin" />;
    case "management":
      return <Redirect to="/management" />;
    case "employee":
      return <Redirect to="/dashboard" />;
    default:
      return <Redirect to="/login" />;
  }
}

function PublicRoute({ component: Component }) {
  const { data: user, isLoading } = useUser();

  if (isLoading) return <div></div>;

  if (user) {
    switch (user.role) {
      case "admin":
        return <Redirect to="/admin" />;
      case "management":
        return <Redirect to="/management" />;
      case "hr":
        return <Redirect to="/hr-dashboard" />;
      case "employee":
        return <Redirect to="/dashboard" />;
      default:
        return <Redirect to="/" />;
    }
  }

  return <Component />;
}


function App() {

  return (
    <DateRangeProvider>
      <HeartbeatAndAutoLogout />
      <Router>
        <Switch>
          <Route path="/login">
            <PublicRoute component={Login} />
          </Route>

          <Route path="/admin">
            <ProtectedRoute component={AdminDashboard} allowedRoles={["admin"]} />
          </Route>

          <Route path="/setting">
            <ProtectedRoute component={Setting} allowedRoles={["admin", "management"]} />
          </Route>
          <Route path="/management">
            <ProtectedRoute
              component={ManagementDashboard}
              allowedRoles={["management"]}
            />
          </Route>
          <Route path="/transactions">
            <ProtectedRoute
              component={Transactions}
              allowedRoles={["admin", "management"]}
            />
          </Route>
          <Route path="/category">
            <ProtectedRoute
              component={Category}
              allowedRoles={["admin", "management"]}
            />
          </Route>
          <Route path="/hr-dashboard">
            <ProtectedRoute
              component={HrDashBoard}
              allowedRoles={["hr"]}
            />
          </Route>
          <Route path="/dashboard">
            <ProtectedRoute
              component={EmployeeDashboard}
              allowedRoles={["employee"]}
            />
          </Route>

          <Route path="/time-tracker">
            <ProtectedRoute
              component={TimeTracker}
              allowedRoles={["employee"]}
            />
          </Route>

          <Route path="/project">
            <ProtectedRoute
              component={EmployeeProject}
              allowedRoles={["employee"]}
            />
          </Route>
          <Route path="/projects">
            <ProtectedRoute
              component={Projects}
              allowedRoles={["admin", "management"]}
            />
          </Route>
          <Route path="/employees">
            <ProtectedRoute
              component={Employees}
              allowedRoles={["admin", "management", "hr"]}
            />
          </Route>
          <Route path="/account">
            <ProtectedRoute
              component={Account}
              allowedRoles={["admin", "management", "employee", "hr"]}
            />
          </Route>
          <Route path="/policies">
            <ProtectedRoute
              component={HolidaysAndPolicies}
              allowedRoles={["admin", "management", "employee", "hr"]}
            />
          </Route>

          <Route path="/reset-password/:token" component={ResetPassword} />
          <Route path="/" component={HomeRedirect} />
          <Route path="*" component={NotFound} />
        </Switch>
      </Router>
    </DateRangeProvider>
  );
}

export default App;
