const Ic = ({ d, size = 20, color = "currentColor", ...p }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>{d}</svg>
);

export const IcoHome = (p: any) => <Ic {...p} d={<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>} />;
export const IcoUsers = (p: any) => <Ic {...p} d={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>} />;
export const IcoBar = (p: any) => <Ic {...p} d={<><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>} />;
export const IcoTrophy = (p: any) => <Ic {...p} d={<><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 19.24 7 20v2" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 19.24 17 20v2" /><path d="M18 2H6v7a6 6 0 1012 0V2Z" /></>} />;
export const IcoPlay = (p: any) => <Ic {...p} d={<><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></>} />;
export const IcoPlus = (p: any) => <Ic {...p} d={<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>} />;
export const IcoEdit = (p: any) => <Ic {...p} d={<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>} />;
export const IcoTrash = (p: any) => <Ic {...p} d={<><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></>} />;
export const IcoBack = (p: any) => <Ic {...p} d={<><polyline points="15 18 9 12 15 6" /></>} />;
export const IcoX = (p: any) => <Ic {...p} d={<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>} />;
export const IcoBall = (p: any) => <Ic {...p} d={<><circle cx="12" cy="12" r="10" /><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10" /><path d="M12 2a15 15 0 00-4 10 15 15 0 004 10" /></>} />;
export const IcoSave = (p: any) => <Ic {...p} d={<><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>} />;
export const IcoEye = (p: any) => <Ic {...p} d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>} />;
export const IcoCal = (p: any) => <Ic {...p} d={<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>} />;
export const IcoGlobe = (p: any) => <Ic {...p} d={<><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></>} />;
export const IcoCamera = (p: any) => <Ic {...p} d={<><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></>} />;
export const IcoLogout = (p: any) => <Ic {...p} d={<><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>} />;
export const IcoLock = (p: any) => <Ic {...p} d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>} />;
export const IcoUser = (p: any) => <Ic {...p} d={<><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>} />;