import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { allEmojis } from './emojies';

import { Socket, Server } from 'socket.io';

import { E, I, P } from '../interface';
import { EmojiService } from './emoji.service';
import { instrument } from '@socket.io/admin-ui';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      'https://emoji-story-front.fly.dev',
      'https://admin.socket.io',
    ],
    credentials: true,
  },
})
export class EmojiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private emojiService: EmojiService) {}

  @WebSocketServer()
  server: Server<E.ClientToServerEvents, E.ServerToClientEvents>;

  afterInit() {
    instrument(this.server, {
      auth: false,
      mode: 'development',
    });
  }

  private emojiLimit: number = 8;
  private stepLimit: number = 8;
  private playTime: number = 8;
  private clients: Map<
    Socket,
    {
      votes: {
        emoji: string;
        stepOrder: number;
      }[];
    }
  > = new Map();

  story: I.Story = {
    steps: [],
  };

  // 1. Get the current step
  // 2. Increment the vote on the selected emoji
  // 3. Update all clients with the latest vote
  @SubscribeMessage(E.EMOJI_VOTE)
  handleVoteRequest(client: Socket, payload) {
    let lastStep: I.StoryStep;

    if (this.story.steps.length === 0) {
      client.emit(E.EMOJI_ERROR, 'There is no story');
      return;
    } else {
      lastStep = this.story.steps[this.story.steps.length - 1];
    }

    const findEmoji: I.Emoji = lastStep.emojiContender.find(
      (emoji: I.Emoji) => emoji.value === payload.emoji,
    );

    // Erreur si l'emoji n'est pas trouvé dans notre story
    if (!findEmoji) {
      client.emit(E.EMOJI_ERROR, 'Invalid selection of emoji', {
        emoji: payload.emoji,
        stepNumber: this.story.steps.length,
      });
      return;
    }

    const clientVotes = this.clients.get(client);
    let clientVote = clientVotes.votes.find(
      (vote) => vote.stepOrder === lastStep.order,
    );

    if (!clientVote) {
      clientVotes.votes.push({
        stepOrder: lastStep.order,
        emoji: '',
      });
      clientVote = clientVotes.votes[clientVotes.votes.length - 1];
    }

    if (clientVote?.emoji) {
      const alreadyVotedEmoji = lastStep.emojiContender.find(
        (emoji: I.Emoji) => emoji.value === clientVote.emoji,
      );

      alreadyVotedEmoji.votes--;
      clientVote.emoji = '';

      if (alreadyVotedEmoji.value === payload.emoji) {
        this.server.emit(E.STORY_UPDATE, { story: this.story });
        return;
      }
    }

    // Rajouter le vote
    findEmoji.votes++;
    clientVote.emoji = payload.emoji;

    // Emettre à tous les clients la nouvelle story
    //TODO envoyer la current step
    this.server.emit(E.STORY_UPDATE, { story: this.story });
  }

  // Ils sont beaux mes émojis ?
  handleDisconnect(client: Socket) {
    this.clients.delete(client);
    console.log(`Client disconnected 🎉: ${client.id}`);
  }

  handleConnection(client: Socket) {
    client.emit(E.STORY_UPDATE, { story: this.story });
    if (!this.clients.has(client)) {
      this.clients.set(client, {
        votes: [],
      });
    }
    console.log(`Client connected 💪: ${client.id}`);
  }

  @SubscribeMessage(E.STORY_REGENERATE)
  handleStoryRegeneration() {
    this.emojiService.getAStory(this.story).then((story) => {
      this.story.openAiStory = story;
      this.server.emit(E.STORY_UPDATE, {
        story: this.story,
      });
    });
  }

  @SubscribeMessage(E.STORY_INIT)
  handleStoryInit() {
    this.story = {
      steps: [],
    };
    this.server.emit(E.STORY_UPDATE, {
      story: this.story,
    });
  }

  // Initialize a story step
  // get from the payload the step to initialize
  @SubscribeMessage(E.STORY_STEP_GENERATE)
  async handleStepGeneration(
    client: Socket,
    { stepNumber }: P.STORY_STEP_GENERATE,
  ) {
    // if stepNumber = 1 & storyLength = 1
    const storyLength = this.story.steps.length;
    if (stepNumber < 0 || stepNumber - 1 >= this.stepLimit) {
      client.emit(E.EMOJI_ERROR, 'Invalid step number');
      return;
    }
    if (stepNumber <= storyLength) {
      client.emit(E.STORY_UPDATE, { story: this.story });
      return;
    }
    const newStep: I.StoryStep = {
      order: stepNumber,
      selectedEmoji: '',
      emojiContender: this._generateRandomEmojies(),
    };

    if (stepNumber === 0) {
      this.story = {
        steps: [newStep],
      };
    } else {
      if (stepNumber <= storyLength - 1) {
        this.story.steps = this.story.steps.slice(stepNumber, storyLength);
      }
      this.story.steps.push(newStep);
    }
    this.server.emit(E.STORY_UPDATE, { story: this.story });
    return await this.startGame(newStep, client);
  }

  startGame(newStep: I.StoryStep, client: Socket) {
    return new Promise<void>((a) => {
      let i = this.playTime;
      const interval = setInterval(() => {
        if (i < 0) {
          return;
        }
        this.server.emit(E.STEP_UPDATE, {
          stepNumber: newStep.order,
          timeLeft: i,
        });
        i -= 1;
      }, 1000);

      setTimeout(
        () => {
          clearInterval(interval);
          this.server.emit(E.STEP_UPDATE, {
            stepNumber: newStep.order,
            timeLeft: 0,
          });
          this.handleStepUpdate(client, {
            stepNumber: newStep.order,
            timeLeft: 0,
          });

          a();
        },
        (this.playTime + 2) * 1000,
      );
    });
  }

  handleStepUpdate(client: Socket, { stepNumber, timeLeft }) {
    if (timeLeft != 0) {
      return;
    }

    const step = this.story.steps?.[stepNumber - 1];
    if (!step) {
      console.error('Step not found', { stepNumber });
      return;
    }

    step.selectedEmoji = step.emojiContender.reduce(
      (acc, cur) => {
        if (!acc.value || cur.votes > acc.votes) {
          return cur;
        }
        return acc;
      },
      { value: '' } as I.Emoji,
    ).value;

    this.server.emit(E.STORY_UPDATE, { story: this.story });

    if (stepNumber === this.stepLimit) {
      this.handleStoryRegeneration();
    }
  }

  private _getFixedLengthArray(): I.Emoji[] {
    const emojiArray: I.Emoji[] = [];
    for (let i = 0; i < this.emojiLimit; i++) {
      emojiArray.push({ value: '', votes: 0 });
    }
    return emojiArray;
  }

  // Generates 8 random emojis
  private _generateRandomEmojies(): I.Emoji[] {
    const randomEmojis: I.Emoji[] = this._getFixedLengthArray();
    for (let i = 0; i < this.emojiLimit; i++) {
      // On récupére l'index d'un emoji aléatoire dans notre array allEmojis
      const randomIndex = Math.floor(Math.random() * allEmojis.length);

      // On valorise les valeurs des emojis dans le tableau créé plus tôt
      randomEmojis[i]['value'] = allEmojis[randomIndex];

      // On supprime l'emoji selectioné de notre liste pour éviter des doublons
      allEmojis.splice(randomIndex, 1);
    }
    return randomEmojis;
  }
}
