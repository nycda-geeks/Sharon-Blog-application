var fs = require( 'fs' )
var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var Sequelize = require('sequelize')
app.use(bodyParser.urlencoded({ extended: false }))

