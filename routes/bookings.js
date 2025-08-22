const express = require('express');
const createBookingModel = require('../models/booking');
const createServiceModel = require('../models/services');
const { authenticateToken } = require('../middleware/auth');
const { auditPHICreate } = require('../middleware/audit');

const router = express.Router();

// Helper function to get models
const getModels = () => {
  const Booking = createBookingModel();
  const Service = createServiceModel();
  return { Booking, Service };
};

// Create a new booking
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      serviceId,
      bookingDate,
      bookingTime,
      sessionDuration = 60,
      sessionType = 'video',
      sessionPlatform = 'Zoom',
      specialRequests,
      customerPhone
    } = req.body;

    const { Booking, Service } = getModels();

    // Validate service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Validate booking date is in the future
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    if (bookingDateTime <= new Date()) {
      return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    // Check if the time slot is available - only confirmed and completed bookings block new bookings
    const existingBooking = await Booking.findOne({
      serviceId,
      bookingDate: new Date(bookingDate),
      bookingTime,
      status: { $in: ['confirmed', 'completed'] }
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    // Create new booking
    const booking = new Booking({
      serviceId,
      serviceName: service.name,
      servicePrice: service.price,
      serviceProviderName: service.serviceProviderName,
      serviceProviderEmail: service.serviceProviderEmail,
      customerId: req.user.userId,
      customerName: req.user.displayName || req.user.firstName + ' ' + req.user.lastName || '',
      customerEmail: req.user.email,
      customerPhone,
      bookingDate: new Date(bookingDate),
      bookingTime,
      sessionDuration,
      sessionType,
      sessionPlatform,
      specialRequests,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await booking.save();

    // Audit log
    auditPHICreate(req, 'booking', booking._id, {
      serviceName: service.name,
      bookingDate,
      bookingTime,
      customerId: req.user.userId
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        serviceProviderName: booking.serviceProviderName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        sessionDuration: booking.sessionDuration,
        sessionType: booking.sessionType,
        status: booking.status,
        specialRequests: booking.specialRequests
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});
// Get available time slots for a service (basic implementation)
router.get('/service/:serviceId/availability', async (req, res) => {
  try {
    const { date } = req.query;
    const { Booking, Service } = getModels();

    // Validate service exists
    const service = await Service.findById(req.params.serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    // Get bookings for the specified date - only confirmed and completed bookings block time slots
    const bookings = await Booking.find({
      serviceId: req.params.serviceId,
      bookingDate: new Date(date),
      status: { $in: ['confirmed', 'completed'] }
    });

    // Generate available time slots (9 AM to 8 PM, 1-hour slots)
    const availableSlots = [];
    const bookedTimes = bookings.map(b => b.bookingTime);
    
    for (let hour = 9; hour <= 20; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      if (!bookedTimes.includes(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    res.json({
      date,
      serviceName: service.name,
      availableSlots,
      bookedSlots: bookedTimes
    });

  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user bookings
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { Booking } = getModels();
    
    const bookings = await Booking.find({ 
      customerId: req.user.userId 
    }).sort({ bookingDate: -1, bookingTime: -1 });

    res.json({
      bookings: bookings.map(booking => ({
        id: booking._id,
        serviceName: booking.serviceName,
        servicePrice: booking.servicePrice,
        serviceProviderName: booking.serviceProviderName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        sessionDuration: booking.sessionDuration,
        sessionType: booking.sessionType,
        sessionPlatform: booking.sessionPlatform,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        specialRequests: booking.specialRequests,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt
      }))
    });

  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel a booking
router.put('/:bookingId/cancel', authenticateToken, async (req, res) => {
  try {
    const { Booking } = getModels();
    
    const booking = await Booking.findOne({ 
      _id: req.params.bookingId,
      customerId: req.user.userId 
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed booking' });
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'customer';
    
    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        cancelledAt: booking.cancelledAt
      }
    });

  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;