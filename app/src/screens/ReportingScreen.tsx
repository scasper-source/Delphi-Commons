/* Copyright 2026 Stephen T. Casper / SPDX-License-Identifier: Apache-2.0 */

import { useState } from "react";
import { useAppContext } from "../core/AppContext";
import {
  formatDateTime,
  shortId,
  roundReportRisk,
} from "../core/appUtils";
import { canExportOutput } from "../core/permissions";
import { reportIncludesNonConsensus } from "../policies/governance";
import { outputModelRegistry } from "../outputModels/registry";
import {
  DataBar,
  LockedRule,
  StatusBadge,
  WarningBanner,
} from "../components/ui/Primitives";

export function ReportingScreen({
  runtimeActionBusy,
  onExportOutput,
  onSelectExportPackage,
  onReviewExportPackage,
  onDownloadExportPackageFile,
}: {
  runtimeActionBusy: string | null;
  onExportOutput: (outputId: string) => void;
  onSelectExportPackage: (packageId: string) => void;
  onReviewExportPackage: (packageId: string, reviewStatus: "approved" | "rejected", note: string) => void;
  onDownloadExportPackageFile: (packageId: string, fileId: string) => void;
}) {
  const { study, role, workflow, runtimeData } = useAppContext();
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const realReport = runtimeData.roundReport ?? runtimeData.exportReport;
  const realItems = realReport?.items ?? [];
  const reportSafe = reportIncludesNonConsensus(study.report);
  const threshold = realItems.find((item) => item.consensus.threshold_percent !== null)?.consensus.threshold_percent
    ?? study.report.thresholdUsed;
  const attrition = realReport?.summary.attrition?.attrition_rate ?? study.report.attritionRate;
  const hasRealStudy = Boolean(workflow.study && workflow.version);
  const selectedPackage =
    runtimeData.exportPackages.find((pkg) => pkg.export_package_id === runtimeData.selectedExportPackageId) ??
    runtimeData.exportPackages.at(-1) ??
    null;
  const selectedFiles = selectedPackage ? runtimeData.exportPackageFiles[selectedPackage.export_package_id] ?? [] : [];
  const latestReview = selectedPackage?.reviews?.at(-1) ?? null;
  const canReviewExports =
    role === "study_owner" ||
    role === "ethics_methods_steward" ||
    role === "data_custodian" ||
    role === "security_privacy_lead";
  const selectedReviewNote = selectedPackage ? reviewNotes[selectedPackage.export_package_id] ?? "" : "";

  return (
    <div className="screen-grid">
      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Reporting Dashboard</span>
          <h2>Downstream users see limits, dissent, and method configuration</h2>
        </div>
        <WarningBanner title="Required statement" risk="info">
          Consensus indicates agreement among this panel; it does not establish correctness.
        </WarningBanner>
      </section>

      <section className="panel">
        <h3>Report Integrity</h3>
        <StatusBadge
          risk={realReport ? "success" : reportSafe ? "success" : "danger"}
          label={realReport ? "Real round data loaded" : reportSafe ? "Non-consensus included" : "Blocked"}
        />
        <DataBar value={attrition} label="Attrition" />
        {realReport?.summary.attrition?.warnings.length ? (
          <WarningBanner title="Attrition interpretation" risk="warning">
            {realReport.summary.attrition.warnings.join(" ")}
          </WarningBanner>
        ) : null}
        <LockedRule title="Threshold used" value={`${threshold}%`} locked />
        {hasRealStudy && !realReport ? (
          <WarningBanner title="No reportable rating data yet" risk="info">
            Publish Round 2 items and collect ratings to populate this report from actual participant data.
          </WarningBanner>
        ) : null}
        {realReport ? (
          <dl className="detail-list">
            <div>
              <dt>Report stage</dt>
              <dd>{realReport.report_stage}</dd>
            </div>
            <div>
              <dt>Dataset hash</dt>
              <dd>{shortId(realReport.hashes.dataset_hash)}</dd>
            </div>
            <div>
              <dt>Submissions</dt>
              <dd>{realReport.summary.round_submission_count ?? realReport.summary.final_round_submission_count ?? 0}</dd>
            </div>
          </dl>
        ) : null}
      </section>

      <section className="panel">
        <h3>Output Models</h3>
        {outputModelRegistry.map((output) => {
          const permitted = canExportOutput(role, output);

          return (
            <article className="output-row" key={output.id}>
              <div>
                <strong>{output.label}</strong>
                <small>{output.sections.slice(0, 2).join(" + ")}</small>
              </div>
              <div className="output-actions">
                <StatusBadge risk={permitted ? "success" : "locked"} label={permitted ? "Permitted" : "Restricted"} />
                <button
                  className="secondary-button"
                  disabled={!permitted || runtimeActionBusy === `export-${output.id}`}
                  onClick={() => onExportOutput(output.id)}
                  type="button"
                >
                  Prepare
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel wide">
        <div className="section-heading">
          <span className="eyebrow">Export Package Center</span>
          <h2>Review, approve, and download governed outputs</h2>
        </div>
        {!hasRealStudy ? (
          <WarningBanner title="Backend study required" risk="info">
            Open a saved backend study to show persistent export packages.
          </WarningBanner>
        ) : runtimeData.exportPackages.length === 0 ? (
          <WarningBanner title="No export packages yet" risk="info">
            Prepare the Final Delphi Report package to create governed files for review.
          </WarningBanner>
        ) : (
          <div className="export-center">
            <div className="export-package-list" aria-label="Export packages">
              {runtimeData.exportPackages.map((pkg) => {
                const review = pkg.reviews?.at(-1) ?? null;
                const isSelected = selectedPackage?.export_package_id === pkg.export_package_id;
                return (
                  <button
                    className={isSelected ? "export-package-card active" : "export-package-card"}
                    key={pkg.export_package_id}
                    onClick={() => onSelectExportPackage(pkg.export_package_id)}
                    type="button"
                  >
                    <span>
                      <strong>{outputModelRegistry.find((output) => output.id === pkg.export_type)?.label ?? pkg.export_type}</strong>
                      <small>{formatDateTime(pkg.export_created_at)} by {pkg.export_created_by.role}</small>
                    </span>
                    <StatusBadge
                      risk={review?.review_status === "approved" ? "success" : review?.review_status === "rejected" ? "danger" : "warning"}
                      label={review?.review_status ?? pkg.human_review_status.replace("_", " ")}
                    />
                  </button>
                );
              })}
            </div>

            {selectedPackage ? (
              <div className="export-package-detail">
                <div className="summary-grid">
                  <article className="summary-item">
                    <strong>Anonymization</strong>
                    <p>{selectedPackage.anonymization_level.replace("_", " ")}</p>
                  </article>
                  <article className="summary-item">
                    <strong>Identifiable data</strong>
                    <p>{selectedPackage.contains_identifiable_data ? "Present: restricted handling required" : "No direct identifiers in package metadata"}</p>
                  </article>
                  <article className="summary-item">
                    <strong>Package hash</strong>
                    <p>{shortId(selectedPackage.package_hash)}...</p>
                  </article>
                  <article className="summary-item">
                    <strong>AI disclosure</strong>
                    <p>{selectedPackage.external_ai_used ? "External AI used" : "No external AI connector recorded"}</p>
                  </article>
                </div>

                {selectedPackage.contains_identifiable_data || selectedPackage.anonymization_level !== "aggregated_only" ? (
                  <WarningBanner title="Sensitive export handling" risk="warning">
                    Downloads are deliberate, permission-gated, and audit logged. Confirm the recipient and purpose before downloading.
                  </WarningBanner>
                ) : (
                  <WarningBanner title="Download audit" risk="info">
                    File downloads are still audit logged even when the package is publication-safe.
                  </WarningBanner>
                )}

                <div className="export-file-list">
                  {selectedFiles.length === 0 ? (
                    <button
                      className="secondary-button"
                      disabled={runtimeActionBusy === `files-${selectedPackage.export_package_id}`}
                      onClick={() => onSelectExportPackage(selectedPackage.export_package_id)}
                      type="button"
                    >
                      {runtimeActionBusy === `files-${selectedPackage.export_package_id}` ? "Loading files..." : "Load file list"}
                    </button>
                  ) : selectedFiles.map((file) => (
                    <article className="export-file-row" key={file.export_file_id}>
                      <div>
                        <strong>{file.path}</strong>
                        <small>{file.format} · {file.content_encoding} · sha256 {shortId(file.sha256)}...</small>
                      </div>
                      <div className="output-actions">
                        <StatusBadge risk={file.contains_identifiable_data ? "warning" : "success"} label={file.contains_identifiable_data ? "Sensitive" : "No identifiers"} />
                        <button
                          className="secondary-button"
                          disabled={runtimeActionBusy === `download-${file.export_file_id}`}
                          onClick={() => onDownloadExportPackageFile(selectedPackage.export_package_id, file.export_file_id)}
                          type="button"
                        >
                          Download
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="review-box">
                  <h3>Human Review</h3>
                  {latestReview ? (
                    <WarningBanner title={`Latest review: ${latestReview.review_status}`} risk={latestReview.review_status === "approved" ? "success" : "danger"}>
                      {latestReview.note} Reviewed by {latestReview.reviewed_by.role} at {formatDateTime(latestReview.reviewed_at)}.
                    </WarningBanner>
                  ) : (
                    <WarningBanner title="Review pending" risk="warning">
                      The package is not released by interface review until an authorized role records approve or reject with a note.
                    </WarningBanner>
                  )}
                  <label className="field wide-field">
                    <span>Review note</span>
                    <textarea
                      disabled={!canReviewExports}
                      value={selectedReviewNote}
                      onChange={(event) =>
                        setReviewNotes((current) => ({
                          ...current,
                          [selectedPackage.export_package_id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="action-row">
                    <button
                      className="primary-button"
                      disabled={!canReviewExports || selectedReviewNote.trim().length === 0 || runtimeActionBusy === `review-${selectedPackage.export_package_id}`}
                      onClick={() => onReviewExportPackage(selectedPackage.export_package_id, "approved", selectedReviewNote)}
                      type="button"
                    >
                      Approve package
                    </button>
                    <button
                      className="secondary-button danger-button"
                      disabled={!canReviewExports || selectedReviewNote.trim().length === 0 || runtimeActionBusy === `review-${selectedPackage.export_package_id}`}
                      onClick={() => onReviewExportPackage(selectedPackage.export_package_id, "rejected", selectedReviewNote)}
                      type="button"
                    >
                      Reject package
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="panel wide">
        <h3>Item Classification</h3>
        <div className="report-table">
          {realItems.length > 0
            ? realItems.map((item) => (
                <article className="report-row" key={item.item_id}>
                  <StatusBadge risk={roundReportRisk(item.consensus.status)} label={item.consensus.status.replace("_", " ")} />
                  <p>{item.text}</p>
                  <span>Median {item.rating_summary.median ?? "n/a"}</span>
                  <span>IQR {item.rating_summary.dispersion.iqr ?? "n/a"}</span>
                  <span>n={item.rating_summary.response_count}</span>
                </article>
              ))
            : study.report.items.map((item) => (
                <article className="report-row" key={item.id}>
                  <StatusBadge
                    risk={item.consensusClass === "non_consensus" ? "warning" : item.consensusClass === "near_consensus" ? "info" : "success"}
                    label={item.consensusClass.replace("_", " ")}
                  />
                  <p>{item.text}</p>
                  <span>Median {item.median}</span>
                  <span>IQR {item.iqr}</span>
                  <span>n={item.responseCount}</span>
                </article>
              ))}
        </div>
      </section>

      {realReport ? (
        <section className="panel wide">
          <h3>Methodological Limitations</h3>
          <ul className="plain-list">
            {realReport.limitations.map((limit) => (
              <li key={limit}>{limit}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
