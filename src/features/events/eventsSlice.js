import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getEvents, getEventDetails } from '../../services/ticketmasterService.js'

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  (_, { signal }) => getEvents({ signal }),
  { condition: (_, { getState }) => getState().events.status !== 'loading' },
)

export const fetchEventDetails = createAsyncThunk(
  'events/fetchEventDetails',
  (id, { signal }) => getEventDetails(id, { signal }),
  { condition: (id, { getState }) => getState().events.details[id]?.status !== 'loading' },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState: { items: [], status: 'idle', error: null, details: {} },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.items = action.payload
        state.status = 'succeeded'
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message || 'Events could not be loaded.'
      })
      .addCase(fetchEventDetails.pending, (state, action) => {
        state.details[action.meta.arg] = { status: 'loading', event: null, error: null }
      })
      .addCase(fetchEventDetails.fulfilled, (state, action) => {
        state.details[action.meta.arg] = { status: 'succeeded', event: action.payload, error: null }
      })
      .addCase(fetchEventDetails.rejected, (state, action) => {
        state.details[action.meta.arg] = {
          status: 'failed', event: null,
          error: action.error.message || 'Event details could not be loaded.',
        }
      })
  },
})

export default eventsSlice.reducer
