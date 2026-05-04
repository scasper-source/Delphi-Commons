import crypto from "node:crypto";
import { getDatabase } from "../core/database.js";
import type { Actor } from "../middleware/auth.js";
import { buildCitationMarkdown } from "../core/citation.js";
import { sha256Json } from "../studies/hash.js";

export type ExportPackageType =
  | "final-delphi-report"
  | "irb-pack"
  | "anonymized-response-dataset"
  | "audit-package"
  | "provenance-bundle"
  | "complete-archive";

export type ExportFormat = ".docx" | ".xlsx" | ".csv" | ".json" | ".md" | ".txt";
export type ExportContentEncoding = "utf8" | "base64";
export type AnonymizationLevel = "none" | "pseudonymized" | "anonymized" | "aggregated_only";
export type HumanReviewStatus = "draft" | "pending_review" | "approved" | "rejected" | "superseded";
export type ReleaseStatus = "not_released" | "released" | "superseded";
export type ExportPackageReviewStatus = "approved" | "rejected";

export type ExportManifest = {
  export_id: string;
  study_id: string;
  version_id: string;
  package_type: ExportPackageType;
  generated_at: string;
  generated_by: {
    user_id: string;
    role: string;
  };
  audit_event_id: string;
  config_hash: string | null;
  dataset_hash: string | null;
  content_hash: string;
  data_scope: Record<string, unknown>;
  redaction_profile: Record<string, unknown>;
};

type ExportManifestRow = {
  manifest_json: string;
};

export type ExportPackageFile = {
  export_file_id: string;
  export_package_id: string;
  path: string;
  format: ExportFormat;
  media_type: string;
  sha256: string;
  record_count: number | null;
  contains_identifiable_data: boolean;
  redaction_profile: Record<string, unknown>;
  content_text: string;
  content_encoding: ExportContentEncoding;
  created_at: string;
};

export type ExportPackage = {
  export_package_id: string;
  study_id: string;
  study_version_id: string;
  export_type: ExportPackageType;
  export_created_at: string;
  export_created_by: {
    user_id: string;
    role: string;
  };
  export_format_set: ExportFormat[];
  data_cutoff_at: string;
  consensus_rule_version_id: string | null;
  feedback_config_version_id: string | null;
  instrument_version_ids: string[];
  contains_identifiable_data: boolean;
  anonymization_level: AnonymizationLevel;
  external_ai_used: boolean;
  human_review_required: boolean;
  human_review_status: HumanReviewStatus;
  release_status: ReleaseStatus;
  released_at: string | null;
  released_by_user_id: string | null;
  release_signoff_ids: string[];
  supersedes_export_package_id: string | null;
  limitations_text_version_id: string;
  manifest_hash: string;
  package_hash: string;
  audit_event_id: string;
  files: Omit<ExportPackageFile, "content_text">[];
};

type ExportPackageRow = {
  manifest_json: string;
};

type ExportPackageFileRow = {
  export_file_id: string;
  export_package_id: string;
  path: string;
  format: ExportFormat;
  media_type: string;
  sha256: string;
  record_count: number | null;
  contains_identifiable_data: number;
  redaction_profile_json: string;
  content_text: string;
  content_encoding: ExportContentEncoding;
  created_at: string;
};

export type ExportPackageReview = {
  review_id: string;
  export_package_id: string;
  study_id: string;
  study_version_id: string;
  reviewed_at: string;
  reviewed_by: {
    user_id: string;
    role: string;
  };
  review_status: ExportPackageReviewStatus;
  note: string;
  audit_event_id: string;
};

type ExportPackageReviewRow = {
  review_json: string;
};

