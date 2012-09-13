var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(process.env.VMC_APP_PORT||80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(data);
  });
}

if(process.env.VMC_APP_PORT) {
	io.set('transports', [
		//'websocket',
		'flashsocket',
		'htmlfile',
		'xhr-polling',
		'jsonp-polling'
	]);
}

io.sockets.on('connection', function (socket) {
  socket.on('set nick', function (data) {
		socket.set('userdata', {nick: data.nick, x: 0, y: 0},function(){
			socket.broadcast.emit('add user', {nick: data.nick, x: 0, y: 0});
			io.sockets.clients().forEach(function(client, index){
				if(socket!==client){
					client.get('userdata', function(err, userdata){
						if(!err && userdata){
							socket.emit('add user', userdata);
						}
					});
				}
			});
		});
  });
	
	socket.on('move', function (data) {
		socket.get('userdata', function(err, userdata){
			if(!err && userdata){
				userdata.x = data.x;
				userdata.y = data.y;
				socket.set('userdata', userdata,function(){
					socket.broadcast.emit('move user', userdata);
				});
			}
		});
  });
	
	socket.on('chat', function (data) {
		socket.get('userdata', function(err, userdata){
			if(!err && userdata){
				socket.broadcast.emit('chat', {nick: userdata.nick, message: data.message});
			}
		});
  });
	
	socket.on('disconnect', function () {
		socket.get('userdata', function(err, userdata){
			if(!err && userdata && userdata.nick){
				io.sockets.emit('remove user', {nick: userdata.nick});
			}
		});
	});
});