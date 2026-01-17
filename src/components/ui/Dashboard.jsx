import { useUser } from "../Use-auth";
import { Calendar, Upload, X } from "lucide-react";
import { useDateRange } from "../Pages/DateRangeContext";

function formatDate(date) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
    const { data: user } = useUser();
    const { rangeType, setRangeType, start, end } = useDateRange();
    const today = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    return (
        <div className="flex items-center justify-between fixed z-[9] w-[87%]  bg-[#fdf9fb] shadow-sm p-[16px] mb-[20px]">
            <div>
                <h1 className="text-xl font-bold text-[#850002]">Welcome {user?.fullName}!</h1>
                <p className="text-sm text-gray-500">Today is {today}</p>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex items-center gap-2 border rounded-lg px-3 py-2 text-sm bg-gray-50">
                    <Calendar
                        className="w-4 h-4 text-gray-600 cursor-pointer" />
                    <span className="text-gray-700">
                        {formatDate(start)} – {formatDate(end)}
                    </span>

                    <select
                        value={rangeType}
                        onChange={(e) => setRangeType(e.target.value)}
                        className="bg-transparent font-medium outline-none cursor-pointer"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                {/* <button className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm text-[#580406] hover:bg-gray-100">
                    <Upload className="w-4 h-4" />
                    Export
                </button> */}
                <div className="flex items-center gap-2  hover:bg-gray-100 px-3 py-2 rounded-lg"  >
                    {user.image ? (<img
                        src={user.image}
                        alt="profile"
                        className="w-10 h-10 rounded-full object-cover"
                    />) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm font-semibold text-gray-700 border">
                            {user.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                        </div>
                    )}
                    <div className="text-sm">
                        <p className="font-semibold">{user?.fullName}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
