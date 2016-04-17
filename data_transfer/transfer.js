import _ from 'lodash'

export class DataTransfer{
  constructor(pgAdapter, redis) {
    this.pgAdapter = pgAdapter
    this.redis = redis

    this.writeUsers                 = false
    this.writeSubscriptionRequests  = false
    this.writeBans                  = false
    this.writeAdmins                = false
    this.writeUserFeeds             = false
    this.writeGroupFeeds            = false
  }

  async run(pgAdapter, redis){
    this.userKeys = await this.redis.keysAsync("user:????????????????????????????????????")

    this.userIds = await this._transferUsers()

    await this._transferSubscriptionRequests()

    await this._transferBans()

    await this._transferGroupAdmins()

    await this._transferFeeds()
  }

  async _transferUsers(){
    let userIds = []
    for (let k of this.userKeys){
      const userId = k.substr(5)

      console.log("Processing user", userId)

      const userHash = await this.redis.hgetallAsync(k)
      userHash.id = userId

      if( this.writeUsers ) {
        await this.pgAdapter.createUser(userHash)
      }

      userIds.push(userId)
    }
    return userIds
  }

  async _transferSubscriptionRequests(){
    for (let id of this.userIds){
      console.log("Processing subscription requests for user", id)

      let requestsRaw = await this.redis.zrangeAsync(`user:${id}:requests`, 0, -1, 'WITHSCORES')
      let requests = _.chunk(requestsRaw, 2)
      for (let r of requests){
        console.log(r[0], id, r[1])
        if(this.writeSubscriptionRequests){
          await this.pgAdapter.createSubscriptionRequest(r[0], id, r[1])
        }
      }
    }
  }

  async _transferBans(){
    for (let id of this.userIds){
      console.log("Processing bans for user", id)

      let bansRaw = await this.redis.zrangeAsync(`user:${id}:bans`, 0, -1, 'WITHSCORES')
      let bans = _.chunk(bansRaw, 2)
      for (let b of bans){
        console.log(id, b[0], b[1])
        if(this.writeBans){
          await this.pgAdapter.createUserBan(id, b[0], b[1])
        }
      }
    }
  }

  async _transferGroupAdmins(){
    for (let id of this.userIds){
      console.log("Processing admins of user", id)

      let adminsRaw = await this.redis.zrangeAsync(`user:${id}:administrators`, 0, -1, 'WITHSCORES')
      let admins = _.chunk(adminsRaw, 2)
      for (let a of admins){
        console.log(id, a[0], a[1])
        if(this.writeAdmins){
          await this.pgAdapter.addAdministratorToGroup(id, a[0], a[1])
        }
      }
    }
  }

  async _transferFeeds(){
    for (let id of this.userIds){
      const user = await this.redis.hgetallAsync(`user:${id}`)
      if (user.type === 'user') {
        await this._transferUserFeeds(id)
      } else {
        await this._transferGroupFeeds(id)
      }
    }
  }

  async _transferUserFeeds(id){
    console.log("Processing feeds of user", id)

    let requiredFeedIds = {
      'RiverOfNews':   null,
      'Hides':         null,
      'Comments':      null,
      'Likes':         null,
      'Posts':         null,
      'Directs':       null,
      'MyDiscussions': null
    }

    let userFeedIds = await this.redis.hgetallAsync(`user:${id}:timelines`)
    _.merge(requiredFeedIds, userFeedIds)

    return Promise.all(_.map(requiredFeedIds, async (feedId, feedName)=>{
      let feed = {
        name: feedName,
        userId: id
      }
      if (feedId){
        feed = await this.redis.hgetallAsync(`timeline:${feedId}`)
        feed.id = feedId
      }
      if(this.writeUserFeeds){
        await this.pgAdapter.createTimeline(feed)
      }
    }))
  }

  async _transferGroupFeeds(id){
    console.log("Processing feeds of group", id)

    let requiredFeedIds = {
      'RiverOfNews':   null,
      'Hides':         null,
      'Comments':      null,
      'Likes':         null,
      'Posts':         null
    }

    let groupFeedIds = await this.redis.hgetallAsync(`user:${id}:timelines`)
    _.merge(requiredFeedIds, groupFeedIds)

    return Promise.all(_.map(requiredFeedIds, async (feedId, feedName)=>{
      let feed = {
        name: feedName,
        userId: id
      }
      if (feedId){
        feed = await this.redis.hgetallAsync(`timeline:${feedId}`)
        feed.id = feedId
      }
      if(this.writeGroupFeeds){
        await this.pgAdapter.createTimeline(feed)
      }
    }))
  }
}