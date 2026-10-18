import { Link } from "react-router-dom";

/** Public account-deletion instructions; never deletes a user automatically. */
const AccountDeletionLink = ({ light = false, compact = false }) => (
  <Link
    to="/account-deletion"
    aria-label="طلب حذف الحساب"
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: compact ? "auto" : "100%",
      padding: compact ? "7px 10px" : "10px 12px",
      borderRadius: 10,
      border: `1px solid ${light ? "rgba(255,255,255,.28)" : "#dce5ed"}`,
      color: light ? "#f5e9cc" : "#173f65",
      backgroundColor: light ? "rgba(255,255,255,.07)" : "#f7f9fc",
      fontFamily: "inherit",
      fontSize: compact ? 11 : 12,
      fontWeight: 700,
      textDecoration: "none",
      boxSizing: "border-box",
    }}
  >
    طلب حذف الحساب
  </Link>
);

export default AccountDeletionLink;
