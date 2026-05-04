/*
 * Copyright 2026 Stephen T. Casper
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ResponseRecord } from "../stores/responseStore.js";
import type { ParticipantEnrollment, NonResponseEscalation } from "../stores/participantStatusStore.js";

type RatingPayload = {
  round_number: number;
  item_id: string;
  rating: number;
};

function isRatingPayload(value: unknown, roundNumber: number): value is RatingPayload {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return rec.round_number === roundNumber && typeof rec.item_id === "string" && typeof rec.rating === "number";
}

function responseRound(response: ResponseRecord): number {
  for (const round of [2, 3, 4]) {
    if (isRatingPayload(response.response_json, round)) return round;
  }
  const rec = response.response_json && typeof response.response_json === "object" ? response.response_json as Record<string, unknown> : {};
  return typeof rec.round_number === "number" ? rec.round_number : 1;
}

export function participantSubmittedInRound(responses: ResponseRecord[], participantId: string, roundNumber: number): boolean {
  return responses.some((response) => response.participant_id === participantId && responseRound(response) === roundNumber);
}

export function buildAttritionSummary(input: {
  enrollments: ParticipantEnrollment[];
  escalations: NonResponseEscalation[];
  responses: ResponseRecord[];
  plannedRounds: number;
  warningThresholdPercent?: number;
}) {
  const totalParticipants = input.enrollments.length;
  const rounds = Array.from({ length: Math.max(1, input.plannedRounds) }, (_, index) => index + 1).map((roundNumber) => {
    const activeParticipants = input.enrollments.filter((enrollment) => {
      if (enrollment.status === "WITHDRAWN_PARTICIPANT" && (enrollment.inactive_from_round_number ?? 1) <= roundNumber) return false;
      if (enrollment.status === "WITHDRAWN_PI" && (enrollment.inactive_from_round_number ?? Number.POSITIVE_INFINITY) <= roundNumber) return false;
      return true;
    });
    const submittedParticipants = new Set(
      input.responses
        .filter((response) => responseRound(response) === roundNumber)
        .map((response) => response.participant_id),
    );
    const flags = input.escalations.filter((record) => record.round_number === roundNumber);
    const participantWithdrawals = input.enrollments.filter(
      (enrollment) => enrollment.withdrawal_type === "participant" && enrollment.inactive_from_round_number === roundNumber,
    );
    const piInactive = input.enrollments.filter(
      (enrollment) => enrollment.withdrawal_type === "pi" && enrollment.inactive_from_round_number === roundNumber,
    );

    return {
      round_number: roundNumber,
      invited_or_enrolled_count: totalParticipants,
      active_count: activeParticipants.length,
      submitted_count: submittedParticipants.size,
      response_rate: activeParticipants.length > 0 ? Number(((submittedParticipants.size / activeParticipants.length) * 100).toFixed(2)) : 0,
      non_responsive_flagged_count: flags.length,
      participant_withdrawal_count: participantWithdrawals.length,
      pi_inactive_count: piInactive.length,
    };
  });

  const inactiveOrWithdrawn = input.enrollments.filter((enrollment) =>
    enrollment.status === "WITHDRAWN_PARTICIPANT" || enrollment.status === "WITHDRAWN_PI"
  );
  const attritionRate = totalParticipants > 0 ? Number(((inactiveOrWithdrawn.length / totalParticipants) * 100).toFixed(2)) : 0;
  const warningThreshold = input.warningThresholdPercent ?? 20;
  const warnings: string[] = [];
  if (attritionRate >= warningThreshold) {
    warnings.push("High attrition may affect interpretation of consensus. Review response rates and withdrawal timing before reporting results.");
  }
  if (rounds.some((round) => round.non_responsive_flagged_count > 0 || round.participant_withdrawal_count > 0 || round.pi_inactive_count > 0)) {
    warnings.push("Participants marked inactive or withdrawn remain represented in prior submitted data according to the study protocol.");
  }

  return {
    total_participants_invited_or_enrolled: totalParticipants,
    current_active_count: input.enrollments.filter((enrollment) => enrollment.status === "ACTIVE" || enrollment.status === "NON_RESPONSIVE_FLAGGED").length,
    non_responsive_flagged_count: input.enrollments.filter((enrollment) => enrollment.status === "NON_RESPONSIVE_FLAGGED").length,
    participant_withdrawal_count: input.enrollments.filter((enrollment) => enrollment.status === "WITHDRAWN_PARTICIPANT").length,
    pi_inactive_count: input.enrollments.filter((enrollment) => enrollment.status === "WITHDRAWN_PI").length,
    completed_count: input.enrollments.filter((enrollment) => enrollment.status === "COMPLETED").length,
    attrition_rate: attritionRate,
    rounds,
    warnings,
    limitations_note:
      "Attrition may affect interpretation of consensus. Participants marked inactive or withdrawn from future rounds remain represented in prior submitted data according to the study protocol. Consensus indicates agreement among this panel; it does not establish correctness.",
  };
}
