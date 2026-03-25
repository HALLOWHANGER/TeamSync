import axios from "axios";

// VITE_API_BASE_URL = "http://localhost:4000/api" (already includes /api)
const baseURL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api"
    : "/api";

export const API = axios.create({
  baseURL,
  withCredentials: true,
});
