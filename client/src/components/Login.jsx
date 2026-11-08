import { useState } from "react";

function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (username.trim() === "" || password === "") {
            setSuccess(false);
            setMessage("Please enter both a username and a password.");
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (response.ok) {
                setPassword("");
            }
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Login</h2>

            <label>
                Username
                <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </label>

            <label>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
            </label>

            <button type="submit">Log In</button>

            {message && <p className={success ? "message success" : "message error"}>{message}</p>}
        </form>
    );
}

export default Login;
