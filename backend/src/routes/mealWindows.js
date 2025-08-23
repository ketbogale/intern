const express = require('express');
const router = express.Router();

// In-memory storage for meal windows configuration
// In production, this should be stored in a database
let mealWindowsConfig = {
  breakfast: {
    startTime: '06:00',
    endTime: '09:00',
    beforeWindow: 30,
    afterWindow: 30,
    enabled: true
  },
  lunch: {
    startTime: '12:00',
    endTime: '14:00',
    beforeWindow: 30,
    afterWindow: 30,
    enabled: true
  },
  dinner: {
    startTime: '18:00',
    endTime: '20:00',
    beforeWindow: 30,
    afterWindow: 30,
    enabled: true
  },
  lateNight: {
    startTime: '22:00',
    endTime: '23:30',
    beforeWindow: 15,
    afterWindow: 15,
    enabled: false
  }
};

// POST /api/meal-windows - Save meal windows configuration
router.post('/', async (req, res) => {
  try {
    console.log('Meal Windows POST endpoint called');
    console.log('Request body:', req.body);

    const { mealWindows } = req.body;

    // Validate the request body
    if (!mealWindows || typeof mealWindows !== 'object') {
      return res.status(400).json({ error: 'Invalid meal windows configuration' });
    }

    // Validate each meal window configuration
    const requiredMeals = ['breakfast', 'lunch', 'dinner', 'lateNight'];
    for (const mealType of requiredMeals) {
      const meal = mealWindows[mealType];
      if (!meal) {
        return res.status(400).json({ error: `Missing configuration for ${mealType}` });
      }

      // Validate time format (HH:MM)
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(meal.startTime) || !timeRegex.test(meal.endTime)) {
        return res.status(400).json({ error: `Invalid time format for ${mealType}` });
      }

      // Validate window values
      if (typeof meal.beforeWindow !== 'number' || meal.beforeWindow < 0 || meal.beforeWindow > 120) {
        return res.status(400).json({ error: `Invalid beforeWindow value for ${mealType}` });
      }
      if (typeof meal.afterWindow !== 'number' || meal.afterWindow < 0 || meal.afterWindow > 120) {
        return res.status(400).json({ error: `Invalid afterWindow value for ${mealType}` });
      }

      // Validate enabled flag
      if (typeof meal.enabled !== 'boolean') {
        return res.status(400).json({ error: `Invalid enabled value for ${mealType}` });
      }
    }

    // Update the configuration
    mealWindowsConfig = { ...mealWindows };

    console.log('Meal windows configuration updated:', mealWindowsConfig);

    res.status(200).json({
      success: true,
      message: 'Meal windows configuration saved successfully',
      mealWindows: mealWindowsConfig
    });

  } catch (error) {
    console.error('Error saving meal windows configuration:', error);
    res.status(500).json({ error: 'Internal server error while saving meal windows configuration' });
  }
});

// GET /api/meal-windows - Get meal windows configuration
router.get('/', async (req, res) => {
  try {
    console.log('Meal Windows GET endpoint called');

    res.status(200).json({
      success: true,
      mealWindows: mealWindowsConfig
    });

  } catch (error) {
    console.error('Error fetching meal windows configuration:', error);
    res.status(500).json({ error: 'Internal server error while fetching meal windows configuration' });
  }
});

module.exports = router;
