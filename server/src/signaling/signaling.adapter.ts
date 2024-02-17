// https://stackoverflow.com/questions/77387309/nestjs-websocket-message-format
import { MessageMappingProperties } from '@nestjs/websockets/gateway-metadata-explorer';
import { EMPTY, Observable } from 'rxjs';
import { WsAdapter } from '@nestjs/platform-ws';
import * as _ from 'lodash';

export class CustomWsAdapter extends WsAdapter {
    // taken from https://github.com/nestjs/nest/blob/master/packages/platform-ws/adapters/ws-adapter.ts
    public bindMessageHandler(
        buffer: any,
        handlers: MessageMappingProperties[],
        transform: (data: any) => Observable<any>,
    ): Observable<any> {
        try {
            //const client = buffer.target;
            const message = JSON.parse(buffer.data);
            const message_handler = handlers.find(
                handler => handler.message === message.type,
            );
            console.log('(+)------\n', { message });
            const callback = message_handler?.callback;
            const data = _.omit(message, 'type');

            const result = transform(callback(message, data.type));
            console.log('(-)--------');
            return result;
        } catch (e) {
            console.log({ e });
            return EMPTY;
        }
    }
}
