/**
 * 초기 관리자 생성 스크립트.
 * DATABASE_URL, ADMIN_INIT_EMAIL, ADMIN_INIT_PASSWORD 환경변수 설정 후 npm run seed:admin
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { AdminUser } from './entities/admin-user.entity';

dotenv.config();

async function seed() {
  const url = process.env.DATABASE_URL;
  const email = process.env.ADMIN_INIT_EMAIL || 'admin@bike.local';
  const password = process.env.ADMIN_INIT_PASSWORD || 'admin1234!';
  if (!url) {
    console.error('DATABASE_URL required');
    process.exit(1);
  }
  const ds = new DataSource({
    type: 'postgres',
    url,
    entities: [AdminUser],
    synchronize: false,
  });
  await ds.initialize();
  const repo = ds.getRepository(AdminUser);
  const existing = await repo.findOne({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    await ds.destroy();
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const admin = repo.create({ email, passwordHash: hash, name: 'Admin' });
  await repo.save(admin);
  console.log('Admin created:', email);
  await ds.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
