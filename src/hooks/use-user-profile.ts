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

export type ProgramRegistrationInfo = EventRegistrationInfo;

type UserProfileState = {
  settings: UserSettings;
  eventRegistrations: Record<string, EventRegistrationInfo>;
  programRegistrations: Record<string, ProgramRegistrationInfo>;
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
    municipality: "Prototype Municipality",
    barangay: "",
    bio: "",
    notifications: true,
    showEmailPublic: false,
  },
  eventRegistrations: {},
  programRegistrations: {},
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

      const [profileResp, joinedProgramsResp, joinedOrgsResp, eventRegsResp, programRegsResp] = await Promise.all([
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
        supabase
          .from("program_registrations")
          .select("program_id,full_name,email,contact_number,municipality,registration_status,cancelled_at,barangays(name)")
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
          municipality: row.municipality ?? "Prototype Municipality",
          barangay: eventBarangay,
        };
        return acc;
      }, {});
      const programRegistrations = (programRegsResp.data ?? []).reduce<Record<string, ProgramRegistrationInfo>>((acc, row) => {
        const programBarangay = (Array.isArray(row.barangays) ? row.barangays[0] : row.barangays)?.name ?? "";
        acc[row.program_id] = {
          fullName: row.full_name ?? "",
          email: row.email ?? "",
          contactNumber: row.contact_number ?? "",
          municipality: row.municipality ?? "Prototype Municipality",
          barangay: programBarangay,
        };
        return acc;
      }, {});
      const joinedProgramIds = Array.from(
        new Set([...(joinedProgramsResp.data ?? []).map((row) => row.program_id), ...Object.keys(programRegistrations)]),
      );

      const loaded: UserProfileState = {
        settings: {
          fullName: profileRow?.full_name ?? profileRow?.display_name ?? user.displayName ?? "",
          email: profileRow?.email ?? user.email ?? "",
          contactNumber: profileRow?.contact_number ?? "",
          municipality: profileRow?.municipality ?? "Prototype Municipality",
          barangay: resolvedBarangay,
          bio: profileRow?.bio ?? "",
          notifications: profileRow?.notifications ?? true,
          showEmailPublic: profileRow?.show_email_public ?? false,
        },
        joined: {
          programs: joinedProgramIds,
          organizations: (joinedOrgsResp.data ?? []).map((row) => row.organization_id),
          events: Object.keys(eventRegistrations),
        },
        eventRegistrations,
        programRegistrations,
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
    const nextProgramRegistrations = { ...profile.programRegistrations };
    if (type === "events") delete nextRegistrations[id];
    if (type === "programs") delete nextProgramRegistrations[id];

    const next = {
      ...profile,
      eventRegistrations: nextRegistrations,
      programRegistrations: nextProgramRegistrations,
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
        await supabase
          .from("program_registrations")
          .update({
            registration_status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("program_id", id)
          .is("cancelled_at", null);
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

  const registerForEvent = async (eventId: string, info: EventRegistrationInfo) => {
    if (!supabase || !user || isLocalAdmin) {
      throw new Error("Registration is only available for signed-in portal users.");
    }

    const cleanedInfo: EventRegistrationInfo = {
      fullName: info.fullName.trim(),
      email: info.email.trim().toLowerCase(),
      contactNumber: info.contactNumber.trim(),
      municipality: info.municipality.trim(),
      barangay: info.barangay.trim(),
    };

    const previousProfile = profile;
    const nextEvents = profile.joined.events.includes(eventId)
      ? profile.joined.events
      : [...profile.joined.events, eventId];

    const next = {
      ...profile,
      settings: {
        ...profile.settings,
        fullName: cleanedInfo.fullName,
        email: cleanedInfo.email,
        contactNumber: cleanedInfo.contactNumber,
        municipality: cleanedInfo.municipality,
        barangay: cleanedInfo.barangay,
      },
      eventRegistrations: { ...profile.eventRegistrations, [eventId]: cleanedInfo },
      joined: { ...profile.joined, events: nextEvents },
    };

    persist(next);

    try {
      const barangayId = await getBarangayIdByName(cleanedInfo.barangay);

      const rpcResult = await supabase.rpc("register_for_event_portal", {
        p_event_id: eventId,
        p_full_name: cleanedInfo.fullName,
        p_email: cleanedInfo.email,
        p_contact_number: cleanedInfo.contactNumber,
        p_municipality: cleanedInfo.municipality,
        p_barangay_id: barangayId,
      });

      if (!rpcResult.error) return;

      const canFallbackToLegacyFlow =
        rpcResult.error.code === "42883" ||
        /register_for_event_portal/i.test(rpcResult.error.message ?? "");

      if (!canFallbackToLegacyFlow) {
        throw new Error(rpcResult.error.message);
      }

      const existing = await supabase
        .from("event_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        throw new Error(existing.error.message);
      }

      if (existing.data?.id) {
        const { error: updateError } = await supabase
          .from("event_registrations")
          .update({
            full_name: cleanedInfo.fullName,
            email: cleanedInfo.email,
            contact_number: cleanedInfo.contactNumber,
            municipality: cleanedInfo.municipality,
            barangay_id: barangayId,
            registration_status: "registered",
            cancelled_at: null,
            registered_at: new Date().toISOString(),
          })
          .eq("id", existing.data.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
        return;
      }

      const { error: insertError } = await supabase.from("event_registrations").insert({
        user_id: user.id,
        event_id: eventId,
        full_name: cleanedInfo.fullName,
        email: cleanedInfo.email,
        contact_number: cleanedInfo.contactNumber,
        municipality: cleanedInfo.municipality,
        barangay_id: barangayId,
        registration_status: "registered",
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    } catch (error) {
      setProfile(previousProfile);
      throw error;
    }
  };

  const registerForProgram = async (programId: string, info: ProgramRegistrationInfo) => {
    if (!supabase || !user || isLocalAdmin) {
      throw new Error("Registration is only available for signed-in portal users.");
    }

    const cleanedInfo: ProgramRegistrationInfo = {
      fullName: info.fullName.trim(),
      email: info.email.trim().toLowerCase(),
      contactNumber: info.contactNumber.trim(),
      municipality: info.municipality.trim(),
      barangay: info.barangay.trim(),
    };

    const previousProfile = profile;
    const nextPrograms = profile.joined.programs.includes(programId)
      ? profile.joined.programs
      : [...profile.joined.programs, programId];

    const next = {
      ...profile,
      settings: {
        ...profile.settings,
        fullName: cleanedInfo.fullName,
        email: cleanedInfo.email,
        contactNumber: cleanedInfo.contactNumber,
        municipality: cleanedInfo.municipality,
        barangay: cleanedInfo.barangay,
      },
      programRegistrations: { ...profile.programRegistrations, [programId]: cleanedInfo },
      joined: { ...profile.joined, programs: nextPrograms },
    };

    persist(next);

    try {
      const barangayId = await getBarangayIdByName(cleanedInfo.barangay);

      const rpcResult = await supabase.rpc("register_for_program_portal", {
        p_program_id: programId,
        p_full_name: cleanedInfo.fullName,
        p_email: cleanedInfo.email,
        p_contact_number: cleanedInfo.contactNumber,
        p_municipality: cleanedInfo.municipality,
        p_barangay_id: barangayId,
      });

      if (!rpcResult.error) return;

      const isKnownMembershipConstraintIssue =
        rpcResult.error.code === "23505" &&
        /uq_user_program_active/i.test(rpcResult.error.message ?? "");
      const canFallbackToLegacyFlow =
        rpcResult.error.code === "42883" ||
        /register_for_program_portal/i.test(rpcResult.error.message ?? "") ||
        isKnownMembershipConstraintIssue;

      if (!canFallbackToLegacyFlow) {
        throw new Error(rpcResult.error.message);
      }

      const existing = await supabase
        .from("program_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("program_id", programId)
        .order("registered_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing.error) {
        throw new Error(existing.error.message);
      }

      if (existing.data?.id) {
        const { error: updateError } = await supabase
          .from("program_registrations")
          .update({
            full_name: cleanedInfo.fullName,
            email: cleanedInfo.email,
            contact_number: cleanedInfo.contactNumber,
            municipality: cleanedInfo.municipality,
            barangay_id: barangayId,
            registration_status: "registered",
            cancelled_at: null,
            registered_at: new Date().toISOString(),
          })
          .eq("id", existing.data.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: registrationInsertError } = await supabase.from("program_registrations").insert({
          user_id: user.id,
          program_id: programId,
          full_name: cleanedInfo.fullName,
          email: cleanedInfo.email,
          contact_number: cleanedInfo.contactNumber,
          municipality: cleanedInfo.municipality,
          barangay_id: barangayId,
          registration_status: "registered",
        });

        if (registrationInsertError) {
          throw new Error(registrationInsertError.message);
        }
      }

      const membershipInsert = await supabase
        .from("user_program_memberships")
        .insert({ user_id: user.id, program_id: programId });
      if (membershipInsert.error) {
        const duplicateActiveMembership =
          membershipInsert.error.code === "23505" ||
          /uq_user_program_active/i.test(membershipInsert.error.message ?? "");

        if (!duplicateActiveMembership) {
          throw new Error(membershipInsert.error.message);
        }
      }
    } catch (error) {
      setProfile(previousProfile);
      throw error;
    }
  };

  const getEventRegistration = (eventId: string) => profile.eventRegistrations[eventId] ?? null;
  const getProgramRegistration = (programId: string) => profile.programRegistrations[programId] ?? null;

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
    registerForProgram,
    getEventRegistration,
    getProgramRegistration,
    joinedCounts,
  };
};
