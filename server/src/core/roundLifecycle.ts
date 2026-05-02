import { getRoundConfig } from "../stores/roundConfigStore.js";
import { getItem, listItems, type ItemRecord } from "../stores/itemStore.js";
import { listResponses } from "../stores/responseStore.js";

export type LifecycleGate =
  | { ok: true }
  | {
      ok: false;
      statusCode: number;
      error: string;
      details: Record<string, unknown>;
    };

export function getCurationGate(input: {
  study_id: string;
  version_id: string;
  target_round_number: number;
}): LifecycleGate {
  if (!Number.isInteger(input.target_round_number) || input.target_round_number < 2) {
    return {
      ok: false,
      statusCode: 400,
      error: "target_rating_round_required",
      details: { target_round_number: input.target_round_number },
    };
  }

  const previousRoundNumber = input.target_round_number - 1;
  const previous = getRoundConfig({
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: previousRoundNumber,
  });

  if (!previous) {
    return {
      ok: false,
      statusCode: 409,
      error: "previous_round_config_required_before_curation",
      details: { previous_round_number: previousRoundNumber },
    };
  }

  if (previous.status !== "Closed") {
    return {
      ok: false,
      statusCode: 409,
      error:
        previousRoundNumber === 1
          ? "round1_must_be_closed_before_curation"
          : "previous_round_must_be_closed_before_curation",
      details: {
        previous_round_number: previousRoundNumber,
        previous_round_status: previous.status,
      },
    };
  }

  const target = getRoundConfig({
    study_id: input.study_id,
    version_id: input.version_id,
    round_number: input.target_round_number,
  });

  if (target?.status === "Open" || target?.status === "Closed") {
    return {
      ok: false,
      statusCode: 409,
      error: "target_round_locked_after_open",
      details: {
        target_round_number: input.target_round_number,
        target_round_status: target.status,
      },
    };
  }

  return { ok: true };
}

export function getPublishedTraceableItemsForRound(input: {
  study_id: string;
  version_id: string;
  round_number: number;
}): ItemRecord[] {
  return listItems({
    study_id: input.study_id,
    version_id: input.version_id,
  }).filter(
    (item) =>
      item.round_number === input.round_number &&
      item.status === "Published" &&
      itemHasVerifiableTraceability(item),
  );
}

export function itemHasVerifiableTraceability(item: ItemRecord): boolean {
  if (item.provenance_type === "LiteratureDerived") {
    return Boolean(item.ai_provenance_rationale?.trim()) || item.ai_provenance_links.length > 0;
  }

  if (item.ai_provenance_links.length === 0) return false;

  const responseIds = new Set(
    listResponses({ study_id: item.study_id, version_id: item.version_id }).map(
      (response) => response.response_id,
    ),
  );

  return item.ai_provenance_links.every((link) => {
    if (link.source_type === "response") return responseIds.has(link.source_id);

    const sourceItem = getItem(link.source_id);
    return Boolean(
      sourceItem &&
        sourceItem.study_id === item.study_id &&
        sourceItem.version_id === item.version_id &&
        sourceItem.round_number === link.source_round_number,
    );
  });
}
