import { addDays, startOfDay } from 'date-fns'

let uuid = function b(a) {
  return a
    ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
    : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b)
}

export const newBlankHabit = () => {
  const id = uuid()
  const startDate = startOfDay(new Date())
  return {
    id,
    title: '',
    importance: 1,
    startDate,
    endDate: addDays(startDate, 30),
    records: {}
  }
}
