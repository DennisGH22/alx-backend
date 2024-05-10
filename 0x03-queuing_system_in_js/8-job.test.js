import kue from 'kue';
const assert = require('assert');
const createPushNotificationsJobs = require('./8-job');

console.log = () => {};
console.error = () => {};

describe('createPushNotificationsJobs', function () {
  let queue;

  beforeEach(function () {
    queue = kue.createQueue({ redis: { createClientFactory: () => kue.redis.createClient() }, testMode: true });
  });

  afterEach(function (done) {
    queue.testMode.clear(done);
  });

  it('display a error message if jobs is not an array', function () {
    assert.throws(() => {
      createPushNotificationsJobs('not an array', queue);
    }, { message: 'Jobs is not an array' });
  });

  it('create two new jobs to the queue', function () {
    const jobs = [
      { phoneNumber: '0123456789', message: 'Test message 1' },
      { phoneNumber: '9876543210', message: 'Test message 2' }
    ];

    createPushNotificationsJobs(jobs, queue);

    assert.strictEqual(queue.testMode.jobs.length, jobs.length);
  });

  it('logs job creation', function () {
    const jobs = [{ phoneNumber: '0123456789', message: 'Test message 1' }];
    createPushNotificationsJobs(jobs, queue);
    assert(queue.testMode.jobs[0].log[0].includes('Notification job created:'));
  });
});
