import { Box } from "@mui/material";
import { useAuthUser } from "react-auth-kit";
import { Outlet } from "react-router-dom";

import NotificationBell from "./NotificationBell";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";
import {
  getStoredRole,
} from "@/shared/auth/session";

const DUTY_NOTIFICATION_ROLES = [
  ROLES.OWNER,
  ROLES.SUPERVISOR,
  ROLES.MANAGER,
  ROLES.TEACHER,
];

/**
 * One notifications poller for the authenticated school/teacher experience.
 * AppRouter does not mount the legacy SchoolLayout/TeacherLayout, so keeping
 * the bell here makes it available on every relevant route without duplicate
 * polling. Platform admins and students do not use the duty notifications.
 */
const NotificationRouteShell = () => {
  const getAuthUser = useAuthUser();
  const authState = getAuthUser?.() || {};

  const role = normalizeRole(
    authState?.user?.role ||
      authState?.role ||
      getStoredRole()
  );

  const showBell = DUTY_NOTIFICATION_ROLES.includes(role);

  return (
    <>
      <Outlet />

      {showBell && (
        <Box
          sx={{
            position: "fixed",
            left: { xs: 12, sm: 18 },
            bottom: { xs: 12, sm: 18 },
            zIndex: 1400,
            p: 0.35,
            borderRadius: "50%",
            backgroundColor: "rgba(255,253,250,0.96)",
            border: "1px solid rgba(36,74,112,0.14)",
            boxShadow: "0 10px 28px rgba(18,47,77,0.18)",
            backdropFilter: "blur(12px)",
          }}
        >
          <NotificationBell
            sx={{
              width: 42,
              height: 42,
              color: "var(--color-navy, #244a70)",
            }}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
          />
        </Box>
      )}
    </>
  );
};

export default NotificationRouteShell;
