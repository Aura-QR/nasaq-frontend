import {
  Route,
} from "react-router-dom";

import GradeLevelsList from "@/pages/GradeLevels/List";

export const gradeLevelsRoutes = (
  <Route
    path="/school/grade-levels"
    element={
      <GradeLevelsList />
    }
  />
);
