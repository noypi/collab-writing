// example: https://github.com/yjs/y-webrtc/blob/master/bin/server.js
import { UseGuards } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import * as _ from 'lodash';
import { WsJwtGuard } from 'src/guards/ws.guard';
import { WsClient, Context } from 'src/types/models';

const clients: Record<string, WsClient> = {};
const client_topics: Record<string, Set<string>> = {};
const topic_clients: Record<string, Set<string>> = {};

@WebSocketGateway({
    transports: ['websocket']
})
export class SignalingGateway {
    @WebSocketServer()
    readonly server;

    handleConnection(client, ...args: any[]) {
        const header_key = args[0].headers['sec-websocket-key'];
        clients[header_key] = { header_key, client };
        client.header_key = header_key;
    }

    handleDisconnect(client) {
        console.warn('!!! disconnect', { header_key: client.header_key });

        const { header_key } = client;
        delete clients[header_key];

        client_topics?.[header_key]?.forEach(topic => {
            console.debug('deleting topic_clients', { header_key });
            topic_clients?.[topic]?.delete(header_key);
        });
        delete client_topics[header_key];
    }

    @SubscribeMessage('publish')
    onPublish(@ConnectedSocket() client, @MessageBody() message: any): WsResponse {
        const { data } = message;
        const { header_key } = client;
        console.log('publish', { header_key: client.header_key, data });

        const context = { header_key, client };
        broadcast(context, message);

        return;
    }

    @SubscribeMessage('ping')
    onPing(@ConnectedSocket() socket) {
        console.log('ping', { header_key: socket.header_key });

        socket.send(JSON.stringify({ type: 'pong' }));
        return;
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('subscribe')
    onSubscribe(@ConnectedSocket() client, @MessageBody() message: any): WsResponse {
        const { topics } = message;
        const { header_key } = client;
        console.log('subscribe', { key: client.header_key, message });

        _.each(topics, (topic: string) => {
            const topic_set = client_topics[topics] ?? new Set<string>();
            topic_set.add(topic);
            client_topics[topics] = topic_set;

            const client_set = topic_clients[topic] ?? new Set<string>();
            topic_clients[topic] = client_set;
            client_set.add(header_key);
        });

        const context = { header_key, client };
        broadcast(context, message);

        return;
    }

    @SubscribeMessage('signal')
    onSignal(@MessageBody() data: any): WsResponse {
        console.log({ data });
        return;
    }

    @SubscribeMessage('unsubscribe')
    onUnsubscribe(@MessageBody() data: any): WsResponse {
        console.warn('!!! unsubscribe', { data });
        return;
    }

}

function broadcast(ctx: Context, message: any): WsResponse {
    console.log('broadcast', { header_key: ctx.header_key, message, topic_clients });

    topic_clients[message.topic]?.forEach(
        (header_key: string) => send_message(ctx, header_key, message)
    );

    return;
}

function send_message(ctx: Context, header_key: string, message: any) {
    if (ctx.header_key === header_key) {
        return;
    }

    console.debug('sending broadcast message to', header_key, { message });

    const client = clients[header_key]?.client;
    client?.send(JSON.stringify(message));
}
