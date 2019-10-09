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
    startOfDay,
    lightFormat
  } from 'date-fns'

  import uuid from 'uuid'

// CALENDAR ----------------------------------------------------------------------------

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

    //6. add records for every day
    dayArray = dayArray.map(day => {
      let newHabits = day.habits.map(habit => {
        let recordId = habit.id + '-' + lightFormat(day.date, 'yyyy-MM-dd')
        return Object.assign({}, habit, {recordId}) 
      })
      return Object.assign({}, day, {habits: newHabits})
    })

    return dayArray
  }

  function nextMonth() {
    displayDate = addMonths(displayDate, 1)
  }

  function prevMonth() {
    displayDate = subMonths(displayDate, 1)
  }

  $: dayArray = generateDayArray(displayDate, habitData, recordData)

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

  //HABIT CRUD ----------------------------------------------------------------------------

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

  let newHabitTitle = ''

  function addHabit() {
    if(!newHabitTitle) return window.alert('Need a title for your new habit')
    const id = uuid()
    const startDate = startOfDay(new Date())
     habitData[id] = {
      id,
      title: newHabitTitle,
      startDate,
      endDate: addDays(startDate, 30)
    }
    newHabitTitle = ''
  }

  function editHabit(id) {
    habitData[id].title = window.prompt('Edit habit title?', habitData[id].title) || habitData[id].title
  }

  function deleteHabit(id) {
    if(window.confirm(`Delete this habit? -> ${habitData[id].title}`)){
      //trigger a rerender 
      habitData[id] = habitData[id]
      
      delete habitData[id]
    }
  }

  // RECORD CRUD ----------------------------------------------------------------------------

  let recordData = {
    '123-2019-10-01': true,
    '123-2019-10-02': false,
    '123-2019-10-03': true,
    '234-2019-10-02': true,
    '234-2019-10-03': true,
    '234-2019-10-09': false,
    '234-2019-10-10': true,
  }

  function cycleRecord(id) {
    if (recordData[id] === undefined) recordData[id] = true
    else if (recordData[id] === true) recordData[id] = false
    else if (recordData[id] === false) recordData[id] = undefined
    console.log(recordData);
  }

</script>






<div class="header">
  <button class="arrow" on:click="{prevMonth}">&lt</button>
  <h1>{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</h1>
  <button class="arrow" on:click="{nextMonth}">&gt</button>
</div>
<div class="day-grid">
  {#each dayArray as day}
  <div class="cell" class:other-month="{!isSameMonth(day.date, displayDate)}" class:today="{isSameDay(day.date,today)}">
    {day.date.getDate()} {#each day.habits as habit}
    <button class="cell-habit" on:click="{() => cycleRecord(habit.recordId)}" class:success="{recordData[habit.recordId] === true}" class:failure="{recordData[habit.recordId] === false}">
      {habit.title}
    </button>
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
      <input required bind:value={newHabitTitle}>
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
    color: #a5a5a5;
    background: #f3f3f3;
    border-radius: 5px;
  }
  .day-grid {
    min-height: calc(100% - 70px);
    width: 100%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 3px;
  }
  .cell {
    padding: 5px;
    border-radius: 5px;
    background: #f5f5f5;
    overflow: hidden;
  }

  .habit {
    display: flex;
    align-items: center;
  }

  .cell-habit{
    display: block;
    width: 100%;
    padding: 3px;
    border-radius: 3px;
    margin-bottom: 2px;
    font-size: 14px;
    transition: .2s;
    user-select: none;
    overflow: hidden;
    cursor: pointer;
    white-space: nowrap;
  } 

  .cell-habit.success {
    background: #8bc34a;
    color: white;
  }

  .cell-habit.failure {
    background: #f44336;
    color: white;
  }

  .today {
    background: #def4ff;
    font-weight: bold;
  }

  .other-month {
    color: #ccc;
    background: none;
  }
</style>
