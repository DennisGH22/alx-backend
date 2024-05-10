const createPushNotificationsJobs = require('./8-job');
import kue from 'kue';

console.log = jest.fn();
console.error = jest.fn();

describe('createPushNotificationsJobs', () => {
  let queue;

  beforeEach(() => {
    queue = kue.createQueue({ redis: { createClientFactory: () => kue.redis.createClient() }, testMode: true });
  });

  afterEach(() => {
    queue.testMode.clear();
    queue.shutdown(1000, (err) => {
      if (err) console.error('Error shutting down queue:', err);
    });
  });

  test('display a error message if jobs is not an array', () => {
    expect(() => {
      createPushNotificationsJobs('not an array', queue);
    }).toThrow('Jobs is not an array');
  });

  test('create two new jobs to the queue', () => {
    const jobs = [
      { phoneNumber: '1234567890', message: 'Test message 1' },
      { phoneNumber: '9876543210', message: 'Test message 2' },
    ];

    createPushNotificationsJobs(jobs, queue);

    expect(queue.testMode.jobs.length).toBe(jobs.length);
  });

  test('logs job creation', () => {
    const jobs = [{ phoneNumber: '1234567890', message: 'Test message 1' }];
    createPushNotificationsJobs(jobs, queue);
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/^Notification job created:/));
  });

});
