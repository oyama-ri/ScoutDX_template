import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import { ScoutStatus } from '../store/statusうウェイター';

@Entity('scouts')
export class ScoutEntity {
  @PrimaryColumn({ name: 'id' })
  id?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt?: Date;

  @Column({ name: 'creator', type: 'varchar', length: 100 })
  creator: string;

  @Column({ name: 'title', type: 'varchar', length: 255 })
  title: string;

  @Column({ name: 'body', type: 'text' })
  body: string;

  @Column({ name: 'status', type: 'varchar', length: 20, default: ScoutStatus.DRAFT })
  status: ScoutStatus;
}
