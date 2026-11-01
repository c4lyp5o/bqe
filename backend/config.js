// BQE v2 — config
const env = process.env;
export const config = {
	PORT: Number(env.PORT) || 3000,
	WS_PORT: Number(env.WS_PORT) || 3001,
	HOST: env.HOST || "0.0.0.0",
	NODE_ENV: env.NODE_ENV || "development",
	DB_PATH: env.DB_PATH || "bqe.db",
	CLIENT_DIR: env.CLIENT_DIR || new URL("../frontend/dist", import.meta.url).pathname,
	CLIENT_ORIGIN: env.CLIENT_ORIGIN || "http://localhost:5173",
};