const express = require("express");
const router = express.Router();
const {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { protect, authorize } = require('../../E1_UserAndRoleManagement/middleware/auth');

router.use(protect);

router
  .route("/")
  .get(getLocations)
  .post(authorize("admin", "master_inventory_manager"), createLocation);

router
  .route("/:id")
  .put(authorize("admin", "master_inventory_manager"), updateLocation)
  .delete(authorize("admin", "master_inventory_manager"), deleteLocation);

module.exports = router;
