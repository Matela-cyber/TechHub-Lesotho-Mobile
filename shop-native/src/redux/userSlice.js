import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  // name: display name from Firestore (users/{uid}.name)
  // displayName: from Firebase Auth profile
  initialState: {
    uid: null,
    email: null,
    displayName: null,
    name: null,
    phone: null,
  },
  reducers: {
    setUser(state, action) {
      const { uid, email, displayName, name, phone } = action.payload;
      state.uid = uid;
      state.email = email;
      state.displayName = displayName || null;
      state.name = name || displayName || null;
      state.phone = phone || null;
    },
    clearUser(state) {
      state.uid = null;
      state.email = null;
      state.displayName = null;
      state.name = null;
      state.phone = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
