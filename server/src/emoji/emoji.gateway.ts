import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { allEmojis } from './emojies';

import { Socket } from 'socket.io';

import { Emoji, Story, StoryStep } from 'interface/emoji';

@WebSocketGateway()
export class EmojiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Socket;

  private emojiLimit: number = 8;
  private stepLimit: number = 8;

  story: Story = {
    steps: [],
  };

  // 1. Get the current step
  // 2. Increment the vote on the selected emoji
  // 3. Update all clients with the latest vote
  @SubscribeMessage('emoji-vote')
  handleVoteRequest(client: Socket, payload: { selectedEmoji: string }) {
    let lastStep: StoryStep;

    if (this.story.steps.length === 0) {
      client.emit('emoji-error', 'There is no story');
      return;
    } else {
      lastStep = this.story.steps[this.story.steps.length - 1];
    }

    const findEmoji: Emoji = lastStep.emojiContender.find(
      (emoji: Emoji) => emoji.value === payload.selectedEmoji,
    );

    // Erreur si l'emoji n'est pas trouvé dans notre story
    if (!findEmoji) {
      this.server.emit('emoji-error', 'Invalid selection of emoji', {
        emoji: payload.selectedEmoji,
        stepNumber: this.story.steps.length,
      });
      return;
    }

    // Rajouter le vote
    findEmoji.votes++;

    // Emettre à tous les clients la nouvelle story
    //TODO envoyer la current step
    this.server.emit('story-update', this.story);
  }

  // Ils sont beaux mes émojis ?
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected 🎉: ${client.id}`);
  }

  handleConnection(client: Socket) {
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
      client.emit('emoji-error', 'Invalid step number');
      return;
    }
    const newStep = {
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

    this.server.emit('story-update', this.story);
  }

  private _getFixedLengthArray(): Emoji[] {
    const emojiArray: Emoji[] = [];
    for (let i = 0; i < this.emojiLimit; i++) {
      emojiArray.push({ value: '', votes: 0 });
    }
    return emojiArray;
  }

  // Generates 8 random emojis
  private _generateRandomEmojies(): Emoji[] {
    const randomEmojis: Emoji[] = this._getFixedLengthArray();
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
