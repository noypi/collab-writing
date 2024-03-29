import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomWsAdapter } from './signaling/signaling.adapter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.useWebSocketAdapter(new CustomWsAdapter(app))
    await app.listen(3000);
}
bootstrap();
