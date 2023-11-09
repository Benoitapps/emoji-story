import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { allEmojis } from './emojies';
import { Socket } from 'socket.io';
import { ServerToClientEvent, ClientToServerEvent } from 'interface/event';
import { Emoji, Story } from 'interface/emoji';

@WebSocketGateway({
  cors: true,
})
export class EmojiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Socket<ClientToServerEvent, ServerToClientEvent>;

  private emojiLimit: number = 8;
  private stepLimit: number = 8;

  // Map<Socket, Map<StepOrder, Emoji>>
  private clientsVote: Map<Socket, Map<number, string>> = new Map();

  story: Story = {
    storyGPT: '',
    steps: [
      {
        order: 1,
        selectedEmoji: '',
        emojiContender: this.generateRandomEmojies(),
      },
    ],
  };

  // 1. Get the current step
  // 2. Increment the vote on the selected emoji
  // 3. Update all clients with the latest vote
  @SubscribeMessage('step-vote')
  handleVoteRequest(
    client: Socket,
    payload: { emoji: string; stepOrder: number },
  ) {
    const step = this.story.steps.find(
      ({ order }) => order === payload.stepOrder,
    );

    if (!step) {
      this.server.emit('user-error', new Error('Invalid step number'));
      return;
    }

    const findEmoji: Emoji = step.emojiContender.find(
      (emoji: Emoji) => emoji.value === payload.emoji,
    );

    // Erreur si l'emoji n'est pas trouvé dans notre story
    if (!findEmoji) {
      this.server.emit('user-error', new Error('Invalid selection of emoji'));
      return;
    }

    const previousClientVote = this.clientsVote
    .get(client)
    ?.get(payload.stepOrder);

    // Rajouter le vote
    findEmoji.votes++;

    // Emettre à tous les clients la nouvelle story
    //TODO envoyer la current step
    this.server.emit('story-update', this.story);
  }

  // Ils sont beaux mes émojis ?
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected 🎉: ${client.id}`);
    this.clientsVote.delete(client);
  }

  handleConnection(client: Socket) {
    this.clientsVote.set(client, new Map());
    client.emit('story-update', this.story);
    console.log(`Client connected 💪: ${client.id}`);
  }

  // Initialize a story step
  // get from the payload the step to initialize
  @SubscribeMessage('story-step-handle')
  handleStepGeneration(client: Socket, { stepNumber }: { stepNumber: number }) {
    // if stepNumber = 1 & storyLength = 1
    const storyLength = this.story.steps.length;
    console.log({ storyLength });
    if (
      stepNumber < 0 ||
      stepNumber >= this.stepLimit ||
      stepNumber > storyLength
    ) {
      client.emit('user-error', 'Invalid step number');
      return;
    }
    const newStep = {
      order: stepNumber,
      selectedEmoji: '',
      emojiContender: this.generateRandomEmojies(),
    };

    if (stepNumber === 0) {
      this.story = {
        storyGPT: '',
        steps: [newStep],
      };
    } else {
      if (stepNumber <= storyLength - 1) {
        this.story.steps = this.story.steps.slice(stepNumber, storyLength);
      }
      this.story.steps.push(newStep);
    }

    this.server.emit('story-update', this.story);
  }

  // Generates X random emojis
  private generateRandomEmojies(): Emoji[] {
    const randomEmojis: Emoji[] = [];
    while (randomEmojis.length < this.emojiLimit) {
      const randomIndex = Math.floor(Math.random() * allEmojis.length);
      if (
        !randomEmojis.some((emoji) => emoji.value === allEmojis[randomIndex])
      ) {
        randomEmojis.push({ value: allEmojis[randomIndex], votes: 0 });
      }
    }
    return randomEmojis;
  }
}
