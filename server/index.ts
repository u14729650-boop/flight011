import { app, ready } from './app';
import { ENV } from './env';

await ready();
app.listen(ENV.port, () => {
  console.log(`YA² API listening on http://localhost:${ENV.port} (storage: ${ENV.dbClient}, payments: ${ENV.paymentProvider})`);
});
