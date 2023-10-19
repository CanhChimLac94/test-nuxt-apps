const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});

const getClientRoom = () => {
  let index = 0;
  while (true) {
    if (!io.sockets.adapter.rooms[index] || io.sockets.adapter.rooms[index].length < 2) {
      return index;
    }
    index++;
  }
}

const peerServer = ExpressPeerServer(server, {
  debug: true,
});

// app.use("/peerjs", peerServer);
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

const ROOM_ID = 1234;

const SOCKET_EVENTS = {
  JOIN_ROOM: 'join-room',
  USER_READY: 'user-ready',
  ORTHER_USER_CONNECTED: 'other-user-connected',
  OLD_USER: 'old-user',
  SEND_MESSAGE: 'send-message',
  CREATE_MESSAGE: 'createMessage',
  NEW_CALL: 'new-Call',
  ANSWER_CALL: 'answer-call',
  SHARE_SCREEN: 'share-screen',
  ANSWER_SHARE_SCEEN: 'answer-shrea-screen',
  ICE_CANDIDATE: 'ICEcandidate',
  
};

io.on("connection", (socket) => {
  socket.on("join-room", (payload) => {
    const { roomId, userId, userName, sender } = payload;
    // console.log("join-room: ", {
    //   roomId, userId, userName
    // });

    socket.join(roomId);
    socket.join(sender);

    socket.to(roomId).broadcast.emit("other-user-connected", payload);

    socket.on('user_ready', (uinfo) => {
      socket.to(roomId).emit('user_ready', uinfo)
    });

    socket.on('old_user', (payload) => {
      socket.to(roomId).emit('old_user', payload);
    });

    socket.on(SOCKET_EVENTS.SEND_MESSAGE, (message) => {
      io.to(roomId).emit(SOCKET_EVENTS.SEND_MESSAGE, {
        message, userName
      });
    });

    /**
    * socket new call
    */
    socket.on('newCall', (data) => {
      // let callee = roomId; // data.name;
      let { rtcMessage, userId, userName } = data;
      socket.to(roomId).emit("newCall", {
        ...data,
        caller: userName,
        rtcMessage: rtcMessage,
      });
    });

    socket.on('answerCall', (data) => {
      // let caller = roomId; // data.caller;
      const { rtcMessage, userId, userName } = data;
      socket.to(roomId).emit("answerCall", {
        ...data,
        callee: userName,
        rtcMessage: rtcMessage,
      })
    });

    socket.on('share_screen', (data) => {
      // let caller = roomId; // data.caller;
      const { rtcMessage, userId, userName } = data;
      // console.log('share_screen', data);
      socket.to(roomId).emit("share_screen", {
        ...data,
        callee: userName,
        // rtcMessage: rtcMessage,
      })
    });

    socket.on('anser_screen', (data) => {
      // let caller = roomId; // data.caller;
      // const { rtcMessage, userId, userName } = data;
      // console.log('share_screen', data);
      socket.to(roomId).emit("anser_screen", {
        ...data,
      });
    });

    socket.on('answer_shrea_screen', (data) => {
      socket.to(roomId).emit("answer_shrea_screen", {
        ...data,
      });
    });

    socket.on('ICEcandidate', (data) => {
      // let otherUser = roomId; // data.user;
      const { userId, userName, rtcMessage } = data;
      socket.to(roomId).emit("ICEcandidate", {
        ...data,
        // sender: socket.user,
        sender: userName,
        rtcMessage: rtcMessage,
      })
    });

    socket.on('actions', (data) => {
      socket.to(roomId).emit("actions", {
        ...data,
      });
    });

  });
});


//========================================
server.listen(process.env.PORT || 3030);
