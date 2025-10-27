document.addEventListener('DOMContentLoaded', async () => {
    const butLogin = document.getElementById('butLogin');

    const isLogged = (await (await fetch("/api/checkAuth")).json()).data;
    if(!isLogged){
        butLogin.textContent = 'Login';
        butLogin.href = '/login';
    } else {
        butLogin.textContent = 'Profile';
        butLogin.href = '/profile';
    }
});