import { Server } from "socket.io";
import { exec } from "child_process";
// const socketIO = require("socket.io")
import dotenv from "dotenv";
dotenv.config()

let childServer = null;

let consoleMessages = [];
let initialiceServer = false;

const initSocketIo = (appServer)=> {
    const io = new Server(appServer, {});
    
    io.on("connection", (socket) => {
        console.log("Usuario connectado");
        socket.emit("all-console-messages", {messages: consoleMessages})

        socket.on("send-command", (data)=> {
            childServer.stdin.write(data.command + "\r");
        });

        socket.on("stop-server", ()=> {
            childServer.stdin.write("stop\r");
        });

        socket.on("start-server", ()=> {
            if(initialiceServer)return;

            socket.emit("clear-console", {});
            consoleMessages=[];
            initialiceServer = true;

            childServer = exec(
                process.env.COMMAND_JAVA,
                {
                    cwd: './initialServer'
                },
                (error, stdout, stderr,)=> {
                
                    if(error !== null){
                        console.log('exec error: ' + error);
                    }
                }
            );

            childServer.stdout.on('data', function (data) {
                consoleMessages.push(data);
                io.emit("console-server", {message: data})
            });

            childServer.on('exit', function() {
                initialiceServer = false;
                io.emit("console-server", {message: "Server stoped"})
            });

        });
    });

    return io;
}

export {
    initSocketIo
}