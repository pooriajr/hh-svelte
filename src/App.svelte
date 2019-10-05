<script>
  import {
    startOfMonth,
    startOfWeek,
    eachDayOfInterval,
    addDays,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
  } from 'date-fns'
  import { flip } from 'svelte/animate'

  let today = new Date()
  let displayDate = today

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

  function nextMonth() {
    displayDate = addMonths(displayDate, 1)
  }
  function prevMonth() {
    displayDate = subMonths(displayDate, 1)
  }

  $: monthArray = generateMonthArray(displayDate)

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

<div class="header">
  <div class="arrow" on:click="{prevMonth}">&lt</div>
  <h1>{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</h1>
  <div class="arrow" on:click="{nextMonth}">&gt</div>
</div>
<div class="calendar">
  {#each monthArray as day}
  <div class="cell {!isSameMonth(day, displayDate) && 'other-month'} {isSameDay(day,today) && 'today'}">
    {day.getDate()}
  </div>
  {/each}
</div>

<style>
  .header {
    text-align: center;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .arrow {
    font-size: 30px;
    font-weight: bold;
    width: 60px;
    height: 40px;
    color: #a5a5a5;
    background: #f3f3f3;
    border-radius: 5px;
  }
  .calendar {
    width: 100%;
    height: calc(100% - 80px);
  }
  .cell {
    width: calc(100% / 7);
    height: calc(100% / 6);
    padding: 5px;
    border-radius: 5px;
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
