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
      startDate: new Date(2019, 8, 1),
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
  }

  // UI Controls ----------------------------------------------------------------------------
  let sidebarActive = false

  function toggleSidebar() {
    sidebarActive = !sidebarActive
  }
</script>




<div class="header">
  <div class="header-left">
      <button class="mobile hamburger" on:click="{toggleSidebar}">{ sidebarActive ? '✕' : '☰' }</button>
      <img class="logo" src="habit-helper-logo.svg">
      <h3 class="logo-type desktop">Habit Helper</h3>
      <h3 class="logo-type mobile">HH</h3>
  </div>
  <div class="header-right">
    <p class="desktop">{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</p>
    <p class="mobile">{monthNames[displayDate.getMonth()].substring(0,3)} '{String(displayDate.getFullYear()).substring(2)}</p>
    <button class="arrow" on:click="{prevMonth}">&lsaquo</button>
    <button class="arrow" on:click="{nextMonth}">&rsaquo</button>
    <button on:click="{() => displayDate = today}">Today</button>
  </div>
</div>
<div class="body">
  <div class="sidebar" class:active="{sidebarActive}">
    <div class="habits">
      <h3>Habits</h3>
      {#each Object.values(habitData) as habit}
      <div class="habit">
        <h4>
            {habit.title}
          </h4>
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
    </div>
<div class="calendar">
  <div class="day-row">
    <div>SUN</div>
    <div>MON</div>
    <div>TUE</div>
    <div>WED</div>
    <div>THU</div>
    <div>FRI</div>
    <div>SAT</div>
  </div>
  <div class="day-grid">
  {#each dayArray as day}
  <div class="cell" class:other-month="{!isSameMonth(day.date, displayDate)}" class:today="{isSameDay(day.date,today)}">
    <div class="cell-top-bar">
      <span class="cell-date">{day.date.getDate()}</span>
    </div> 
    {#each day.habits as habit}
      <button class="cell-habit" on:click="{() => cycleRecord(habit.recordId)}" class:success="{recordData[habit.recordId] === true}" class:failure="{recordData[habit.recordId] === false}">
        {habit.title}
      </button>
      {/each}
    </div>
    {/each}
  </div>
</div>
</div>







<style>
  .header {
    text-align: center;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-left, .header-right {
    display: flex;
    align-items: center;
  }

  .logo{
    width: 20px;
    margin-right: 5px;
  }
  .logo-type{
    font-size: 27px;
  }

  .hamburger{
    margin-right: 15px;
    font-size: 15px;
    width: 35px;
    margin-bottom: 0;
  }

  .header-right * {
    margin-left: 6px;
  }

  .desktop{
    display: none;
  }
  @media (min-width: 600px){
    .mobile {
      display: none
    }
    .desktop{
      display: initial;
    }
  }

  .body{
    display: flex;
    min-height: calc(100% - 50px);
  }

  .sidebar {
    width: 0px;
    transition: .2s;
  }
  .sidebar.active{
    width: 220px;
  }
  @media (min-width: 600px) {
    .sidebar {
      width: 220px;
    }
  }

  .habit {
    display: flex;
    align-items: center;
  }

  .calendar {
    width: 100%;
    background: white;
  }

  .day-row{
    display: flex;
    padding-bottom: 4px;
  }
  .day-row div {
    width: 100%;
    color: grey;
    text-align: center;
    font-size: 9px;
  }

  .day-grid {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 1px;
  }

  .cell {
    background: #f5f5f5;
    overflow: hidden;
  }
  .cell-top-bar{
    display: flex;
    justify-content: center;
  }
  .cell-date {
    font-size: 12px;
    padding: 3px 4px;
    text-align: center;
    font-weight: normal;
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

  .today .cell-date{
    color: white;
    background-color: #2196F3;
    border-radius: 100%;
  }

  .other-month {
    background: white;
    color: #ccc
  }
</style>
