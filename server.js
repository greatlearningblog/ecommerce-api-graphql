require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');
const { getUserFromToken } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // Get token from the Authorization header
      const token = req.headers.authorization || '';
      const user = getUserFromToken(token);
      return { user };
    },
  });
  await server.start();
  server.applyMiddleware({ app });
  app.listen(PORT, () => {
    console.log(`Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer();
