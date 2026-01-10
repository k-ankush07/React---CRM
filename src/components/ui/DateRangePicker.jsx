import React, { useEffect, useRef } from "react";
import $ from "jquery";
import "daterangepicker/daterangepicker.css";
import "daterangepicker";
import moment from "moment";

export default function DateRangePicker({ onApply, open }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const $input = $(inputRef.current);

    $input.daterangepicker(
      {
        opens: "right",
        autoUpdateInput: true,
        alwaysShowCalendars: true,
        locale: {
          format: "DD-MM-YYYY",
          cancelLabel: "Clear",
        },
        ranges: {
          Today: [moment(), moment()],
          Yesterday: [moment().subtract(1, "days"), moment().subtract(1, "days")],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days": [moment().subtract(29, "days"), moment()],
          "Last Month": [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ],
        },
      },
      function (start, end) {
        onApply?.({ startDate: start.toDate(), endDate: end.toDate() });
      }
    );

    return () => {
      $input.data("daterangepicker")?.remove();
    };
  }, [onApply]);

  useEffect(() => {
    if (open) {
      $(inputRef.current).data("daterangepicker")?.show();
    }
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="text"
        className="border rounded-md px-3 py-2 text-sm w-64 cursor-pointer"
        placeholder="Select date range or use presets"
        readOnly
      />
    </div>
  );
}
