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
import { SchedulerRegistry } from '@nestjs/schedule';
import { EmojiService } from './emoji.service';

@WebSocketGateway({
  cors: true,
})
export class EmojiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Socket<ClientToServerEvent, ServerToClientEvent>;

  private emojiLimit: number = 15;
  private stepLimit: number = 3;
  private stepTimeLimit: number = 5;

  // Map<Socket, Map<StepOrder, Emoji>>
  private clientsVote: Map<Socket, Map<number, string>> = new Map();

  story: Story = {
    storyGPT: '',
    steps: [],
  };

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private storyService: EmojiService,
  ) {}

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

    if (
      !this.schedulerRegistry.doesExist('interval', `step-${payload.stepOrder}`)
    ) {
      this.server.emit('user-error', new Error('Step not started or finished'));
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

    if (!previousClientVote) {
      findEmoji.votes++;
      this.clientsVote.get(client).set(payload.stepOrder, payload.emoji);
    }

    if (previousClientVote && previousClientVote !== payload.emoji) {
      // Decrement previous vote
      this.story.steps
        .find(({ order }) => order === payload.stepOrder)
        .emojiContender.find(
          (emoji: Emoji) => emoji.value === previousClientVote,
        ).votes--;

      this.clientsVote.get(client).set(payload.stepOrder, payload.emoji);

      findEmoji.votes++;
    }

    if (previousClientVote === payload.emoji) {
      this.clientsVote.get(client).delete(payload.stepOrder);

      findEmoji.votes--;
    }

    // Emettre à tous les clients la nouvelle story
    //TODO envoyer la current step
    this.server.emit('story-update', this.story);
  }

  // Initialize a story step
  // get from the payload the step to initialize
  @SubscribeMessage('story-step-handle')
  handleStepGeneration(client: Socket, { stepNumber }: { stepNumber: number }) {
    // if stepNumber = 1 & storyLength = 1
    const storyLength = this.story.steps.length;
    if (stepNumber < 1 || stepNumber > this.stepLimit) {
      client.emit('user-error', 'Invalid step number');
      return;
    }
    const newStep = {
      order: stepNumber,
      selectedEmoji: '',
      emojiContender: this.generateRandomEmojies(),
    };

    if (stepNumber === 1) {
      this.story = {
        storyGPT: '',
        steps: [newStep],
      };
    } else {
      if (stepNumber <= storyLength) {
        this.story.steps = this.story.steps.slice(stepNumber, storyLength);
      }
      this.story.steps.push(newStep);
    }

    if (this.schedulerRegistry.doesExist('interval', `step-${stepNumber}`)) {
      this.schedulerRegistry.deleteInterval(`step-${stepNumber}`);
    }

    setTimeout(() => {
      this.startTimer(stepNumber);
    }, 2000);

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

  private startTimer(stepOrder: number) {
    const step = this.story.steps.find(({ order }) => order === stepOrder);
    if (!step) {
      console.error('Invalid step', { stepOrder });
      return;
    }

    let timeLeft = this.stepTimeLimit;

    const stepIntervalFn = () => {
      this.server.emit('step-time', { stepOrder, timeLeft });
      if (timeLeft === 0) {
        this.schedulerRegistry.deleteInterval(`step-${stepOrder}`);
        this.handleTimerEnd(stepOrder);
      }
      timeLeft--;
    };

    const stepInterval = setInterval(stepIntervalFn, 1000);
    this.schedulerRegistry.addInterval(`step-${stepOrder}`, stepInterval);
  }

  async handleTimerEnd(stepOrder: number) {
    const step = this.story.steps.find(({ order }) => order === stepOrder);

    if (!step) {
      this.server.emit(
        'story-error',
        new Error('Cannot end step #' + stepOrder),
      );
    }

    const selectedEmoji = step.emojiContender.reduce(
      (prev, current) => {
        if (current.votes > prev.votes) {
          return current;
        }

        return prev;
      },
      { votes: 0, value: '' },
    );

    step.selectedEmoji = selectedEmoji.value;

    this.server.emit('story-update', this.story);

    if (stepOrder === this.stepLimit) {
      const storyGPT = await this.storyService.generateStory(
        this.story.steps.map((s) => s.selectedEmoji),
      );

      this.story.storyGPT = storyGPT;

      this.server.emit('story-update', this.story);
    }
  }
}
