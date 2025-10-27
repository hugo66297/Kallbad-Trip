document.addEventListener('DOMContentLoaded', async() => {

    //Vérification de l'utilisateur
    const isLogged = (await (await fetch("/api/checkAuth")).json()).data;
    if(!isLogged){
        window.location.href = "/login";
    }

    const adminOptions = document.querySelectorAll('.adminOpt');
    if(isLogged.role === 'admin'){
        adminOptions.forEach(opt => {
            opt.style.display = 'block';
        });
    }

    const cardOverview = document.querySelector(".overview");
    const cardManageUsers = document.querySelector(".manageusers");

    cardOverview.style.display = 'grid';
    cardManageUsers.style.display = 'none';

    document.querySelectorAll('.menu a').forEach(a=>{
        a.addEventListener('click', e=>{
            document.querySelectorAll('.menu a').forEach(x=>x.classList.remove('active'));
            a.classList.add('active');

            if (a.getAttribute('href') === '#overview') {
                cardOverview.style.display = 'grid';
                cardManageUsers.style.display = 'none';
            } else if (a.getAttribute('href') === '#settings') {
                cardOverview.style.display = 'none';
                cardManageUsers.style.display = 'block';
                fetchUsers();
            }
        });
    });
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

    // MANAGE USERS

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

        const nPseudo = fieldusername.value;
        const nEmail = fieldemail.value;
        // si le champ est vide, on envoie null pour le remettre à null en base de données
        const nFirstname = (fieldfirstname.value == "") ? null : fieldfirstname.value;
        const nLastname = (fieldlastname.value == "") ? null : fieldlastname.value;
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
    
    // MANAGE USERS ADMIN

    const tbody = document.querySelector('#usersTable tbody');
    const errEl = document.getElementById('usersError');

    async function fetchUsers(){
        errEl.textContent = '';
        tbody.innerHTML = '<tr><td colspan="6" style="padding:12px">Loading…</td></tr>';
        const res = await (await fetch('/api/manage/user')).json();
        if(res.status){
            renderUsers(res.data);
        } else {
            errEl.textContent = res.message;
            errEl.style.display = 'block';
        }
        
    }

    function renderUsers(users){
        tbody.innerHTML = '';
        if(!Array.isArray(users) || users.length === 0){
            tbody.innerHTML = '<tr><td colspan="6" style="padding:12px">No users</td></tr>';
            return;
        }

        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.id}</td>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${(u.role === 'admin') ? 'Administrator' : 'Traveler'}</td>
                <td>${u.is_active ? 'Yes' : 'Banned'}</td>
                <td>
                    <button id="detailsBtn" class="btn ghost detailsBtn" data-id="${u.id}" title="details">
                        <!-- eye icon -->
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
                        </svg>
                    </button>
                    <button id="deleteBtn" class="btn ghost deleteBtn" data-id="${u.id}" title="Delete">
                        <!-- trash icon -->
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M3 6h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        tbody.querySelectorAll('.deleteBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if(!confirm('Delete user #' + id + ' ?')) return;
                const delres = await (await fetch('/api/manage/user/' + encodeURIComponent(id), { method: 'DELETE' })).json();
                if(!delres.status){
                    errEl.textContent = delres.message;
                    errEl.style.display = 'block';
                } else {
                    fetchUsers();
                }
            });
        });

        tbody.querySelectorAll('.detailsBtn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const userRes = await (await fetch('/api/manage/user/' + encodeURIComponent(id), { method: 'GET' })).json();
                if(!userRes.status){
                    errEl.textContent = userRes.message;
                    errEl.style.display = 'block';
                } else {
                    displayReviews(userRes.data);
                }
            });
        });
    }
    async function displayReviews(userData){
        const card = document.getElementById('manageUR');;
        card.style.display = 'block';
        const titlecard = document.getElementById('titlecard');

        titlecard.textContent = `Manage user #${userData.user.id} : ${userData.user.username}`;

        const toggleAdmin = document.getElementById('toggleAdmin');
        const toggleActive = document.getElementById('toggleActive');
        const butStatusChange = document.getElementById('usrStatusChange');

        userData.user.role === 'admin' ? toggleAdmin.checked = true : toggleAdmin.checked = false;
        userData.user.is_active ? toggleActive.checked = false : toggleActive.checked = true;

        butStatusChange.onclick = async () => {
            const newRole = toggleAdmin.checked ? 'admin' : 'user';
            const newActive = !toggleActive.checked;
            const ModifResp = await (await fetch('/api/manage/user/' + encodeURIComponent(userData.user.id),{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    role: newRole,
                    is_active: newActive
                })
            })).json();

            if(!ModifResp.status){
                alert('Error: ' + ModifResp.message);
            } else {
                fetchUsers();
                displayReviews(ModifResp.data);
            }
        };
    }
});