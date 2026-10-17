import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getEvents } from '../../services/ticketmasterService.js'

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  (_, { signal }) => getEvents({ signal }),
  { condition: (_, { getState }) => getState().events.status !== 'loading' },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState: { items: [], status: 'idle', error: null },
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
  },
})

export default eventsSlice.reducer
