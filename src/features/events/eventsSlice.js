import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getEventsPage, getEventDetails } from '../../services/ticketmasterService.js'
import { normalizeEventFilters } from '../../utils/eventFilters.js'

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  (query, { signal, getState }) => {
    const page = query?.page ?? 0
    return getEventsPage({ signal, filters: query, page,
      startDateTime: page > 0 ? getState().events.startDateTime : undefined })
  },
  { condition: (filters, { getState }) => {
    const events = getState().events
    return events.status !== 'loading'
      || events.page !== (filters?.page ?? 0)
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
    page: 0, pagination: null, startDateTime: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state, action) => {
        state.status = 'loading'
        state.error = null
        state.items = []
        state.filters = normalizeEventFilters(action.meta.arg)
        state.page = action.meta.arg?.page ?? 0
        state.pagination = null
        if (state.page === 0) state.startDateTime = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.items = action.payload.events
        state.pagination = action.payload.pagination
        state.startDateTime = action.payload.startDateTime
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
