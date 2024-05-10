import redis from 'redis';

const client = redis.createClient();

client.on('connect', () => {
  console.log('Redis client connected to the server');
});

client.on('error', (err) => {
  console.error(`Redis client not connected to the server: ${err}`);
});

function setNewSchool (schoolName, value) {
  client.set(schoolName, value, (err, reply) => {
    if (err) {
      console.error('Error setting value:', err);
    } else {
      console.log('Value set successfully:', reply);
    }
  });
}

function displaySchoolValue (schoolName) {
  client.get(schoolName, (err, reply) => {
    if (err) {
      console.error('Error getting value:', err);
    } else {
      console.log(`Value for ${schoolName}:`, reply);
    }
  });
}

displaySchoolValue('Holberton');
setNewSchool('HolbertonSanFrancisco', '100');
displaySchoolValue('HolbertonSanFrancisco');
