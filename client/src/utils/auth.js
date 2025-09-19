// utils/auth.js
export const getAuth = () => {
  const token = localStorage.getItem("token");
  const profile = JSON.parse(localStorage.getItem("profile"));

  return {
    token,
    role: profile?.role || null
  };
};
