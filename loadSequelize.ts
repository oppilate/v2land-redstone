import { Sequelize } from 'sequelize-typescript';
import { datastores } from '@Configs';
import * as models from '@Models';
import pino from 'pino';
const logger = pino();

const { postgresql } = datastores;
let logging: boolean | ((sql: string, timing?: number) => void) = process.env.SEQUELIZE_LOGGING !== 'false';
if (logging && process.env.NODE_ENV === 'production') {
  logging = (sql: string) => {
    logger.info(sql);
  };
} else if (logging) {
  logging = (sql: string) => {
    console.info(sql);
  };
}

export const sequelize = new Sequelize({
  database: postgresql.database,
  dialect: 'postgres',
  username: postgresql.user,
  password: postgresql.password,
  host: postgresql.host,
  port: postgresql.port,
  modelPaths: Object.keys(models).map(model => (models as any)[model]),

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },

  logging,
});

async function loadSequelize() {
  await sequelize.authenticate();
}

export default loadSequelize;
