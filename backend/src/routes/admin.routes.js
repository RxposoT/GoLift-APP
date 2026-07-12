const { Router } = require('express');
const authenticate = require('../middleware/auth');
const requireAdmin = require('../middleware/adminAuth');
const adminCtrl = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminCtrl.getStats);
router.get('/growth', adminCtrl.getGrowth);
router.get('/users', adminCtrl.getUsers);
router.patch('/users/:userId/tipo', adminCtrl.setUserTipo);
router.delete('/users/:userId', adminCtrl.removeUser);
router.get('/phrases', adminCtrl.getPhrases);
router.post('/phrases', adminCtrl.addPhrase);
router.put('/phrases/:id', adminCtrl.editPhrase);
router.delete('/phrases/:id', adminCtrl.deletePhraseHandler);

module.exports = router;
