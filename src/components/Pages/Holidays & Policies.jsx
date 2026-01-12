import React, { useState, useEffect } from "react";
import RoleBasedLayout from "./RoleBasedLayout";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import ReactQuill from "../ui/RichText";
import { useHoliday, useTotalHolidays, useUpdateHoliday, useDeleteHoliday, useUser } from "../Use-auth";
import SucessToast from "../ui/SucessToast";
import { Pencil, Trash2 } from "lucide-react";
import { useDateRange } from "./DateRangeContext";

export default function HolidaysAndPolicies() {
    const [form, setForm] = useState({
        title: "",
        date: "",
        description: "",
        type: "holiday",
    });
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const { mutate: createHoliday } = useHoliday();
    const { data: holidaysData, refetch } = useTotalHolidays();
    const { mutate: updateHoliday } = useUpdateHoliday();
    const { mutate: deleteHoliday } = useDeleteHoliday();
    const { data: user } = useUser();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const { start, end } = useDateRange();

    const isHR = user?.role === "hr";
    // Fetch existing holidays on mount
    useEffect(() => {
        if (holidaysData?.holidays) {
            setHolidays(holidaysData.holidays);
        }
    }, [holidaysData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleDescriptionChange = (value) => {
        setForm((prev) => ({ ...prev, description: value }));
    };

    const handleHoliday = (e) => {
        e.preventDefault();
        setLoading(true);


        if (editingIndex !== null) {
            const holidayId = holidays[editingIndex]._id;

            updateHoliday(
                { id: holidayId, body: form },
                {
                    onSuccess: (data) => {
                        setHolidays((prev) =>
                            prev.map((item, idx) =>
                                idx === editingIndex ? data.holiday : item
                            )
                        );

                        setEditingIndex(null);
                        setForm({ title: "", date: "", description: "", type: "holiday" });
                        setLoading(false);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                    },
                    onError: (error) => {
                        console.error("Error updating holiday:", error);
                        setLoading(false);
                    },
                }
            );
        }
        else {
            createHoliday(
                { ...form },
                {
                    onSuccess: (data) => {
                        setHolidays((prev) => [...prev, { ...form }]);
                        setToastMessage(
                            form.type === "holiday"
                                ? "Holiday added successfully!"
                                : form.type === "policy"
                                    ? "Policy added successfully!"
                                    : "Optional added successfully!"
                        );
                        setForm({ title: "", date: "", description: "", type: "holiday" });
                        setLoading(false);
                        setShowToast(true);
                        setTimeout(() => setShowToast(false), 3000);
                    },
                    onError: (error) => {
                        console.error("Error creating holiday:", error);
                        setLoading(false);
                    },
                }
            );
        }
    };

    const handleEdit = (index) => {
        setShowPopup(true);
        const item = holidays[index];
        setForm({
            title: item.title,
            date: item.date.split("T")[0],
            description: item.description,
            type: item.type,
        });
        setEditingIndex(index);
    };

    const handleDelete = (index) => {
        const holiday = holidays[index];

        if (!holiday?._id) {
            console.error("Invalid holiday ID", holiday);
            return;
        }

        const confirmDelete = window.confirm(
            `Are you sure you want to delete "${holiday.title}"?`
        );

        if (!confirmDelete) return;

        deleteHoliday(holiday._id, {
            onSuccess: () => {
                setHolidays((prev) => prev.filter((_, i) => i !== index));
                setToastMessage("Holiday deleted successfully!");
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            },
            onError: (error) => {
                console.error("Error deleting holiday:", error);
            },
        });
    };

    const filteredHolidays = holidays.filter((holiday) => {
        if (!start || !end) return true;
        const holidayDate = new Date(holiday.date);
        return holidayDate >= start && holidayDate <= end;
    });

    const holidaysByMonth = filteredHolidays.reduce((acc, holiday) => {
        const date = new Date(holiday.date);
        const monthKey = date.toLocaleString("default", { month: "long", year: "numeric" });

        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(holiday);

        return acc;
    }, {});

    return (
        <RoleBasedLayout >
            <div className="relative h-[90.7vh] bg-gray-50 overflow-hidden">
                <div className="relative z-20 h-full overflow-y-auto p-6 space-y-8">
                    {isHR && (<div>
                        <Button onClick={() => setShowPopup(true)} className="flex items-center justify-center gap-2 mb-[10px] px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200" >
                            Add New Holiday & Policy </Button>
                        {showPopup && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Holidays & Policies</h3>
                                <form
                                    onSubmit={handleHoliday}
                                    className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-end"
                                >
                                    <Input
                                        name="title"
                                        placeholder="Holiday Title"
                                        value={form.title}
                                        onChange={handleChange}
                                        required
                                        className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                                    />
                                    <Input
                                        type="date"
                                        name="date"
                                        value={form.date}
                                        onChange={handleChange}
                                        required
                                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                                    />
                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={handleChange}
                                        className="col-span-1 md:col-span-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200"
                                    >
                                        <option value="holiday">Holiday</option>
                                        <option value="policy">Policy</option>
                                        <option value="optional">Optional</option>
                                    </select>

                                    <div className="col-span-3">
                                        <ReactQuill
                                            theme="snow"
                                            value={form.description}
                                            onChange={handleDescriptionChange}
                                            placeholder="Description (optional)"
                                            className="h-32 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#fbe5e9]"
                                        />
                                    </div>

                                    <div className="col-span-3 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                                        >
                                            {loading ? "Saving..." : editingIndex !== null ? "Update" : "Add"}
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setShowPopup(false);
                                                setEditingIndex(null);
                                                setForm({ title: "", date: "", description: "", type: "holiday" });
                                            }}
                                            className="flex items-center justify-center gap-2 px-4 py-2 ml-[10px] rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                                        >
                                            Cancel
                                        </Button>

                                    </div>
                                </form>
                            </div>)}
                    </div>)}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Holiday List</h3>
                        {Object.keys(holidaysByMonth).length === 0 ? (
                            <p className="text-gray-500 text-sm">No holidays added yet.</p>
                        ) : (
                            <div className="space-y-6">
                                {Object.entries(holidaysByMonth).map(([month, monthHolidays]) => (
                                    <div
                                        key={month}
                                        className="border rounded-xl p-5 bg-gray-50"
                                    >
                                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                                            {month}
                                        </h3>
                                        <div className="space-y-3">
                                            {monthHolidays.map((item, index) => (
                                                <div
                                                    key={item._id}
                                                    className="flex justify-between items-start bg-white border rounded-lg p-4"
                                                >
                                                    <div>
                                                        <h4 className="font-medium text-gray-800">
                                                            {item.title}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(item.date).toDateString()}
                                                        </p>

                                                        {item.description && (
                                                            <div
                                                                className="text-sm text-gray-600 mt-1"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: item.description,
                                                                }}
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                                            {item.type}
                                                        </span>

                                                        <Pencil
                                                            size={18}
                                                            className="cursor-pointer text-blue-500"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    holidays.findIndex(
                                                                        (h) => h._id === item._id
                                                                    )
                                                                )
                                                            }
                                                        />

                                                        <Trash2
                                                            size={18}
                                                            className="cursor-pointer text-red-500 hover:text-red-700"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    holidays.findIndex(
                                                                        (h) => h._id === item._id
                                                                    )
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {showToast && <SucessToast message={toastMessage} />}
            </div>
        </RoleBasedLayout >
    );
}
