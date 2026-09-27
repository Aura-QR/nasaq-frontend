import { Route } from "react-router-dom";
import { RequireAuth } from "react-auth-kit";

// Library Components
import Library_List from "../pages/School/Library/List";
import RequirePermission from "@/components/RequirePermission";

export const libraryRoutes = (
  <>
    <Route
      path="/school/library"
      element={
        <RequireAuth loginPath="/">
          <RequirePermission module="library" operation="read">
            <Library_List />
          </RequirePermission>
        </RequireAuth>
      }
    />
  </>
);
