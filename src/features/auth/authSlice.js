import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { readSession, registerAccount, signIn, signOut } from '../../services/authService.js'

export const register = createAsyncThunk('auth/register', registerAccount)
export const login = createAsyncThunk('auth/login', signIn)
export const logout = createAsyncThunk('auth/logout', signOut)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: readSession(),
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
      })
  },
})

export default authSlice.reducer
