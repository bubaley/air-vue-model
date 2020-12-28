const axios = require("axios");
axios.defaults.headers.common = {"Accept-Language": "ru-ru"};
axios.defaults.baseURL = process.env.NODE_ENV !== "production" ? "http://127.0.0.1:8000/api/v1" : "/api/v1";
module.exports = axios