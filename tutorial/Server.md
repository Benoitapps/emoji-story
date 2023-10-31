# Real-Time Interactive Story Creation with Socket.io

## Overview

This tutorial studies an application that crafts real-time, engaging stories using emojis. At the heart of this interaction is socket.io, a powerful JavaScript library for real-time web applications.

## EmojiGateway and WebSocket

Our EmojiGateway is the central hub of activity, connecting clients and handling interactions.

The WebSocketGateway, decorated with CORS policies, initializes socket connections:

```typescript
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

  @WebSocketServer()
  server: Server<...>;

```

Alright, let's explain those key concepts in the EmojiGateway of the application:

- **server**: This is the server instance of our WebSocket connection, it helps in managing all events related to WebSocket like broadcasting a message to all clients, receiving messages and so forth. It's created using the @WebSocketServer() decorator from the '@nestjs/websockets' module.

```typescript
@WebSocketServer()
server: Server<...>;
```

- **emojiLimit**: This is a fixed limit set for the maximum number of unique random emojis that can be generated for each step in the story. The limit here is set to 8. This variable governs the maximum number of emoji options offered to the user for each step in the story.

```typescript
private emojiLimit: number = 8;
```
 
- **stepLimit**: This value determines the maximum number of steps or sequences in a single story. It's set to 8 implying a story can have 8 different parts or sequences to it.

```typescript
private stepLimit: number = 8;
```

- **playTime**: The playTime variable determines the duration for which the voting "game" runs for each step in the story. It's set to 8 seconds here. This is the time interval users have to vote for their choice of emoji in each step of the story.

```typescript
private playTime: number = 8;
```

- **story**: The 'story' is an object that contains an array of steps. Each 'step' is an object in itself and contains the order, selectedEmoji, and real-time votes cast for each emoji contender.

```typescript
story: I.Story = {
  steps: [],
};
```

- **clients**: This is a map to keep track of all the connected clients' session along with their respective votes. It helps to manage user sessions and their instance-level data in an efficient manner.

```typescript
private clients: Map<...> = new Map();
```

Each of these variables & properties play a crucial role in managing the real-time, interactive story-creation process.
For instance, 'server' facilitates real-time interactions, 'emojiLimit' and 'stepLimit' restrict the extent of user choices & story parts, 'playTime' ensures the real-timeliness of the game, 'story' continuously updates story progression, and 'clients' effectively manage client sessions and their associated data.

The `handleConnection` and `handleDisconnect` methods manage client connections and disconnections, emitting story updates and logging connection status:

```typescript
handleDisconnect(client: Socket) {
  this.clients.delete(client);
  console.log(`Client disconnected 🎉: ${client.id}`);
}

handleConnection(client: Socket) {
  //...
}
```

## Handling Real-Time Events

Next, we have various handlers for different real-time events. Each of these handlers corresponds to a particular action in the application and is represented by a string event ID.

