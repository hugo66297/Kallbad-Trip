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
    const headerBan = document.getElementById('headerBan');
    const headerAvatar = document.getElementById('headerAvatar');
    const butLogout = document.getElementById('butLogout');

    headerName.textContent = isLogged.username;
    headerRole.textContent = ((isLogged.role === 'admin') ? 'Administrator' : 'Traveler') + ' • ' + numberLocation + ' visited sites';
    headerBan.style.display = isLogged.is_active ? 'none' : 'block';
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
        const card = document.getElementById('manageUR');
        const reviewError = document.getElementById('reviewError');

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
                reviewError.textContent = 'Error: ' + ModifResp.message;
                reviewError.style.display = 'block';
            } else {
                fetchUsers();
                displayReviews(ModifResp.data);
            }
        };

        const cloneReview = document.getElementById('cloneReview');
        const reviewsList = document.querySelector('.reviews-list');
        reviewsList.innerHTML = '';
        if(userData.reviews.length === 0){
            reviewsList.innerHTML = '<p>No reviews</p>';
            return;
        }
        userData.reviews.forEach(r => {
            const emptyStar = `<svg width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`
            const fullStar = `<svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M11.2691 4.41115C11.5006 3.89177 11.6164 3.63208 11.7776 3.55211C11.9176 3.48263 12.082 3.48263 12.222 3.55211C12.3832 3.63208 12.499 3.89177 12.7305 4.41115L14.5745 8.54808C14.643 8.70162 14.6772 8.77839 14.7302 8.83718C14.777 8.8892 14.8343 8.93081 14.8982 8.95929C14.9705 8.99149 15.0541 9.00031 15.2213 9.01795L19.7256 9.49336C20.2911 9.55304 20.5738 9.58288 20.6997 9.71147C20.809 9.82316 20.8598 9.97956 20.837 10.1342C20.8108 10.3122 20.5996 10.5025 20.1772 10.8832L16.8125 13.9154C16.6877 14.0279 16.6252 14.0842 16.5857 14.1527C16.5507 14.2134 16.5288 14.2807 16.5215 14.3503C16.5132 14.429 16.5306 14.5112 16.5655 14.6757L17.5053 19.1064C17.6233 19.6627 17.6823 19.9408 17.5989 20.1002C17.5264 20.2388 17.3934 20.3354 17.2393 20.3615C17.0619 20.3915 16.8156 20.2495 16.323 19.9654L12.3995 17.7024C12.2539 17.6184 12.1811 17.5765 12.1037 17.56C12.0352 17.5455 11.9644 17.5455 11.8959 17.56C11.8185 17.5765 11.7457 17.6184 11.6001 17.7024L7.67662 19.9654C7.18404 20.2495 6.93775 20.3915 6.76034 20.3615C6.60623 20.3354 6.47319 20.2388 6.40075 20.1002C6.31736 19.9408 6.37635 19.6627 6.49434 19.1064L7.4341 14.6757C7.46898 14.5112 7.48642 14.429 7.47814 14.3503C7.47081 14.2807 7.44894 14.2134 7.41394 14.1527C7.37439 14.0842 7.31195 14.0279 7.18708 13.9154L3.82246 10.8832C3.40005 10.5025 3.18884 10.3122 3.16258 10.1342C3.13978 9.97956 3.19059 9.82316 3.29993 9.71147C3.42581 9.58288 3.70856 9.55304 4.27406 9.49336L8.77835 9.01795C8.94553 9.00031 9.02911 8.99149 9.10139 8.95929C9.16534 8.93081 9.2226 8.8892 9.26946 8.83718C9.32241 8.77839 9.35663 8.70162 9.42508 8.54808L11.2691 4.41115Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="yellow"/></svg>`;
            const clone = cloneReview.cloneNode(true);
            clone.classList.add('onereview');
            let starsHTML = '';
            for(let i=0; i<r.rating; i++){
                starsHTML += fullStar;
            }
            for(let i=r.rating; i<5; i++){
                starsHTML += emptyStar;
            }
            clone.querySelector('.review-rating').innerHTML = starsHTML;

            clone.querySelector('.review-comment').textContent = r.review_text;
            clone.querySelector('.review-actions').innerHTML = `
            <button id="editRBtn" class="btn ghost editRBtn" title="Edit">
                <!-- eye icon -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.2"/>
                </svg>
            </button>
            <button id="deleteRBtn" class="btn ghost deleteRBtn" title="Delete">
                <!-- trash icon -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M3 6h18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>`;

            const editRBtn = clone.querySelector('.editRBtn');
            const deleteRBtn = clone.querySelector('.deleteRBtn');
            editRBtn.addEventListener('click', () => {
                editComment(r, userData);
            });
            deleteRBtn.addEventListener('click', async () => {
                const confirmDelete = confirm("Are you sure you want to delete this review? This action is irreversible.");
                if (confirmDelete) {
                    const delResp = await (await fetch('/api/review/' + encodeURIComponent(r.id), {
                        method: 'DELETE'
                    })).json();
                    if (!delResp.status) {
                        reviewError.textContent = 'Error: ' + delResp.message;
                        reviewError.style.display = 'block';
                    } else {
                        updateData(userData.user.id);

                    }
                }
            });

            reviewsList.appendChild(clone);
        });
    }
    function editComment(review, userData){
        const editReviewPopup = document.getElementById('editAdminReview');
        editReviewPopup.style.display = 'block';

        const ratingInput = document.getElementById('currentRating');
        const commentInput = document.getElementById('currentComment');

        const butCancel = document.getElementById('butCancelChangeReview');
        const butSubmit = document.getElementById('butSubmitChangeReview');

        const reviewError = document.getElementById('reviewChangeError');

        ratingInput.value = review.rating;
        commentInput.value = review.review_text;

        editReviewPopup.addEventListener('click', (e) => {
            if (e.target === editReviewPopup) {
                editReviewPopup.style.display = 'none';
            }
        });
        butCancel.onclick = () => {
            editReviewPopup.style.display = 'none';
        };
        
        butSubmit.onclick = async () => {
            const newRating = ratingInput.value;
            const newComment = commentInput.value;
            const editRevResp = await (await fetch('/api/review/' + encodeURIComponent(review.id), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    rating: newRating,
                    review_text: newComment
                })
            })).json();
            if (!editRevResp.status) {
                reviewError.textContent = editRevResp.message;
                reviewError.style.display = 'block';
            } else {
                editReviewPopup.style.display = 'none';
                updateData(userData.user.id);
                
            }
        };
    }
    async function updateData(id){
        const reviewError = document.getElementById('reviewChangeError');
        const usrRes = await (await fetch('/api/manage/user/' + encodeURIComponent(id), { method: 'GET' })).json();
        if(!usrRes.status){
            reviewError.textContent = usrRes.message;
            reviewError.style.display = 'block';
        } else {
            displayReviews(usrRes.data);
        }
    }
});