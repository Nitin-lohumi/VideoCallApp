import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get("/", (req, res) => res.send("Signaling server running"));
let totalusers = new Set();
let rooms = new Map();
io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    totalusers.add(socket.id);
    socket.on("join-room", (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        // socket.emit("joinRooms", roomId);
        const numberOfClient = room ? room.size : 0;
        if (numberOfClient >= 2) {
            socket.emit("roomFull", { roomId, message: "Room is full (max 2)." });
            return;
        }
        socket.join(roomId);
        const roomAfter = io.sockets.adapter.rooms.get(roomId);
        const sizeAfter = roomAfter ? roomAfter.size : 0;
        if (sizeAfter > 2) {
            socket.leave(roomId);
            socket.emit("roomFull", { roomId, message: "Room became full." });
            return;
        }
        socket.emit("joined", { roomId, socketId: socket.id, participants: sizeAfter });
        socket.to(roomId).emit("userJoin", { User2socketId: socket.id, participants: sizeAfter, roomId })
        console.log(`${socket.id} joined ${roomId} (now: ${sizeAfter})`);
    });

    socket.on("sendOffer", ({ offer, to }) => {
        io.to(to).emit("getanswer", { offer, from: socket.id });
    })

    socket.on("sendAns", ({ ans, to }) => {
        io.to(to).emit("answer", ans);
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
        io.to(to).emit("ice-candidate", { candidate });
    })

    io.emit("toatalUserInWebSite", totalusers.size);


    socket.on("toggle-audio", ({ to, isMuted }) => {
        io.to(to).emit("remote-audio-toggled", { isMuted });
    });

    socket.on("toggle-video", ({ to, isVideoOff }) => {
        io.to(to).emit("remote-video-toggled", { isVideoOff });
    });
    
    socket.on("leave-room", (roomId) => {
        socket.leave(roomId);
        socket.to(roomId).emit("userLeft", { socketId: socket.id });
        socket.emit("left", { roomId });
        console.log(`${socket.id} left ${roomId}`);
    });

    socket.on("disconnecting", () => {
        for (const roomId of socket.rooms) {
            if (roomId === socket.id) continue;
            socket.to(roomId).emit("userLeft", { socketId: socket.id });
        }
        totalusers.delete(socket.id);
        io.emit("toatalUserInWebSite", totalusers.size);
        console.log(`${socket.id} left`);
    });
});

const PORT = 2000;
server.listen(PORT, () => console.log(`Signaling server listening on ${PORT}`));
