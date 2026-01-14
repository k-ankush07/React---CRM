const tabs = [
    { id: "calendar", label: "Calendar" },
    { id: "list", label: "List" },
    { id: "team", label: "Team" },
];

export default function ProjectTab({ active, setActive }) {
    return (
        <div className="flex gap-6 border-b border-gray-200 mb-[20px]">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`
                 pb-3 text-sm font-medium transition
                 ${active === tab.id
                            ? "border-b-2 border-black text-black"
                            : "border-b-2 border-transparent text-gray-500 hover:text-black"
                        }
               `}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    )
}
