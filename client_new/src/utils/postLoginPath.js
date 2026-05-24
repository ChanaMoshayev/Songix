/** אחרי התחברות מוצלחת — לאן לנווט לפי סטטוס משתמש */
export function getPostLoginPath(user) {
  if (user?.status === "admin") return "/admin/songs";
  return "/songs";
}
