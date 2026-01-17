import { useState, useRef, useEffect } from "react";
import { Sidebar } from "../SideBar";
import Dashboard from "../ui/Dashboard";
import { Button } from "../ui/Button";
import { Loader, Camera, PenLine } from "lucide-react";
import { Input } from "../ui/Input";
import { useQueryClient } from "@tanstack/react-query";
import {
  useUser, useForgotPassword, useCreateUser, useGetPermissions,
  useEditUser, useTotalStaff
} from "../Use-auth";

export default function Account() {
  const { data: user } = useUser();
  const { mutate, isLoading } = useForgotPassword();
  const { mutate: createUser } = useCreateUser();
  const { data: existingPermissions, } = useGetPermissions();
  const { mutate: editUser, } = useEditUser();
  const queryClient = useQueryClient();
  const { data: totalStaff = [] } = useTotalStaff();
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createNewUser, SetCreateNewUser] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editableDescription, setEditableDescription] = useState("");

  useEffect(() => {
    setEditableDescription(user?.description || "");
  }, [user?.description]);

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
    description: "",
  });

  const textareaRef = useRef(null);

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
      description,
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
    fd.append("description", description);

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
          description: ''
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

  const [profileImage, setProfileImage] = useState(user?.image || "");

  useEffect(() => {
    setProfileImage(user?.image || "");
  }, [user]);

  const handleImageChange = (file) => {
    const fd = new FormData();
    fd.append("image", file);

    const staffMember = totalStaff.find(staff => staff.userId === user.userId);

    if (!staffMember) {
      alert("User not found in staff list");
      return;
    }

    editUser(
      { userId: staffMember._id, formData: fd },
      {
        onSuccess: (updatedUser) => {
          setProfileImage(updatedUser.image);
          queryClient.setQueryData(["user"], (old) => ({
            ...old,
            image: updatedUser.image,
          }));
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  const handleDescriptionSave = () => {
    const staffMember = totalStaff.find(staff => staff.userId === user.userId);
    if (!staffMember) {
      alert("User not found in staff list");
      return;
    }

    const fd = new FormData();
    fd.append("description", editableDescription);

    editUser(
      { userId: staffMember._id, formData: fd },
      {
        onSuccess: (updatedUser) => {
          queryClient.setQueryData(["user"], (old) => ({
            ...old,
            description: updatedUser.description,
          }));
          setIsEditingDescription(false);
        },
        onError: (err) => alert(err.message),
      }
    );
  };

  useEffect(() => {
    if (isEditingDescription) {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
        textarea.focus();
      }
    }
  }, [isEditingDescription]);

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
                  <div className="flex mb-4 items-start">
                    <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden shadow-md flex-shrink-0">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="profile"
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-accent to-primary flex items-center justify-center text-white font-bold text-xl">
                          {user?.fullName?.[0] || "U"}
                        </div>
                      )}

                      <div className="absolute right-[9px] bottom-[9px]">
                        <label className="bg-white rounded-full p-1 shadow-md cursor-pointer hover:bg-gray-100 transition flex items-center justify-center">
                          <Camera size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files[0]) {
                                handleImageChange(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="ml-4 flex-1 flex flex-col gap-1">
                      <p className="font-semibold text-lg text-gray-800">{user?.fullName}</p>
                      <p className="text-gray-500 text-sm">{user?.role?.toUpperCase()}</p>
                      <div className="text-gray-500 text-sm w-full">
                        {isEditingDescription ? (
                          <textarea
                            ref={textareaRef}
                            value={editableDescription}
                            onChange={(e) => {
                              setEditableDescription(e.target.value);
                              const textarea = textareaRef.current;
                              if (textarea) {
                                textarea.style.height = "auto";
                                textarea.style.height = textarea.scrollHeight + "px";
                              }
                            }}
                            onBlur={handleDescriptionSave}
                            autoFocus
                            rows={1}
                            placeholder="add description"
                            className="w-full text-[12px] leading-[15px] bg-transparent border-0 resize-none focus:ring-0 focus:outline-none p-1 whitespace-pre-wrap overflow-auto"
                          />
                        ) : (
                          <div className="relative w-full group">
                            <p className="rounded transition w-full whitespace-pre-wrap text-[12px] leading-[15px]">
                              {editableDescription?.trim() ? editableDescription : "add description"}
                            </p>
                            <span
                              onClick={() => setIsEditingDescription(true)}
                              className="absolute right-[-11px] top-[-3px] -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer transition"
                            >
                              <PenLine size={16} color="#7b7b7b" />
                            </span>
                          </div>
                        )}
                      </div>
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
                              <option value="hr">HR</option>
                              <option value="management">Manager</option>
                              <option value="employee">Employee</option>
                            </select>
                          </div>

                          <Input
                            name="description"
                            placeholder="Description"
                            value={formData.description}
                            onChange={handleChange}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                          />

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