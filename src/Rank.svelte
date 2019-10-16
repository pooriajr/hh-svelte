<script>
  export let habitScore

  import { fade, fly } from 'svelte/transition'

  let ranks = [
    { num: 0, title: 'Newbie', min: 0, max: 9, color: '#3689c9', badges: ['0.svg'] },
    {
      num: 1,
      title: 'Greenhorn',
      min: 10,
      max: 29,
      color: '#3CB54A',
      badges: ['1.1.svg', '1.2.svg', '1.3.svg', '1.4.svg']
    },
    { num: 2, title: 'Tough Guy', min: 30, max: 49, color: '#BD6428', badges: ['2.1.svg', '2.2.svg', '2.3.svg'] },
    { num: 3, title: 'Smooth Sailor', min: 50, max: 69, color: '#3689C9', badges: ['3.1.svg', '3.2.svg', '3.3.svg'] },
    {
      num: 4,
      title: 'Hardcore Habiteer',
      min: 70,
      max: 84,
      color: '#EE2C39',
      badges: ['4.1.svg', '4.2.svg', '4.3.svg']
    },
    { num: 5, title: 'Shining Star', min: 85, max: 94, color: '#ec9c0d', badges: ['5.1.svg', '5.2.svg', '5.3.svg'] },
    { num: 6, title: 'Master', min: 95, max: 100, color: '#1f3d52', badges: ['6.svg'] }
  ]

  let totalBadgeCount = 18

  $: myRank = ranks.find(rank => habitScore >= rank.min && habitScore <= rank.max) || {}
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

<div>
  <input type="number" bind:value="{habitScore}" />
  <div class="current-rank" style="color:{myRank.color};">{myRank.title}</div>
  <div
    class="rank-progress-bar"
    id="progress-bar"
    style="width: {rankProgress * 100}%; background: {myRank.color};"
  ></div>
  <div class="rank-badges">
    {#each myBadges as badge}
    <div
      class="badge-spacer"
      style="width:{100 / totalBadgeCount}%;"
      in:fly="{{ x: 30, duration:1000 }}"
      out:fly="{{ y: -30, duration:1000 }}"
    >
      <img class="badge" src="badges/{badge}" alt="" />
    </div>
    {/each}
  </div>
</div>

<style>
  .current-rank {
    font-size: 16px;
    font-weight: bold;
    font-variant: all-small-caps;
    margin-bottom: 2px;
    transition: 0.5s;
  }
  .rank-swapper {
    height: 25px;
  }
  .rank-progress-bar {
    height: 5px;
    border-radius: 5px 0px 0px 5px;
    min-width: 2%;
    transition: 0.8s;
  }
  .rank-badges {
    display: flex;
    align-items: center;
    margin: 10px 0;
    height: 35px;
    padding: 7px;
  }
  .badge-spacer {
    display: flex;
    justify-content: center;
  }
  .badge {
    width: 30px;
    transition: 0.5s;
  }
  .badge-spacer:last-child .badge {
    width: 42px;
    margin-left: 6px;
  }
</style>
