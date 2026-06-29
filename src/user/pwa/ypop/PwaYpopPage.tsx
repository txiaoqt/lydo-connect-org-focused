import { ChevronDown, FileText, Medal, Trophy } from "lucide-react";
import { StatusBadge } from "@/components/portal/StatusBadge";
import {
  computeYpopScore,
  getApprovedYpopOrgActivityCount,
  normalizeYpopCityLedPoints,
  resolveYpopCityLedCategory,
  YPOP_CITY_LED_CATEGORY_LABELS,
} from "@/lib/lydo-connect-data";
import type { usePwaPortalData } from "../hooks/usePwaPortalData";

type PortalData = ReturnType<typeof usePwaPortalData>;

const dateLabel = (value: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
};

export function PwaYpopPage({ data }: { data: PortalData }) {
  const { state } = data.store;
  const organizationId = data.profile?.id ?? "";
  const participations = state.ypopEventParticipations.filter((item) => item.organizationId === organizationId);
  const orgActivities = state.ypopOrgActivities.filter((item) => item.organizationId === organizationId);

  return (
    <div className="pwa-stack">
      <section className="pwa-page-intro">
        <span><Medal aria-hidden="true" /></span>
        <div>
          <h2>YPOP Incentive</h2>
          <p>Review semesters, verified participation, qualification results, and the current scoring breakdown.</p>
        </div>
      </section>

      <section className="pwa-stack" aria-label="YPOP semester submissions">
        {data.ypopEntries.map((entry) => {
          const period = state.ypopPeriods.find((item) => item.semesterKey === entry.semester) ?? null;
          const semesterActivities = state.ypopCityActivities
            .filter((item) => item.semesterKey === entry.semester)
            .sort((left, right) => left.date.localeCompare(right.date));
          const semesterParticipations = participations.filter((participation) =>
            semesterActivities.some((activity) => activity.id === participation.activityId),
          );
          const semesterOrgActivities = orgActivities.filter((activity) => activity.ypopEntryId === entry.id);
          const approvedOrgActivityCount = getApprovedYpopOrgActivityCount(
            semesterOrgActivities,
            entry.id,
            entry.orgLedProjectCount ?? 0,
          );
          const score = computeYpopScore(
            entry.cityLedAttendance ?? [],
            semesterActivities,
            approvedOrgActivityCount,
            period?.orgLedTiers,
          );
          const verifiedActivityIds = new Set(
            (entry.cityLedAttendance ?? [])
              .filter((attendance) => attendance.attended)
              .map((attendance) => attendance.activityId),
          );
          const legacyFiles = state.ypopFiles.filter((file) => file.ypopEntryId === entry.id);
          const eventProofFiles = state.ypopEventFiles.filter((file) =>
            semesterParticipations.some((participation) => participation.id === file.participationId),
          );
          const orgProofFiles = state.ypopOrgActivityFiles.filter((file) =>
            semesterOrgActivities.some((activity) => activity.id === file.orgActivityId),
          );
          const proofCount = legacyFiles.length + eventProofFiles.length + orgProofFiles.length;
          const threshold = entry.pointsRequired;
          const recentUpdates = [
            ...(entry.revisionHistory ?? []).map((item) => ({
              label: item.action.replaceAll("_", " "),
              detail: item.adminRemarks,
              date: item.changedAt,
            })),
            ...semesterParticipations.map((item) => ({
              label: `${item.activityName}: ${item.status.replaceAll("_", " ")}`,
              detail: item.adminRemarks,
              date: item.updatedAt,
            })),
            ...semesterOrgActivities.map((item) => ({
              label: `${item.activityName}: ${item.status.replaceAll("_", " ")}`,
              detail: item.adminRemarks,
              date: item.updatedAt,
            })),
          ]
            .filter((item) => item.date)
            .sort((left, right) => right.date.localeCompare(left.date))
            .slice(0, 3);

          return (
            <article className="pwa-card pwa-ypop-card" key={entry.id}>
              <div className="pwa-ypop-heading">
                <div>
                  <h3>{entry.semesterLabel}</h3>
                  <p>{period?.status === "open" ? `Validation closes ${dateLabel(entry.validationDeadline || period.validationDeadline)}` : `Period ${period?.status ?? "unavailable"}`}</p>
                </div>
                <StatusBadge status={entry.status} />
              </div>

              <div className="pwa-ypop-score">
                <span><small>Current participation score</small><strong>{score.totalScore}%</strong></span>
                <span><small>Qualification threshold</small><strong>{threshold}%</strong></span>
              </div>
              <div className="pwa-progress" aria-label={`${score.totalScore}% current YPOP participation score`}>
                <span style={{ width: `${Math.min(100, Math.max(0, score.totalScore))}%` }} />
              </div>

              <div className="pwa-ypop-metrics">
                <span><small>City-led</small><strong>{score.cityLedEarned} / {score.cityLedMax} pts</strong></span>
                <span><small>City score</small><strong>{score.cityLedPercent}%</strong></span>
                <span><small>Org bonus</small><strong>+{score.orgLedBonus}%</strong></span>
                <span><small>Approved PPAs</small><strong>{approvedOrgActivityCount}</strong></span>
              </div>

              {(entry.status === "qualified" || entry.status === "not_qualified") ? (
                <div className={`pwa-ypop-result ${entry.status === "qualified" ? "is-qualified" : "is-not-qualified"}`}>
                  {entry.status === "qualified" ? <Trophy aria-hidden="true" /> : <Medal aria-hidden="true" />}
                  <div>
                    <strong>{entry.status === "qualified" ? "Qualified for the YPOP incentive" : "Not qualified for this period"}</strong>
                    <p>Qualification is the admin-validated result for this semester. The score above is recalculated from current verified participation.</p>
                  </div>
                </div>
              ) : null}

              {entry.adminRemarks ? <div className="pwa-admin-note"><strong>Admin remarks</strong><p>{entry.adminRemarks}</p></div> : null}

              <details className="pwa-ypop-details">
                <summary>View participation details <ChevronDown aria-hidden="true" /></summary>

                <section>
                  <h4>City-led activities</h4>
                  {semesterActivities.map((activity) => {
                    const participation = semesterParticipations.find((item) => item.activityId === activity.id);
                    const verified = verifiedActivityIds.has(activity.id);
                    return (
                      <div className="pwa-ypop-record" key={activity.id}>
                        <div>
                          <strong>{activity.name}</strong>
                          <small>{dateLabel(activity.date)}{activity.venue ? ` · ${activity.venue}` : ""}</small>
                        </div>
                        <span className="pwa-ypop-record-meta">
                          <small>{YPOP_CITY_LED_CATEGORY_LABELS[resolveYpopCityLedCategory(activity.category, activity.points)]}</small>
                          <strong>{normalizeYpopCityLedPoints(activity.points, activity.category)} pts</strong>
                          <StatusBadge status={verified ? "verified" : participation?.status ?? "not_started"} />
                        </span>
                      </div>
                    );
                  })}
                  {!semesterActivities.length ? <p className="pwa-empty-copy">No city-led activities are configured for this semester.</p> : null}
                </section>

                <section>
                  <h4>Organization-initiated activities</h4>
                  {semesterOrgActivities.map((activity) => (
                    <div className="pwa-ypop-record" key={activity.id}>
                      <div><strong>{activity.activityName}</strong><small>{dateLabel(activity.activityDate)} · {activity.venue || "Venue not set"}</small></div>
                      <StatusBadge status={activity.status} />
                    </div>
                  ))}
                  {!semesterOrgActivities.length ? <p className="pwa-empty-copy">No organization-initiated activities submitted.</p> : null}
                </section>

                <section>
                  <h4>Proof documents</h4>
                  <p className="pwa-ypop-proof-count"><FileText aria-hidden="true" /> {proofCount} proof file{proofCount === 1 ? "" : "s"} attached</p>
                </section>

                <section>
                  <h4>Recent activity</h4>
                  {recentUpdates.map((item, index) => (
                    <div className="pwa-ypop-update" key={`${item.date}-${index}`}>
                      <strong>{item.label}</strong>
                      {item.detail ? <p>{item.detail}</p> : null}
                      <time>{dateLabel(item.date)}</time>
                    </div>
                  ))}
                  {!recentUpdates.length ? <p className="pwa-empty-copy">No recent YPOP activity.</p> : null}
                </section>
              </details>
            </article>
          );
        })}
        {!data.ypopEntries.length ? <section className="pwa-card pwa-empty-copy">No YPOP semester submissions yet.</section> : null}
      </section>
    </div>
  );
}

