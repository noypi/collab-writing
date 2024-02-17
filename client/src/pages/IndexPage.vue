<template>
    <q-editor ref="editor" v-model="content" min-height="5rem" @update:model-value="on_change" />
</template>

<script setup lang="ts">
/* eslint-disable */
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { ref } from 'vue';
import * as awarenessProtocol from 'y-protocols/awareness.js'
import { type QEditor } from 'quasar';
import * as Diff from 'diff';

console.log({ Diff })

const ydoc = new Y.Doc();
const ytext = ydoc.getText();

const awareness = new awarenessProtocol.Awareness(ydoc);

const editor = ref<QEditor>();
const content = ref(ytext.toString());

//const provider = new WebrtcProvider('your-room-name', ydoc, { signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'] });
const provider = new WebrtcProvider(
    'your-room-name22',
    ydoc,
    {
        signaling: ['ws://localhost:3000/'],
        awareness,
    },
);

awareness.on('change', (/*changes*/) => {
  // Whenever somebody updates their awareness information,
  // we log all awareness information from all users.
  console.log('on awareness changed', Array.from(awareness.getStates().values()))
})

// You can think of your own awareness information as a key-value store.
// We update our "user" field to propagate relevant user information.
awareness.setLocalStateField('user', {
  // Define a print name that should be displayed
  name: 'user-' + +Date.now(),
  // Define a color that should be associated to the user:
  color: '#ffb61e' // should be a hex color
})

provider.on('synced', synced => {
  // NOTE: This is only called when a different browser connects to this client
  // Windows of the same browser communicate directly with each other
  // Although this behavior might be subject to change.
  // It is better not to expect a synced event when using y-webrtc
  console.log('synced!', synced)
})

ytext.observe(text_observer);

// enable logging for all modules
//localStorage.log = 'true';

// @ts-ignore
window.example = { provider, ydoc, ytext }

function text_observer({ transaction, delta }) {
    if (!transaction.origin) {
        console.log('same origin doc, ignoring')
        return;
    }

    console.log('updating', { transaction });
    content.value = ytext.toString();
}

function on_change(text) {
    console.log('on_change', { text });

    const diff = Diff.diffChars(ytext.toString(), text);

    console.log({ diff })

    let offset = 0;

    const insert = part => {
        ytext.insert(offset, part.value);
        return offset + part.count;
    };

    const remove = part => {
        ytext.delete(offset, part.count);
        return offset - part.count;
    }


    diff.forEach((part) => {
        console.log({ part, offset });
        part.added
            ? offset = insert(part)
            : part.removed
                ? offset = remove(part)
                : offset += part.count; //noop
    });

    console.log(ytext.toString());
}
</script>
