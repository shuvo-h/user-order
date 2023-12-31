import { TOrders, TUser, TUserOptional } from './user.interface';
import { UserModel } from './user.model';

// create a new user to db
const createUserIntoDb = async (user: TUser): Promise<TUser> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(user.userId);
  if (isExistUser) {
    throw new Error('User id already exist');
  }
  const isExistUserByUsername =
    await UserModel.isUserExistByUserNameStaticMethod(user.username);
  if (isExistUserByUsername) {
    throw new Error('Username already exist');
  }

  const result = await UserModel.create(user);
  return result;
};

// get all users
const getAllUserFromDB = async (fields = {}): Promise<TUser[]> => {
  const result = await UserModel.find({}, fields);
  return result;
};

// get single user by id
const getSingleUserFromDB = async (userId: number): Promise<TUser | null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }

  const result = await UserModel.findOne({ userId });
  return result;
};

// update a single user by userId
const updateUserByUserId = async (
  userId: number,
  userInfo: TUserOptional,
): Promise<TUser | null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }
  if (userInfo.username) {
    const isExistUserByUsername =
      await UserModel.isUserExistByUserNameStaticMethod(userInfo.username);
    if (isExistUserByUsername) {
      throw new Error('Username already exist');
    }
  }

  const doc = await UserModel.findOneAndUpdate(
    { userId },
    {
      $set: userInfo,
    },
    { new: true, runValidators: true },
  );
  const result = doc?.toObject() as TUser | null;
  if (result?.password)
    (result as unknown as { password: undefined }).password = undefined;
  if (result?.orders) result.orders = undefined;
  return result;
};

// delete a user by userId
const deleteUserByUserId = async (userId: number): Promise<null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }

  await UserModel.findOneAndDelete({ userId });

  return null;
};

// add an order element

const addAnOrderByUserId = async (
  userId: number,
  order: TOrders,
): Promise<null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }

  if (isExistUser.orders) {
    // push to array
    await UserModel.updateOne(
      { userId },
      {
        $push: {
          orders: order,
        },
      },
      { new: false, runValidators: true },
    );
  } else {
    // insert a new order array
    await UserModel.findOneAndUpdate(
      { userId },
      {
        $set: {
          orders: [order],
        },
      },
      { new: false, runValidators: true },
    );
  }

  return null;
};

// get all orders by userId
const getAllOrdersByUserId = async (userId: number): Promise<TUser | null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }

  const result = await UserModel.findOne({ userId }).select('orders');

  return result;
};

// calculate total price of a user order
const getTotalPriceOfOrderByuserId = async (
  userId: number,
): Promise<{ totalPrice: number } | null> => {
  const isExistUser = await UserModel.isUserExistByStaticMethod(userId);
  if (!isExistUser) {
    const err = new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).statusCode = 404;
    throw err;
  }

  const result: { totalPrice: number }[] = await UserModel.aggregate([
    // get this users data only
    { $match: { userId } },

    // desctructure the orders array
    { $unwind: { path: '$orders' } },

    // make a group based on _id and calculte the total price
    {
      $group: {
        _id: '$_id',
        totalPrice: {
          $sum: { $multiply: ['$orders.price', '$orders.quantity'] },
        },
      },
    },

    // select the fields
    { $project: { totalPrice: 1 } },
  ]);

  return result.length ? result[0] : null;
};

export const userService = {
  createUserIntoDb,
  getAllUserFromDB,
  getSingleUserFromDB,
  updateUserByUserId,
  deleteUserByUserId,
  addAnOrderByUserId,
  getAllOrdersByUserId,
  getTotalPriceOfOrderByuserId,
};
