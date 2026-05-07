import { Platform } from "react-native";

const WEB_API_BASE_URL = "http://localhost:5001/api";
const MOBILE_API_BASE_URL = "http://172.17.17.188:5001/api";

export const API_BASE_URL = Platform.select({
  web: WEB_API_BASE_URL,
  default: MOBILE_API_BASE_URL,
});

export const PROFESSOR_PROFILE = "PROFESSOR";
