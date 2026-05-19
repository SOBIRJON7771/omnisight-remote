import express from "express";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  const PORT = 3000;

  // Real-time signaling logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-session", (sessionId: string) => {
      socket.join(sessionId);
      console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on("signal", ({ sessionId, signal, to }: { sessionId: string; signal: any; to: string }) => {
      // Send signal to specific peer in the room
      if (to) {
        io.to(to).emit("signal", { signal, from: socket.id });
      } else {
        socket.to(sessionId).emit("signal", { signal, from: socket.id });
      }
    });

    socket.on("remote-status", ({ sessionId, status }: { sessionId: string; status: any }) => {
      socket.to(sessionId).emit("remote-status", status);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
