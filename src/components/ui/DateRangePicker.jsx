import React, { useEffect, useRef } from "react";
import $ from "jquery";
import "daterangepicker/daterangepicker.css";
import "daterangepicker";
import moment from "moment";

export default function DateRangePicker({ onApply, open, selectedRange }) {
  const inputRef = useRef(null);

  useEffect(() => {
    const $input = $(inputRef.current);

    $input.daterangepicker(
      {
        opens: "right",
        autoUpdateInput: false,
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
        onApply?.({
          startDate: start.toDate(),
          endDate: end.toDate(),
        });
      }
    );

    return () => {
      $input.data("daterangepicker")?.remove();
    };
  }, []);


  useEffect(() => {
    const picker = $(inputRef.current).data("daterangepicker");
    if (!picker) return;

    if (selectedRange) {
      picker.setStartDate(moment(selectedRange.startDate));
      picker.setEndDate(moment(selectedRange.endDate));
    }

    if (open) {
      picker.show();
    }
  }, [open, selectedRange]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        readOnly
        className="absolute opacity-0 pointer-events-none w-0 h-0"
      />
    </div>
  );
}
