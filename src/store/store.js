import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice.js'
import eventsReducer from '../features/events/eventsSlice.js'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
  },
})
