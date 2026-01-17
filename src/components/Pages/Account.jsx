import { useUser, useForgotPassword, useCreateUser, useGetPermissions } from "../Use-auth";
import { useState } from "react";
import { Sidebar } from "../SideBar";
import Dashboard from "../ui/Dashboard";
import { Button } from "../ui/Button";
import { Loader } from "lucide-react";
import { Input } from "../ui/Input";

export default function Account() {
  const { data: user } = useUser();
  const { mutate, isLoading } = useForgotPassword();
  const { mutate: createUser } = useCreateUser();
  const { data: existingPermissions, } = useGetPermissions();
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createNewUser, SetCreateNewUser] = useState(false);
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    password: "",
    role: "",
    fullName: "",
    title: "",
    email: "",
    status: "active",
    image: null,
  });

  const handleChangePassword = () => {
    if (!user?.email) return;

    setLoading(true);

    mutate(user.email, {
      onSuccess: () => {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setLoading(false);
      },
      onError: (err) => {
        alert(err.message);
        setLoading(false);
      },
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      setFormData((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateUser = (e) => {
    e.preventDefault();

    const {
      userId,
      username,
      password,
      role,
      fullName,
      title,
      email,
      status,
      image,
    } = formData;

    if (!userId || !username || !password || !email || !role || !fullName || !title) {
      alert("Please fill in all fields");
      return;
    }

    const fd = new FormData();
    fd.append("userId", userId);
    fd.append("username", username);
    fd.append("password", password);
    fd.append("role", role);
    fd.append("fullName", fullName);
    fd.append("title", title);
    fd.append("email", email);
    fd.append("status", status);

    if (image) {
      fd.append("image", image);
    }

    createUser(fd, {
      onSuccess: () => {
        setMessage(true);
        setTimeout(() => setMessage(false), 3000);
        setFormData({
          userId: "",
          username: "",
          password: "",
          role: "",
          fullName: "",
          title: "",
          email: "",
          status: "active",
          image: null,
        });
      },
      onError: (err) => alert(err.message),
    });
  };

  const isEmployee = user.role === "employee";

  const handleNewUser = () => {
    SetCreateNewUser(prve => !prve);
  }

  const isAdmin = user?.role === "admin";
  console.log(existingPermissions)
  const currentUserPermissions = isAdmin
    ? {
      management: {
        manager_view: true,
        manager_time: true,
      },
    }
    : existingPermissions?.find(p => p.userId === user?.userId);

  const canViewHome =
    isAdmin || currentUserPermissions?.management?.account_new === true;

  const canViewManagerupdate =
    isAdmin || currentUserPermissions?.management?.account_update === true;

  return (
    <div className="flex min-h-screen bg-background/50">
      <Sidebar />
      <div className="flex-1 bg-[#FFFF]">
        <div>
          <Dashboard />
          <div className="pt-[88px]">
            <div className="relative h-[90.7vh]">
              <div
                className="absolute w-full h-[100%] opacity-[0.2] bg-[url('https://www.hubsyntax.com/uploads/accountimg.jpg')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
              ></div>
              <div className=" h-full overflow-y-auto p-6">
                <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-200 max-w-lg mx-auto relative z-20">
                  <div className="flex items-center mb-4">
                    <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden shadow-md">
                      {user?.image ? (
                        <img
                          src={user?.image}
                          alt="profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold text-xl">
                          {user?.fullName?.[0] || "U"}
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <p className="font-semibold text-lg text-gray-800">{user?.fullName}</p>
                      <p className="text-gray-500 text-sm">{user?.role?.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">User ID:</span> {user?.userId}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Email:</span> {user?.email}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={handleChangePassword}
                      disabled={loading}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200`}
                    >
                      {loading ? <Loader className="animate-spin h-5 w-5" /> : "Change Password"}
                    </Button>

                    {sent && (
                      <p className="mt-2 text-green-600 text-sm font-medium">
                        Password reset email sent successfully!
                      </p>
                    )}
                  </div>

                  {canViewHome && (<> {!isEmployee && (
                    <div className="pt-6">
                      <Button
                        onClick={handleNewUser}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200`}                  >
                        {createNewUser ? "Close Form" : "Create New User"}
                      </Button>

                      {createNewUser && (
                        <form
                          onSubmit={handleCreateUser}
                          className="mt-4 p-6 bg-white border border-gray-200 rounded-xl shadow-md space-y-4 transition-all duration-500"
                        >
                          <h3 className="text-lg font-semibold text-gray-800">Create New User</h3>

                          <div className="grid grid-cols-2 gap-3">
                            <Input
                              name="userId"
                              placeholder="User ID"
                              required
                              value={formData.userId}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              name="username"
                              placeholder="Username"
                              required
                              value={formData.username}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              name="password"
                              type="password"
                              placeholder="Password"
                              required
                              value={formData.password}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              name="fullName"
                              placeholder="Full Name"
                              required
                              value={formData.fullName}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              name="title"
                              placeholder="Title"
                              required
                              value={formData.title}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              name="email"
                              type="email"
                              placeholder="Email"
                              required
                              value={formData.email}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <Input
                              type="file"
                              name="image"
                              accept="image/*"
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            />

                            <select
                              name="role"
                              required
                              value={formData.role}
                              onChange={handleChange}
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                            >
                              <option value="">Select Role</option>
                              <option value="admin">Admin</option>
                              <option value="management">Manager</option>
                              <option value="employee">Employee</option>
                            </select>
                          </div>

                          <Button
                            type="submit"
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200`}
                          >
                            Submit
                          </Button>
                          {message && (
                            <p className="mt-2 text-green-600 text-sm font-medium">
                              User created successfully!
                            </p>
                          )}
                        </form>
                      )}
                    </div>
                  )}</>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}