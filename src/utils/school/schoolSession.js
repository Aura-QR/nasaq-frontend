import {
  getStoredRole,
  getStoredSchoolId,
  getStoredUser,
} from "@/shared/auth/session";

import {
  normalizeRole,
} from "@/shared/auth/roles";

const getAuthUserObject = (
  authState
) => {
  const candidates = [
    authState?.user?.user,
    authState?.user,
    authState,
    getStoredUser(),
  ];

  return (
    candidates.find(
      (candidate) =>
        candidate &&
        typeof candidate ===
          "object" &&
        !Array.isArray(
          candidate
        )
    ) || {}
  );
};

export const getSchoolSessionInfo =
  (authState) => {
    const user =
      getAuthUserObject(
        authState
      );

    const role =
      normalizeRole(
        user?.role ||
          authState?.role ||
          authState?.user?.role ||
          getStoredRole()
      );

    const email =
      user?.email ||
      user?.schoolEmail ||
      authState?.email ||
      "";

    const displayName =
      user?.name ||
      user?.fullName ||
      user?.username ||
      email ||
      "مستخدم نَسّق";

    const schoolObject =
      user?.school ||
      authState?.school ||
      authState?.user
        ?.school ||
      {};

    const schoolName =
      schoolObject?.name ||
      schoolObject
        ?.schoolName ||
      user?.schoolName ||
      authState?.schoolName ||
      "المدرسة";

    const schoolSlug =
      schoolObject?.slug ||
      user?.schoolSlug ||
      authState?.schoolSlug ||
      "";

    const schoolId =
      schoolObject?._id ||
      schoolObject?.id ||
      user?.schoolId ||
      authState?.schoolId ||
      getStoredSchoolId() ||
      "";

    return {
      user,
      role,
      email,
      displayName,
      schoolName,
      schoolSlug,
      schoolId,
    };
  };

export const getSchoolRoleLabel =
  (role) => {
    const labels = {
      OWNER: "مالك المدرسة",
      SUPERVISOR:
        "مدير المدرسة",
      MANAGER: "مساعد إداري",
      TEACHER: "معلم",
      STUDENT: "طالب",
    };

    return (
      labels[
        normalizeRole(role)
      ] || "مستخدم المدرسة"
    );
  };
