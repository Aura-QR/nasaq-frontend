const normalizePermissions = (
  permissions
) => {
  if (
    Array.isArray(permissions)
  ) {
    return permissions
      .map((permission) =>
        String(
          permission || ""
        ).trim()
      )
      .filter(Boolean);
  }

  if (
    typeof permissions ===
      "string" &&
    permissions.trim()
  ) {
    try {
      const parsed =
        JSON.parse(permissions);

      return normalizePermissions(
        parsed
      );
    } catch {
      return [
        permissions.trim(),
      ];
    }
  }

  return [];
};

export const getStoredPermissions =
  () => {
    try {
      return normalizePermissions(
        localStorage.getItem(
          "permissions"
        )
      );
    } catch {
      return [];
    }
  };

export const hasPermission = (
  permissions,
  requestedPermission
) => {
  const normalizedPermissions =
    normalizePermissions(
      permissions
    );

  const requested =
    String(
      requestedPermission || ""
    ).trim();

  if (!requested) {
    return true;
  }

  if (
    normalizedPermissions.includes(
      "*"
    ) ||
    normalizedPermissions.includes(
      "school.*"
    ) ||
    normalizedPermissions.includes(
      "platform.*"
    )
  ) {
    return true;
  }

  if (
    normalizedPermissions.includes(
      requested
    )
  ) {
    return true;
  }

  const permissionParts =
    requested.split(".");

  if (
    permissionParts.length >= 3
  ) {
    const moduleWildcard =
      `${permissionParts[0]}.${permissionParts[1]}.*`;

    const moduleManage =
      `${permissionParts[0]}.${permissionParts[1]}.manage`;

    return (
      normalizedPermissions.includes(
        moduleWildcard
      ) ||
      normalizedPermissions.includes(
        moduleManage
      )
    );
  }

  return false;
};

export const hasAnyPermission = (
  permissions,
  requestedPermissions = []
) =>
  requestedPermissions.some(
    (permission) =>
      hasPermission(
        permissions,
        permission
      )
  );

export const hasAllPermissions = (
  permissions,
  requestedPermissions = []
) =>
  requestedPermissions.every(
    (permission) =>
      hasPermission(
        permissions,
        permission
      )
  );

export {
  normalizePermissions,
};
