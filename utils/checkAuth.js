import axios from "axios";

export async function checkAuth() {
  if (typeof window === "undefined") return false;

  const token = localStorage.getItem("token");
  if (!token) return false;

  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || "https://growthbackend.onrender.com/api";

    const response = await axios.get(`${baseURL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    return response.status === 200;
  } catch (error) {
    console.error("Token check failed:", error);
    localStorage.removeItem("token");
    return false;
  }
}