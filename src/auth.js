export const auth = {
    currentUser: null
};

export async function login(secretCode) {
    if (!secretCode || secretCode.trim() === "") {
        throw new Error("Please enter a valid code.");
    }
    const code = secretCode.trim();
    localStorage.setItem("habit_secret_code", code);
    auth.currentUser = { uid: code };
    return auth.currentUser;
}

export function logout() {
    localStorage.removeItem("habit_secret_code");
    auth.currentUser = null;
    window.location.reload();
}

export function onAuthChange(callback) {
    const code = localStorage.getItem("habit_secret_code");
    if (code) {
        auth.currentUser = { uid: code };
        callback(auth.currentUser);
    } else {
        auth.currentUser = null;
        callback(null);
    }
}
