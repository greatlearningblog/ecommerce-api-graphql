const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLScalarType, Kind } = require('graphql');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date scalar type',
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value.toISOString();
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.STRING) {
        return new Date(ast.value);
      }
      return null;
    },
  }),

  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await User.findById(user.id);
    },
    getProducts: async () => {
      return await Product.find();
    },
    getProduct: async (_, { id }) => {
      return await Product.findById(id);
    },
    myCart: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const currentUser = await User.findById(user.id).populate('cart.product');
      return currentUser.cart;
    },
    orders: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      return await Order.find({ user: user.id }).populate({
        path: 'items.product'
      });
    },
  },

  Mutation: {
    signup: async (_, { name, email, password }) => {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const user = new User({ name, email, password: hashedPassword, role: 'customer' });
      await user.save();
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });
      if (!user) throw new Error('Invalid credentials');
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new Error('Invalid credentials');
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      return { token, user };
    },
    addProduct: async (_, { name, description, price, stock }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Not authorized');
      const product = new Product({ name, description, price, stock });
      await product.save();
      return product;
    },
    updateProduct: async (_, { id, name, description, price, stock }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Not authorized');
      const update = {};
      if (name !== undefined) update.name = name;
      if (description !== undefined) update.description = description;
      if (price !== undefined) update.price = price;
      if (stock !== undefined) update.stock = stock;
      const product = await Product.findByIdAndUpdate(id, update, { new: true });
      return product;
    },
    deleteProduct: async (_, { id }, { user }) => {
      if (!user || user.role !== 'admin') throw new Error('Not authorized');
      const product = await Product.findByIdAndDelete(id);
      return product;
    },
    addToCart: async (_, { productId, quantity = 1 }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const currentUser = await User.findById(user.id);
      const index = currentUser.cart.findIndex(item => item.product.toString() === productId);
      if (index > -1) {
        currentUser.cart[index].quantity += quantity;
      } else {
        currentUser.cart.push({ product: productId, quantity });
      }
      await currentUser.save();
      return currentUser;
    },
    removeFromCart: async (_, { productId }, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const currentUser = await User.findById(user.id);
      currentUser.cart = currentUser.cart.filter(item => item.product.toString() !== productId);
      await currentUser.save();
      return currentUser;
    },
    placeOrder: async (_, __, { user }) => {
      if (!user) throw new Error('Not authenticated');
      const currentUser = await User.findById(user.id).populate('cart.product');
      if (currentUser.cart.length === 0) throw new Error('Cart is empty');
      
      let totalPrice = 0;
      const orderItems = currentUser.cart.map(item => {
        totalPrice += item.product.price * item.quantity;
        return { product: item.product._id, quantity: item.quantity };
      });
      
      const order = new Order({
        user: currentUser._id,
        items: orderItems,
        totalPrice,
        status: 'pending'
      });
      await order.save();
      // Clear user's cart after placing order
      currentUser.cart = [];
      await currentUser.save();
      return order;
    }
  }
};

module.exports = resolvers;
