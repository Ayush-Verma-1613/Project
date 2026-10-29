const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function CalendarIcon(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  );
}

export function PlusIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

export function BriefcaseIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

export function SendIcon(props) {
  return (
    <svg {...base} width={19} height={19} {...props}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function ArrowRightIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function CheckCircleIcon(props) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.2 2.2 4.8-5" />
    </svg>
  );
}

export function XCircleIcon(props) {
  return (
    <svg {...base} width={20} height={20} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.3 9.3 5.4 5.4m0-5.4-5.4 5.4" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg {...base} width={16} height={16} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function CloseIcon(props) {
  return (
    <svg {...base} width={13} height={13} {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function SunIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon(props) {
  return (
    <svg {...base} width={18} height={18} {...props}>
      <path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg {...base} width={15} height={15} {...props}>
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  );
}

export function InboxIcon(props) {
  return (
    <svg {...base} width={34} height={34} strokeWidth={1.3} {...props}>
      <path d="M4 13h4l2 3h4l2-3h4" />
      <path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4z" />
    </svg>
  );
}
