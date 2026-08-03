import {
  Route,
} from "react-router-dom";

import StagesList from "@/pages/Stages/List";

export const stagesRoutes = (
  <Route
    path="/school/stages"
    element={
      <StagesList />
    }
  />
);
