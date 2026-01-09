import React, { useState } from "react";
import HrLayout from "../HrLayout";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";
import ReactQuill from "../../ui/RichText";
import { useHoliday } from "../../Use-auth";

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

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleDescriptionChange = (value) => {
        setForm({ ...form, description: value });
    };

    const handleHoliday = (e) => {
        e.preventDefault();
        setLoading(true);

        createHoliday({
            title: form.title,
            date: form.date,
            description: form.description,
            type: form.type,
        }, {
            onSuccess: (data) => {
                setHolidays((prev) => [...prev, data]);
                setForm({ title: "", date: "", description: "", type: "holiday" });
                setLoading(false);
            },
            onError: (error) => {
                console.error("Error creating holiday:", error);
                setLoading(false);
            },
        });
    };

    return (
        <HrLayout>
            <div className="relative h-[90.7vh] bg-gray-50 overflow-hidden">
                <div className="relative z-20 h-full overflow-y-auto p-6 space-y-8">
                    <h3 className="text-lg font-semibold text-gray-800">
                        Holidays & Policies
                    </h3>
                    <form
                        onSubmit={handleHoliday}
                        className="bg-white rounded-xl shadow-md p-6 grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
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
                                disabled={loading}
                                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
                            >
                                {loading ? "Saving..." : "Add"}
                            </Button>
                        </div>
                    </form>


                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Holiday List</h3>
                        {holidays.length === 0 ? (
                            <p className="text-gray-500 text-sm">No holidays added yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {holidays.map((item, index) => (
                                    <div
                                        key={index}
                                        className="flex justify-between items-start border rounded-lg p-4 hover:bg-gray-50"
                                    >
                                        <div>
                                            <h3 className="font-medium text-gray-800">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.date).toDateString()}
                                            </p>
                                            {item.description && (
                                                <div
                                                    className="text-sm text-gray-600 mt-1"
                                                    dangerouslySetInnerHTML={{ __html: item.description }}
                                                />
                                            )}
                                        </div>

                                        <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                                            {item.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HrLayout>
    );
}
