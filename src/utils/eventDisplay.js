export function getEventScheduleLabels(event) {
  const start = event.dates?.start
  const dateUnknown = !start?.localDate || start.dateTBA || start.dateTBD
  const timeUnknown = dateUnknown || start.timeTBA || start.noSpecificTime || !start.localTime
  return {
    date: dateUnknown ? 'Date to be announced' : start.localDate,
    time: timeUnknown ? 'Time to be announced' : `${start.localTime.slice(0, 5)} (venue local time)`,
  }
}
