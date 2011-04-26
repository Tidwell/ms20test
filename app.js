/**
 * Module dependencies.
 */

var http = require('http');
var sys = require('sys')
var request = require('request');

var express = require('express');

var OAuth= require('oauth').OAuth;

var TwitterNode = require('twitter-node').TwitterNode
var io = require('socket.io')


//create our http server using express
var app = module.exports = express.createServer();

//Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.register('.html', require('jqtpl'))
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res){
  res.render('index', {
    locals: {
      hdr: 'mslo20test'
    },
    layout: false,
    debug: true
  });
});

var OAuth= require('oauth').OAuth;
varoa= new OAuth("https://twitter.com/oauth/request_token",
                 "https://twitter.com/oauth/access_token", 
                 consumer_key, consume_secret, 
                 "1.0A", "http://localhost:3000/oauth/callback", "HMAC-SHA1");
//create the oauth connector
oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
  if (error) new Error(error.data)
  else {
    req.session.oauth.token = oauth_token
    req.session.oauth.token_secret = oauth_token_secret
    res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
   }
});

app.get('/oauth/callback', function(req, res, next){
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier
    var oauth = req.session.oauth

    oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
      function(error, oauth_access_token, oauth_access_token_secret, results){
        if (error) new Error(error)
        console.log(results.screen_name)
    }
  );
} else
  next(new Error('No OAuth information stored in the session. How did you get here?'))
});


//Listen with express
if (!module.parent) {
  app.listen(8080);
  console.log("Express server listening on port %d", app.address().port);
}


//now we can create our socket connection for the clients
var socket = io.listen(app); 
socket.on('connection', function(client){ 
  // new client is here! 
  client.on('message', function(){
  
  }) 
  client.on('disconnect', function(){
  
  }) 
}); 


//create the server's socket connection to twitter
var twit = new TwitterNode({
  user: 'mslo20test',
  password: 'ChangeMe9',
  track: ['ms20test']
});

twit.headers['User-Agent'] = 'node.js-thingy';

//if we get an error from the twitter socket we just log it
//todo: proper error handling
twit.addListener('error', function(error) {
  console.log(error.message);
});

twit.addListener('tweet', function(tweet) {
  socket.broadcast("@" + tweet.user.screen_name + ": " + tweet.text);
});

twit.stream();
