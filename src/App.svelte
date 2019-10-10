<script>
  import { fade } from 'svelte/transition'
  import { flip } from 'svelte/animate'

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

  let uuid = function b(a) {
    return a
      ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
      : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b)
  }

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
        date: date,
        fDate: lightFormat(date, 'yyyy-MM-dd')
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

  //HABIT SCORE ----------------------------------------------------------------------------

  let habitScore

  function calcHabitScore(habitData) {
    let maxPoints = 0
    let earnedPoints = 0

    //1. Iterate over every Habit
    Object.values(habitData).forEach(habit => {
      //2. For every day in its duration, add its importance to the maxPoints
      maxPoints += getHabitDuration(habit) * habit.importance
      //3. Iterate over the records for this habit
      Object.values(habit.records).forEach(record => {
        //4. For every successful record, add the habit's importance to earnedPoints
        if (record === true) earnedPoints += habit.importance
        //5. For every failure record, subtract the habit's importance from earnedPoints + a penalty that scales cubicly with importance
        else if (record === false) earnedPoints -= habit.importance * habit.importance
      })
    })

    //6. Calculate the score as the percentage earned from the max possible points
    habitScore = Math.floor(100 * (earnedPoints / maxPoints))
  }

  $: calcHabitScore(habitData)

  //HABIT CRUD ----------------------------------------------------------------------------

  let habitData = {
    123: {
      id: 123,
      title: 'The Plan',
      startDate: new Date(2019, 8, 1),
      endDate: new Date(2019, 9, 5),
      importance: 1,
      records: {
        '2019-10-01': true,
        '2019-10-02': false,
        '2019-10-03': true
      }
    },
    234: {
      id: 234,
      title: 'Meditation',
      startDate: new Date(2019, 9, 2),
      endDate: new Date(2019, 10, 1),
      importance: 1,
      records: {
        '2019-10-02': true,
        '2019-10-03': true,
        '2019-10-09': false,
        '2019-10-10': true
      }
    }
  }

  function addHabit() {
    const id = uuid()
    const startDate = startOfDay(new Date())
    habitData[id] = {
      id,
      title: '',
      importance: 1,
      startDate,
      endDate: addDays(startDate, 30),
      records: {}
    }
    //automatically start editing new habit
    editModeId = id
  }

  function deleteHabit(id) {
    if (window.confirm(`Delete this habit? -> ${habitData[id].title}`)) {
      //trigger a rerender
      habitData[id] = habitData[id]

      delete habitData[id]
    }
  }

  function cycleRecord(habitId, fDate) {
    if (habitData[habitId].records[fDate] === undefined) habitData[habitId].records[fDate] = true
    else if (habitData[habitId].records[fDate] === true) habitData[habitId].records[fDate] = false
    else if (habitData[habitId].records[fDate] === false) habitData[habitId].records[fDate] = undefined
  }

  // UI Controls ----------------------------------------------------------------------------

  let sidebarActive = false
  let editModeId
  let editTitle

  function toggleSidebar() {
    sidebarActive = !sidebarActive
  }

  function setEditModeId(id) {
    editModeId = id
  }

  // Helper Functions ------------------------------------------------------------------------
  function getHabitDuration(habit) {
    return eachDayOfInterval({ start: habit.startDate, end: habit.endDate }).length
  }
</script>

<div class="header">
  <div class="header-left">
    <button class="mobile hamburger" on:click="{toggleSidebar}">{ sidebarActive ? '✕' : '☰' }</button>
    <img class="logo" src="habit-helper-logo.svg" />
    <h3 class="logo-type desktop">Habit Helper</h3>
    <h3 class="logo-type mobile">HH</h3>
  </div>
  <div class="header-right">
    <p class="desktop">{monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}</p>
    <p class="mobile">
      {monthNames[displayDate.getMonth()].substring(0,3)} '{String(displayDate.getFullYear()).substring(2)}
    </p>
    <button class="arrow" on:click="{prevMonth}">&lsaquo</button>
    <button class="arrow" on:click="{nextMonth}">&rsaquo</button>
    <button on:click="{() => displayDate = today}">Today</button>
  </div>
