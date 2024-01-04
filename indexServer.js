const  express = require('express');
const app = express();
const server = require('http').Server(app);
const io = module.exports.io = require('socket.io')(server)

const port = process.env.PORT || 3000;

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost', 
  port: '3306', 
  user: 'root',
  password: 'Kaustubh@mysql',
  database: 'colabwhiteboard',
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.use(express.json());

// Register endpoint
app.post('http://localhost:3000/register', (req, res) => {
  const { username, password } = req.body;

  connection.query(
    'SELECT * FROM user_info WHERE username = ?',
    [username],
    (error, results) => {
      if (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Registration failed' });
        return;
      }

      if (results.length > 0) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }
      connection.query(
        'INSERT INTO user_info (username, password) VALUES (?, ?)',
        [username, password],
        (insertError) => {
          if (insertError) {
            console.error('Error during registration:', insertError);
            res.status(500).json({ error: 'Registration failed' });
            return;
          }
          res.status(201).json({ message: 'Registration successful' });
        }
      );
    }
  );
});

server.listen(port,()=> {
    console.log(`App is running at ${port}`);
})

app.use(express.static('public'));

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('server.js'));
  }

const users = {};
io.sockets.on('connection',
  function (socket) {
  
    console.log("We have a new client: " + socket.id);
    socket.broadcast.emit('recieve',  io.sockets.server.engine.clientsCount);
    socket.on('mouse',
      function(data) {
        console.log("Received: 'mouse' " + data.x + " " + data.y);
        socket.broadcast.emit('mouse', data);
        socket.broadcast.emit('recieve',  io.sockets.server.engine.clientsCount);
      }
      );
        
        socket.on('disconnect', function() {
          console.log("Client has disconnected");
          socket.broadcast.emit('left', users[socket.id]);
          delete users[socket.id];
        });
        
        
        socket.on('new-user-joined', name => {
          console.log("New User ", name);
          users[socket.id] = name;
          socket.broadcast.emit('user-joined', name);
        });

        socket.on('message', (evt) => {
          log(evt)
          socket.broadcast.emit('message', evt)
      })  

  }
);
