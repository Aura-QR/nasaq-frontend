import { createSlice } from "@reduxjs/toolkit";

const catsSlice = createSlice({
  name : "cats",
  initialState : { cats : [] },
  reducers : {
    GET_CATS : (state , action) => {
      state.cats = action.payload
    },
    DEL_CAT : (state , action) => {
      state.cats = state.cats.filter(cat => cat.id !== action.payload )
    },
    ADD_CAT : (state , action) => {
      state.cats = [...state.cats, action.payload]
    },
    EDIT_CAT : (state , action) => {
      const item = state.cats.filter(cat => cat.id === action.payload.id)
      const index = state.cats.indexOf(item[0])
      state.cats[index] = action.payload
      state.cats = [ ...state.cats ]
    },
  }
})


export const { GET_CATS , ADD_CAT , DEL_CAT , EDIT_CAT } = catsSlice.actions;
export default catsSlice.reducer;