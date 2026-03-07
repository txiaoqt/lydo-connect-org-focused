import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./use-auth";

const USER_PROFILE_STORAGE_KEY = "lydo_connect_user_profile";

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

export const useUserProfile = () => {
  const { user } = useAuth();
  const storageKey = user ? `${USER_PROFILE_STORAGE_KEY}:${user.id}` : `${USER_PROFILE_STORAGE_KEY}:guest`;
  const [profile, setProfile] = useState<UserProfileState>(defaultProfile);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      const seeded = {
        ...defaultProfile,
        settings: {
          ...defaultProfile.settings,
          fullName: user?.displayName ?? "",
          email: user?.email ?? "",
        },
      };
      setProfile(seeded);
      window.localStorage.setItem(storageKey, JSON.stringify(seeded));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as UserProfileState;
      setProfile({
        ...defaultProfile,
        ...parsed,
        settings: { ...defaultProfile.settings, ...(parsed.settings ?? {}) },
        joined: { ...defaultProfile.joined, ...(parsed.joined ?? {}) },
        eventRegistrations: parsed.eventRegistrations ?? {},
      });
    } catch {
      setProfile(defaultProfile);
    }
  }, [storageKey, user?.displayName, user?.email]);

  const persist = (next: UserProfileState) => {
    setProfile(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const updateSettings = (settings: UserSettings) => {
    persist({ ...profile, settings });
  };

  const join = (type: JoinedType, id: string) => {
    if (profile.joined[type].includes(id)) return;
    persist({
      ...profile,
      joined: { ...profile.joined, [type]: [...profile.joined[type], id] },
    });
  };

  const leave = (type: JoinedType, id: string) => {
    const nextRegistrations = { ...profile.eventRegistrations };
    if (type === "events") delete nextRegistrations[id];
    persist({
      ...profile,
      eventRegistrations: nextRegistrations,
      joined: {
        ...profile.joined,
        [type]: profile.joined[type].filter((itemId) => itemId !== id),
      },
    });
  };

  const isJoined = (type: JoinedType, id: string) => profile.joined[type].includes(id);

  const registerForEvent = (eventId: string, info: EventRegistrationInfo) => {
    const nextEvents = profile.joined.events.includes(eventId)
      ? profile.joined.events
      : [...profile.joined.events, eventId];
    persist({
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
    });
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
    updateSettings,
    join,
    leave,
    isJoined,
    registerForEvent,
    getEventRegistration,
    joinedCounts,
  };
};
