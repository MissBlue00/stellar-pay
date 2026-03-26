import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('checkout_sessions')
export class CheckoutSessionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { nullable: false })
  merchant_id: string;

  @Column('varchar', { length: 255, unique: true, nullable: false })
  session_token: string;

  @Column('varchar', { length: 50, nullable: false })
  payment_method: string;

  @Column('decimal', { precision: 18, scale: 8, nullable: false })
  amount: number;

  @Column('varchar', { length: 3, nullable: false })
  currency: string;

  @Column('varchar', { length: 500, nullable: false })
  description: string;

  @Column('varchar', { length: 255, nullable: false })
  merchant_name: string;

  @Column('varchar', { length: 250, nullable: true })
  return_url: string | null;

  @Column('varchar', { length: 250, nullable: true })
  webhook_url: string | null;

  @Column('varchar', { length: 50, default: 'pending' })
  status: 'pending' | 'completed' | 'expired' | 'cancelled';

  @Column('timestamp', { nullable: false })
  expires_at: Date;

  @Column('json', { nullable: true })
  metadata: Record<string, string | number | boolean | Date | null> | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
