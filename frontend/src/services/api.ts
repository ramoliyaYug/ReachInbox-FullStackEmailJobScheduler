import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
});

export const getBullMQBoardUrl = (): string => {
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const baseUrl = apiBase.replace(/\/api\/?$/, "");
  return `${baseUrl}/admin/queues`;
};

export default api;