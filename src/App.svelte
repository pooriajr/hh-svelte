<script>
  import { fade, fly } from 'svelte/transition'
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
    lightFormat,
    isAfter
  } from 'date-fns'

  let uuid = function b(a) {
    return a
      ? (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
      : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, b)
  }

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
    return Math.floor(100 * (earnedPoints / maxPoints)) || 0
  }

  $: habitScore = calcHabitScore(habitData)

  // RANK ------------------------------------------------------------------------------------
  let currentRank, rankProgress

  let ranks = [
    { title: 'Newbie', min: 0, max: 9, color: '#000', img: '0.svg' },
    { title: 'Greenhorn', min: 10, max: 29, color: '#3CB54A', img: '1.1.svg' },
    { title: 'Tough Guy', min: 30, max: 49, color: '#BD6428', img: '2.1.svg' },
    { title: 'Smooth Sailor', min: 50, max: 69, color: '#3CB54A', img: '3.1.svg' },
    { title: 'Hardcore Habiteer', min: 70, max: 84, color: '#3689C9', img: '4.1.svg' },
    { title: 'Shining Star', min: 85, max: 94, color: '#FFCB5B', img: '5.1.svg' },
    { title: 'Master', min: 95, max: 100, color: '#000', img: '6.svg' }
  ]

  $: currentRank = ranks.find(rank => habitScore >= rank.min && habitScore <= rank.max) || {}
  $: rankProgress = (habitScore - currentRank.min / currentRank.max - currentRank.min) * 10
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

  function toggleSidebar() {
    sidebarActive = !sidebarActive
  }

  // Helper Functions ------------------------------------------------------------------------
  function getHabitDuration(habit) {
    return eachDayOfInterval({ start: habit.startDate, end: habit.endDate }).length
  }
</script>

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
  <div class="sidebar" class:active="{sidebarActive}">
    <div class="section score">
      <div class="section-top">
        <div class="section-title">Habit Rank</div>
        <button>?</button>
      </div>
      <p>{habitScore}</p>
      <input type="range" bind:value="{habitScore}" min="0" max="100" />
      <div class="current-rank" style="color:{currentRank.color};">{currentRank.title}</div>
      <div
        class="rank-progress-bar"
        id="progress-bar"
        style="width: {rankProgress}%; background: {currentRank.color};"
      ></div>
      <div class="rank-badges">
        {#each new Array(currentRank) as name, index}
        <img
          src="badges/chevron-{index}.svg"
          in:fly="{{ x: 30, duration:1000 }}"
          out:fly="{{ y: -30, duration:1000 }}"
        />
        {/each}
      </div>
    </div>
    <div class="section habits">
      <div class="section-top">
        <div class="section-title">Habits</div>
        <button on:click="{addHabit}">Add New</button>
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
            {:else}
            <input class="title" disabled value="{habit.title}" placeholder="Title" />
            {/if} {#if habit.id === editModeId}
            <div contenteditable="true" class="notes" bind:innerHTML="{habit.notes}" placeholder="Notes"></div>
            {:else}
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
      {/each}
    </div>
  </div>
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

  .current-rank {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 2px;
    color: #2196f3;
  }
  .rank-progress-bar {
    height: 5px;
    border-radius: 5px 0px 0px 5px;
    min-width: 2px;
    transition: 0.8s;
  }
  .rank-badges {
    display: flex;
    align-items: center;
    margin: 10px 0;
    height: 35px;
  }
  .rank-badges img {
    width: 30px;
    margin-right: -20px;
    transition: 1s;
  }
  .rank-badges img:first-child {
    margin-left: -3px;
  }
  .rank-badges img:last-child {
    width: 35px;
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

  button {
    cursor: pointer;
  }
  button:disabled {
    cursor: default;
  }
</style>
