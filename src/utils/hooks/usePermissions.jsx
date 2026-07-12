const usePermissions = (module, operation) => {
    const raw = localStorage.getItem("permissions");

    // permissions not in storage (e.g. student role, or post-logout race)
    if (!raw) return null;

    let permissions;
    try {
        permissions = JSON.parse(raw);
    } catch {
        return null;
    }

    if (!permissions) return null;

    if (module && module in permissions) {
        if (operation && operation in permissions[module]) {
            return permissions[module][operation];
        }
        return permissions[module];
    }
    return permissions;
};

export default usePermissions;