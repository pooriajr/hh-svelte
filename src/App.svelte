<script>
  import Rank from './Rank.svelte'
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import axios from 'axios'

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
    lightFormat,
    isAfter
  } from 'date-fns'

  import {newBlankHabit} from './habitGenerator.js'

  // CALENDAR ----------------------------------------------------------------------------

  let today = startOfDay(new Date())
  let displayDate = today

  function generateDayArray(startDate, habitData) {
    console.time('generateDayArray')
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

    console.timeEnd('generateDayArray')
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
    habitScore = Math.floor(100 * (earnedPoints / maxPoints)) || 0
  }

  $: calcHabitScore(habitData)

  //HABIT CRUD ----------------------------------------------------------------------------
  let habitData

  if (window.localStorage.getItem('habitData')) {
    habitData = JSON.parse(window.localStorage.getItem('habitData'))
    Object.keys(habitData).forEach(key => {
      habitData[key].startDate = new Date(habitData[key].startDate)
      habitData[key].endDate = new Date(habitData[key].endDate)
    })
  } else {
    habitData = {
      123: {
        id: 123,
        title: 'The Plan',
        startDate: new Date(2019, 9, 1),
        endDate: new Date(2019, 9, 11),
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
  }

  function createHabit() {
    const newHabit = newBlankHabit()
    const id = newHabit.id
    habitData[id] = newHabit
    //automatically start editing new habit
    editModeId = id
  }

  function deleteHabit(id) {
    //trigger a rerender
    habitData[id] = habitData[id]
    delete habitData[id]
  }

  function cycleRecord(habitId, fDate) {
    if (habitData[habitId].records[fDate] === undefined) habitData[habitId].records[fDate] = true
    else if (habitData[habitId].records[fDate] === true) habitData[habitId].records[fDate] = false
    else if (habitData[habitId].records[fDate] === false) habitData[habitId].records[fDate] = undefined
  }

  function saveHabitData(habitData) {
    window.localStorage.setItem('habitData', JSON.stringify(habitData))
  }

  $: saveHabitData(habitData)

  // UI Stuff ---------------------------------------------------------------------------------

  let sidebarActive = false
  let deleteConfirmId = ''
  let editModeId = ''
  let progressBarColor = '#2196f3'
  let activeCell = ''
  let subscribed = false

  function toggleSidebar() {
    sidebarActive = !sidebarActive
  }

  // Helper Functions ------------------------------------------------------------------------
  function getHabitDuration(habit) {
    return eachDayOfInterval({ start: habit.startDate, end: habit.endDate }).length
  }
</script>

<!-- ! HEADER -->
<div class="header">
  <div class="header-left">
    <button class="mobile hamburger" on:click="{toggleSidebar}">{ sidebarActive ? '✕' : '☰' }</button>
    <img class="logo" alt="logo" src="habit-helper-logo.svg" />
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
  <!-- ! SIDEBAR -->
  <div class="sidebar" class:active="{sidebarActive}">
    <div class="section score">
      <div class="section-top">
        <div class="section-title">Habit Rank</div>
        <button>?</button>
      </div>
      <Rank {habitScore}></Rank>
    </div>

    <div class="section habits">
      <div class="section-top">
        <div class="section-title">Habits</div>
        <button on:click="{createHabit}">Add New</button>
      </div>
      {#each Object.values(habitData).reverse() as habit (habit.id)}
      <div
        class="habit"
        class:editMode="{habit.id === editModeId}"
        transition:fade="{{duration: 200}}"
        animate:flip="{{duration: 200}}"
      >
        <form on:submit|preventDefault="{() => {editModeId = ''}}">
          <div class="fields">
            {#if habit.id === editModeId}
            <!-- svelte-ignore a11y-autofocus -->
            <input class="title" bind:value="{habit.title}" placeholder="Title" autofocus />
            <div contenteditable="true" class="notes" bind:innerHTML="{habit.notes}" placeholder="Notes"></div>
            {:else}
            <input class="title" disabled value="{habit.title}" placeholder="Title" />
            <div contenteditable="false" class="notes" bind:innerHTML="{habit.notes}" placeholder="Notes"></div>
            {/if}
          </div>
          <div class="controls">
            {#if habit.id === editModeId}
            <button type="submit" on:click="{() => {editModeId = ''}}">Done</button>
            <button class="triggerDeleteOverlay" on:click="{() => {deleteConfirmId = habit.id }}">Delete</button>
            {:else}
            <button on:click="{() => {editModeId = habit.id}}">
              Edit
            </button>
            {/if}
          </div>
        </form>
        {#if habit.id === deleteConfirmId}
        <div class="deleteConfirmOverlay" transition:fade="{{duration: 200}}">
          <p>Sure? It's permanent.</p>
          <div>
            <button on:click="{() => deleteConfirmId = ''}">Cancel</button>
            <button class="delete" on:click="{() => deleteHabit(habit.id)}">Delete</button>
          </div>
        </div>
        {/if}
      </div>
      {:else}
      <div>No habits... Hit that "Add New" button and get started!</div>
      {/each}
    </div>

    <div class="section-habits">
      <div class="section-top">
        <div class="section-title">Stay updated</div>
      </div>
      {#if subscribed}
      <p>You're signed up 👍</p>
      {:else}
      <small>Get special perks & future updates!</small>
      <!-- <form name="subscribe" method="POST" on:submit={() => {subscribed = true}}>
         <input type="hidden" name="form-name" value="subscribe" />
        <input required type="email" name="email" placeholder="email@example.com" />
        <button type="submit">Stay updated</button>
      </form> -->
      <form name="contact" id="email-form" method="post" on:submit|preventDefault={(e) => {
        var form = document.getElementById(email-form) 
        axios.post(form.getAttribute('action'),{name: 'foo', email:'pjrgmail.com', message:'bleh'}).then(()=>{window.alert('thanks')})
      }}>
        <input type="hidden" name="form-name" value="contact" />
        <p>
          <label>Your Name: <input type="text" name="name"/></label>
        </p>
        <p>
          <label>Your Email: <input type="email" name="email"/></label>
        </p>
        <p>
          <label>Message: <textarea name="message"></textarea></label>
        </p>
        <p>
          <button type="submit">Send</button>
        </p>
      </form>
      {/if}
    </div>
  </div>

  <!-- ! CALENDAR -->
  <div class="calendar">
    <div class="day-row">
      <div>S</div>
      <div>M</div>
      <div>T</div>
      <div>W</div>
      <div>T</div>
      <div>F</div>
      <div>S</div>
    </div>
    <div class="day-grid">
      {#each dayArray as day}
      <!-- svelte-ignore a11y-autofocus -->
      <button
        class="cell"
        class:other-month="{!isSameMonth(day.date, displayDate)}"
        class:today="{isSameDay(day.date,today)}"
        on:click="{() => {activeCell = day.date}}"
        class:active="{day.date === activeCell}"
        disabled="{isAfter(day.date,today)}"
        autofocus="{isSameDay(day.date,today)}"
      >
        <div class="cell-wrapper">
          <div class="cell-top-bar">
            <span class="cell-date">{day.date.getDate()}</span>
            {#if day.date === activeCell}
            <button class="cell-close" on:click|stopPropagation="{() => {activeCell = ''}}">✕</button>
            {/if}
          </div>
          {#each day.habits as habit (habit.id)} {#if day.date === activeCell}
          <button
            class="cell-habit active"
            on:click="{() => cycleRecord(habit.id, day.fDate)}"
            disabled="{day.date !== activeCell}"
            class:success="{habit.records[day.fDate] === true}"
            class:failure="{habit.records[day.fDate] === false}"
          >
            {habit.title || '?'}
          </button>
          {:else}
          <div
            class="cell-habit"
            class:success="{habit.records[day.fDate] === true}"
            class:failure="{habit.records[day.fDate] === false}"
            class:active="{day.date === activeCell}"
          >
            <span>
              {habit.title || '?'}
            </span>
          </div>
          {/if} {/each}
        </div>
      </button>
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
    height: calc(100vh - 60px);
  }

  .sidebar {
    width: 0px;
    transition: 0.1s;
    padding-right: 8px;
    position: relative;
    left: -220px;
    overflow-y: auto;
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

  .section {
    margin-bottom: 20px;
  }
  .section-top {
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
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
    position: relative;
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
  .habit .fields .notes {
    font-size: 12px;
    background: #fff;
    padding: 3px;
  }
  .habit .controls {
    margin-top: 3px;
    margin-bottom: 0;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
    font-size: 12px;
  }
  .habit .triggerDeleteOverlay {
    background: none;
    border: none;
    color: #f44336;
    text-decoration: underline;
  }

  .deleteConfirmOverlay {
    border-radius: inherit;
    position: absolute;
    top: 0;
    width: 100%;
    min-height: 100%;
    background: rgba(0, 0, 0, 0.9);
    padding: 3px;
    text-align: center;
    font-size: 12px;
    color: white;
  }
  .deleteConfirmOverlay > div {
    display: flex;
    justify-content: space-around;
  }
  .deleteConfirmOverlay button.delete {
    background: #f44336;
    color: white;
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
    background: #d4d4d4;
    border: 1px solid #d4d4d4;
  }

  .cell {
    background: #fff;
    overflow: hidden;
    padding: 0;
    margin: 0;
    border: 0;
    border-radius: 0;
    position: relative;
  }
  .cell:focus {
    border: 1px solid #2196f3;
    margin: -1px;
  }
  .cell.active {
    border: 1px solid #2196f3;
    margin: 0px;
    z-index: 2;
    border-radius: 3px;
    height: fit-content;
    min-height: 100%;
    min-width: 80px;
    transform: scale(1.1);
  }
  .cell-wrapper {
    width: 100%;
    height: 100%;
    position: absolute;
    display: flex;
    flex-direction: column;
    top: 0;
    left: 0;
  }
  .cell.active .cell-wrapper {
    padding: 5px;
    padding-top: 40px;
    position: initial;
  }
  .cell-close {
    margin-bottom: 0;
    border: none;
    background: none;
  }
  .cell.active.today .cell-close {
    color: white;
  }
  .cell-top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: absolute;
    width: 100%;
    top: 0;
    left: 0;
  }
  .cell.active .cell-top-bar {
    height: 35px;
  }
  .cell.active.today .cell-top-bar {
    background: #2196f3;
    color: white;
  }
  .cell-date {
    font-size: 11px;
    padding: 1px 4px 3px 4px;
    text-align: left;
    font-weight: normal;
    border-radius: 0 0 5px 0;
    color: rgba(0, 0, 0, 0.45);
  }
  .cell.active .cell-date {
    background: white;
  }
  .cell-habit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 3px;
    margin-bottom: 2px;
    font-size: 10px;
    transition: 0.2s;
    user-select: none;
    overflow: hidden;
    white-space: nowrap;
    margin-bottom: 0px;
    color: rgb(0, 0, 0, 0.5);
    flex-grow: 1;
  }
  .cell-habit.active {
    border-radius: 3px;
    margin-bottom: 4px;
    height: 30px;
    font-size: 12px;
    color: rgb(0, 0, 0, 0.7);
  }
  .cell-habit.success {
    background: #aed581;
  }
  .cell-habit.failure {
    background: #e57373;
  }
  .cell-habit:disabled {
    border: none;
    background: none;
    color: #aaa;
    cursor: auto;
    font-style: italic;
  }

  .cell.today .cell-date {
    color: white;
    background-color: #2196f3;
  }

  .other-month {
    background: white;
    color: #ccc;
  }
  .other-month:nth-child(n + 1):nth-child(-n + 6) {
    margin: -1px 0 0 -1px;
  }
  .other-month:nth-child(n + 29):nth-child(-n + 42) {
    margin-right: -1px;
    margin-bottom: -1px;
  }
  .other-month:nth-child(36) {
    margin-left: -1px;
  }
  .other-month.today .cell-date {
    color: #ccc;
    background: none;
  }

  input {
    max-width: 100%;
  }

  button {
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
  }
</style>
