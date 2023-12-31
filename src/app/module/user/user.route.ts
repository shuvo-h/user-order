import express from 'express';
import { userController } from './user.controller';

const router = express.Router();

// user routes
router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.get('/:userId', userController.getSingleUser);
router.put('/:userId', userController.updateSingleUser);
router.delete('/:userId', userController.deleteSingleUser);

// user's order route
router.get('/:userId/orders', userController.getOrdersOfSingleuser);
router.put('/:userId/orders', userController.addOrderTOList);
router.get(
  '/:userId/orders/total-price',
  userController.getTotalPriceOfOrderByuserId,
);

export const UserRoute = router;
