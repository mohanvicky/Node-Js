const express = require('express');
const router = express.Router();
const emiController = require('../controllers/emi.controller');
const auth = require('../middleware/auth');

router.post('/', auth, emiController.createEMI);
router.get('/', auth, emiController.getAllEMIs);
router.get('/:id', auth, emiController.getEMIById);
router.put('/:id', auth, emiController.updateEMI);
router.delete('/:id', auth, emiController.deleteEMI);

module.exports = router;
