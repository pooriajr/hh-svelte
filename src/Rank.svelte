<script>
  export let habitScore, inHeader, hide
  import { fly } from 'svelte/transition'

  let ranks = [
    { num: 0, title: 'Newbie', min: 0, max: 10, color: '#3689c9', badges: ['0.svg'] },
    {
      num: 1,
      title: 'Greenhorn',
      min: 10,
      max: 30,
      color: '#3CB54A',
      badges: ['1.1.svg', '1.2.svg', '1.3.svg', '1.4.svg']
    },
    { num: 2, title: 'Tough Cookie', min: 30, max: 50, color: '#BD6428', badges: ['2.1.svg', '2.2.svg', '2.3.svg'] },
    { num: 3, title: 'Smooth Sailor', min: 50, max: 70, color: '#3689C9', badges: ['3.1.svg', '3.2.svg', '3.3.svg'] },
    {
      num: 4,
      title: 'Unbreakable',
      min: 70,
      max: 85,
      color: '#EE2C39',
      badges: ['4.1.svg', '4.2.svg', '4.3.svg']
    },
    { num: 5, title: 'Star Player', min: 85, max: 95, color: '#ec9c0d', badges: ['5.1.svg', '5.2.svg', '5.3.svg'] },
    { num: 6, title: 'Habit Master', min: 95, max: 100.01, color: '#1f3d52', badges: ['6.svg'] }
  ]

  let totalBadgeCount = 18

  $: myRank = ranks.find(rank => habitScore >= rank.min && habitScore < rank.max) || {}
  $: rankProgress = (habitScore - myRank.min) / (myRank.max - myRank.min)
  $: myBadges = ranks.reduce((list, thisRank) => {
    //add all badges from lower ranks
    if (myRank.num > thisRank.num) {
      return list.concat(thisRank.badges)
    }
    // for the same rank, figure out the sub-rank, and add the right badges
    else if (myRank.num === thisRank.num) {
      let steps = 1 / thisRank.badges.length // 0.3333
      let subRank = Math.floor(rankProgress / steps)
      console.log(subRank)
      return list.concat(thisRank.badges.slice(0, subRank + 1))
    }
    //don't add anything on the bigger ranks
    else return list
  }, [])
</script>

<div class:inHeader class:hide>
  {#if habitScore >= 0}
  <div class="current-rank" style="color:{myRank.color};">{myRank.title}</div>
  <div class="rank-progress-bar-wrapper">
    <div
      class="rank-progress-bar"
      id="progress-bar"
      style="width: {rankProgress * 100}%; background: {myRank.color};"
    ></div>
  </div>
  <div class="rank-badges">
    {#each myBadges as badge}
    <div
      class="badge-spacer"
      style="width:{100 / totalBadgeCount}%;"
      in:fly|local="{{ x: 30, duration:1000 }}"
      out:fly|local="{{ y: -30, duration:1000 }}"
    >
      <img class="badge" src="badges/{badge}" alt="" />
    </div>
    {/each}
  </div>
  {:else}
  <div class="negative-message">
    <h3>
      Darn, your score is below zero. 😩
    </h3>
    <p>But don't give up.</p>
    <p>
      <b>Delete the habit you struggle with most.</b> No shame, we'll get that one later. Get your score back into the
      positive.
    </p>
    <p>If that was your only habit, take a short break. Then start fresh with a <b>more attainable habit.</b></p>
    <p>
      If you have other habits don't let them die! Keep that positive momentum.
    </p>
    <p>
      If you want to talk about your habit challenges, email me at
      <a href="mailto:pjrashidi@gmail.com">pjrashidi@gmail.com</a>
    </p>
  </div>
  {/if}
</div>

<style>
  @media (min-width: 600px) {
    .inHeader {
      display: none;
    }
  }
  .hide {
    display: none;
  }
  .current-rank {
    font-size: 16px;
    font-weight: bold;
    font-variant: all-small-caps;
    margin-bottom: 2px;
    transition: 0.5s;
  }
  .inHeader .current-rank {
    font-size: 10px;
    text-align: left;
    margin-bottom: 1px;
  }
  .rank-progress-bar-wrapper {
    width: 100%;
    border-radius: 5px;
    box-shadow: inset 0 0 1px 0px #5a5a5a;
  }
  .rank-progress-bar {
    height: 5px;
    border-radius: 5px 0px 0px 5px;
    min-width: 2%;
    transition: 0.8s;
  }
  .inHeader .rank-progress-bar {
    height: 4px;
  }
  .rank-badges {
    display: flex;
    align-items: center;
    margin: 10px 0;
    height: 35px;
    padding: 7px;
  }
  .inHeader .rank-badges {
    height: 25px;
    margin: 0;
    padding: 0;
  }
  .badge-spacer {
    display: flex;
    justify-content: center;
  }
  .badge {
    width: 30px;
    transition: 0.5s;
  }
  .inHeader .badge {
    width: 16px;
  }
  .badge-spacer:last-child .badge {
    width: 42px;
    margin-left: 6px;
  }
  .inHeader .badge-spacer:last-child .badge {
    width: 20px;
  }

  .negative-message {
    background: #ffebee;
    border-radius: 3px;
    padding: 12px;
    color: #3e0505;
  }

  .negative-message p {
    font-size: 14px;
  }
</style>
