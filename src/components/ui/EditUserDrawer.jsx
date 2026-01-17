import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./Button";
import { Input } from "./Input";

export default function EditUserDrawer({ open, onClose, user, onSave }) {
    const [form, setForm] = useState({});
    const [image, setImage] = useState(null);
    const [showDrawer, setShowDrawer] = useState(open);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (open) {
            setShowDrawer(true);
            setTimeout(() => setAnimate(true), 10);
        } else {
            setAnimate(false);
            setTimeout(() => setShowDrawer(false), 300);
        }
    }, [open]);

    useEffect(() => {
        if (user) {
            setForm({ ...user, _id: user._id }); 
        }
    }, [user]);

    if (!showDrawer) return null;

    const handleSubmit = () => {
        const formData = new FormData();
        Object.keys(form).forEach((key) => {
            if (key !== "image") formData.append(key, form[key]);
        });
        if (image) formData.append("image", image);

        onSave(form._id, formData);
    };

    return (
        <div className="fixed inset-0 z-[999] flex">
            {/* Overlay */}
            <div
                onClick={onClose}
                className={`flex-1 bg-black/40 transition-opacity duration-300 ${animate ? "opacity-100" : "opacity-0"
                    }`}
            />

            {/* Drawer */}
            <div
                className={`w-[500px] bg-white p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out
          ${animate ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800">
                        Edit Employee
                    </h3>
                    <X
                        onClick={onClose}
                        className="cursor-pointer text-gray-600 hover:text-black"
                    />
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name</label>
                        <Input
                            value={form.fullName || ""}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Job Title</label>
                        <Input
                            value={form.title || ""}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <Input
                            type="email"
                            value={form.email || ""}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border rounded-md px-3 py-2"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                            value={form.role || ""}
                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="employee">Employee</option>
                            <option value="management">Management</option>
                            <option value="hr">HR</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Status</label>
                        <select
                            value={form.status || ""}
                            onChange={(e) => setForm({ ...form, status: e.target.value })}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Profile Image</label>
                        <Input type="file" onChange={(e) => setImage(e.target.files[0])} />
                    </div>

                    <Button
                        onClick={handleSubmit}
                        className="w-full bg-[#dbeafe] hover:bg-blue-200 text-gray-800 py-2 rounded-md transition"
                    >
                        Update User
                    </Button>
                </div>
            </div>
        </div>
    );
}
