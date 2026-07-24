export const auth = {
    currentUser: null
};

export async function login(email, password) {
    if (email === "CODYOFFICIAL84@GMAIL.COM" && password === "A1@pankaj") {
        localStorage.setItem("loggedIn", "true");
        auth.currentUser = { uid: "hardcoded_user", email: email };
        return auth.currentUser;
    } else {
        throw new Error("Incorrect Email or Password");
    }
}

export function logout() {
    localStorage.removeItem("loggedIn");
    auth.currentUser = null;
    window.location.reload();
}

export function onAuthChange(callback) {
    if (localStorage.getItem("loggedIn") === "true") {
        auth.currentUser = { uid: "hardcoded_user", email: "CODYOFFICIAL84@GMAIL.COM" };
        callback(auth.currentUser);
    } else {
        auth.currentUser = null;
        callback(null);
    }
}