function sha256Bytes(content: Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function fileFormatFromPath(filePath: string): ExportFormat {
  const extension = filePath.slice(filePath.lastIndexOf("."));
  if (
    extension === ".docx" ||
    extension === ".xlsx" ||
    extension === ".csv" ||
    extension === ".json" ||
    extension === ".md" ||
    extension === ".txt"
  ) {
    return extension;
  }
  return ".txt";
}

function mediaTypeForFormat(format: ExportFormat): string {
  if (format === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (format === ".xlsx") return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (format === ".csv") return "text/csv";
  if (format === ".json") return "application/json";
  if (format === ".md") return "text/markdown";
  return "text/plain";
}

export function recordExportManifest(input: {
  study_id: string;
  version_id: string;
  package_type: ExportPackageType;
  generated_by: Actor;
  audit_event_id: string;
  config_hash?: string | null;
  dataset_hash?: string | null;
  content: unknown;
  data_scope: Record<string, unknown>;
  redaction_profile: Record<string, unknown>;
}): ExportManifest {
  const manifest: ExportManifest = {
    export_id: crypto.randomUUID(),
    study_id: input.study_id,
    version_id: input.version_id,
    package_type: input.package_type,
    generated_at: new Date().toISOString(),
    generated_by: {
      user_id: input.generated_by.userId,
      role: input.generated_by.role,
    },
    audit_event_id: input.audit_event_id,
    config_hash: input.config_hash ?? null,
    dataset_hash: input.dataset_hash ?? null,
    content_hash: sha256Json(input.content),
    data_scope: input.data_scope,
    redaction_profile: input.redaction_profile,
  };

  getDatabase()
    .prepare(
      `INSERT INTO export_manifests (
        export_id,
        study_id,
        version_id,
        package_type,
        generated_at,
        generated_by_user_id,
        generated_by_role,
        audit_event_id,
        config_hash,
        dataset_hash,
        content_hash,
        data_scope_json,
        redaction_profile_json,
        manifest_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      manifest.export_id,
      manifest.study_id,
      manifest.version_id,
      manifest.package_type,
      manifest.generated_at,
      manifest.generated_by.user_id,
      manifest.generated_by.role,
      manifest.audit_event_id,
      manifest.config_hash,
      manifest.dataset_hash,
      manifest.content_hash,
      JSON.stringify(manifest.data_scope),
      JSON.stringify(manifest.redaction_profile),
      JSON.stringify(manifest),
    );

  return manifest;
}

export function listExportManifests(filter: {
  study_id?: string;
  version_id?: string;
  package_type?: ExportPackageType;
} = {}): ExportManifest[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filter.study_id) {
    clauses.push("study_id = ?");
    params.push(filter.study_id);
  }
  if (filter.version_id) {
    clauses.push("version_id = ?");
    params.push(filter.version_id);
  }
  if (filter.package_type) {
    clauses.push("package_type = ?");
    params.push(filter.package_type);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDatabase()
    .prepare(
      `SELECT manifest_json
       FROM export_manifests
       ${where}
       ORDER BY generated_at ASC, export_id ASC`,
    )
    .all(...params) as ExportManifestRow[];

  return rows.map((row) => JSON.parse(row.manifest_json) as ExportManifest);
}

export function createExportPackage(input: {
  study_id: string;
  study_version_id: string;
  export_type: ExportPackageType;
  generated_by: Actor;
  audit_event_id: string;
  data_cutoff_at: string;
  consensus_rule_version_id?: string | null;
  feedback_config_version_id?: string | null;
  instrument_version_ids?: string[];
  contains_identifiable_data: boolean;
  anonymization_level: AnonymizationLevel;
  external_ai_used: boolean;
  human_review_required: boolean;
  human_review_status?: HumanReviewStatus;
  limitations_text_version_id: string;
  supersedes_export_package_id?: string | null;
  files: Array<{
    path: string;
    content: string | Buffer;
    format?: ExportFormat;
    media_type?: string;
    record_count?: number | null;
    contains_identifiable_data?: boolean;
    redaction_profile?: Record<string, unknown>;
  }>;
}): ExportPackage {
  const exportPackageId = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const inputFiles = input.files.some((file) => file.path === "CITATION.md")
    ? input.files
    : [
        ...input.files,
        {
          path: "CITATION.md",
          content: buildCitationMarkdown({ generatedAt: createdAt }),
          format: ".md" as const,
          record_count: null,
          contains_identifiable_data: false,
          redaction_profile: {
            direct_identifiers: "not_applicable",
            endorsement: "citation guidance only; does not validate study findings",
          },
        },
      ];

  const files: ExportPackageFile[] = inputFiles.map((file) => {
    const format = file.format ?? fileFormatFromPath(file.path);
    const contentBytes = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content, "utf8");
    const contentEncoding: ExportContentEncoding = Buffer.isBuffer(file.content) ? "base64" : "utf8";
    return {
      export_file_id: crypto.randomUUID(),
      export_package_id: exportPackageId,
      path: file.path,
      format,
      media_type: file.media_type ?? mediaTypeForFormat(format),
      sha256: sha256Bytes(contentBytes),
      record_count: file.record_count ?? null,
      contains_identifiable_data: file.contains_identifiable_data ?? input.contains_identifiable_data,
      redaction_profile: file.redaction_profile ?? {},
      content_text: contentEncoding === "base64" ? contentBytes.toString("base64") : contentBytes.toString("utf8"),
      content_encoding: contentEncoding,
      created_at: createdAt,
    };
  });

  const exportFormatSet = Array.from(new Set(files.map((file) => file.format))).sort() as ExportFormat[];
  const manifestBase = {
    schema_name: "edelphi_export_manifest",
    schema_version: "1.0.0",
    export_package_id: exportPackageId,
    study_id: input.study_id,
    study_version_id: input.study_version_id,
    export_type: input.export_type,
    created_at: createdAt,
    created_by: {
      user_id: input.generated_by.userId,
      role: input.generated_by.role,
    },
    export_format_set: exportFormatSet,
    data_cutoff_at: input.data_cutoff_at,
    consensus_rule_version_id: input.consensus_rule_version_id ?? null,
    feedback_config_version_id: input.feedback_config_version_id ?? null,
    instrument_version_ids: input.instrument_version_ids ?? [input.study_version_id],
    anonymization: {
      level: input.anonymization_level,
      direct_identifiers_removed: !input.contains_identifiable_data,
      redaction_manifest_included: files.some((file) => file.path.includes("redaction")),
    },
    governance: {
      human_review_required: input.human_review_required,
      human_review_status: input.human_review_status ?? "pending_review",
      limitations_text_version_id: input.limitations_text_version_id,
    },
    ai_assistance: {
      external_ai_used: input.external_ai_used,
    },
    files: files.map(({ content_text: _content, ...file }) => file),
  };
  const manifestHash = sha256Json(manifestBase);
  const packageHash = sha256Json({
    export_package_id: exportPackageId,
    manifest_hash: manifestHash,
    file_hashes: files.map((file) => ({ path: file.path, sha256: file.sha256 })).sort((a, b) => a.path.localeCompare(b.path)),
  });

  const pkg: ExportPackage = {
    export_package_id: exportPackageId,
    study_id: input.study_id,
    study_version_id: input.study_version_id,
    export_type: input.export_type,
    export_created_at: createdAt,
    export_created_by: {
      user_id: input.generated_by.userId,
      role: input.generated_by.role,
    },
    export_format_set: exportFormatSet,
    data_cutoff_at: input.data_cutoff_at,
    consensus_rule_version_id: input.consensus_rule_version_id ?? null,
    feedback_config_version_id: input.feedback_config_version_id ?? null,
    instrument_version_ids: input.instrument_version_ids ?? [input.study_version_id],
    contains_identifiable_data: input.contains_identifiable_data,
    anonymization_level: input.anonymization_level,
    external_ai_used: input.external_ai_used,
    human_review_required: input.human_review_required,
    human_review_status: input.human_review_status ?? "pending_review",
    release_status: "not_released",
    released_at: null,
    released_by_user_id: null,
    release_signoff_ids: [],
    supersedes_export_package_id: input.supersedes_export_package_id ?? null,
    limitations_text_version_id: input.limitations_text_version_id,
    manifest_hash: manifestHash,
    package_hash: packageHash,
    audit_event_id: input.audit_event_id,
    files: files.map(({ content_text: _content, ...file }) => file),
  };

  getDatabase()
    .prepare(
      `INSERT INTO export_packages (
        export_package_id,
        study_id,
        study_version_id,
        export_type,
        export_created_at,
        export_created_by_user_id,
        export_created_by_role,
        export_format_set_json,
        data_cutoff_at,
        consensus_rule_version_id,
        feedback_config_version_id,
        instrument_version_ids_json,
        contains_identifiable_data,
        anonymization_level,
        external_ai_used,
        human_review_required,
        human_review_status,
        release_status,
        released_at,
        released_by_user_id,
        release_signoff_ids_json,
        supersedes_export_package_id,
        limitations_text_version_id,
        manifest_hash,
        package_hash,
        audit_event_id,
        manifest_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      pkg.export_package_id,
      pkg.study_id,
      pkg.study_version_id,
      pkg.export_type,
      pkg.export_created_at,
      pkg.export_created_by.user_id,
      pkg.export_created_by.role,
      JSON.stringify(pkg.export_format_set),
      pkg.data_cutoff_at,
      pkg.consensus_rule_version_id,
      pkg.feedback_config_version_id,
      JSON.stringify(pkg.instrument_version_ids),
      pkg.contains_identifiable_data ? 1 : 0,
      pkg.anonymization_level,
      pkg.external_ai_used ? 1 : 0,
      pkg.human_review_required ? 1 : 0,
      pkg.human_review_status,
      pkg.release_status,
      pkg.released_at,
      pkg.released_by_user_id,
      JSON.stringify(pkg.release_signoff_ids),
      pkg.supersedes_export_package_id,
      pkg.limitations_text_version_id,
      pkg.manifest_hash,
      pkg.package_hash,
      pkg.audit_event_id,
      JSON.stringify(pkg),
    );

  for (const file of files) {
    getDatabase()
      .prepare(
        `INSERT INTO export_files (
          export_file_id,
          export_package_id,
          path,
          format,
          media_type,
          sha256,
          record_count,
          contains_identifiable_data,
          redaction_profile_json,
          content_text,
          content_encoding,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        file.export_file_id,
        file.export_package_id,
        file.path,
        file.format,
        file.media_type,
        file.sha256,
        file.record_count,
        file.contains_identifiable_data ? 1 : 0,
        JSON.stringify(file.redaction_profile),
        file.content_text,
        file.content_encoding,
        file.created_at,
      );
  }

  return pkg;
}

export function listExportPackages(filter: {
  study_id?: string;
  study_version_id?: string;
  export_type?: ExportPackageType;
} = {}): ExportPackage[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filter.study_id) {
    clauses.push("study_id = ?");
    params.push(filter.study_id);
  }
  if (filter.study_version_id) {
    clauses.push("study_version_id = ?");
    params.push(filter.study_version_id);
  }
  if (filter.export_type) {
    clauses.push("export_type = ?");
    params.push(filter.export_type);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDatabase()
    .prepare(
      `SELECT manifest_json
       FROM export_packages
       ${where}
       ORDER BY export_created_at ASC, export_package_id ASC`,
    )
    .all(...params) as ExportPackageRow[];

  return rows.map((row) => JSON.parse(row.manifest_json) as ExportPackage);
}

export function listExportPackageFiles(exportPackageId: string): ExportPackageFile[] {
  const rows = getDatabase()
    .prepare(
      `SELECT *
       FROM export_files
       WHERE export_package_id = ?
       ORDER BY path ASC`,
    )
    .all(exportPackageId) as ExportPackageFileRow[];

  return rows.map((row) => ({
    export_file_id: row.export_file_id,
    export_package_id: row.export_package_id,
    path: row.path,
    format: row.format,
    media_type: row.media_type,
    sha256: row.sha256,
    record_count: row.record_count,
    contains_identifiable_data: row.contains_identifiable_data === 1,
    redaction_profile: JSON.parse(row.redaction_profile_json) as Record<string, unknown>,
    content_text: row.content_text,
    content_encoding: row.content_encoding,
    created_at: row.created_at,
  }));
}

export function recordExportPackageReview(input: {
  export_package_id: string;
  study_id: string;
  study_version_id: string;
  reviewed_by: Actor;
  review_status: ExportPackageReviewStatus;
  note: string;
  audit_event_id: string;
}): ExportPackageReview {
  const review: ExportPackageReview = {
    review_id: crypto.randomUUID(),
    export_package_id: input.export_package_id,
    study_id: input.study_id,
    study_version_id: input.study_version_id,
    reviewed_at: new Date().toISOString(),
    reviewed_by: {
      user_id: input.reviewed_by.userId,
      role: input.reviewed_by.role,
    },
    review_status: input.review_status,
    note: input.note,
    audit_event_id: input.audit_event_id,
  };

  getDatabase()
    .prepare(
      `INSERT INTO export_package_reviews (
        review_id,
        export_package_id,
        study_id,
        study_version_id,
        reviewed_at,
        reviewed_by_user_id,
        reviewed_by_role,
        review_status,
        note,
        audit_event_id,
        review_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      review.review_id,
      review.export_package_id,
      review.study_id,
      review.study_version_id,
      review.reviewed_at,
      review.reviewed_by.user_id,
      review.reviewed_by.role,
      review.review_status,
      review.note,
      review.audit_event_id,
      JSON.stringify(review),
    );

  return review;
}

export function listExportPackageReviews(filter: {
  export_package_id?: string;
  study_id?: string;
  study_version_id?: string;
} = {}): ExportPackageReview[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filter.export_package_id) {
    clauses.push("export_package_id = ?");
    params.push(filter.export_package_id);
  }
  if (filter.study_id) {
    clauses.push("study_id = ?");
    params.push(filter.study_id);
  }
  if (filter.study_version_id) {
    clauses.push("study_version_id = ?");
    params.push(filter.study_version_id);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDatabase()
    .prepare(
      `SELECT review_json
       FROM export_package_reviews
       ${where}
       ORDER BY reviewed_at ASC, review_id ASC`,
    )
    .all(...params) as ExportPackageReviewRow[];

  return rows.map((row) => JSON.parse(row.review_json) as ExportPackageReview);
}
