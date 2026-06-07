"use client";

import { Calendar } from "lucide-react";

/**
 * Opens the <PropertyTourModal> (mounted on the property page) via the
 * `hasker:open-tour` event. A thin client wrapper so the server-rendered
 * detail page can trigger the tour modal.
 */
export function BookTourButton({
  className,
  label = "Schedule a tour",
  withIcon = true,
}: {
  className?: string;
  label?: string;
  withIcon?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("hasker:open-tour"))}
      className={className}
    >
      {withIcon && <Calendar size={15} />}
      {label}
    </button>
  );
}
