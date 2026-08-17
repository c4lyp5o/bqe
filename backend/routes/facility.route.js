// BQE v2 — facility + ticket routes
import { Elysia, t } from "elysia";
import { FacilityService } from "../services/facility.service.js";
import { FacilityModel } from "../models/facility.model.js";

export const FacilityRoute = new Elysia({
	prefix: "/api/v1",
	name: "FacilityRoute",
})
	.get(
		"/facility/:code",
		({ params }) => FacilityService.getByCode({ params }),
		{
			response: t.Union([
				FacilityModel.snapshotResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Get facility snapshot",
				description:
					"Get a facility by admin or TV code, including the live queue state",
				tags: ["Facility"],
			},
		},
	)
	.post(
		"/facility",
		({ body }) => FacilityService.create({ body }),
		{
			response: t.Union([
				FacilityModel.facilityResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Create facility",
				description: "Create a new facility and get admin + TV codes",
				tags: ["Facility"],
			},
		},
	)
	.patch(
		"/facility/:code",
		({ params, body }) => FacilityService.update({ params, body }),
		{
			response: t.Union([
				FacilityModel.snapshotResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Update facility",
				description: "Update facility name or display text (admin code only)",
				tags: ["Facility"],
			},
		},
	)
	.post(
		"/facility/:code/join",
		({ params, body }) => FacilityService.join({ params, body }),
		{
			response: t.Union([
				FacilityModel.joinResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Join queue",
				description: "Issue a ticket for a facility (optionally via QR nonce)",
				tags: ["Ticket"],
			},
		},
	)
	.post(
		"/facility/:code/call/:ticketId",
		({ params }) => FacilityService.call({ params }),
		{
			response: FacilityModel.actionResponse,
			detail: {
				summary: "Call ticket",
				description: "Call the next ticket (admin code only)",
				tags: ["Ticket"],
			},
		},
	)
	.post(
		"/facility/:code/recall/:ticketId",
		({ params }) => FacilityService.recall({ params }),
		{
			response: FacilityModel.actionResponse,
			detail: {
				summary: "Recall ticket",
				description: "Re-call an already-called ticket (admin code only)",
				tags: ["Ticket"],
			},
		},
	)
	.post(
		"/facility/:code/arrived/:ticketId",
		({ params }) => FacilityService.arrive({ params }),
		{
			response: FacilityModel.actionResponse,
			detail: {
				summary: "Mark arrived",
				description: "Mark a called ticket as arrived (admin code only)",
				tags: ["Ticket"],
			},
		},
	)
	.get(
		"/facility/:code/qr-nonce",
		({ params }) => FacilityService.qrNonce({ params }),
		{
			response: t.Union([
				FacilityModel.qrNonceResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Generate QR nonce",
				description: "Get a short-lived nonce for a join QR code",
				tags: ["Ticket"],
			},
		},
	)
	.get(
		"/ticket/:id",
		({ params }) => FacilityService.ticket({ params }),
		{
			response: t.Union([
				FacilityModel.ticketInfoResponse,
				FacilityModel.errorResponse,
			]),
			detail: {
				summary: "Get ticket info",
				description: "Get a customer's ticket status and waiting position",
				tags: ["Ticket"],
			},
		},
	);
