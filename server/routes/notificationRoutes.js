const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authMiddleware);

// Get all notifications for the authenticated user
router.get('/', getNotifications);

// Mark a specific notification as read
router.put('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

module.exports = router;
