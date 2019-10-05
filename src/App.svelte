<script>
  import { startOfMonth, startOfWeek, eachDayOfInterval, addDays, isSameMonth, isSameDay } from 'date-fns'

  function generateMonthArray(startDate) {
    let result
    // 1. get first day of first week of the month in given date
    // * this is usually not the first day of the month.
    let firstDay = startOfWeek(startOfMonth(startDate))

    // 2. return an array of 42 dates - that day and the following 41
    return eachDayOfInterval({
      start: firstDay,
      end: addDays(firstDay, 41)
    })
  }
  let today = new Date()
  let displayDate = today
  let monthArray = generateMonthArray(displayDate)
  let monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
</script>

<h1>{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</h1>
<div class="wrapper">
  {#each monthArray as day}
  <div class="cell {!isSameMonth(day, displayDate) && 'other-month'} {isSameDay(day,today) && 'today'}">
    {day.getDate()}
  </div>
  {/each}
</div>

<style>
  .wrapper {
    width: 100%;
    height: 100%;
  }
  .cell {
    width: calc(100% / 7);
    height: calc(100% / 7);
    padding: 5px;
    border-radius: 4px;
    background: #f3f3f3;
    border: 2px solid white;
    display: inline-block;
  }

  .today {
    background: lightblue;
    font-weight: bold;
  }

  .other-month {
    color: #ccc;
    background: none;
  }
</style>
