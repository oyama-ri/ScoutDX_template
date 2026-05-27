import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // フロントエンドからのAPIリクエストを受け付けるためにCORSを有効化
  app.enableCors({
    origin: '*', // 演習用のため、すべてのアクセス元を許可
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept',
  });

  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port);
  console.log(`▼ バックエンドサーバーがポート${port}で起動しました！`);
  console.log(`APIのベースURL: http://localhost:${port}/api/scouts`);
}
bootstrap();