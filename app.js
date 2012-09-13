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
		socket.userdata = {nick: data.nick, x: 0, y: 0};
    socket.broadcast.emit('add user', socket.userdata);
		io.sockets.clients().forEach(function(client, index){
			if(socket!==client){
				socket.emit('add user', client.userdata);
			}
		});
  });
	
	socket.on('move', function (data) {
		socket.userdata.x = data.x;
		socket.userdata.y = data.y;
    socket.broadcast.emit('move user', socket.userdata);
  });
	
	socket.on('chat', function (data) {
		socket.broadcast.emit('chat', {nick: socket.userdata.nick, message: data.message});
  });
	
	socket.on('disconnect', function () {
		if(socket.userdata && socket.userdata.nick){
			io.sockets.emit('remove user', {nick: socket.userdata.nick});
		}
	});
});