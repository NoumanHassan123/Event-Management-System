import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { readRegistrations, saveRegistration } from '../../services/registrationService.js'

export const loadRegistrations = createAsyncThunk(
  'registrations/load',
  (userId, { getState }) => {
    if (!userId || getState().auth.user?.id !== userId) throw new Error('Please log in to view your registrations.')
    return readRegistrations(userId)
  },
  { condition: (userId, { getState }) => getState().registrations.byUser[userId]?.status !== 'loading' },
)

export const registerForEvent = createAsyncThunk(
  'registrations/register',
  (event, { getState }) => {
    const userId = getState().auth.user?.id
    if (!userId) throw new Error('Please log in to register for this event.')
    return { userId, items: saveRegistration(userId, event) }
  },
)

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState: { byUser: {} },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadRegistrations.pending, (state, action) => {
        state.byUser[action.meta.arg] = { items: [], status: 'loading', error: null }
      })
      .addCase(loadRegistrations.fulfilled, (state, action) => {
        state.byUser[action.meta.arg] = { items: action.payload, status: 'succeeded', error: null }
      })
      .addCase(loadRegistrations.rejected, (state, action) => {
        state.byUser[action.meta.arg] = { items: [], status: 'failed', error: action.error.message }
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.byUser[action.payload.userId] = { items: action.payload.items, status: 'succeeded', error: null }
      })
  },
})

export default registrationsSlice.reducer
