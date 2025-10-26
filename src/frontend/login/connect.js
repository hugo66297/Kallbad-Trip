document.addEventListener('DOMContentLoaded', async() => {
    
    const perror = document.getElementById('perror');

    const toggleLink = document.getElementById('toggleLink');
    const usernameInput = document.getElementById('username');
    const nameRow = document.getElementById('nameRow');
    const authTitle = document.getElementById('authTitle');
    const submitBtn = document.getElementById('submitBtn');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const switchText = document.getElementById('switchText');
    let isRegister = false;

    toggleLink.addEventListener('click', function (e) {
        e.preventDefault();
        isRegister = !isRegister;
        if (isRegister) {
            usernameInput.style.display = 'block';
            nameRow.style.display = 'flex';
            authTitle.textContent = 'Register';
            submitBtn.textContent = 'Register';
            switchText.firstChild.textContent = 'Already have an account?';
            toggleLink.textContent = 'Login here';
        } else {
            usernameInput.style.display = 'none';
            nameRow.style.display = 'none';
            authTitle.textContent = 'Login';
            submitBtn.textContent = 'Login';
            switchText.firstChild.textContent = "Don't have an account?";
            toggleLink.textContent = 'Register here';
        }
    });

    document.getElementById('authForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const payload = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
        };
        if (isRegister) {
            payload.username = usernameInput.value;
            payload.firstName = firstName.value;
            payload.lastName = lastName.value;
        }

        submitBtn.textContent = isRegister ? 'Registering...' : 'Logging in...';
        setTimeout(() => {
            submitBtn.textContent = isRegister ? 'Register' : 'Login';
        }, 800);

        console.log('Submit payload:', payload);

        if(!isRegister){
            const resp = await (await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })).json();
            if(resp.status){
                window.location.href = '/profile';
            } else {
                perror.textContent = resp.message;
                perror.style.display = 'block';
            }
        } else {
            const resp = await (await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })).json();
            if(resp.status){
                perror.style.color = 'green';
                perror.textContent = "Registration successful! You can now log in.";
                perror.style.display = 'block';
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                perror.textContent = resp.message;
                perror.style.display = 'block';
            }
        }

    });
});