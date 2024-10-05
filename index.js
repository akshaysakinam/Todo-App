const express = require('express'); // Removed the unused 'const e'
const app = express();
const path = require('path');
const jwt = require('jsonwebtoken');
const port = 3000;
const JWT_SECRET = "Shrikrishnagovindharemurari";
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

const users = [];

app.use(express.static(path.join(__dirname, 'public')));

// Middleware to authenticate tokens
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extract token
    if (!token) {
        return res.status(401).json({ message: "Token not provided" }); // Handle missing token
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" }); // Handle invalid token
        }
        req.user = decoded; // Attach user info to request
        next();
    });
}

// User signup
app.post('/signup', function (req, res) {
    const { username, password } = req.body;
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: "User already exists" }); // Return bad request
    }
    users.push({
        username: username,
        password: password,
        todos: [] // Initialize the todos array
    });
    res.status(201).json({ message: "User created successfully" }); // 201 Created
});

// User signin
app.post('/signin', function (req, res) {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = jwt.sign({ username: user.username }, JWT_SECRET);
        res.json({ token: token });
    } else {
        res.status(401).json({ message: "Invalid username or password" }); // Return unauthorized
    }
});

// Get todos for authenticated user
app.get('/todos', authenticateToken, function (req, res) {
    const username = req.user.username;
    const user = users.find(u => u.username === username);
    if (user) {
        res.json({ todos: user.todos });
    } else {
        res.status(404).json({ message: "User not found" });
    }
});

// Create a new todo for authenticated user
app.post('/todos', authenticateToken, function (req, res) {
    const { title, description, done } = req.body;
    const username = req.user.username;
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: "User not found" }); // Return user not found
    }

    const newTodo = {
        id: uuidv4(),
        title: title,
        description: description,
        done: done !== undefined ? done : false // Optionally track whether the todo is done

    };

    user.todos.push(newTodo); // Add the new todo to the user's todos
    res.status(201).json({ message: "Todo created successfully" }); // Return created response
});

// Update a todo for authenticated user
app.put('/todos/:id', authenticateToken, function (req, res) {
    const username = req.user.username;
    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const todoId = req.params.id;
    const todo = user.todos.find(u => u.id === todoId);
    if (!todo) {
        return res.status(404).json({ message: "Todo not found" });
    }

    const { title, description, done } = req.body;
    todo.title = title || todo.title;
    todo.description = description || todo.description;
    todo.done = done !== undefined ? done : todo.done;

    res.json({ message: "Todo updated successfully" });
})

// Delete a todo for authenticated user

app.delete('/todos/:id', authenticateToken, function (req, res) {
    const username = req.user.username;
    const user = users.find(u => u.username === username);
    if (!user) {
        res.status(404).json({
            message: "User not found"
        })
        return
    }
    const todoId = req.params.id;
    const todoIndex = user.todos.findIndex(u => u.id === todoId);
    if (todoIndex === -1) {
        res.status(404).json({
            message: "Todo not found"
        });
        return
    }
    user.todos.splice(todoIndex, 1)

    res.json({
        message: "Todo Deleted Successfully"
    })
})


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
