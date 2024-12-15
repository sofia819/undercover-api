import pgPromise from 'pg-promise';
import * as dotenv from 'dotenv';

const pgp = pgPromise();

const config = {
  connectionString: dotenv.config().parsed?.DATABASE_URL,
};
export default pgp(config);
