import { addDays, startOfDay } from 'date-fns'
import _ from 'lodash'

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
    notes: '',
    importance: 1,
    startDate,
    endDate: addDays(startDate, 30),
    records: {}
  }
}

export const newRandomHabit = () => {
  const id = uuid()
  const startDate = startOfDay(new Date())
  return {
    id,
    title: _.sample(randomTitles),
    notes: '',
    importance: 1,
    startDate,
    endDate: addDays(startDate, 30),
    records: {}
  }
}

const randomTitles = [
  'Meditation',
  'Talk a walk',
  'Do something active',
  'Read a book',
  'No soda',
  'Morning Routine',
  'No electronics in bed'
]
