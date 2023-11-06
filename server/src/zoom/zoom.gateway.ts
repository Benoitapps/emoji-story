import {
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/zoom',
})
export class ZoomGateway implements OnGatewayDisconnect {
  handleDisconnect(client: Socket) {
    this.rooms.forEach((room) => {
      if (room.includes(client)) {
        room.splice(room.indexOf(client), 1);
      }
    });
  }
  @WebSocketServer()
  server: Server;

  rooms: Map<string, Socket[]> = new Map();

  @SubscribeMessage('join')
  handleJoin(client: Socket, { roomName }: { roomName: string }) {
    const room = this.rooms.get(roomName);

    // room == undefined when no such room exists.
    if (room === undefined || room.length === 0) {
      client.join(roomName);
      this.rooms.set(roomName, [client]);
      client.emit('created');
    } else if (room.length < 4) {
      // room.size == 1 when one person is inside the room.
      client.join(roomName);
      room.push(client);
      client.emit('joined');
    } else {
      // when there are already two people inside the room.
      client.emit('full');
    }

    console.log({ roomLength: room?.length });
  }

  @SubscribeMessage('ready')
  handleReady(client: any, { roomName }: { roomName: string }) {
    client.to(roomName).emit('ready');
  }

  @SubscribeMessage('leave')
  handleLeave(client: any, { roomName }: { roomName: string }) {
    client.leave(roomName);
    this.rooms.delete(roomName);
    client.broadcast.to(roomName).emit('leave');
  }

  @SubscribeMessage('ice-candidate')
  handleIce(
    client: any,
    { candidate, roomName }: { candidate: RTCIceCandidate; roomName: string },
  ) {
    console.log({ candidate });
    client.to(roomName).emit('ice-candidate', candidate);
  }
  @SubscribeMessage('offer')
  handleOffer(
    client: any,
    { roomName, offer }: { offer: any; roomName: string },
  ) {
    client.to(roomName).emit('offer', offer);
  }
  @SubscribeMessage('answer')
  handleAnswer(
    client: any,
    { answer, roomName }: { answer: string; roomName: string },
  ) {
    client.to(roomName).emit('answer', answer);
  }
}
