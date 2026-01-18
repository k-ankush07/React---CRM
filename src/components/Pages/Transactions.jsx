import { useState, useMemo, useEffect, useRef } from "react";
import ManagementLayout from "./ManagementLayout";
import {
    useCreateContracts, useTotalContracts, useDeleteContract,
    useUpdateContract, useGetPermissions, useUser
} from "../Use-auth";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import SuccessToast from "../ui/SucessToast";
import DateRangePicker from "../ui/DateRangePicker";
import { CalendarRange, ChevronDown, CircleX, Trash2, Pencil } from "lucide-react";
import { useDateRange } from "./DateRangeContext";
import Papa from "papaparse";

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
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">{label}</label>
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
                        <label key={opt} className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer">
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
    const { start, end } = useDateRange();
    const { data: contractsData, refetch } = useTotalContracts();
    const { mutateAsync: createContract } = useCreateContracts();
    const { mutate: deleteContract } = useDeleteContract();
    const { mutateAsync: updateContract } = useUpdateContract();
    const { data: existingPermissions, } = useGetPermissions();
    const { data: user } = useUser();
    const [editingContract, setEditingContract] = useState(null);

    const [showCreateForm, setShowCreateForm] = useState(false);

    const contracts = useMemo(() => contractsData?.contracts || [], [contractsData]);
    const [form, setForm] = useState({
        date: "",
        type: "",
        title: "",
        subtitle: "",
        clientName: "",
        status: "Pending",
        amount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedClients, setSelectedClients] = useState([]);
    const [selectedContractTitles, setSelectedContractTitles] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedRange, setSelectedRange] = useState(null);

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
        isAdmin || currentUserPermissions?.management?.transaction_view === true;
    const canViewManagerNew =
        isAdmin || currentUserPermissions?.management?.transaction_new === true;

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
    const getInitials = (name = "") => {
        if (!name) return "NA";
        const words = name.trim().split(" ");
        return words.length === 1
            ? words[0].slice(0, 2).toUpperCase()
            : (words[0][0] + words[words.length - 1][0]).toUpperCase();
    };

    const clients = useMemo(() => [...new Set(contracts.map((c) => c.client?.name).filter(Boolean))], [contracts]);
    const contractTitles = useMemo(() => [...new Set(contracts.map((c) => c.contractDetails?.title).filter(Boolean))], [contracts]);

    // Filtered contracts
    const filteredContracts = useMemo(() => {
        let filtered = contracts;

        if (selectedRange?.startDate && selectedRange?.endDate) {
            const startDate = new Date(selectedRange.startDate);
            const endDate = new Date(selectedRange.endDate);
            endDate.setHours(23, 59, 59, 999);

            filtered = filtered.filter((c) => {
                if (!c.createdAt) return false;
                const createdAt = new Date(c.createdAt);
                return createdAt >= startDate && createdAt <= endDate;
            });
        }

        if (selectedTypes.length)
            filtered = filtered.filter((c) => selectedTypes.includes(c.type));

        if (selectedClients.length)
            filtered = filtered.filter((c) => selectedClients.includes(c.client?.name));

        if (selectedContractTitles.length)
            filtered = filtered.filter((c) =>
                selectedContractTitles.includes(c.contractDetails?.title)
            );

        return filtered;
    }, [contracts, selectedRange, selectedTypes, selectedClients, selectedContractTitles]);

    // Earnings & balance
    const pendingEarnings = useMemo(() => {
        return filteredContracts
            .filter((c) => c.status === "Pending")
            .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    }, [filteredContracts]);

    const availableBalance = useMemo(() => {
        return filteredContracts
            .filter((c) => ["Completed", "In Progress"].includes(c.status))
            .reduce((sum, c) => sum + Number(c.amount || 0), 0);
    }, [filteredContracts]);

    // CSV download
    const downloadCSV = () => {
        if (!filteredContracts.length) return;

        const headers = [
            "Date",
            "Type",
            "Contract Title",
            "Contract Subtitle",
            "Client",
            "Status",
            "Amount",
        ];

        const rows = filteredContracts.map((c) => [
            formatDate(c.date),
            c.type,
            c.contractDetails?.title || "",
            c.contractDetails?.subtitle || "",
            c.client?.name || "",
            c.status,
            Number(c.amount || 0).toFixed(2),
        ]);

        const csvContent = [headers, ...rows]
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let response;
            if (editingContract) {
                response = await updateContract({
                    id: editingContract._id,
                    date: form.date,
                    type: form.type,
                    contractDetails: { title: form.title, subtitle: form.subtitle },
                    client: { name: form.clientName, initials: getInitials(form.clientName) },
                    status: form.status,
                    amount: Number(form.amount),
                });
                console.log("Update response:", response);
                setToastMessage("Contract updated successfully!");
                setEditingContract(null);
            } else {
                response = await createContract({
                    date: form.date,
                    type: form.type,
                    contractDetails: { title: form.title, subtitle: form.subtitle },
                    client: { name: form.clientName, initials: getInitials(form.clientName) },
                    status: form.status,
                    amount: Number(form.amount),
                });
                console.log("Create response:", response);
                setToastMessage("Contract created successfully!");
            }

            setForm({ date: "", type: "", title: "", subtitle: "", clientName: "", status: "Pending", amount: 0 });
            refetch();
        } catch (err) {
            console.error("Error caught:", err);
            setToastMessage("Failed to create/update contract.");
        } finally {
            setLoading(false);
            setTimeout(() => setToastMessage(""), 3000);
        }
    };

    const handleDelete = (index) => {
        const contractToDelete = filteredContracts[index];
        if (!contractToDelete) return;
        const clientName = contractToDelete.client?.name || "Unknown Client";

        const confirmDelete = window.confirm(
            `Are you sure you want to delete the contract for "${clientName}"?`
        );

        if (confirmDelete) {
            deleteContract(contractToDelete._id, {
                onSuccess: () => refetch(),
                onError: (err) => alert("Failed to delete contract: " + err.message),
            });
        }
    };

    const handleCSVUpload = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) =>
                header.trim().toLowerCase().replace(/\s+/g, "_"),
            complete: async (results) => {
                try {
                    for (const row of results.data) {
                        if (!row.contract_title) {
                            console.warn("Skipping row (no title):", row);
                            continue;
                        }

                        await createContract({
                            date: row.date
                                ? new Date(row.date).toISOString()
                                : new Date().toISOString(),
                            type: row.type,
                            contractDetails: {
                                title: row.contract_title,
                                subtitle: row.contract_subtitle || "",
                            },
                            client: {
                                name: row.client,
                                initials: getInitials(row.client),
                            },
                            status: row.status || "Pending",
                            amount: Number(row.amount || 0),
                        });
                    }

                    setToastMessage("CSV imported successfully!");
                    refetch();
                } catch (err) {
                    console.error("CSV import error:", err);
                    setToastMessage("CSV import failed");
                }
            },
        });
    };

    const inputClass =
        "w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#fbe5e9] transition duration-200";

    return (
        <ManagementLayout>
            <div className="relative h-[90.7vh] bg-gray-50 overflow-hidden">
                <div
                    className="absolute w-full h-[100%] opacity-[0.1] z-[99]  bg-[url('https://www.hubsyntax.com/uploads/policies.jfif')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
                ></div>
                <div className="relative z-[99] h-full overflow-y-auto p-6 space-y-8">
                    {toastMessage && <SuccessToast message={toastMessage} />}

                   {canViewManagerNew && ( <>
                        <div className="mb-4 flex justify-end gap-[20px]">
                            <Button
                                onClick={() => setShowCreateForm((prev) => !prev)}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            >
                                {showCreateForm ? "Hide Create Contract" : "Show Create Contract"}
                            </Button>
                            <input
                                type="file"
                                accept=".csv"
                                hidden
                                id="csvInput"
                                onChange={(e) => handleCSVUpload(e.target.files[0])}
                            />
                            <Button
                                className="px-4 py-2 h-[40px] bg-green-600 text-white text-sm rounded hover:bg-green-700"
                                onClick={() => document.getElementById("csvInput").click()}
                            >
                                Import CSV
                            </Button>
                        </div>

                        {/* Create Contract Form */}
                        {(showCreateForm || editingContract) && (
                            <div className="p-6 border border-gray-300 rounded-lg shadow-md bg-white space-y-6 mb-[20px]">
                                <h3 className="text-2xl font-semibold text-gray-800 mb-4"> {editingContract ? "Edit Contract" : "Create Contract"}</h3>
                                <form onSubmit={handleSubmit} className="space-y-4 text-[14px]">
                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Date</label>
                                            <Input type="date" name="date" value={form.date} onChange={handleChange} className={inputClass} required />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Contract Type</label>
                                            <select name="type" value={form.type} onChange={handleChange} className={inputClass} required>
                                                <option value="">Select Contract Type</option>
                                                {transactionTypes.map((t) => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Contract Title</label>
                                            <Input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass} required />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Contract Subtitle</label>
                                            <Input type="text" name="subtitle" value={form.subtitle} onChange={handleChange} className={inputClass} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Client Name</label>
                                            <Input type="text" name="clientName" value={form.clientName} onChange={handleChange} className={inputClass} required />
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Amount</label>
                                            <Input type="number" name="amount" value={form.amount} onChange={handleChange} className={inputClass} required />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <div className="flex-1 flex flex-col">
                                            <label className="mb-1 font-medium">Status</label>
                                            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
                                                <option value="Pending">Pending</option>
                                                <option value="Completed">Completed</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-black bg-[#fbe5e9] hover:bg-[#fdf9fb] shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200" disabled={loading}>
                                            {loading ? (editingContract ? "Updating..." : "Creating...") : (editingContract ? "Update Contract" : "Create Contract")}
                                        </Button>
                                    </div>
                                </form>
                            </div>)}
                    </>)}

                    {/* Transactions Table & Filters */}
                   {canViewHome && ( <div className="mb-6">
                        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Transactions</h3>
                        <div className="flex gap-[20px] mb-[20px] flex-wrap text-[14px] text-gray-700">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date range</label>
                                <div
                                    className="flex items-center justify-between border rounded-md px-3 py-2 cursor-pointer text-sm text-gray-700"
                                    onClick={() => setShowDatePicker(true)}
                                >
                                    {selectedRange
                                        ? `${new Date(selectedRange.startDate).toLocaleDateString()} → ${new Date(selectedRange.endDate).toLocaleDateString()}`
                                        : "All time"}
                                    <CalendarRange />
                                </div>
                                {showDatePicker && (
                                    <div className="mt-2 z-50">
                                        <DateRangePicker
                                            open={showDatePicker}
                                            selectedRange={selectedRange}
                                            onApply={(range) => {
                                                setSelectedRange(range);
                                                setShowDatePicker(false);
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                            <FilterDropdown label="Transactions Type" options={transactionTypes} selected={selectedTypes} setSelected={setSelectedTypes} />
                            <FilterDropdown label="Client" options={clients} selected={selectedClients} setSelected={setSelectedClients} />
                            <FilterDropdown label="Contract" options={contractTitles} selected={selectedContractTitles} setSelected={setSelectedContractTitles} />

                        </div>

                        {/* Earnings */}
                        <div className="flex gap-6 mb-6">
                            <div className="flex-1 border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Pending earnings</p>
                                <p className="text-2xl font-semibold text-gray-800">${pendingEarnings.toFixed(2)}</p>
                            </div>
                            <div className="flex-1 border border-[#0f8a00] rounded-lg p-4 bg-white shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Available balance</p>
                                <p className="text-2xl font-semibold text-gray-800">${availableBalance.toFixed(2)}</p>
                            </div>
                            <Button onClick={downloadCSV} className="px-4 py-2 inline-block h-[40px] bg-green-600 text-white text-sm rounded hover:bg-green-700 transition">Download CSV</Button>
                        </div>

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                            <div className="flex items-center px-4 py-3 border-b text-sm font-medium text-gray-600">
                                <div className="w-[140px]">Date</div>
                                <div className="w-[160px]">Type</div>
                                <div className="flex-1">Contract / Details</div>
                                <div className="w-[300px]">Client</div>
                                <div className="w-[200px]">Status</div>
                                <div className="w-[100px] text-right">Amount</div>
                                <div className="w-[100px] text-right">Actions</div>
                            </div>

                            {filteredContracts.map((item) => (
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
                                    <div className="w-[100px] text-right text-sm">
                                        <div className="flex items-center gap-3 justify-end">
                                            <Pencil
                                                size={18}
                                                className="cursor-pointer text-blue-500"
                                                onClick={() => {
                                                    setEditingContract(item);
                                                    setForm({
                                                        date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
                                                        type: item.type || "",
                                                        title: item.contractDetails?.title || "",
                                                        subtitle: item.contractDetails?.subtitle || "",
                                                        clientName: item.client?.name || "",
                                                        status: item.status || "Pending",
                                                        amount: item.amount || 0,
                                                    });
                                                    setShowCreateForm(true);
                                                }}
                                            />

                                            <Trash2
                                                size={18}
                                                className="cursor-pointer text-red-500 hover:text-red-700"
                                                onClick={() =>
                                                    handleDelete(filteredContracts.findIndex((c) => c._id === item._id))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {filteredContracts.length === 0 && (
                                <div className="py-6 text-center text-gray-500">No transactions found</div>
                            )}
                        </div>
                    </div>)}
                </div>
            </div>
        </ManagementLayout>
    );
}
