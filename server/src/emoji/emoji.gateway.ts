import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Socket } from 'socket.io';

type FixedLengthArray<T> = [T, T, T, T, T, T, T, T];

interface StoryStep {
  selectedEmoji: string;
  emojiContender: FixedLengthArray<{ emoji: string; votes: number }>;
}

interface Story {
  steps: StoryStep[];
}

@WebSocketGateway()
export class EmojiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Socket;

  story: Story = { steps: [] };

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any): string {
    return 'Hello world! : 🚀' + client.id;
  }

  // Ils sont beaux mes émojis ?
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected 🎉: ${client.id}`);
  }

  @SubscribeMessage('emoji-vote')
  handleVoteRequest(client: Socket, payload: { selectedEmoji: string }) {
    let emoji = '☪️👸🏻';
    const lastStep: StoryStep = this.story.steps[this.story.steps.length - 1];
    
    let emoji = lastStep.emojiContender.find((emoji) => emoji === selectedEmoji );
    emoji.vote

    const index = this.StoryStep.emojiContender.findIndex(
      ({ client: emoji }) => _client.id === client.id,
    );;
  }

  handleConnection(client: Socket) {
    console.log(`Client connected 💪: ${client.id}`);
  }

  // This function generates 8 random emojis
  generateRandomEmojies(): string {

    return thi
  }  
}
