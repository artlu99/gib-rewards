export const Caret = () => {
  return (
    <svg
      className="h-6 w-6 sm:h-5 sm:w-5 transition-transform group-open:rotate-180"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="2"
      stroke="currentColor"
      aria-label="Caret"
    >
      <title>Caret</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
      />
    </svg>
  );
};

export const Eyeball = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-1"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <title>Eyeball</title>
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export const Heart = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-1"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <title>Heart</title>
      <path
        fillRule="evenodd"
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        clipRule="evenodd"
      />
    </svg>
  );
};

export const Clock = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 ml-1"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <title>Clock</title>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
};

export const Flame = ({
  className = "h-4 w-4 ml-1",
  colorFrom = "#ff4500", // Fiery orange-red
  colorTo = "#ffcc00", // Bright yellow
}) => {
  const gradientId = `flameGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      viewBox="0 0 24 24"
      fill={`url(#${gradientId})`}
      stroke="none"
    >
      <title>Flame</title>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
      </defs>
      <path d="M12,2c0,0-7,5.09-7,11c0,3.97,3.14,7,7,7s7-3.03,7-7C19,7.09,12,2,12,2z" />
      <path
        d="M12,5c0,0-3.5,3.5-3.5,6.5c0,1.93,1.57,3.5,3.5,3.5s3.5-1.57,3.5-3.5C15.5,8.5,12,5,12,5z"
        fill="#ffffaa"
        opacity="0.6"
      />
    </svg>
  );
};
