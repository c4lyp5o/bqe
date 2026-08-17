import { Elysia, t } from "elysia";

export const HealthRoute = new Elysia({ name: "HealthRoute" }).get(
	"/api/v1",
	() => {
		return {
			success: true,
			message: "BQE API is running",
			uptime: process.uptime(),
		};
	},
	{
		response: t.Object({
			success: t.Boolean(),
			message: t.String(),
			uptime: t.Number(),
		}),
		detail: {
			summary: "API Health Check",
			description: "Simple endpoint to verify that the API is up and running",
			tags: ["General"],
		},
	},
);
