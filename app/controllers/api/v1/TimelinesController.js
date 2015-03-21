"use strict";

var models = require('../../../models')
  , TimelineSerializer = models.TimelineSerializer

exports.addController = function(app) {
  var TimelineController = function() {
  }

  TimelineController.home = function(req, res) {
    if (!req.user)
      return res.status(401).jsonp({ err: 'Not found', status: 'fail'})

    var user = req.user

    user.getRiverOfNewsTimeline({
      start: req.query.offset,
      num: req.query.limit
    })
      .then(function(timeline) {
        new TimelineSerializer(timeline).toJSON(function(err, json) {
          res.jsonp(json)
        })
      })
      .catch(function(e) { res.status(401).send({}) })
  }

  TimelineController.posts = function(req, res) {
    var username = req.params.username

    models.User.findByUsername(username)
      .then(function(user) { return user.getPostsTimeline() })
      .then(function(timeline) {
        new TimelineSerializer(timeline).toJSON(function(err, json) {
          res.jsonp(json)
        })
      })
      .catch(function(e) { res.status(401).send({}) })
  }

  TimelineController.likes = function(req, res) {
    var username = req.params.username

    models.User.findByUsername(username)
      .then(function(user) { return user.getLikesTimeline() })
      .then(function(timeline) {
        new TimelineSerializer(timeline).toJSON(function(err, json) {
          res.jsonp(json)
        })
      })
      .catch(function(e) { res.status(401).send({}) })
  }

  return TimelineController
}