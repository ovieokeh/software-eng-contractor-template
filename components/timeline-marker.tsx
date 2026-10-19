export function TimelineMarker({
  icon,
}: {
  icon: "phone" | "timer" | "rocket" | "check" | "lock";
}) {
  return (
    <span className="engagement-marker" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        {icon === "lock" && (
          <>
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
          </>
        )}
        {icon === "check" && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12 3 3 5-6" />
          </>
        )}
        {icon === "phone" && (
          <path d="M6.7 3.7 9 6 7.5 8.3a16 16 0 0 0 8.2 8.2L18 15l2.3 2.3-1.4 3a1.5 1.5 0 0 1-1.7.8C9.9 19.3 4.7 14.1 2.9 6.8a1.5 1.5 0 0 1 .8-1.7l3-1.4Z" />
        )}
        {icon === "timer" && (
          <>
            <circle cx="12" cy="13" r="8" />
            <path d="M12 13V9m0 4 3 2M9 2h6m-3 0v3m6.5.5L20 7" />
          </>
        )}
        {icon === "rocket" && (
          <>
            <path d="M12 3c3 2 5 5.5 5 9v5H7v-5c0-3.5 2-7 5-9Z" />
            <circle cx="12" cy="10" r="1.5" />
            <path d="m7 14-3 3v2l3-1m10-4 3 3v2l-3-1m-7 0 2 4 2-4" />
          </>
        )}
      </svg>
    </span>
  );
}
