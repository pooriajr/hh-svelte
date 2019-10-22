import { eachDayOfInterval, isWithinInterval, lightFormat, subDays } from 'date-fns'

import sum from 'lodash/sum'

export default function calcHabitScore(habitData = {}) {
  let dayRange = 75

  //get an array of dates in the day range
  let dates = eachDayOfInterval({ start: subDays(new Date(), dayRange - 1), end: new Date() })

  // create an array of scores for each day from -1 to 1
  const dayScores = dates.map(date => {
    // first, for that date, figure out which habits were expected
    const expectedHabits = Object.values(habitData).filter(habit => {
      return isWithinInterval(date, { start: habit.startDate, end: habit.endDate })
    })
    //if there were no active habits on that day, just return a 0
    if (!expectedHabits.length) {
      return 0
    }
    // if there were habits, return a day score between -1 and 1
    else {
      let potentialScore = expectedHabits.length
      let earnedScore = expectedHabits.reduce((total, habit) => {
        if (habit.records[lightFormat(date, 'yyyy-MM-dd')] === true) {
          return total + 1
        } else if (habit.records[lightFormat(date, 'yyyy-MM-dd')] === false) {
          return total - 1
        } else return total
      }, 0)
      return earnedScore / potentialScore
    }
  })

  //finally, assuming a 1 in every array spot is a perfect score, calculate the end score
  return Math.ceil((sum(dayScores) / dayScores.length) * 100)
}
