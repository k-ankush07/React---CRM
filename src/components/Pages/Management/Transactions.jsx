import ManagementLayout from "../ManagementLayout";
import { useTotalContracts } from "../../Use-auth";
import { useMemo, useState, useEffect, useRef } from "react";
import DateRangePicker from "../../ui/DateRangePicker";
import { CalendarRange, ChevronDown, CircleX } from "lucide-react";
import { Button } from "../../ui/Button";

const transactionTypes = [
    "Fixed-price",
    "Connects",
    "Hourly",
    "Withdrawal",
    "Bonus",
    "Refund to Client",
    "Adjustment",
];

function FilterDropdown({ label, options, selected, setSelected }) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const allSelected = selected.length === 0;

    const handleChange = (option, checked) => {
        if (checked) setSelected((prev) => [...prev, option]);
        else setSelected((prev) => prev.filter((o) => o !== option));
    };

    return (
        <div className="flex-1 min-w-[200px] relative" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                {label}
            </label>
            <div
                className="border rounded-md p-2 bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setOpen(!open)}
            >
                {allSelected
                    ? `All ${label}`
                    : selected.length === 1
                        ? selected[0]
                        : `(${selected.length} selected)`}
                <ChevronDown size={18} />
            </div>

            {open && (
                <div className="absolute mt-1 w-full bg-white border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
                        <input
                            type="checkbox"
                            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            checked={allSelected}
                            onChange={() => setSelected([])}
                        />
                        All {label}
                    </label>
                    {options.map((opt) => (
                        <label
                            key={opt}
                            className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                        >
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                checked={selected.includes(opt)}
                                onChange={(e) => handleChange(opt, e.target.checked)}
                            />
                            {opt}
                        </label>
                    ))}
                </div>
            )}

            {selected.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mt-2 bg-gray-100 p-2 rounded">
                    <div
                        className="flex items-center gap-[10px] cursor-pointer text-sm text-green-700 hover:underline"
                        onClick={() => setSelected([])}
                    >
                        <CircleX size={18} /> Clear All
                    </div>
                    {selected.map((opt) => (
                        <div
                            key={opt}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-sm bg-white border border-gray-300 hover:bg-gray-200 cursor-pointer"
                        >
                            {opt}
                            <CircleX
                                size={16}
                                className="text-gray-700"
                                onClick={() => setSelected((prev) => prev.filter((o) => o !== opt))}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Transactions() {
    const { data, isLoading } = useTotalContracts();
    const contracts = useMemo(() => data?.contracts || [], [data]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [selectedContractTitles, setSelectedContractTitles] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const getInitials = (name = "") => {
        if (!name) return "NA";
        const words = name.trim().split(" ");
        return words.length === 1
            ? words[0].slice(0, 2).toUpperCase()
            : (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const pendingEarnings = contracts
        .filter((c) => c.status === "Pending")
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const availableBalance = contracts
        .filter((c) => ["Completed", "In Progress"].includes(c.status))
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const clients = useMemo(
        () => [...new Set(contracts.map((c) => c.client?.name).filter(Boolean))],
        [contracts]
    );
    const contractTitles = useMemo(
        () => [...new Set(contracts.map((c) => c.contractDetails?.title).filter(Boolean))],
        [contracts]
    );

    const filteredContracts = useMemo(() => {
        let filtered = contracts;
        if (selectedRange) {
            const { startDate, endDate } = selectedRange;
            filtered = filtered.filter((c) => new Date(c.date) >= startDate && new Date(c.date) <= endDate);
        }
        if (selectedTypes.length) filtered = filtered.filter((c) => selectedTypes.includes(c.type));
        if (selectedClients.length) filtered = filtered.filter((c) => selectedClients.includes(c.client?.name));
        if (selectedContractTitles.length)
            filtered = filtered.filter((c) => selectedContractTitles.includes(c.contractDetails?.title));
        return filtered;
    }, [contracts, selectedRange, selectedTypes, selectedClients, selectedContractTitles]);

    const downloadCSV = () => {
        if (!filteredContracts.length) return;

        const headers = ["Date", "Type", "Contract / Details", "Client", "Status", "Amount"];

        const rows = filteredContracts.map((c) => [
            formatDate(c.date),
            c.type,
            `${c.contractDetails?.title || ""}${c.contractDetails?.subtitle ? " - " + c.contractDetails.subtitle : ""}`,
            c.client?.name || "",
            c.status,
            Number(c.amount || 0).toFixed(2),
        ]);

        const csvContent =
            [headers, ...rows]
                .map((row) => row.map((v) => `"${v}"`).join(","))
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ManagementLayout>
            <div className="relative h-[90.7vh]">
                <div className="relative z-20 h-full overflow-y-auto p-6 bg-white">
                    <div className="flex gap-6 mb-6">
                        <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">Pending earnings</p>
                            <p className="text-2xl font-semibold text-gray-800">${pendingEarnings.toFixed(2)}</p>
                        </div>
                        <div className="flex-1 border border-[#0f8a00] rounded-lg p-4 bg-white shadow-sm">
                            <p className="text-sm text-gray-500 mb-1">Available balance</p>
                            <p className="text-2xl font-semibold text-gray-800">${availableBalance.toFixed(2)}</p>
                        </div>

                    </div>

                    <div className="flex gap-[20px] mb-[20px]">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date range</label>
                            <div
                                className="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer text-sm text-gray-700"
                                onClick={() => setShowDatePicker(true)}
                            >
                                {selectedRange ? (
                                    <div className="flex items-center gap-2">
                                        <span>
                                            {new Date(selectedRange.startDate).toLocaleDateString()} →{" "}
                                            {new Date(selectedRange.endDate).toLocaleDateString()}
                                        </span>
                                        <Button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedRange(null);
                                            }}
                                            className="text-red-500 text-xs font-semibold px-2 py-0.5 bg-red-100 rounded"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <span>All time</span>
                                )}
                                <CalendarRange />
                            </div>
                            {showDatePicker && (
                                <div className="mt-2 z-50">
                                    <DateRangePicker
                                        open={showDatePicker}
                                        onApply={(range) => {
                                            setSelectedRange(range);
                                            setShowDatePicker(false);
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <FilterDropdown
                            label="Transactions Type"
                            options={transactionTypes}
                            selected={selectedTypes}
                            setSelected={setSelectedTypes}
                        />
                        <FilterDropdown label="Client" options={clients} selected={selectedClients} setSelected={setSelectedClients} />
                        <FilterDropdown
                            label="Contract"
                            options={contractTitles}
                            selected={selectedContractTitles}
                            setSelected={setSelectedContractTitles}
                        />
                        <div>
                            <Button
                                onClick={downloadCSV}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
                            >
                                Download CSV
                            </Button>
                        </div>
                    </div>

                    <h3 className="text-2xl font-semibold text-gray-800 mb-6">Transactions</h3>
                    <div className="flex items-center px-4 py-3 border-b text-sm font-medium text-gray-600">
                        <div className="w-[140px]">Date</div>
                        <div className="w-[160px]">Type</div>
                        <div className="flex-1">Contract / Details</div>
                        <div className="w-[300px]">Client</div>
                        <div className="w-[200px]">Status</div>
                        <div className="w-[100px] text-right">Amount</div>
                    </div>

                    {isLoading && <div className="py-6 text-center text-gray-500">Loading transactions...</div>}
                    {!isLoading &&
                        filteredContracts.map((item) => (
                            <div key={item._id} className="flex items-center px-4 py-4 border-b hover:bg-gray-50 transition">
                                <div className="w-[140px] text-sm text-gray-700">{formatDate(item.date)}</div>
                                <div className="w-[160px] text-sm font-medium text-gray-800">{item.type}</div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{item.contractDetails?.title}</p>
                                    <p className="text-xs text-gray-500">{item.contractDetails?.subtitle}</p>
                                </div>
                                <div className="w-[300px] flex items-center gap-2">
                                    <span className="w-[35px] h-[35px] flex items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700">
                                        {getInitials(item.client?.name)}
                                    </span>
                                    <span className="text-sm text-gray-800 truncate">{item.client?.name}</span>
                                </div>
                                <div className="w-[200px]">
                                    <span
                                        className={`px-3 py-1 text-xs rounded-full font-medium ${item.status === "Completed"
                                            ? "bg-green-100 text-green-700"
                                            : item.status === "Pending"
                                                ? "bg-blue-100 text-blue-700"
                                                : item.status === "In Progress"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-red-100 text-red-700"
                                            }`}
                                    >
                                        {item.status}
                                    </span>
                                </div>
                                <div className="w-[100px] text-right text-sm font-semibold text-[#0f8a00]">${item.amount}</div>
                            </div>
                        ))}
                    {!isLoading && filteredContracts.length === 0 && (
                        <div className="py-6 text-center text-gray-500">No transactions found</div>
                    )}
                </div>
            </div>
        </ManagementLayout>
    );
}












// import { useState } from "react";
// import ManagementLayout from "../ManagementLayout";
// import { useCreateContracts, useTotalContracts } from "../../Use-auth";
// import { Button } from "../../ui/Button";
// import { Input } from "../../ui/Input";
// import SuccessToast from "../../ui/SucessToast";

// export default function Transactions() {
//     const { mutateAsync: createContract } = useCreateContracts();
//     const { data: contractsData, refetch } = useTotalContracts();
//     console.log(contractsData)
//     const [form, setForm] = useState({
//         date: "",
//         type: "",
//         title: "",
//         subtitle: "",
//         clientName: "",
//         status: "Pending",
//         amount: 0,
//     });
//     const [loading, setLoading] = useState(false);
//     const [toastMessage, setToastMessage] = useState("");

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setForm((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();
//         setLoading(true);
//         try {
//             await new Promise((resolve) => setTimeout(resolve, 3000));
//             await createContract({
//                 date: form.date,
//                 type: form.type,
//                 contractDetails: { title: form.title, subtitle: form.subtitle },
//                 client: { name: form.clientName, initials: form.clientInitials },
//                 status: form.status,
//                 amount: form.amount,
//             });
//             setToastMessage("Contract created successfully!");
//             setForm({
//                 date: "",
//                 type: "",
//                 title: "",
//                 subtitle: "",
//                 clientName: "",
//                 status: "Pending",
//                 amount: 0,
//             });
//         } catch (err) {
//             console.error(err);
//             setToastMessage("Failed to create contract.");
//         } finally {
//             setLoading(false);
//             setTimeout(() => setToastMessage(""), 3000);
//         }
//     };

//     const inputClass =
//         "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200";

//     return (
//         <ManagementLayout>
//             <div className="relative h-[90.7vh]">
//                 <div className="relative z-20 h-full overflow-y-auto p-6">
//                      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Transactions</h3>
//                     {toastMessage && <SuccessToast message={toastMessage} />}
//                     <div className="p-6 border border-gray-300 rounded-lg shadow-md bg-white space-y-6 mb-[20px]">
//                         <form onSubmit={handleSubmit} className="space-y-4 text-[14px]">
//                             <div className="flex flex-wrap gap-4">
//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Date</label>
//                                     <Input
//                                         type="date"
//                                         name="date"
//                                         value={form.date}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         placeholder="Select Date"
//                                         required
//                                     />
//                                 </div>

//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Contract Type</label>
//                                     <select
//                                         name="type"
//                                         value={form.type}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         required
//                                     >
//                                         <option value="">Select Contract Type</option>
//                                         <option value="Fixed-price">Fixed-price</option>
//                                         <option value="Connects">Connects</option>
//                                         <option value="Hourly">Hourly</option>
//                                         <option value="Withdrawal">Withdrawal</option>
//                                         <option value="Bonus">Bonus</option>
//                                         <option value="Refund to Client">Refund to Client</option>
//                                         <option value="Adjustment">Adjustment</option>
//                                     </select>
//                                 </div>
//                             </div>

//                             <div className="flex flex-wrap gap-4">
//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Contract Title</label>
//                                     <Input
//                                         type="text"
//                                         name="title"
//                                         value={form.title}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         placeholder="Enter Contract Title"
//                                         required
//                                     />
//                                 </div>

//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Contract Subtitle</label>
//                                     <Input
//                                         type="text"
//                                         name="subtitle"
//                                         value={form.subtitle}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         placeholder="Enter Contract Subtitle"
//                                     />
//                                 </div>
//                             </div>

//                             <div className="flex flex-wrap gap-4">
//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Client Name</label>
//                                     <Input
//                                         type="text"
//                                         name="clientName"
//                                         value={form.clientName}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         placeholder="Enter Client Name"
//                                         required
//                                     />
//                                 </div>
//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Amount</label>
//                                     <Input
//                                         type="number"
//                                         name="amount"
//                                         value={form.amount}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                         placeholder="Enter Amount"
//                                         required
//                                     />
//                                 </div>
//                             </div>

//                             <div className="flex flex-wrap gap-4">

//                                 <div className="flex-1 flex flex-col">
//                                     <label className="mb-1 font-medium">Status</label>
//                                     <select
//                                         name="status"
//                                         value={form.status}
//                                         onChange={handleChange}
//                                         className={inputClass}
//                                     >
//                                         <option value="Pending">Pending</option>
//                                         <option value="Completed">Completed</option>
//                                         <option value="In Progress">In Progress</option>
//                                         <option value="Cancelled">Cancelled</option>
//                                     </select>
//                                 </div>
//                             </div>
//                             <div className="flex justify-end">
//                                 <Button
//                                     type="submit"
//                                     className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
//                                     disabled={loading}
//                                 >
//                                     {loading ? "Creating..." : "Create Contract"}
//                                 </Button>
//                             </div>
//                         </form>
//                     </div>
//                     <div>
//                         dddd
//                     </div>
//                 </div>
//             </div>
//         </ManagementLayout>
//     );
// }
 