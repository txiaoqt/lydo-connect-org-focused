import { useEffect, useMemo, useState } from "react";
import { PREDEFINED_ADMIN_USER } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

type JoinedType = "events" | "programs" | "organizations";

export type UserSettings = {
  fullName: string;
  email: string;
  contactNumber: string;
  municipality: string;
  barangay: string;
  bio: string;
  notifications: boolean;
  showEmailPublic: boolean;
};

export type EventRegistrationInfo = {
  fullName: string;
  email: string;
  contactNumber: string;
  municipality: string;
  barangay: string;
};

type UserProfileState = {
  settings: UserSettings;
  eventRegistrations: Record<string, EventRegistrationInfo>;
  joined: {
    events: string[];
    programs: string[];
    organizations: string[];
  };
};

const defaultProfile: UserProfileState = {
  settings: {
    fullName: "",
    email: "",
    contactNumber: "",
    municipality: "San Mateo, Rizal",
    barangay: "",
    bio: "",
    notifications: true,
    showEmailPublic: false,
  },
  eventRegistrations: {},
  joined: {
    events: [],
    programs: [],
    organizations: [],
  },
};

const getBarangayIdByName = async (barangayName: string) => {
  if (!supabase || !barangayName.trim()) return null;
  const { data } = await supabase.from("barangays").select("id").eq("name", barangayName.trim()).maybeSingle();
  return data?.id ?? null;
};

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfileState>(defaultProfile);
  const [isLoading, setIsLoading] = useState(true);
  const isLocalAdmin = user?.id === PREDEFINED_ADMIN_USER.id;

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user) {
        if (!mounted) return;
        setProfile(defaultProfile);
        setIsLoading(false);
        return;
      }

      if (!supabase || isLocalAdmin) {
        if (!mounted) return;
        setProfile({
          ...defaultProfile,
          settings: {
            ...defaultProfile.settings,
            fullName: user.displayName ?? "",
            email: user.email ?? "",
          },
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const [profileResp, joinedProgramsResp, joinedOrgsResp, eventRegsResp] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("full_name,display_name,email,contact_number,municipality,bio,notifications,show_email_public,barangay_id,barangays(name)")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_program_memberships").select("program_id").eq("user_id", user.id).is("left_at", null),
        supabase.from("user_org_memberships").select("organization_id").eq("user_id", user.id).is("left_at", null),
        supabase
          .from("event_registrations")
          .select("event_id,full_name,email,contact_number,municipality,registration_status,cancelled_at,barangays(name)")
          .eq("user_id", user.id)
          .is("cancelled_at", null)
          .in("registration_status", ["registered", "attended", "waitlisted"]),
      ]);

      const profileRow = profileResp.data;
      let resolvedBarangay =
        (Array.isArray(profileRow?.barangays) ? profileRow?.barangays[0] : profileRow?.barangays)?.name ?? "";

      if (!resolvedBarangay && profileRow?.barangay_id) {
        const { data: barangayData } = await supabase
          .from("barangays")
          .select("name")
          .eq("id", profileRow.barangay_id)
          .maybeSingle();
        resolvedBarangay = barangayData?.name ?? "";
      }

      const eventRegistrations = (eventRegsResp.data ?? []).reduce<Record<string, EventRegistrationInfo>>((acc, row) => {
        const eventBarangay = (Array.isArray(row.barangays) ? row.barangays[0] : row.barangays)?.name ?? "";
        acc[row.event_id] = {
          fullName: row.full_name ?? "",
          email: row.email ?? "",
          contactNumber: row.contact_number ?? "",
          municipality: row.municipality ?? "San Mateo, Rizal",
          barangay: eventBarangay,
        };
        return acc;
      }, {});

      const loaded: UserProfileState = {
        settings: {
          fullName: profileRow?.full_name ?? profileRow?.display_name ?? user.displayName ?? "",
          email: profileRow?.email ?? user.email ?? "",
          contactNumber: profileRow?.contact_number ?? "",
          municipality: profileRow?.municipality ?? "San Mateo, Rizal",
          barangay: resolvedBarangay,
          bio: profileRow?.bio ?? "",
          notifications: profileRow?.notifications ?? true,
          showEmailPublic: profileRow?.show_email_public ?? false,
        },
        joined: {
          programs: (joinedProgramsResp.data ?? []).map((row) => row.program_id),
          organizations: (joinedOrgsResp.data ?? []).map((row) => row.organization_id),
          events: Object.keys(eventRegistrations),
        },
        eventRegistrations,
      };

      if (!mounted) return;
      setProfile(loaded);
      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [isLocalAdmin, user]);

  const persist = (next: UserProfileState) => {
    setProfile(next);
  };

  const updateSettings = (settings: UserSettings) => {
    const next = { ...profile, settings };
    persist(next);

    if (!supabase || !user || isLocalAdmin) return;

    void (async () => {
      const barangayId = await getBarangayIdByName(settings.barangay);
      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        email: settings.email || user.email,
        full_name: settings.fullName,
        display_name: settings.fullName,
        contact_number: settings.contactNumber,
        municipality: settings.municipality,
        barangay_id: barangayId,
        bio: settings.bio,
        notifications: settings.notifications,
        show_email_public: settings.showEmailPublic,
      });
    })();
  };

  const join = (type: JoinedType, id: string) => {
    if (!supabase || !user || isLocalAdmin) return;
    if (profile.joined[type].includes(id)) return;

    const next = {
      ...profile,
      joined: { ...profile.joined, [type]: [...profile.joined[type], id] },
    };
    persist(next);

    void (async () => {
      if (type === "programs") {
        await supabase.from("user_program_memberships").insert({ user_id: user.id, program_id: id });
      } else if (type === "organizations") {
        await supabase.from("user_org_memberships").insert({ user_id: user.id, organization_id: id });
      }
    })();
  };

  const leave = (type: JoinedType, id: string) => {
    if (!supabase || !user || isLocalAdmin) return;

    const nextRegistrations = { ...profile.eventRegistrations };
    if (type === "events") delete nextRegistrations[id];

    const next = {
      ...profile,
      eventRegistrations: nextRegistrations,
      joined: {
        ...profile.joined,
        [type]: profile.joined[type].filter((itemId) => itemId !== id),
      },
    };
    persist(next);

    void (async () => {
      if (type === "programs") {
        await supabase
          .from("user_program_memberships")
          .update({ left_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("program_id", id)
          .is("left_at", null);
      } else if (type === "organizations") {
        await supabase
          .from("user_org_memberships")
          .update({ left_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("organization_id", id)
          .is("left_at", null);
      } else if (type === "events") {
        await supabase
          .from("event_registrations")
          .update({
            registration_status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("event_id", id)
          .is("cancelled_at", null);
      }
    })();
  };

  const isJoined = (type: JoinedType, id: string) => profile.joined[type].includes(id);

  const registerForEvent = (eventId: string, info: EventRegistrationInfo) => {
    if (!supabase || !user || isLocalAdmin) return;

    const nextEvents = profile.joined.events.includes(eventId)
      ? profile.joined.events
      : [...profile.joined.events, eventId];

    const next = {
      ...profile,
      settings: {
        ...profile.settings,
        fullName: info.fullName,
        email: info.email,
        contactNumber: info.contactNumber,
        municipality: info.municipality,
        barangay: info.barangay,
      },
      eventRegistrations: { ...profile.eventRegistrations, [eventId]: info },
      joined: { ...profile.joined, events: nextEvents },
    };

    persist(next);

    void (async () => {
      const barangayId = await getBarangayIdByName(info.barangay);
      const insertResult = await supabase.from("event_registrations").insert({
        user_id: user.id,
        event_id: eventId,
        full_name: info.fullName,
        email: info.email,
        contact_number: info.contactNumber,
        municipality: info.municipality,
        barangay_id: barangayId,
        registration_status: "registered",
      });

      if (!insertResult.error) return;

      await supabase
        .from("event_registrations")
        .update({
          full_name: info.fullName,
          email: info.email,
          contact_number: info.contactNumber,
          municipality: info.municipality,
          barangay_id: barangayId,
          registration_status: "registered",
          cancelled_at: null,
        })
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .is("cancelled_at", null);
    })();
  };

  const getEventRegistration = (eventId: string) => profile.eventRegistrations[eventId] ?? null;

  const joinedCounts = useMemo(
    () => ({
      events: profile.joined.events.length,
      programs: profile.joined.programs.length,
      organizations: profile.joined.organizations.length,
    }),
    [profile.joined.events.length, profile.joined.organizations.length, profile.joined.programs.length],
  );

  return {
    profile,
    isLoading,
    updateSettings,
    join,
    leave,
    isJoined,
    registerForEvent,
    getEventRegistration,
    joinedCounts,
  };
};
