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


});