import { useEffect, useState } from "react";
import { resolveSupabaseFileUrl } from "@/lib/lydo-connect-supabase";

export function PwaOrganizationAvatar({
  organizationName,
  profileImageUrl,
  className,
}: {
  organizationName: string;
  profileImageUrl?: string | null;
  className: string;
}) {
  const source = profileImageUrl?.trim() ?? "";
  const [resolvedUrl, setResolvedUrl] = useState("");
  const [failed, setFailed] = useState(false);
  const initial = organizationName.trim().charAt(0).toUpperCase() || "Y";

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    if (!source) {
      setResolvedUrl("");
      return () => { cancelled = true; };
    }
    void resolveSupabaseFileUrl(source)
      .then((url) => {
        if (!cancelled) setResolvedUrl(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => { cancelled = true; };
  }, [source]);

  return (
    <span className={className}>
      {resolvedUrl && !failed
        ? <img src={resolvedUrl} alt={`${organizationName} profile`} onError={() => setFailed(true)} />
        : <span aria-hidden="true">{initial}</span>}
    </span>
  );
}
