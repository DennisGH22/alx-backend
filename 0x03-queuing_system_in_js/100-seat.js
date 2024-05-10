import redis from 'redis';
import kue from 'kue';
const express = require('express');
const { promisify } = require('util');

const app = express();
const port = 1245;

const redisClient = redis.createClient();
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);

const queue = kue.createQueue();

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

setAsync('available_seats', 50);

let reservationEnabled = true;

async function reserveSeat (number) {
  await setAsync('available_seats', number);
}

async function getCurrentAvailableSeats () {
  const numberOfAvailableSeats = await getAsync('available_seats');
  return parseInt(numberOfAvailableSeats);
}

app.get('/available_seats', async (req, res) => {
  const numberOfAvailableSeats = await getCurrentAvailableSeats();
  res.json({ numberOfAvailableSeats });
});

app.get('/reserve_seat', (req, res) => {
  if (!reservationEnabled) {
    return res.json({ status: 'Reservation are blocked' });
  }

  const job = queue.create('reserve_seat').save(err => {
    if (err) {
      return res.json({ status: 'Reservation failed' });
    }
    res.json({ status: 'Reservation in process' });
  });

  job.on('complete', () => {
    console.log(`Seat reservation job ${job.id} completed`);
  });

  job.on('failed', err => {
    console.log(`Seat reservation job ${job.id} failed: ${err}`);
  });
});

app.get('/process', async (req, res) => {
  res.json({ status: 'Queue processing' });

  queue.process('reserve_seat', async (job, done) => {
    const numberOfAvailableSeats = await getCurrentAvailableSeats();
    if (numberOfAvailableSeats === 0) {
      reservationEnabled = false;
      done(new Error('Not enough seats available'));
    } else {
      await reserveSeat(numberOfAvailableSeats - 1);
      if (numberOfAvailableSeats - 1 === 0) {
        reservationEnabled = false;
      }
      done();
    }
  });
});
