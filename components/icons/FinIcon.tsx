interface IconProps {
  className?: string;
  size?: number;
}

export default function FinIcon({ className, size = 48 }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M459.813,280.313c-15.891-127.141,73.141-263.063-48.922-238.047C140.234,97.688,35.875,365.126,0,472.735h512C512,472.735,476.125,410.767,459.813,280.313z" />
    </svg>
  );
}
