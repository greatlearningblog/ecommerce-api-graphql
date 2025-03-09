const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type User {
    id: ID!
    name: String
    email: String!
    role: String
    cart: [CartItem]
  }

  type CartItem {
    product: Product
    quantity: Int
  }

  type Product {
    id: ID!
    name: String!
    description: String
    price: Float!
    stock: Int
  }

  type OrderItem {
    product: Product
    quantity: Int
  }

  type Order {
    id: ID!
    user: User
    items: [OrderItem]
    totalPrice: Float
    status: String
    createdAt: Date
  }

  type AuthPayload {
    token: String
    user: User
  }

  type Query {
    me: User
    getProducts: [Product]
    getProduct(id: ID!): Product
    myCart: [CartItem]
    orders: [Order]
  }

  type Mutation {
    signup(name: String, email: String!, password: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload

    addProduct(name: String!, description: String, price: Float!, stock: Int!): Product
    updateProduct(id: ID!, name: String, description: String, price: Float, stock: Int): Product
    deleteProduct(id: ID!): Product

    addToCart(productId: ID!, quantity: Int): User
    removeFromCart(productId: ID!): User
    placeOrder: Order
  }
`;

module.exports = typeDefs;
