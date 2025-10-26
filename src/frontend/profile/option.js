document.addEventListener('DOMContentLoaded', async() => {

    //Vérification de l'utilisateur
    const isLogged = (await (await fetch("/api/checkAuth")).json()).data;
    if(!isLogged){
        window.location.href = "/login";
    }

    const cardOverview = document.querySelector(".overview");
    const cardManageUsers = document.querySelector(".manageusers");
    const cardManageReviews = document.querySelector(".managereviews");

    cardOverview.style.display = 'grid';
    cardManageUsers.style.display = 'none';
    cardManageReviews.style.display = 'none';

    document.querySelectorAll('.menu a').forEach(a=>{
        a.addEventListener('click', e=>{
            document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
            a.classList.add('active');

            if (a.getAttribute('href') === '#overview') {
                cardOverview.style.display = 'grid';
                cardManageUsers.style.display = 'none';
                cardManageReviews.style.display = 'none';
            } else if (a.getAttribute('href') === '#settings') {
                cardOverview.style.display = 'none';
                cardManageUsers.style.display = 'block';
                cardManageReviews.style.display = 'none';
            } else if (a.getAttribute('href') === '#security') {
                cardOverview.style.display = 'none';
                cardManageUsers.style.display = 'none';
                cardManageReviews.style.display = 'block';
            } 
        });
    });


    console.log(isLogged);
    const numberLocation = (await (await fetch("/api/user/location")).json()).data.length;

    const headerName = document.getElementById('headerName');
    const headerRole = document.getElementById('headerRole');
    const headerAvatar = document.getElementById('headerAvatar');
    const butLogout = document.getElementById('butLogout');

    headerName.textContent = isLogged.username;
    headerRole.textContent = ((isLogged.role === 'admin') ? 'Administrator' : 'Traveler') + ' • ' + numberLocation + ' visited sites';
    headerAvatar.textContent = (isLogged.first_name != null && isLogged.last_name != null) ? (isLogged.first_name.charAt(0) + isLogged.last_name.charAt(0)).toUpperCase() : (isLogged.username.charAt(0) + isLogged.username.charAt(1)).toUpperCase();

    butLogout.addEventListener('click', async () => {
        await fetch("/api/logout", { method: "GET" });
        window.location.href = "/";
    });

    const fieldusername = document.getElementById('username');
    const fieldemail = document.getElementById('email');
    const fieldfirstname = document.getElementById('firstname');
    const fieldlastname = document.getElementById('lastname');
    const butChangeInfo = document.getElementById('butChangeInfo');
    const perror = document.getElementById('profileError');

    fieldusername.value = isLogged.username;
    fieldemail.value = isLogged.email;
    fieldfirstname.value = isLogged.first_name;
    fieldlastname.value = isLogged.last_name;

    butChangeInfo.addEventListener('click', async () => {
        // pseudo, email, password, firstname, lastname
        const nPseudo = fieldusername.value;
        const nEmail = fieldemail.value;
        const nFirstname = fieldfirstname.value;
        const nLastname = fieldlastname.value;
        const resp = await (await fetch('/api/changeInfo', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                pseudo: nPseudo,
                email: nEmail,
                firstname: nFirstname,
                lastname: nLastname
            })
        })).json();
        console.log(resp);
        if(resp.status){
            window.location.reload();
        } else {
            perror.textContent = resp.message;
            perror.style.display = 'block';
        }
    });

    const butChangePassword = document.getElementById('butChangePswd');
    const changepswdPopup = document.getElementById('changePswdPopup');
    const butDeleteAccount = document.getElementById('butDelAccount');

    butChangePassword.addEventListener('click', async () => {
        changepswdPopup.style.display = 'block';
        
        const oldpswd = document.getElementById('currentPswd');
        const newpswd = document.getElementById('newPswd');
        const confirmpswd = document.getElementById('confirmNewPswd');

        const butcancel = document.getElementById('butCancelChangePswd');
        const butConfirm = document.getElementById('butSubmitChangePswd');
        const popuperror = document.getElementById('pswdChangeError');

        //if click outside the popup, close it
        changepswdPopup.addEventListener('click', (e) => {
            if (e.target === changepswdPopup) {
                changepswdPopup.style.display = 'none';
            }
        });
        butcancel.addEventListener('click', () => {
            changepswdPopup.style.display = 'none';
        });
        butConfirm.addEventListener('click', async () => {
            if(newpswd.value !== confirmpswd.value){
                popuperror.textContent = "Les nouveaux mots de passe ne correspondent pas.";
                popuperror.style.display = 'block';
            } else {
                const logresp = await (await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: isLogged.email,
                        password: oldpswd.value})
                })).json();
                if(logresp.status){
                    const changeResp = await (await fetch('/api/changeInfo', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            password: newpswd.value
                        })
                    })).json();
                    if(changeResp.status){
                        window.location.reload();
                    }
                    else {
                        popuperror.textContent = changeResp.message;
                        popuperror.style.display = 'block';
                    }
                } else {
                    popuperror.textContent = logresp.message;
                    popuperror.style.display = 'block';
                }
            }
        })
        
    });
    butChangePassword.addEventListener('click', () => {});
    butDeleteAccount.addEventListener('click', async() => {
        const confirmDelete = confirm("Are you sure you want to delete your account? This action is irreversible.");
        if(confirmDelete){
            const resp = await (await fetch('/api/changeInfo', {
                method: 'DELETE'
            })).json();
            if(resp.status){
                window.location.href = "/";
            }
            else {
                perror.textContent = resp.message;
                perror.style.display = 'block';
            }
        }

    });
    

});