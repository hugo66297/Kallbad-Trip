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

                // Wire favorite button
                

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

                // Wire favorite button for fallback card and render reviews
                

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
        container.innerHTML = `<div class="card"><h3>Reviews</h3><p class="muted">Loading reviews...</p></div>`;
        try{
                    const res = await fetch(`/api/locations/${encodeURIComponent(siteId)}/reviews`);
                    const json = await res.json();
                    let reviews = json.data || [];

                    function renderReviewItems(arr){
                        return arr.map(r => ` <div class="review-item"><div class="meta">${r.rating ? 'Rating: '+r.rating+' · ' : ''}by user #${r.user_id || 'local'} · ${new Date(r.created_at).toLocaleDateString()}</div><div class="text">${r.review_text}</div></div>`).join('');
                    }

                    const html = [
                        `<div class="card">
                            <h3>Reviews</h3>
                            <form id="reviewForm" class="review-form">
                                <textarea name="review" placeholder="Write your review..."></textarea>
                                <br/>
                                <button type="submit">Submit review</button>
                                <div class="review-note">Reviews submitted here are saved locally.</div>
                            </form>`,
                        reviews.length === 0 ? `<p class="muted">No reviews yet.</p>` : ``,
                        `<div id="reviewList">` + renderReviewItems(reviews) + `</div>`,
                        `</div>`
                    ].join('\n');

                    container.innerHTML = html;

                    // Attach form handler to store reviews locally (no auth/post)
                    const form = document.getElementById('reviewForm');
                    const listDiv = document.getElementById('reviewList');
                    form.addEventListener('submit', (ev) => {
                        ev.preventDefault();
                        const txt = form.querySelector('textarea').value.trim();
                        if(!txt) return;
                        const newReview = {
                            user_id: 'you',
                            rating: null,
                            review_text: txt,
                            created_at: new Date().toISOString()
                        };
                        // prepend locally
                        reviews.unshift(newReview);
                        listDiv.innerHTML = renderReviewItems(reviews);
                        form.reset();
                    });
        }catch(err){
            container.innerHTML = `<div class="card"><h3>Reviews</h3><p class="muted">Unable to load reviews.</p></div>`;
            console.error('Error loading reviews', err);
        }
    }
    renderSite();
});