```typescript
@SubscribeMessage('emojiVote')
handleVoteRequest(client: Socket, payload: P.EMOJI_VOTE) {
  let lastStep: I.StoryStep;

  if (this.story.steps.length === 0) {
    client.emit('emojiError', 'There is no story');
    return;
  } else {
    lastStep = this.story.steps[this.story.steps.length - 1];
  }

  if (lastStep.selectedEmoji !== '') {
    client.emit(
      'emojiError',
      `Vote finished for this step (#${lastStep.order})`,
    );
    return;
  }

  const findEmoji: I.Emoji = lastStep.emojiContender.find(
    (emoji: I.Emoji) => emoji.value === payload.emoji,
  );

  if (!findEmoji) {
    client.emit('emojiError', 'Invalid selection of emoji', {
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
      this.server.emit('storyUpdate', { story: this.story });
      return;
    }
  }

  findEmoji.votes++;
  clientVote.emoji = payload.emoji;

  this.server.emit('storyUpdate', { story: this.story });
}
```

Here's a brief rundown of this function:

1. **Check the story's length**: If there are no steps in the story, emit 'emojiError' to the client.

2. **Check if voting is complete for the current step**: If the last step's selected emoji is not an empty string, it means voting for this step is over. Emit 'emojiError'.

3. **Check if the client's selected emoji is a contender in the step**: If it's not, Emit 'emojiError'.

4. **Store client's votes** in `clientVotes`. If a client has already voted, we update their vote, decrease the vote count for the previously voted emoji, and remove the vote.

5. **Check if the client is revoting for the same emoji**: If a client re-votes for the same emoji, we simply return without doing anything.

6. **Otherwise, add the vote**: Increase the votes for the emoji, and store it as the client's vote.

7. **Finally**, emit 'storyUpdate' to all the clients with the updated story. This way, all the clients stay in sync, and they can continue voting for the next emoji.

```typescript
@SubscribeMessage('storyRegenerate')
handleStoryRegeneration() {
  this.emojiService.getAStory(this.story).then((story) => {
    this.story.openAiStory = story;
    this.server.emit('storyUpdate', {
      story: this.story,
    });
  });
}
```

This function may look compact, but it encapsulates an important logic step, so let's break it down.

1. Clients trigger the story regeneration process by emitting a 'storyRegenerate' event.

2. The current state of the story (`this.story`), which holds the ordered list of selected emojis, is passed to the `getAStory` method of `emojiService`.

3. The `getAStory` method is asynchronous because it makes a request to the OpenAI API to generate the story. Thus, it returns a promise - an object that represents the eventual completion or failure of the asynchronous operation. We attach a `.then` callback to handle the completion of the promise.

4. In the `.then` callback, upon successful completion of the story from OpenAI, we store the generated story into `this.story.openAiStory`. 

5. Finally, we emit the updated story to all clients by emitting the 'storyUpdate' event via socket.io. All subscribing clients will receive this real-time update and will be able to see the regenerated story instantly.

This process signifies the pinnacle of our application's logic, marrying the real-time emoji inputs from users with AI-driven story creation.


```typescript
@SubscribeMessage('storyInit')
handleStoryInit() {
  this.story = {
    steps: [],
  };
  this.server.emit(E.STORY_UPDATE, { story: this.story });
}
```

This function is a handler function for the 'storyInit' event, emitted by the client when a new story needs to be initiated.

1. **Initialize the Story**: Our story here is an object with a single property, `steps`, which is an array. When we initialize a new story, we're essentially setting this `steps` array to an empty array.

    ```typescript
    this.story = {
      steps: [],
    };
    ```

    The `this.story = { steps: [] }` line is what clears out any existing story steps and readies the server to start a new story.

2. **Broadcast the Story's State**: Once the story is initialized, we inform all connected clients by emitting a 'STORY_UPDATE' event. As part of this event, we broadcast the newly initialized (empty) story. It allows all connected clients to be in sync with the server's state, ensuring that they are aware that a new story is being started.

    ```typescript
    this.server.emit(STORY_UPDATE, { story: this.story });
    ```

And that's it! The `handleStoryInit` function is quite straightforward - its main job is to clear out the old story and inform all clients that a new story is about to start.


## Votes Management

In 'handleVoteRequest', we process 'emojiVote' events, which represent a client vote for a particular emoji at a specific story step. This method implements logic for tallying votes for emojis, managing client votes, and dictating how voting affects the progression of the story:

```typescript
@SubscribeMessage('emojiVote')
handleVoteRequest(client: Socket, payload: ..) {
  // Logic for handling votes
  //...
}
```

## Processing Random Emojis

Random emojis play a significant role in our story creation process. We generate a predefined number of unique random emojis for each step in the story using the `_generateRandomEmojies` function:

```typescript
private _generateRandomEmojies(): I.Emoji[] {
  // Logic to generate 8 unique random emojis
  //...
}
```

## Real-time Story Steps Management

In our application, the method `handleStepGeneration` generates a new step in the story. This process sets up a new voting "game" for each new step. During the voting process, users vote in real-time for their choice of emoji to continue the story:

```typescript
@SubscribeMessage('storyStepGenerate')
async handleStepGeneration(
  client: Socket,
  { stepNumber }: P.STORY_STEP_GENERATE,
) {
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
```

This function can be verbose, so let's break it down:  

1. A client might request a new step by emitting a 'storyStepGenerate' event. We denote this client using `client: Socket`. 

2. Along with the message, the client also sends some additional data as part of `payload`, here we're destructuring `stepNumber` out of it.

3. We start by checking whether the step number provided is valid (not negative and not exceeding the step limit). If the step number is invalid, we return an error message to the client.

4. If the step number already exists in the story, rather than creating a new step, we return the latest story status to the client. 

5. Now we're ready to generate a new story step (unless the step number is invalid or already exists). The details of the new step are created, such as order (as per stepNumber), selectedEmoji (which is empty at this stage), and a set of emoji contenders, which are randomly generated emojis.

6. Depending on the position (`stepNumber`) of this new step, we either insert it at the beginning (if `stepNumber` is 0) or append it at the last of the current story steps.

7. Once the new step is inserted, the updated story is emitted back to all clients via the STORY_UPDATE event.

8. Finally, we call the `startGame` method, passing in the newly created step and the client. This initiates the voting game for the new step and wraps up the new story step generation process.

On conclusion of the voting round, the application automatically initializes an update to the story step, thus ensuring that the data is always real-time.

```typescript
handleStepUpdate(client: Socket, { stepNumber, timeLeft }) {
  // Logic for updating the step post voting round
  //...
}
```

## EmojiService

The EmojiService generates stories via the OpenAI Service using specified emojis.  

Our `getAStory` function accepts a story object and an optional additional prompt. The function creates a prompt string using the emojis from the story steps and requests a story completion from the OpenAI Service. The function then returns the generated textual story:

```typescript
@Injectable()
export class EmojiService {
  constructor(private readonly openai: OpenAIService) {}

  async getAStory(story: I.Story, extraPrompt = '') {
    const emojis = story.steps.map(({ selectedEmoji }) => selectedEmoji);
    const { data } = await this.openai.createCompletion({
      model: 'gpt-3.5-turbo-instruct',
      prompt: `Write a small (100 words) witty story with the following emojis: "${emojis.join(
        ', ',
      )}" (in that order), Be concise and funny, with dark humour. Base the story on historical events, mythology, or science facts. Give me the story in french. Only use the emoji provided. Do not put the emojis in the response. ${extraPrompt}`,
      stream: false,
      max_tokens: 500,
    });
    return data.choices[0].text;
  }
}
```

## Summary

And that wraps up our tutorial. We've traversed our application's complete workflow. We're utilizing socket.io to handle connections, manage real-time events, manage votes, and track the progression of the story. With each interaction, we see the comprehensive capabilities of socket.io as a real-time technology in shaping interactive, engaging applications. Lastly, we discussed the role of EmojiService in transforming selected emojis into a unique story using OpenAI Service.

This interactive emoji story creation application presents an intriguing fusion of web sockets, user interaction, OpenAI, and real-time updates, rendering a glimpse of future applications driven by real-time technology.

