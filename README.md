# Chat Application Backend

This is the backend service for the Chat Application. It provides APIs and handles the server-side logic for the chat functionality.

## Features

- User authentication and authorization
- Real-time messaging using WebSockets
- Chat room creation and management
- Message history storage and retrieval
- Secure token storage in HTTP-only cookies for enhanced security

## Technologies Used

- **Node.js**: Backend runtime environment
- **Express.js**: Web framework for building APIs
- **Socket.IO**: Real-time communication
- **MongoDB**: Database for storing user and message data
- **JWT**:Authentication using JSON Web Tokens
- **Bcrypt.js**: Password hashing for secure authentication

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/your-username/chat-app-backend.git
    cd chat-app-backend
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following:
    ```
    PORT=5000
    MONGO_URI=your_mongodb_connection_string
    JWT_SECRET=your_jwt_secret
    ```

4. Start the server:
    ```bash
    npm start
    ```

## API Endpoints

| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| POST   | `/api/auth/login` | User login (token stored securely in cookies) |
| POST   | `/api/auth/register` | User registration      |
| GET    | `/api/messages/:roomId` | Fetch chat history |
| GET    | `/api/auth/sidebar` | Get list of sidebar users (requires authentication) |
| POST   | `/api/messages`   | Send a new message       |

## Security

- Tokens are securely stored in HTTP-only cookies to prevent XSS attacks.
- Ensure HTTPS is used in production to encrypt data in transit.

## License

This project is licensed under the [MIT License](LICENSE) © 2025 Kalyan Kashaboina.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Contact

For any inquiries, please contact [kalyankashaboina07@gmail.com].