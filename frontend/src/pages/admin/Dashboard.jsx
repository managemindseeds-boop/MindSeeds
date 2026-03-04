import { useAuth } from "../../context/AuthContext";

function Dashboard() {
    const { currentUser, logout } = useAuth()
    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {currentUser.name}</p>
            <button onClick={logout}>Logout</button>
        </div>
    )
}

export default Dashboard