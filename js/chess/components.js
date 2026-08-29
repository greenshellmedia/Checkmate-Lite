/* chess/components.js — small HTML helpers for Lite (cards, empty states, tags). */

const CmUi = (() => {
    function esc(s) {
        return String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escAttr(s) {
        return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    function card({ title, body, tone, extraClass, kicker, note }) {
        const toneAttr = tone ? ` data-tone="${esc(tone)}"` : '';
        return `
            <div class="p-card cm-card ${extraClass || ''}"${toneAttr}>
                <div class="p-card-body">
                    ${kicker ? `<div class="cm-card-kicker">${kicker}</div>` : ''}
                    ${title ? `<div class="p-card-title mb-1">${title}</div>` : ''}
                    ${body || ''}
                    ${note ? `<p class="cm-stat-note">${note}</p>` : ''}
                </div>
            </div>
        `;
    }

    function emptyState({ variant, icon, title, body, actions }) {
        if (variant === 'hint') {
            return `<p class="tab-empty-hint">${body || ''}</p>`;
        }
        const start = (actions || []).map(a => `
            <button type="button" class="cm-start-card" onclick="${a.onclick}">
                <span class="cm-start-icon" aria-hidden="true"><i class="pi ${esc(a.icon)}"></i></span>
                <span>
                    <strong>${esc(a.title)}</strong>
                    <p>${a.body || ''}</p>
                </span>
            </button>
        `).join('');
        const iconHtml = icon
            ? `<div class="tab-empty-icon"><i class="pi ${esc(icon)}"></i></div>`
            : '';
        return `
            ${iconHtml}
            ${title ? `<div class="tab-empty-title">${title}</div>` : ''}
            ${body ? `<div class="tab-empty-body">${body}</div>` : ''}
            ${start ? `<div class="cm-start-grid">${start}</div>` : ''}
        `;
    }

    function resultBadge(result) {
        const kind = result === 'WIN' ? 'is-win' : result === 'DRAW' ? 'is-draw' : 'is-loss';
        const label = result === 'WIN' ? 'Win' : result === 'DRAW' ? 'Draw' : 'Loss';
        return `<span class="cm-result-badge ${kind}">${label}</span>`;
    }

    function stars(stars) {
        if (stars == null) {
            return `<span class="phase-stars na" title="Not applicable">N/A</span>`;
        }
        const full = Math.max(0, Math.min(5, stars));
        let html = `<span class="phase-stars" aria-label="${full} out of 5 stars">`;
        for (let i = 1; i <= 5; i++) {
            html += `<i class="pi ${i <= full ? 'pi-star-fill' : 'pi-star'}"></i>`;
        }
        html += `<span class="phase-stars-num">${full}/5</span></span>`;
        return html;
    }

    function phaseScores(breakdown) {
        if (!breakdown?.segments) return '';
        const labels = { opening: 'Opening', middlegame: 'Middlegame', endgame: 'Endgame' };
        return `<div class="cm-game-phases">${['opening', 'middlegame', 'endgame'].map(key => {
            const seg = breakdown.segments[key];
            const reached = !!seg?.reached;
            return `<div class="cm-game-phase"><span>${labels[key]}</span>${stars(reached ? seg.stars : null)}</div>`;
        }).join('')}</div>`;
    }

    function moveTag(classification) {
        if (!classification?.label) return '';
        const cls = classification.class || classification.className || '';
        return `<span class="move-label ${esc(cls)}">${esc(classification.label)}</span>`;
    }

    function metricCard({ kicker, value, label, meta, note, tone }) {
        const toneAttr = tone ? ` data-tone="${esc(tone)}"` : '';
        return `
            <div class="cm-metric-card"${toneAttr}>
                ${kicker ? `<div class="cm-metric-kicker">${kicker}</div>` : ''}
                <div class="cm-metric-value">${value ?? '–'}</div>
                ${label ? `<div class="cm-metric-label">${label}</div>` : ''}
                ${meta ? `<div class="cm-metric-meta">${meta}</div>` : ''}
                ${note ? `<p class="cm-stat-note">${note}</p>` : ''}
            </div>
        `;
    }

    function coachMessage({ kicker, body, extraClass }) {
        return `
            <div class="coach-block cm-coach-msg ${extraClass || ''}">
                ${kicker ? `<div class="coach-kicker">${kicker}</div>` : ''}
                ${body || ''}
            </div>
        `;
    }

    function miniGameRow({ title, result, color, reason, gameKey }) {
        return `
            <div class="p-card p-component cm-game-card mb-2" onclick="openReviewFromStore('${escAttr(gameKey)}')">
                <div class="p-card-body mini-game-row py-2">
                    ${resultBadge(result)}
                    <div class="mini-color">${esc(color)}</div>
                    <div class="mini-body">
                        <div class="mini-opp">${title}</div>
                        <div class="mini-reason">${reason || ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        esc,
        escAttr,
        card,
        emptyState,
        resultBadge,
        stars,
        phaseScores,
        moveTag,
        metricCard,
        coachMessage,
        miniGameRow
    };
})();
