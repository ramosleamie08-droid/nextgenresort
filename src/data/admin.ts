// PALITAN ng email ng admin account mo
export const ADMIN_EMAILS = ['admin@nextgenresort.com'];

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase());

// DAPAT DASHBOARD ANG BAGSAD DITO
export const homeFor = (email?: string | null) =>
  isAdminEmail(email) ? '/admin/dashboard' : '/customer/home'; 