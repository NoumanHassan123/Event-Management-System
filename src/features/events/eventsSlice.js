import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getEvents, getEventDetails } from '../../services/ticketmasterService.js'
import { normalizeEventFilters } from '../../utils/eventFilters.js'

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  (filters, { signal }) => getEvents({ signal, filters }),
  { condition: (filters, { getState }) => {
    const events = getState().events
    return events.status !== 'loading'
      || JSON.stringify(events.filters) !== JSON.stringify(normalizeEventFilters(filters))
  } },
)

export const fetchEventDetails = createAsyncThunk(
  'events/fetchEventDetails',
  (id, { signal }) => getEventDetails(id, { signal }),
  { condition: (id, { getState }) => getState().events.details[id]?.status !== 'loading' },
)

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [], status: 'idle', error: null, details: {},
    filters: normalizeEventFilters(), currentRequestId: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.items = []
        state.filters = normalizeEventFilters(action.meta.arg)
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.items = action.payload
        state.status = 'succeeded'
        state.currentRequestId = null
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.status = 'failed'
        state.error = action.error.message || 'Events could not be loaded.'
        state.currentRequestId = null
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
