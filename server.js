//modulo do node ajuda a pegar o caminho
const path = require('path');
//Para lidar com o soquete
const http = require('http');
//implementar socket.io
const express = require('express');
//chamar socket.io
const socketio = require('socket.io');
//pega mensagem em seu formato padrão na pasta util
const formatMessage = require('./utils/messages');
//pega usuario em seu formato na pasta util
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers
} = require('./utils/users');
const app = express();
//Criar variavel para o servidor e setar em http
const server = http.createServer(app);
//criar variavel Io e passar socketio como parametro
const io = socketio(server);
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
//Nome do bot do chat
const botName = 'VoxCord Bot';
//Rodar quando cliente se conectar
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room },data) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    

    // Mensagem de boas vindas ao usuario
    socket.emit('message', formatMessage(botName, 'Bem-Vindo ao Midiavox Chat!'));

    // Transmissão quando alguem se conecta
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} entrou no chat`)
      );

    // Envia informação do usuario e sala
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });

  // Ouvindo o chat
  socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message',formatMessage(user.username, msg));
  });

  // Quando cliente se desconecta
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} deixou o chat`)
      );

      //Envia informação do usuario e sala
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
