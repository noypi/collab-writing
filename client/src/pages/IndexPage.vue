<template>
    <q-editor v-model="content" min-height="5rem" @update:model-value="on_change" />
</template>

<script setup lang="ts">
/* eslint-disable */
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { ref } from 'vue';
import * as awarenessProtocol from 'y-protocols/awareness.js'
import { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } from 'constants';

const ydoc = new Y.Doc();
const ytext = ydoc.getText();

const awareness = new awarenessProtocol.Awareness(ydoc);

const content = ref('');

//const provider = new WebrtcProvider('your-room-name', ydoc, { signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com', 'wss://y-webrtc-signaling-us.herokuapp.com'] });
const provider = new WebrtcProvider(
    'your-room-name',
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
localStorage.log = 'true';

// @ts-ignore
window.example = { provider, ydoc, ytext }

function text_observer({ transaction, delta }) {
    if (transaction.origin === ydoc) {
        console.log('same origin doc, ignoring')
        return;
    }

    console.log('ytext updated: ', ytext.toJSON(), { delta });
}

function on_change() {
    const text = content.value;
    console.log('on_change', { text });
    ytext.insert(0, text)
}
</script>
