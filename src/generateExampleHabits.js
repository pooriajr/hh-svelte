import { eachDayOfInterval, addDays, subDays, startOfDay, lightFormat } from 'date-fns'

import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'

export default function generateExampleHabits() {
  const today = startOfDay(new Date())

  return {
    1: {
      id: 1,
      title: 'No devices after midnight',
      startDate: subDays(today, 39),
      endDate: subDays(today, 9),
      notes: 'Another example. Go on, delete it!',
      records: generateRandomRecords(subDays(today, 39), subDays(today, 9))
    },
    2: {
      id: 2,
      title: 'Meditation',
      startDate: subDays(today, 14),
      endDate: addDays(today, 15),
      notes: 'This is just a demo example. Delete it and add your own real habits! :)',
      records: generateRandomRecords(subDays(today, 14), today)
    }
  }
}

//HELPERS ---------------------------------------------------------------------------------------

function returnTrueUsually() {
  return Math.random() > 0.1
}

function generateRandomRecords(start, end) {
  return mapValues(keyBy(eachDayOfInterval({ start, end }), date => lightFormat(date, 'yyyy-MM-dd')), () =>
    returnTrueUsually()
  )
}
