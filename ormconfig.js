module.exports = {
  type: 'postgres',
  keepConnectionAlive: true,
  entities: ['dist/entities/**/*.entity.js'],
  migrations: ['dist/migrations/**/*.js'],
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  username: process.env.POSTGRES_USERNAME || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DBNAME || 'postgres',
  synchronize: false,
  uuidExtension: 'pgcrypto',
  migrationsTableName: 'custom_migration_table',
  cli: {
    migrationsDir: 'src/migrations',
  },
};
