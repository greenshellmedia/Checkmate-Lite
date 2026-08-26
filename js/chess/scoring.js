/* Deterministic, browser-only game assessment. No rating claim is made here. */
(function (root, factory) {
    const api = factory();
    root.LiteScoring = api;
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    'use strict';

    const BAD = new Set(['Miss', 'Mistake', 'Blunder']);
    const POSITIVE = new Set(['Great', 'Best', 'Excellent', 'Good']);

    function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

    function phaseExplanation(segment) {
        if (!segment || !segment.reached) return 'This phase was not reached, so it is excluded.';
        const n = segment.ratedN || segment.total || 0;
        if (!n) return 'Too few meaningful moves to rate this phase.';
        const bad = (segment.counts?.Blunder || 0) + (segment.counts?.Mistake || 0) + (segment.counts?.Miss || 0);
        const good = (segment.counts?.Great || 0) + (segment.counts?.Best || 0) +
            (segment.counts?.Excellent || 0) + (segment.counts?.Good || 0);
        if (bad) return `${bad} costly decision${bad === 1 ? '' : 's'} held this phase back across ${n} meaningful moves.`;
        if (good >= Math.max(2, Math.ceil(n * 0.65))) return `Mostly sound choices across ${n} meaningful moves, with no major error detected.`;
        return `A mixed but stable phase across ${n} meaningful moves; shallow engine margins may move this score.`;
    }

    function overallStars(segments) {
        const reached = Object.values(segments || {}).filter(s => s?.reached && s.stars != null);
        if (!reached.length) return null;
        const weight = s => Math.max(1, s.ratedN || s.total || 1);
        const value = reached.reduce((sum, s) => sum + s.stars * weight(s), 0) /
            reached.reduce((sum, s) => sum + weight(s), 0);
        return clamp(Math.round(value), 1, 5);
    }

    function estimateLevel(stats, segments, context) {
        const n = stats?.ratedN || 0;
        if (!n || stats.accuracy == null) {
            return { value: null, confidence: 'Low', explanation: 'Not enough non-book moves for a useful estimate.' };
        }
        const counts = stats.counts || {};
        const accuracy = clamp(Number(stats.accuracy) || 0, 0, 100);
        const cpl = stats.avgCpl == null ? 120 : clamp(Number(stats.avgCpl) || 0, 0, 500);
        const positiveRate = Array.from(POSITIVE).reduce((s, k) => s + (counts[k] || 0), 0) / n;
        const errorWeight = ((counts.Blunder || 0) * 1.25 + (counts.Mistake || 0) * 0.72 + (counts.Miss || 0) * 0.42) / n;
        const phase = overallStars(segments);
        const tacticalErrors = (stats.moves || []).filter(m =>
            BAD.has(m.classification?.label) && (m.materialEvent?.kind === 'hang' || (m.moveThemes || []).some(t => /fork|pin|mate|hang/.test(t)))
        ).length;

        // Conservative blend: accuracy leads, CPL and concrete error severity stop short clean games inflating it.
        let value = 350 + accuracy * 15.2 - cpl * 1.35 + (positiveRate - 0.55) * 260 - errorWeight * 520;
        if (phase != null) value += (phase - 3) * 75;
        value -= tacticalErrors * 35;
        const opponent = Number(context?.opponentRating);
        if (Number.isFinite(opponent) && opponent > 0) value += clamp((opponent - 1200) * 0.08, -60, 80);
        value = Math.round(clamp(value, 400, 2250) / 25) * 25;

        const ratedMoves = (stats.moves || []).filter(m => !['Book', 'Theory'].includes(m.classification?.label));
        const reliableN = ratedMoves.filter(m => m.engineReliable !== false).length;
        const reliableRate = ratedMoves.length ? reliableN / ratedMoves.length : 0;
        const confidence = n >= 18 && reliableRate >= 0.8 ? 'High' : n >= 9 && reliableRate >= 0.6 ? 'Medium' : 'Low';
        const caveat = n < 9 ? 'The sample is short' : n < 18 ? 'The sample is moderate' : 'The sample is reasonably broad';
        return {
            value,
            confidence,
            explanation: `${caveat}: ${n} meaningful moves, ${accuracy.toFixed(1)}% estimated accuracy and ${Math.round(cpl)} average CPL. This is a game-level signal, not a player rating.`
        };
    }

    function buildSideAssessment(stats, phaseBreakdown, context = {}) {
        const segments = phaseBreakdown?.segments || {};
        const phases = {};
        for (const key of ['opening', 'middlegame', 'endgame']) {
            const segment = segments[key] || { reached: false, stars: null };
            phases[key] = { ...segment, explanation: phaseExplanation(segment) };
        }
        const stars = overallStars(phases);
        return {
            phases,
            overall: {
                stars,
                explanation: stars == null
                    ? 'Not enough meaningful play to calculate an overall phase rating.'
                    : 'Weighted from reached phases only; longer phases count more.'
            },
            level: estimateLevel(stats, phases, context)
        };
    }

    function normalizeMissedMateClassification(classification, missedMate) {
        if (!missedMate || !classification || !POSITIVE.has(classification.label)) return classification;
        return { label: 'Miss', class: 'cls-miss', desc: 'Missed a forced mate found by the local engine.' };
    }

    return { buildSideAssessment, estimateLevel, overallStars, phaseExplanation, normalizeMissedMateClassification };
});
