// BQE v2 — facility + ticket response models
import { t } from "elysia";

const CalledSummary = t.Object({
	label: t.String(),
	status: t.String(),
});

const TicketSummary = t.Object({
	id: t.Number(),
	label: t.String(),
	status: t.String(),
	calledAt: t.Nullable(t.Number()),
	arrivedAt: t.Nullable(t.Number()),
});

export const FacilityModel = {
	errorResponse: t.Object({
		ok: t.Boolean(),
		message: t.String(),
	}),

	facilityResponse: t.Object({
		ok: t.Boolean(),
		id: t.Number(),
		adminCode: t.String(),
		tvCode: t.String(),
		name: t.String(),
		displayText: t.String(),
	}),

	snapshotResponse: t.Object({
		ok: t.Boolean(),
		id: t.Number(),
		name: t.String(),
		displayText: t.String(),
		adminCode: t.String(),
		tvCode: t.String(),
		nowServing: t.Nullable(t.Object({ id: t.Number(), label: t.String() })),
		lastCalled: t.Array(CalledSummary),
		waitingCount: t.Number(),
		servedCount: t.Number(),
		tickets: t.Array(TicketSummary),
	}),

	joinResponse: t.Object({
		ok: t.Boolean(),
		ticket: t.Object({ id: t.Number(), label: t.String() }),
	}),

	actionResponse: t.Object({
		ok: t.Boolean(),
		message: t.String(),
	}),

	qrNonceResponse: t.Object({
		ok: t.Boolean(),
		nonce: t.String(),
		expiresAt: t.Number(),
	}),

	ticketInfoResponse: t.Object({
		ok: t.Boolean(),
		label: t.String(),
		number: t.Number(),
		status: t.String(),
		waitingAhead: t.Number(),
		facility: t.Object({ name: t.String(), displayText: t.String() }),
		lastCalled: t.Array(CalledSummary),
	}),
};
