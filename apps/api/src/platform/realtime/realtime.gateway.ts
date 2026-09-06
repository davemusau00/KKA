import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { RedisService } from "../redis/redis.service";
import { env } from "../env";

function cookieValue(raw: string | undefined, name: string): string | undefined {
  if (!raw) return undefined;
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

@WebSocketGateway({
  namespace: "/realtime",
  cors: { origin: true, credentials: true }
})
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly redis: RedisService) {}

  async handleConnection(client: Socket) {
    const sid = cookieValue(client.handshake.headers.cookie, env().SESSION_COOKIE_NAME);
    if (!sid) return client.disconnect(true);
    const raw = await this.redis.client.get(`session:${sid}`);
    if (!raw) return client.disconnect(true);
    const session = JSON.parse(raw) as { userId: string; firmId: string };
    client.data.userId = session.userId;
    client.data.firmId = session.firmId;
    await client.join(`user:${session.userId}`);
    await client.join(`firm:${session.firmId}`);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToFirm(firmId: string, event: string, payload: unknown) {
    this.server.to(`firm:${firmId}`).emit(event, payload);
  }

  emitToChannel(channelId: string, event: string, payload: unknown) {
    this.server.to(`channel:${channelId}`).emit(event, payload);
  }
}
