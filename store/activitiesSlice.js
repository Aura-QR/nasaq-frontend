import { createSlice } from "@reduxjs/toolkit";

const activitiesSlice = createSlice({
  name : "activities",
  initialState : { activities : [] },
  reducers : {
    GET_ACTIVITIES : (state , action) => {
      state.activities = action.payload
    },
    DEL_ACTIVITY : (state , action) => {
      state.activities = state.activities.filter(activity => activity.id !== action.payload )
    },
    ADD_ACTIVITY : (state , action) => {
      state.activities = [...state.activities, action.payload]
    },
    EDIT_ACTIVITY : (state , action) => {
      const item = state.activities.filter(activity => activity.id === action.payload.id)
      const index = state.activities.indexOf(item[0])
      state.activities[index] = action.payload
      state.activities = [ ...state.activities ]
    },
  }
})


export const { GET_ACTIVITIES , ADD_ACTIVITY , DEL_ACTIVITY , EDIT_ACTIVITY } = activitiesSlice.actions;
export default activitiesSlice.reducer;