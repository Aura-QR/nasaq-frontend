import { configureStore } from "@reduxjs/toolkit";
import plansReducer from "./plansSlice";
import featuresReducer from "./featuresSlice";
import activitiesReducer from "./activitiesSlice";
import catReducer from "./catSlice";

const store = configureStore({ reducer : { plans : plansReducer , features : featuresReducer , activities : activitiesReducer , cats : catReducer } })

export default store;