</div>
<div class="body">
  <div class="sidebar" class:active="{sidebarActive}">
    <div class="section score">
      <div class="section-top">
        <div class="section-title">Habit Score</div>
        <button>?</button>
      </div>
      <h1>{habitScore}</h1>
    </div>
    <div class="section habits">
      <div class="section-top">
        <div class="section-title">Habits</div>
        <button on:click="{addHabit}">Add New</button>
      </div>
      {#each Object.values(habitData) as habit (habit.id)}
      <div
        class="habit"
        class:editMode="{habit.id === editModeId}"
        transition:fade="{{duration: 200}}"
        animate:flip="{{duration: 200}}"
      >
        <form on:submit|preventDefault="{() => {editModeId = ''}}">
          <div class="fields">
            <!-- this duplicate if block input is for autofocusing -->
            {#if habit.id === editModeId}
            <input class="title" bind:value="{habit.title}" placeholder="Title" autofocus />
            {:else}
            <input class="title" disabled value="{habit.title}" placeholder="Title" />
            {/if}
            <input
              class="description"
              disabled="{habit.id !== editModeId}"
              bind:value="{habit.description}"
              placeholder="Description"
            />
          </div>
          <div class="controls">
            {#if habit.id === editModeId}
            <button type="submit" on:click="{() => {editModeId = ''}}">Done</button>
            <button class="delete" on:click="{() => { deleteHabit(habit.id)}}">Delete</button>
            {:else}
            <button on:click="{() => {setEditModeId(habit.id)}}">
              Edit
            </button>
            {/if}
          </div>
        </form>
      </div>
      {/each}
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
      <div
        class="cell"
        class:other-month="{!isSameMonth(day.date, displayDate)}"
        class:today="{isSameDay(day.date,today)}"
      >
        <div class="cell-top-bar">
          <span class="cell-date">{day.date.getDate()}</span>
        </div>
        {#each day.habits as habit (habit.id)}
        <button
          class="cell-habit"
          on:click="{() => cycleRecord(habit.id, day.fDate)}"
          class:success="{habit.records[day.fDate] === true}"
          class:failure="{habit.records[day.fDate] === false}"
        >
          {habit.title || '?'}
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

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
  }

  .logo {
    width: 20px;
    margin-right: 5px;
  }
  .logo-type {
    font-size: 27px;
  }

  .hamburger {
    margin-right: 15px;
    font-size: 15px;
    width: 35px;
    margin-bottom: 0;
  }

  .header-right * {
    margin-left: 6px;
  }

  .desktop {
    display: none;
  }
  @media (min-width: 600px) {
    .mobile {
      display: none;
    }
    .desktop {
      display: initial;
    }
  }

  .body {
    display: flex;
    min-height: calc(100% - 50px);
  }

  .sidebar {
    width: 0px;
    transition: 0.1s;
    padding-right: 8px;
    position: relative;
    left: -220px;
  }
  .sidebar.active {
    width: 220px;
    left: 0;
  }
  @media (min-width: 600px) {
    .sidebar {
      width: 220px;
      left: 0;
    }
  }

  .section-top {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;
  }
  .section-top .section-title {
    font-size: 16px;
    font-variant: all-small-caps;
  }
  .section-top button {
    font-size: 10px;
  }

  .habit {
    align-items: center;
    transition: 0.2s;
    padding: 3px;
    margin: 3px;
    border-radius: 3px;
  }
  .habit.editMode {
    background-color: #eee;
  }
  .habit .fields {
    display: block;
    width: 100%;
  }
  .habit .fields input {
    border: none;
    width: 100%;
    margin-bottom: 3px;
    padding: 3px;
  }
  .habit .fields input:disabled {
    color: black;
    border-bottom: none;
  }
  .habit .fields .title {
    font-size: 18px;
    font-weight: bold;
  }
  .habit .fields .description {
    font-size: 10px;
  }
  .habit .controls {
    margin-top: 3px;
    margin-bottom: 0;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    font-size: 12px;
  }
  .habit .delete {
    background: none;
    border: none;
    color: red;
    text-decoration: underline;
  }

  .calendar {
    width: 100%;
    background: white;
  }

  .day-row {
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
    height: 95%;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 1px;
  }

  .cell {
    background: #f5f5f5;
    overflow: hidden;
  }
  .cell-top-bar {
    display: flex;
    justify-content: center;
  }
  .cell-date {
    font-size: 11px;
    padding: 3px 4px;
    text-align: center;
    font-weight: normal;
  }
  .cell-habit {
    display: block;
    width: 100%;
    padding: 3px;
    border-radius: 3px;
    margin-bottom: 2px;
    font-size: 14px;
    transition: 0.2s;
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

  .today .cell-date {
    color: white;
    background-color: #2196f3;
    width: 18px;
    height: 18px;
    margin-bottom: 1px;
    border-radius: 100%;
    line-height: 1;
  }

  .other-month {
    background: white;
    color: #ccc;
  }
</style>
