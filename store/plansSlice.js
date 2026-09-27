import { createSlice } from "@reduxjs/toolkit";

const plansSlice = createSlice({
  name : "plans",
  initialState : { plans : [] },
  reducers : {
    GET_PLANS : (state , action) => {
      state.plans = action.payload
    },
    DEL_PLAN : (state , action) => {
      state.plans = state.plans.filter(plan => plan.id !== action.payload )
    },
  }
})


export const { GET_PLANS , ADD_PLAN , EDIT_PLAN , DEL_PLAN } = plansSlice.actions;
export default plansSlice.reducer;