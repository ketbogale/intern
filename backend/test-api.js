const http = require('http');

// Test the meal windows API endpoint
function testMealWindowsAPI() {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/meal-windows',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('Status Code:', res.statusCode);
      console.log('Response Headers:', res.headers);
      console.log('Response Body:', data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('\n--- Parsed Response ---');
        console.log('Success:', parsed.success);
        console.log('Meal Windows:', JSON.stringify(parsed.mealWindows, null, 2));
        
        if (parsed.mealWindows) {
          console.log('\n--- Meal Window Times ---');
          Object.entries(parsed.mealWindows).forEach(([meal, config]) => {
            console.log(`${meal}: ${config.startTime} - ${config.endTime} (enabled: ${config.enabled})`);
          });
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request failed: ${e.message}`);
    console.log('Make sure the backend server is running on port 3001');
  });

  req.end();
}

console.log('Testing meal windows API endpoint...');
testMealWindowsAPI();
