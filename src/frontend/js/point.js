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

    async function renderSite() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const statusEl = document.getElementById('status');
        const infoEl = document.getElementById('siteInfo');

        if (!id) {
            statusEl.textContent = 'No site selected. Return to the map and click "View details" on a marker.';
            return;
        }

        try {
            statusEl.textContent = 'Fetching site information...';

            // Fetch profile only — results/monitoring call removed because it is unreliable
            const profileRes = await fetch(`/api/bathing-waters/${encodeURIComponent(id)}/profile`).catch(e => ({ ok:false, json: async ()=> ({ success:false, error: e }) }));
            const profileJson = profileRes && profileRes.ok ? await profileRes.json() : { success: false };

            // If profile succeeded
            if (profileJson && profileJson.success) {
                const site = profileJson.data;
                statusEl.textContent = '';
                infoEl.innerHTML = `
                    <div class="card">
                        <div class="fav-container">
                            <h2>${site.name || '—'}</h2>
                            <button id="favBtn" class="fav-button">Add to favorites</button>
                        </div>
                        <p class="muted"><strong>ID:</strong> ${site.id || '—'}</p>
                        <p><strong>Description:</strong> ${site.description || 'No description available.'}</p>
                        <p><strong>Summary:</strong> ${site.summary || '—'}</p>
                        <p><strong>Water type:</strong> ${site.waterType?.name || '—'}</p>
                        <p><strong>Coordinates:</strong> ${site.coordinates?.latitude || '—'}, ${site.coordinates?.longitude || '—'}</p>
                        <h3>Bathing season</h3>
                        <p>${site.bathingSeason ? `${site.bathingSeason.startDate || ''} → ${site.bathingSeason.endDate || ''} (${site.bathingSeason.isActive ? 'active' : 'inactive'})` : 'Information not available'}</p>
                        <h3>Pollution sources</h3>
                        <p>${(site.pollutionSources && site.pollutionSources.length) ? site.pollutionSources.join(', ') : 'No information'}</p>
                        <h3>Administrative authority</h3>
                        <p>${site.administrativeAuthority?.contactInfo?.name || '—'}</p>
                        <p>${site.administrativeAuthority?.contactInfo?.email ? `<a href="mailto:${site.administrativeAuthority.contactInfo.email}">${site.administrativeAuthority.contactInfo.email}</a>` : ''}</p>
                    </div>
                `;

                // favorite button
                const favBtn = document.getElementById('favBtn');
                const favresp = await (await fetch('/api/user/location', {
                    method: 'GET'
                })).json();
                if(favresp.status){
                    if(favresp.data.some(loc => loc.site_api_id === id)){
                        favBtn.textContent = 'Remove from favorites';
                        favBtn.style.backgroundColor = '#a30b0b';
                    } else {
                        favBtn.textContent = 'Add to favorites';
                        favBtn.style.backgroundColor = '#0b69a3';
                    }
                }
                favBtn.addEventListener('click', async () => {
                    if (!isLogged){
                        window.location.href = '/login';
                    } else {
                        if(favBtn.textContent === 'Add to favorites'){
                            const addFav = await (await fetch('/api/user/location/' + encodeURIComponent(id), {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })).json();
                            if(addFav.status){
                                favBtn.textContent = 'Remove from favorites';
                                favBtn.style.backgroundColor = '#a30b0b';
                            }
                        } else {
                            const remFav = await (await fetch('/api/user/location/' + encodeURIComponent(id), {
                                method: 'DELETE',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            })).json();
                            if(remFav.status){
                                favBtn.textContent = 'Add to favorites';
                                favBtn.style.backgroundColor = '#0b69a3';
                            }
                        }
                    }
                });

                // Add review button
                const leaveReviewBtn = document.getElementById('submitReviewBtn');
                leaveReviewBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (!isLogged){
                        window.location.href = '/login';
                        return;
                    }
                    const ratingInput = document.getElementById('reviewRating');
                    const reviewInput = document.getElementById('reviewComment');
                    const rating = parseInt(ratingInput.value);
                    const comment = reviewInput.value.trim();

                    const addrevResp = await (await fetch('/api/locations/' + encodeURIComponent(id) + '/reviews', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            rating: rating,
                            review_text: comment
                        })
                    })).json();

                    if(addrevResp.status){
                        // Clear the form
                        ratingInput.value = '';
                        reviewInput.value = '';
                        // Reload reviews
                        renderReviews(id);
                    } else {
                        alert('Failed to submit review: ' + (addrevResp.error || 'Unknown error'));
                    }
                });

                // Load reviews for this site
                renderReviews(id);
                return;
            }

            // If profile failed, try to fallback to the map listing for basic info
            console.warn('Profile endpoint failed or returned no data:', profileJson);
            statusEl.textContent = 'Detailed profile unavailable — trying to fetch basic information...';

            const listRes = await fetch('/api/bathing-waters?limit=5000&page=1');
            const listJson = await listRes.json();
            const found = (listJson.data || []).find(s => s.id === id);

            if (found) {
                statusEl.textContent = '';
                infoEl.innerHTML = `
                    <div class="card">
                        <div class="fav-container">
                            <h2>${found.name || '—'}</h2>
                            <button id="favBtn" class="fav-button">Add to favorites</button>
                        </div>
                        <p class="muted"><strong>ID:</strong> ${found.id || '—'}</p>
                        <p><strong>Coordinates:</strong> ${found.coordinates?.latitude || '—'}, ${found.coordinates?.longitude || '—'}</p>
                        <p>Detailed profile is not available for this site, but here are the basic data from the listing.</p>
                    </div>
                `;
                // After rendering basic info, also render reviews section placeholder
                renderReviews(id);
                return;
            }

            statusEl.textContent = 'Unable to retrieve site information.';
            console.error('Profile fetch result:', profileJson);

        } catch (err) {
            statusEl.textContent = 'Error fetching data.';
            console.error(err);
        }
    };

    // Fetch and render reviews for a site
    async function renderReviews(siteId){
        const container = document.getElementById('reviewsContainer');
        const cloneReview = document.getElementById('reviewTemplate');
        const reviewsList = document.getElementById('reviewList');

        const revres = await (await fetch(`/api/locations/${encodeURIComponent(siteId)}/reviews`,{method: 'GET'})).json();
        if(revres.status){
            if(revres.data.length === 0){
                container.innerHTML = `<div class="card"><h3>Reviews</h3><p class="muted">No reviews yet.</p></div>`;
                return; 
            }
            reviewsList.innerHTML = '';
            revres.data.forEach(r => {
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
                clone.querySelector('.review-date').innerHTML = `by <strong>${r.username}</strong> · ${new Date(r.created_at).toLocaleDateString()}`;
                

                reviewsList.appendChild(clone);
            });
        } else {
            container.innerHTML = `<div class=s"card"><h3>Reviews</h3><p class="muted">Unable to load reviews.</p></div>`;
            return;
        }
    }
    renderSite();
});