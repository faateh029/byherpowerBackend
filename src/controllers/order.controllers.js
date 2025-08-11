// controllers/order.controllers.js

export const createOrderController = async (req, res, next) => {
  res.json({ message: "createOrderController hit" });
};

export const getUserOrdersController = async (req, res, next) => {
  res.json({ message: "getUserOrdersController hit" });
};

export const getAllOrdersController = async (req, res, next) => {
  res.json({ message: "getAllOrdersController hit" });
};

export const updateOrderStatusController = async (req, res, next) => {
  res.json({ message: "updateOrderStatusController hit" });
};

export const cancelOrderController = async (req, res, next) => {
  res.json({ message: "cancelOrderController hit" });
};
