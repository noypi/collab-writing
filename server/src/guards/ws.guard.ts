// https://github.com/nestjs/nest/issues/1254
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
/*
    Custom imports for AuthService, jwt secret, etc...
*/
//import * as jwt from 'jsonwebtoken';

@Injectable()
export class WsJwtGuard implements CanActivate {
    constructor() { }

    async canActivate(context: ExecutionContext) {
        const ctx = context.switchToWs();

        console.log('guard', { data: ctx.getData(), pat: ctx.getPattern() });

        return true;
    }
} ``