import { useState } from "react";

function Signup() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (firstName.trim() === "" || lastName.trim() === "" || username.trim() === "" || password === "") {
            setSuccess(false);
            setMessage("Please fill in all of the fields.");
            return;
        }

        try {
            const response = await fetch("http://localhost:9000/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    f_name: firstName,
                    l_name: lastName,
                    username: username,
                    password: password
                })
            });

            const data = await response.json();

            setSuccess(response.ok);
            setMessage(data.message);

            if (response.ok) {
                setFirstName("");
                setLastName("");
                setUsername("");
                setPassword("");
            }
        } catch {
            setSuccess(false);
            setMessage("Could not connect to the server. Is it running?");
        }
    }

    return (
        <form onSubmit={handleSubmit}>
            <h2>Sign Up</h2>

            <label>
                First Name
                <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                />
            </label>

            <label>
                Last Name
                <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                />
            </label>

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

            <button type="submit">Create Account</button>

            {message && <p className={success ? "message success" : "message error"}>{message}</p>}
        </form>
    );
}

export default Signup;
