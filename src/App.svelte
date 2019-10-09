<script>
  import {
    startOfMonth,
    startOfWeek,
    eachDayOfInterval,
    addDays,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    areIntervalsOverlapping,
    isWithinInterval,
    startOfDay
  } from 'date-fns'

  let habitData = {
    123: {
      id: 123,
      title: 'The Plan',
      startDate: new Date(2019, 9, 1),
      endDate: new Date(2019, 9, 5)
    },
    234: {
      id: 234,
      title: 'Meditation',
      startDate: new Date(2019, 9, 2),
      endDate: new Date(2019, 10, 1)
    }
  }

  function deleteHabit(id) {
    if(window.confirm(`Delete this habit? -> ${habitData[id].title}`)){
      //trigger a rerender 
      habitData[id] = habitData[id]
      
      delete habitData[id]
    }
  }

  function editHabit(id) {
    habitData[id].title = window.prompt('Edit habit title?', habitData[id].title)
  }

  let newHabitTitle = ''

  function addHabit() {
    const startDate = startOfDay(new Date())
     habitData[345] = {
      id: 345,
      title: newHabitTitle,
      startDate,
      endDate: addDays(startDate, 30)
    }
    newHabitTitle = ''
  }

  let today = new Date()
  let displayDate = today

  function generateDayArray(startDate, habitData) {
    let dateArray
    // 1. get first and last days of the display range,
    // * based on the first day of the first week of the month of the displayDate.
    let displayStartDate = startOfWeek(startOfMonth(startDate))
    let displayEndDate = addDays(displayStartDate, 41)

    // 2. create an array of the dates in that range
    let displayDateInterval = {
      start: displayStartDate,
      end: displayEndDate
    }
    dateArray = eachDayOfInterval(displayDateInterval)

    //3. turn each item in the array into a day object
    let dayArray = dateArray.map(date => {
      return new Object({
        date: date
      })
    })

    //4. get the habits to display (the ones that overlap with the display range)
    const displayHabits = Object.values(habitData).filter(habit => {
      let habitInterval = { start: habit.startDate, end: habit.endDate }
      return areIntervalsOverlapping(habitInterval, displayDateInterval)
    })

    //5. add display habits to the days that fall in their range
    dayArray = dayArray.map(day => {
      let habitsForThisDay = displayHabits.filter(habit =>
        isWithinInterval(day.date, { start: habit.startDate, end: habit.endDate })
      )

      return Object.assign(day, { habits: habitsForThisDay })
    })

    return dayArray
  }

  function nextMonth() {
    displayDate = addMonths(displayDate, 1)
  }

  function prevMonth() {
    displayDate = subMonths(displayDate, 1)
  }

  $: dayArray = generateDayArray(displayDate, habitData)

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
<div class="day-grid">
  {#each dayArray as day}
  <div class="cell" class:other-month="{!isSameMonth(day.date, displayDate)}" class:today="{isSameDay(day.date,today)}">
    {day.date.getDate()} {#each day.habits as habit}
    <div>
      {habit.title}
    </div>
    {/each}
  </div>
  {/each}
</div>
<div class="habits">
  <h1>Habits</h1>
  {#each Object.values(habitData) as habit}
  <div class="habit">
    <h2>
      {habit.title}
    </h2>
    <button on:click={() => editHabit(habit.id)}>✏️Edit</button>
    <button on:click={() => deleteHabit(habit.id)}>❌Delete</button>
  </div>
  {/each}
  <form on:submit|preventDefault={addHabit}>
      <label>Title</label>
      <input bind:value={newHabitTitle}>
      <button>Add New 30 Day Habit</button>
  </form>
</div>

<style>
  .header {
    text-align: center;
    height: 70px;
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
  .day-grid {
    height: calc(100% - 70px);
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 3px;
  }
  .cell {
    padding: 5px;
    border-radius: 5px;
    background: #f3f3f3;
  }

  .habit {
    display: flex;
    align-items: center;
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
