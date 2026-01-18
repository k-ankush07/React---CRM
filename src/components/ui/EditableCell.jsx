import { useState, useRef, useEffect } from "react";

export default function EditableCell({ value, onSave, className = "", canUpdate = true, }) {
    const [editing, setEditing] = useState(false);
    const divRef = useRef(null);

    const handleClick = () => {
        if (!canUpdate) return;
        setEditing(true);
    };

    useEffect(() => {
        if (editing && divRef.current) {
            divRef.current.innerText = value || "";
            divRef.current.focus();

            const range = document.createRange();
            range.selectNodeContents(divRef.current);
            range.collapse(false);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }, [editing, value]);

    const startEditing = () => setEditing(true);

    const saveValue = () => {
        if (divRef.current) {
            const newValue = divRef.current.innerText;
            onSave(newValue);
        }
    };

    const handleBlur = () => {
        saveValue();
        setEditing(false);
    };

    return (
        <div
            className={`border-b p-2 cursor-pointer text-[14px] ${className}`}
            onClick={startEditing}
        >
            {editing && canUpdate ? (
                <div
                    ref={divRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    className="w-full h-full px-1 py-1"
                    style={{ minHeight: "1.5em" }}
                    onClick={handleClick}
                />
            ) : (
                value || "-"
            )}
        </div>
    );
}
