var Promise = require('bluebird')
  , inherits = require("util").inherits
  , models = require("../../app/models")
  , AbstractModel = models.AbstractModel
  , User = models.User
  , Group = models.Group
  , mkKey = require("../support/models").mkKey

exports.addModel = function(database) {
  function FeedFactory() {
    FeedFactory.super_.call(this)
  }

  inherits(FeedFactory, AbstractModel)

  FeedFactory.findById = function(feedId) {
    return new Promise(function(resolve, reject) {
      database.hgetAsync(mkKey(['user', feedId]), 'type')
        .then(function(type) {
          switch(type) {
          case 'group':
            Group.findById(feedId)
              .then(function(group) { resolve(grooup) })
            break

          default:
            User.findById(feedId)
              .then(function(user) { resolve(user) })
            break
          }
        })
    })
  }

  FeedFactory.findByUsername = function(username) {
    return Promise.resolve(
      database.getAsync(mkKey(['username', username, 'uid']))
        .then(function(identifier) {
          return FeedFactory.findById(identifier)
        })
    )
  }

  return FeedFactory
}
