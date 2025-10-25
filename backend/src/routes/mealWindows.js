const express = require('express');
const router = express.Router();
const MealWindow = require('../models/MealWindows');

// POST /api/meal-windows - Save meal windows configuration
router.post('/', async (req, res) => {
  try {
    // Meal Windows POST endpoint called

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

      // Validate enabled flag
      if (typeof meal.enabled !== 'boolean') {
        return res.status(400).json({ error: `Invalid enabled value for ${mealType}` });
      }
    }

    // Save to database - update or create each meal window
    const savedWindows = {};
    for (const mealType of requiredMeals) {
      const mealData = mealWindows[mealType];
      
      const updatedWindow = await MealWindow.findOneAndUpdate(
        { mealType },
        {
          startTime: mealData.startTime,
          endTime: mealData.endTime,
          enabled: mealData.enabled
        },
        { 
          new: true, 
          upsert: true,
          runValidators: true
        }
      );
      
      savedWindows[mealType] = {
        startTime: updatedWindow.startTime,
        endTime: updatedWindow.endTime,
        enabled: updatedWindow.enabled
      };
    }

    // Meal windows configuration saved to database

    res.status(200).json({
      success: true,
      message: 'Meal windows configuration saved successfully',
      mealWindows: savedWindows
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error while saving meal windows configuration' });
  }
});

// GET /api/meal-windows - Get meal windows configuration
router.get('/', async (req, res) => {
  try {
    // Meal Windows GET endpoint called

    // Get all meal windows from database
    const mealWindows = await MealWindow.getAllAsObject();
    
    // Only initialize defaults if no windows exist at all
    if (Object.keys(mealWindows).length === 0) {
      await MealWindow.initializeDefaults();
      const defaultWindows = await MealWindow.getAllAsObject();
      return res.status(200).json({
        success: true,
        mealWindows: defaultWindows
      });
    }

    res.status(200).json({
      success: true,
      mealWindows: mealWindows
    });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching meal windows configuration' });
  }
});

module.exports = router;
