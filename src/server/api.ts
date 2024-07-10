import axios from "axios";

export const api = axios.create({
  baseURL: "https://nlw-journey.apidocumentation.com",
  timeout: 10000,
});
