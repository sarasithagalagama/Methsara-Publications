// ============================================
// Location Controller
// Epic: E5 - Inventory Management
// Purpose: Manage dynamic locations/branches (E5.7)
// ============================================

const Location = require('../models/Location');

// @desc    Get all locations
// @route   GET /api/locations
// @access  Private
exports.getLocations = async (req, res) => {
  try {
    let locations = await Location.find().sort({
      isMainWarehouse: -1,
      createdAt: -1,
    });

    // Self-healing: Ensure only one main warehouse exists
    const mainWarehouses = locations.filter((loc) => loc.isMainWarehouse);
    if (mainWarehouses.length > 1) {
      // Keep the first one (most recently created due to sort) and demote others
      const idsToDemote = mainWarehouses.slice(1).map((loc) => loc._id);
      await Location.updateMany(
        { _id: { $in: idsToDemote } },
        { isMainWarehouse: false },
      );
      // Refresh list after fix
      locations = await Location.find().sort({
        isMainWarehouse: -1,
        createdAt: -1,
      });
    }

    res.status(200).json({
      success: true,
      count: locations.length,
      locations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching locations",
      error: error.message,
    });
  }
};

// @desc    Create a new location
// @route   POST /api/locations
// @access  Private (Admin)
exports.createLocation = async (req, res) => {
  try {
    // If setting as main warehouse, unset others first
    if (req.body.isMainWarehouse) {
      await Location.updateMany({}, { isMainWarehouse: false });
    }

    const location = await Location.create(req.body);
    res.status(201).json({
      success: true,
      message: "Location created successfully",
      location,
    });
  } catch (error) {
    // Handle uniqueness error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A location with that name already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error creating location",
      error: error.message,
    });
  }
};

// @desc    Update location
// @route   PUT /api/locations/:id
// @access  Private (Admin)
exports.updateLocation = async (req, res) => {
  try {
    let location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // If setting this one as main, unset all others
    if (req.body.isMainWarehouse === true) {
      await Location.updateMany(
        { _id: { $ne: req.params.id } },
        { isMainWarehouse: false },
      );
    }

    const oldName = location.name;
    const newName = req.body.name;

    location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If the name changed, update all inventory records (E5 Sync)
    if (newName && newName !== oldName) {
      const Inventory = require('../models/Inventory');
      const User = require('../../E1_UserAndRoleManagement/models/User');
      await Inventory.updateMany({ location: oldName }, { location: newName });
      await User.updateMany(
        { assignedLocation: oldName },
        { assignedLocation: newName },
      );
    }

    res.status(200).json({
      success: true,
      message: "Location updated successfully",
      location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating location",
      error: error.message,
    });
  }
};

// @desc    Delete location
// @route   DELETE /api/locations/:id
// @access  Private (Admin)
exports.deleteLocation = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: "Location not found",
      });
    }

    // Do not allow deleting main warehouse easily
    if (location.isMainWarehouse) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete the main warehouse. Please reassign main status first.",
      });
    }

    await location.deleteOne();

    res.status(200).json({
      success: true,
      message: "Location deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting location",
      error: error.message,
    });
  }
};
