const express =require("express");
const path=require("path");
const http=require("http"); // server
const socketio=require('socket.io');
const formatMessage =require('./utils/messages');
const {userJoin,getCurrentUser,userLeave,getRoomUsers} =require('./utils/users');


const app=express();
const server=http.createServer(app);
const io=socketio(server);

const bottName='chat chord'
// set static folder - For using public folder 
app.use(express.static(path.join(__dirname,"public")))

//   -------------- Run when client connects ----------
io.on('connection',socket =>{

    socket.on('joinRoom',({username,room})=>{
        const user=userJoin(socket.id,username,room);
        socket.join(user.room);

        // welcome current user
        socket.emit('message',formatMessage(bottName,'welcome to chartChort'));
        

        // Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(bottName,`${user.username} user joined`));
   
        // send users info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });

    });


    // Listern for chatMessage
    socket.on('chatMessage', msg =>{
        const user=getCurrentUser(socket.id);
        // emit to evry body
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    });

    // Runs when client disconnects
    socket.on('disconnect',()=>{
        const user=userLeave(socket.id);

        if(user){
        io.to(user.room).emit('message',formatMessage(bottName, `${user.username} has left the chat`));
        // send users info
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
        
        }

    });

});

const PORT =3000 || process.env.PORT;
server.listen(PORT,()=>console.log(`server running at ${PORT}`));