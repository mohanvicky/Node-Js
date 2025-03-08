# Task Management API

A RESTful API built with Express.js and MongoDB for managing user accounts and tasks.

## Features

#### User authentication

* Register
* Login

#### Task management

* Create
* Read
* Update
* Delete

#### MongoDB database integration

#### JWT-based authentication

#### Request validation

#### Health check endpoint

## Tech Stack

* Node.js
* Express.js
* MongoDB (with Mongoose)
* JSON Web Tokens (JWT)

## Prerequisites

* Node.js (v14 or higher)
* MongoDB (local or Atlas)
* npm

## API Endpoints

### Health Check

* `GET /api/health` - Check API and database health

### User Routes

* `POST /api/user/register` - Register a new user
* `POST /api/user/login` - Login and get authentication token

### Task Routes

* `GET /api/tasks` - Get all tasks (authenticated)
* `POST /api/tasks` - Create a new task (authenticated)
* `GET /api/tasks/:id` - Get a task by ID (authenticated)
* `PUT /api/tasks/:id` - Update a task (authenticated)
* `DELETE /api/tasks/:id` - Delete a task (authenticated)

## Authentication

This API uses JWT (JSON Web Tokens) for authentication. To access protected routes:

* Obtain a token by registering or logging in

