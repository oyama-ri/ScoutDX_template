import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoutModule } from './scout.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5433', 10),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password123',
      database: process.env.DB_NAME || 'scout_db',
      autoLoadEntities: true,
      synchronize: false,
    }),
    ScoutModule,
  ],
})
export class AppModule {}
