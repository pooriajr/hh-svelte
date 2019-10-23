<script>
  import Rank from './Rank.svelte'
  import SignupForm from './SignupForm.svelte'
  import { fade, fly } from 'svelte/transition'
  import { flip } from 'svelte/animate'
  import axios from 'axios'

  import {
    startOfMonth,
    startOfWeek,
    eachDayOfInterval,
    addDays,
    subDays,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    areIntervalsOverlapping,
    isWithinInterval,
    startOfDay,
    lightFormat,
    format,
    isAfter,
    parseISO,
    differenceInCalendarDays,
    isValid
  } from 'date-fns'

  import omit from 'lodash/omit'

  import { newBlankHabit } from './habitGenerator.js'
  import calcHabitScore from './calcHabitScore.js'
  import generateExampleHabits from './generateExampleHabits.js'

  // CALENDAR ----------------------------------------------------------------------------

  let today = startOfDay(new Date())
  let tomorrow = addDays(today, 1)
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

  let habitScore = calcHabitScore()

  $: habitScore = calcHabitScore(habitData)

  //HABIT CRUD ----------------------------------------------------------------------------
  let habitData

  if (window.localStorage.getItem('habitData')) {
    habitData = JSON.parse(window.localStorage.getItem('habitData'))
    Object.keys(habitData).forEach(key => {
      habitData[key].startDate = new Date(habitData[key].startDate)
      habitData[key].endDate = new Date(habitData[key].endDate)
    })
  } else {
    habitData = generateExampleHabits()
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

  function updateDates(habitId) {
    const newStart = parseISO(document.getElementById('newStart').value)
    if (!isValid(newStart)) {
      return window.alert('START date is invalid, make the format YYY-MM-DD')
    }

    const newEnd = parseISO(document.getElementById('newEnd').value)
    if (!isValid(newEnd)) {
      return window.alert('END date is invalid, make the format YYY-MM-DD')
    }

    if (isAfter(newStart, newEnd)) {
      return window.alert("You can't set the START date to AFTER the END date.")
    }

    if (isAfter(newStart, today)) {
      return window.alert("You can't set a START date in the future.")
    }

    // Delete records that now fall outside the new date range, with a warning
    //1. get the list of record IDs that fall outside the date range
    const recordsToDelete = Object.keys(habitData[habitId].records).filter(key => {
      if (isWithinInterval(parseISO(key), { start: newStart, end: newEnd })) {
        return false
      }
      return true
    })

    //2. If there are records, let user confirm is they want to delete
    if (recordsToDelete.length) {
      if (
        window.confirm(
          `Heads up! When you change the date range of your habit, days outside of the new range will be nullified. For this change, ${recordsToDelete.length} day(s) will be effected. This may effect your rank. Confirm this change?`
        )
      ) {
        habitData[habitId].records = omit(habitData[habitId].records, recordsToDelete)
        habitData[habitId].startDate = newStart
        habitData[habitId].endDate = newEnd
      } else {
        return
      }
    }

    //3. if there are no records, just make the change
    habitData[habitId].startDate = newStart
    habitData[habitId].endDate = newEnd
  }

  $: saveHabitData(habitData)

  // UI Stuff ---------------------------------------------------------------------------------

  let sidebarActive = false
  let deleteConfirmId = ''
  let editModeId = ''
  let progressBarColor = '#2196f3'
  let activeCell = ''
  let showRankInfo = false;

  function toggleSidebar() {
    sidebarActive = !sidebarActive
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
<div class="body" class:sidebar-active="{sidebarActive}">
  <!-- ! SIDEBAR -->
  <div class="sidebar">
    <div class="section score">
      <div class="section-top">
        <div class="section-title">Habit Rank</div>
        <button on:click={()=>{showRankInfo = !showRankInfo}}>{showRankInfo ? 'Hide Info' : '?'}</button>
      </div>
      <Rank {habitScore} {showRankInfo}></Rank>
    </div>

    <div class="section habits">
      <div class="section-top">
        <div class="section-title">Habits</div>
        <div>
          <button on:click="{createHabit}">Add New</button>
        </div>
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
            <input class="habit-title" bind:value="{habit.title}" placeholder="Title" autofocus />
            <label>Notes (optional)</label>
            <div contenteditable="true" class="notes" bind:innerHTML="{habit.notes}"></div>
            <label>
              Start (yyyy-mm-dd)
            </label>
            <input id="newStart" value="{lightFormat(habit.startDate, 'yyyy-MM-dd')}" />
            <label>
              End (yyyy-mm-dd)
            </label>
            <input id="newEnd" value="{lightFormat(habit.endDate, 'yyyy-MM-dd')}" />
            <button on:click|preventDefault="{() => {updateDates(habit.id)}}">Update Dates</button>
            {:else}
            <h2 class="habit-title" placeholder="Title">{habit.title || '?'}</h2>
            <small class="day-counter">
              {isAfter(today,habit.endDate) ? 'Completed ✓' : `Day ${differenceInCalendarDays(today, habit.startDate) +
              1} of ${differenceInCalendarDays(habit.endDate, habit.startDate) + 1}`}
            </small>
            <div contenteditable="false" class="notes" bind:innerHTML="{habit.notes}"></div>
            <div class="date-range">
              {format(habit.startDate, 'MMM dd')} to {format(habit.endDate, 'MMM dd')}
            </div>
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
      <SignupForm/>
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
        class:tomorrow="{isSameDay(day.date,tomorrow)}"
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
          {#if isSameDay(day.date, tomorrow)}
          <p>Check back tomorrow to log more habits!</p>
          {:else if day.date > tomorrow}
          <div></div>
          {:else} {#each day.habits.slice(0).reverse() as habit (habit.id)} {#if day.date === activeCell}
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
          {/if} {/each} {/if}
        </div>
      </button>
      {/each}
    </div>
    <div class="calendar-footer">
        <a href="/contact">
          Questions, Issues, Suggestions →
        </a>
      </div>
  </div>
</div>

<style>
  .header {
    text-align: center;
    height: 40px;
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
    height: calc(100vh - 50px);
  }

  /* mobile first sidebar styles */
  .sidebar {
    width: 0px;
    transition: 0.1s;
    position: relative;
    left: -220px;
    overflow-y: auto;
  }

  .body.sidebar-active .sidebar{
    margin-right: 8px;
    min-width: 100%;
    left: 0;
  }

  .body.sidebar-active .calendar {
    width: 0%;
    display: none;
  }

  /* force sidebar open after 600px width */
  @media (min-width: 600px) {
    .sidebar {
      margin-right: 8px !important;
      min-width: 220px !important;
      left: 0 !important;
    }
    .calendar {
    width: 100% !important;
    display: initial !important;
    }
  }

  .section {
    margin-bottom: 20px;
  }
  .section-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-bottom: 1px solid #ccc;
    margin-bottom: 10px;
    padding-bottom: 6px;
  }
  .section-top .section-title {
    font-size: 16px;
    font-variant: all-small-caps;
  }
  .section-top button {
    font-size: 12px;
    margin: 0;
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
    margin-bottom: 9px;
    padding: 3px;
  }
  .habit .fields input:disabled {
    color: black;
    border-bottom: none;
  }
  .habit .fields .habit-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 9px;
  }
  .habit .fields .notes {
    font-size: 12px;
    background: #fff;
    padding: 3px;
    margin-bottom: 9px;
  }
  .habit .fields label {
    font-size: 14px;
    margin-bottom: 3px;
  }
  .habit .controls {
    margin-top: 9px;
    margin-bottom: 0;
    display: flex;
    flex-direction: row-reverse;
    justify-content: space-between;
  }
  .habit button {
    font-size: 14px;
  }
  .habit .triggerDeleteOverlay {
    background: none;
    border: none;
    color: #f44336;
    text-decoration: underline;
  }
  .habit .date-range {
    font-size: 12px;
    color: rgba(0, 0, 0, 0.6);
    padding: 3px;
  }
  .habit .day-counter {
    padding: 3px;
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
    height: 13px;
  }
  .day-row div {
    width: 100%;
    color: grey;
    text-align: center;
    font-size: 9px;
  }

  .day-grid {
    width: 100%;
    /* subtract the height of day row and calendar footer */
    height: calc(100% - 43px); 
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 1px;
    background: #d4d4d4;
    border: 1px solid #d4d4d4;
  }

  .calendar-footer{
    height: 30px;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .calendar-footer a {
    color: #757575
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
    cursor: default;
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
  .cell-habit span {
    width: 100%;
    padding: 2px;
    padding: 2px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .cell-habit.active {
    border-radius: 3px;
    margin-bottom: 4px;
    min-height: 30px;
    white-space: initial;
    overflow: initial;
    font-size: 12px;
    color: rgb(0, 0, 0, 0.7);
  }
  .cell-habit.success {
    background: #aed581;
  }
  button.cell-habit.success{
    border: 1px solid #558b2f;
  }
  .cell-habit.failure {
    background: #e57373;
  }
  button.cell-habit.failure{
    border: 1px solid #c62828;
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
  .cell.tomorrow p {
    margin: auto;
    font-size: 10px;
    color: rgb(0, 0, 0, 0.5);
    font-style: italic;
  }

  .cell .other-month {
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
</style>
