"""
Bid & Historical Pattern Analyzer — Procurement Integrity Engine V2
===================================================================
Analyzes bid pricing patterns, historical winner concentration, repeated
cohort participation, potential bid rotation, bid-to-estimate anomalies,
cover/losing-bid patterns, narrow competition, BOQ anomalies, and officer associations.

Guarantees:
- Purely deterministic calculations using transparent configurable thresholds.
- Insufficient historical records gracefully yield zero false-positive signals.
- Transparent, non-punitive explanatory language conforming to GeM & GFR 2017 principles.
- No legal accusations ("fraud", "collusion", "corruption"). All findings are review triggers.
"""
import hashlib
import statistics
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple

from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    RuleReference,
    SignalType,
)
from app.services.integrity.feature_extractor import normalize_entity_name


# ============================================================
# CONFIGURABLE THRESHOLDS & STATUTORY CONSTANTS
# ============================================================

PRICE_SIMILARITY_THRESHOLD_PCT = 1.0  # 1.0% delta threshold
MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION = 4
WINNER_CONCENTRATION_THRESHOLD_RATIO = 0.75  # 75% or higher win rate
MIN_CO_PARTICIPATIONS = 3
MIN_TENDERS_FOR_ROTATION = 4
BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT = 0.5  # Bids within 0.5% of estimated tender value
NARROW_COMPETITION_MAX_BIDDERS = 2
OFFICER_ASSOCIATION_MIN_TENDERS = 3
OFFICER_ASSOCIATION_THRESHOLD_RATIO = 0.75


def _get_valid_quote(bidder: BidderFeature) -> Optional[float]:
    """
    Return the bidder's quote_amount as a float only if it is a valid positive numeric value.
    Returns None for missing or non-positive quotes.
    """
    q = bidder.quote_amount
    if q is not None and q > 0:
        return float(q)
    return None


# ============================================================
# A. BID PRICE CLUSTERING
# ============================================================

def analyze_bid_price_similarity(
    bidders: List[BidderFeature],
    tender_id: str,
    estimated_value: Optional[float] = None,
    historical_tenders: Optional[List[Dict[str, Any]]] = None,
) -> List[IntegrityFinding]:
    """
    Detect suspiciously close bid prices among participating vendors.
    
    Trigger: When two or more bidders submit quotes within a narrow price threshold (<= 1.0% delta),
    warranting verification of independent costing methodology.
    
    Enhancements:
    - Computes cluster size relative to total bidders.
    - Evaluates relationship between clustered bids and estimated tender value.
    - Factors in whether this cohort has previously exhibited price clustering.
    """
    quoted_pairs: List[Tuple[BidderFeature, float]] = []
    for b in bidders:
        price = _get_valid_quote(b)
        if price is not None:
            quoted_pairs.append((b, price))

    if len(quoted_pairs) < 2:
        return []

    quoted_pairs.sort(key=lambda pair: pair[1])

    clusters: List[List[Tuple[BidderFeature, float]]] = []
    current_cluster: List[Tuple[BidderFeature, float]] = [quoted_pairs[0]]

    for i in range(len(quoted_pairs) - 1):
        _, p1 = quoted_pairs[i]
        _, p2 = quoted_pairs[i + 1]

        delta = abs(p2 - p1)
        base = min(p1, p2)
        pct_diff = (delta / base) * 100.0 if base > 0 else 0.0

        if pct_diff <= PRICE_SIMILARITY_THRESHOLD_PCT:
            current_cluster.append(quoted_pairs[i + 1])
        else:
            if len(current_cluster) >= 2:
                clusters.append(current_cluster)
            current_cluster = [quoted_pairs[i + 1]]

    if len(current_cluster) >= 2:
        clusters.append(current_cluster)

    findings: List[IntegrityFinding] = []
    total_quoted = len(quoted_pairs)

    for cluster in clusters:
        evidences: List[IntegrityEvidence] = []
        cluster_prices: List[float] = [price for (_, price) in cluster]
        min_p: float = min(cluster_prices)
        max_p: float = max(cluster_prices)
        spread_pct: float = ((max_p - min_p) / min_p) * 100.0 if min_p > 0 else 0.0
        cluster_ratio = len(cluster) / total_quoted if total_quoted > 0 else 0.0

        for (b, price) in cluster:
            formatted_price = f"₹{price:,.2f}"
            evidences.append(
                IntegrityEvidence(
                    source_type="BID_SUBMISSION",
                    source_id=b.bidder_id,
                    field="quote_amount",
                    value=price,
                    description=f"Submitted financial quote: {formatted_price} by '{b.legal_name}'.",
                    metadata={"bidder_id": b.bidder_id, "amount": price}
                )
            )

        cluster_meta = {}
        est_context = ""
        if estimated_value and estimated_value > 0:
            avg_cluster_p = statistics.mean(cluster_prices)
            cluster_est_ratio = (avg_cluster_p / estimated_value) * 100.0
            est_context = f" Cluster averages {cluster_est_ratio:.2f}% of the official departmental estimate (₹{estimated_value:,.2f})."
            cluster_meta = {"estimated_value": estimated_value, "cluster_est_ratio": round(cluster_est_ratio, 2)}

        # Base impact & severity calibration
        severity = RiskLevel.MEDIUM
        base_impact = 20.0

        price_hash = hashlib.md5(f"{tender_id}:cluster:{min_p}".encode()).hexdigest()[:8].upper()
        finding_id = f"INT-PRICE-{price_hash}"
        names_str = ", ".join([b.legal_name for (b, _) in cluster])

        finding = IntegrityFinding(
            id=finding_id,
            tender_id=tender_id,
            bidder_id=None,
            related_bidder_ids=[b.bidder_id for (b, _) in cluster],
            signal_type=SignalType.BID_PRICE_ANOMALY,
            severity=severity,
            score_impact=base_impact,
            confidence=0.85,
            title=f"Close Bid Price Clustering ({len(cluster)} Bidders within {spread_pct:.2f}%)",
            reason=(
                f"{len(cluster)} out of {total_quoted} participating bidders ({names_str}) submitted financial quotes "
                f"with an unusually narrow price spread ({spread_pct:.2f}% maximum delta across bids).{est_context} "
                f"While tight margins can occur in highly standardized commodity supplies, such proximity warrants "
                f"independent cost verification under General Financial Rules (GFR 2017) Rule 173."
            ),
            evidence=evidences,
            rule_reference=RuleReference(
                clause_id="GFR-2017-R173",
                title="Transparency, Competition and Fairness in Public Procurement",
                description="Rule 173 mandates open, transparent, and fair competition. Narrow clustering warrants verification of independent cost computation.",
                applicability="Financial bid evaluation in multi-bidder procurement"
            ),
            recommended_action=(
                "Request itemized bill of quantities (BOQ) and rate break-ups from all clustered bidders "
                "to confirm that material, labor, and overhead estimations were derived independently."
            ),
            status=FindingStatus.OPEN,
        )
        findings.append(finding)

    return findings


# ============================================================
# B. WINNER CONCENTRATION
# ============================================================

def analyze_winner_concentration(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str,
    category: Optional[str] = None,
) -> List[IntegrityFinding]:
    """
    Detect disproportionate historical award concentration for any current participant.
    
    Trigger: When a participating vendor has won >= 75% of historical tenders (min 4 tenders).
    Avoids treating legitimate market dominance as corruption by framing the finding
    as an open-competition screening indicator.
    """
    if len(historical_tenders) < MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION:
        return []

    total_awards = 0
    cat_awards = 0
    vendor_wins: Dict[str, int] = {}
    vendor_cat_wins: Dict[str, int] = {}
    evaluated_dates: List[str] = []

    for t in historical_tenders:
        winner = t.get("winner_name") or t.get("winner_id") or t.get("awarded_bidder")
        t_cat = t.get("category")
        c_date = t.get("created_at") or t.get("bid_closing_date")
        if c_date:
            evaluated_dates.append(str(c_date)[:10])

        if winner:
            total_awards += 1
            w_str = str(winner).strip()
            norm_w = normalize_entity_name(w_str) if not w_str.lower().startswith("bid-") else w_str.lower()
            vendor_wins[norm_w] = vendor_wins.get(norm_w, 0) + 1

            if category and t_cat == category:
                cat_awards += 1
                vendor_cat_wins[norm_w] = vendor_cat_wins.get(norm_w, 0) + 1

    if total_awards < MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION:
        return []

    date_range_str = f"between {min(evaluated_dates)} and {max(evaluated_dates)}" if evaluated_dates else "over recent procurement cycles"
    findings: List[IntegrityFinding] = []

    for b in bidders:
        norm_name = b.normalized_name
        b_id_norm = b.bidder_id.lower()

        # Overall wins
        wins = 0
        for win_key, count in vendor_wins.items():
            if win_key == b_id_norm or win_key == norm_name or win_key in norm_name or norm_name in win_key:
                wins += count

        win_ratio = wins / total_awards if total_awards > 0 else 0.0

        # Category wins if available
        cat_wins = 0
        if cat_awards >= 3:
            for win_key, count in vendor_cat_wins.items():
                if win_key == b_id_norm or win_key == norm_name or win_key in norm_name or norm_name in win_key:
                    cat_wins += count

        # Use category ratio if >= 3 category tenders, else overall
        effective_wins = cat_wins if (cat_awards >= 3 and cat_wins >= 3) else wins
        effective_total = cat_awards if (cat_awards >= 3 and cat_wins >= 3) else total_awards
        effective_ratio = effective_wins / effective_total if effective_total > 0 else 0.0

        if effective_wins >= 3 and effective_ratio >= WINNER_CONCENTRATION_THRESHOLD_RATIO:
            evidence = [
                IntegrityEvidence(
                    source_type="HISTORICAL_TENDERS",
                    source_id=b.bidder_id,
                    field="historical_win_ratio",
                    value=f"{effective_wins}/{effective_total} ({effective_ratio * 100:.1f}%)",
                    description=f"Entity '{b.legal_name}' was awarded {effective_wins} out of {effective_total} comparable tenders {date_range_str}.",
                    metadata={
                        "wins": effective_wins,
                        "total_evaluated": effective_total,
                        "ratio": effective_ratio,
                        "category_evaluated": category if (cat_awards >= 3 and cat_wins >= 3) else "All Categories"
                    }
                )
            ]

            win_hash = hashlib.md5(f"{tender_id}:{b.bidder_id}".encode()).hexdigest()[:8].upper()
            finding_id = f"INT-WIN-{win_hash}"
            findings.append(
                IntegrityFinding(
                    id=finding_id,
                    tender_id=tender_id,
                    bidder_id=b.bidder_id,
                    related_bidder_ids=[b.bidder_id],
                    signal_type=SignalType.REPEATED_WINNER_PATTERN,
                    severity=RiskLevel.LOW,
                    score_impact=10.0,
                    confidence=0.80,
                    title=f"Supplier Concentration Signal ({effective_wins}/{effective_total} Awards to {b.legal_name})",
                    reason=(
                        f"Vendor '{b.legal_name}' has been awarded {effective_wins} of {effective_total} evaluated tenders "
                        f"({effective_ratio * 100:.1f}%) {date_range_str}. "
                        f"This pattern may reflect specialized technical competence, strong past performance, or incumbent advantage; "
                        f"it is recorded to verify that technical eligibility criteria remain broad and competitive under GFR Rule 144."
                    ),
                    evidence=evidence,
                    rule_reference=RuleReference(
                        clause_id="GFR-2017-R144",
                        title="Fundamental Principles of Public Buying",
                        description="Rule 144 requires procuring entities to design eligibility criteria that foster broad, open competition without restrictive hurdles.",
                        applicability="Tender specification and vendor eligibility review"
                    ),
                    recommended_action=(
                        "Verify tender qualification thresholds and criteria to confirm specifications do not unintentionally create restrictive barriers to alternate suppliers."
                    ),
                    status=FindingStatus.OPEN,
                )
            )

    return findings


# ============================================================
# C. REPEATED PARTICIPATION (COHORT)
# ============================================================

def analyze_repeated_participation(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect repeated joint participation of the same bidder cohort across multiple historical tenders.
    
    Trigger: When >= 2 current bidders have co-participated together in >= 3 historical tenders.
    """
    if len(bidders) < 2 or len(historical_tenders) < MIN_CO_PARTICIPATIONS:
        return []

    tender_participants: List[Set[str]] = []
    for t in historical_tenders:
        parts: Set[str] = set()
        raw_parts = t.get("participants") or t.get("bidders") or t.get("bidder_ids") or []
        for p in raw_parts:
            if isinstance(p, dict):
                v_name = str(p.get("legal_name") or p.get("name") or "").lower().strip()
                v_id = str(p.get("id") or p.get("bidder_id") or "").lower().strip()
                if v_name:
                    parts.add(v_name)
                if v_id:
                    parts.add(v_id)
            else:
                p_str = str(p).lower().strip()
                if p_str:
                    parts.add(p_str)
        if parts:
            tender_participants.append(parts)

    if len(tender_participants) < MIN_CO_PARTICIPATIONS:
        return []

    findings: List[IntegrityFinding] = []
    analyzed_pairs: Set[Tuple[str, str]] = set()

    for i in range(len(bidders)):
        for j in range(i + 1, len(bidders)):
            b1 = bidders[i]
            b2 = bidders[j]
            pair_key = (min(b1.bidder_id, b2.bidder_id), max(b1.bidder_id, b2.bidder_id))
            if pair_key in analyzed_pairs:
                continue
            analyzed_pairs.add(pair_key)

            co_occurrences = 0
            n1 = b1.normalized_name
            n2 = b2.normalized_name
            id1 = b1.bidder_id.lower()
            id2 = b2.bidder_id.lower()
            leg1 = b1.legal_name.lower()
            leg2 = b2.legal_name.lower()

            for parts in tender_participants:
                has_b1 = any(id1 in p or n1 in p or p in n1 or leg1 in p or p in leg1 for p in parts if p)
                has_b2 = any(id2 in p or n2 in p or p in n2 or leg2 in p or p in leg2 for p in parts if p)
                if has_b1 and has_b2:
                    co_occurrences += 1

            if co_occurrences >= MIN_CO_PARTICIPATIONS:
                ev = [
                    IntegrityEvidence(
                        source_type="HISTORICAL_TENDERS",
                        source_id=tender_id,
                        field="joint_participations",
                        value=co_occurrences,
                        description=f"'{b1.legal_name}' and '{b2.legal_name}' co-participated across {co_occurrences} historical tenders.",
                        metadata={"co_occurrences": co_occurrences, "bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                ]
                copart_hash = hashlib.md5(f"{tender_id}:{min(b1.bidder_id, b2.bidder_id)}:{max(b1.bidder_id, b2.bidder_id)}".encode()).hexdigest()[:8].upper()
                finding_id = f"INT-COPART-{copart_hash}"
                findings.append(
                    IntegrityFinding(
                        id=finding_id,
                        tender_id=tender_id,
                        bidder_id=None,
                        related_bidder_ids=[b1.bidder_id, b2.bidder_id],
                        signal_type=SignalType.REPEATED_PARTICIPATION_PATTERN,
                        severity=RiskLevel.LOW,
                        score_impact=10.0,
                        confidence=0.75,
                        title=f"Recurring Bidder Cohort: {b1.legal_name} & {b2.legal_name} ({co_occurrences} Tenders)",
                        reason=(
                            f"Bidders '{b1.legal_name}' and '{b2.legal_name}' have submitted bids together in {co_occurrences} separate procurement exercises. "
                            f"While frequent co-bidding is common in specialized regional contracting, this pattern is recorded "
                            f"to verify that all bids represent active, independent price competition."
                        ),
                        evidence=ev,
                        rule_reference=RuleReference(
                            clause_id="GEM-GTC-CL4",
                            title="Open Competition on Government e-Marketplace",
                            description="GeM encourages broad seller participation to preserve independent market forces across recurring tenders.",
                            applicability="Vendor co-participation monitoring"
                        ),
                        recommended_action=(
                            "Review historical price variance between these vendors across past tenders to confirm genuine rate competition."
                        ),
                        status=FindingStatus.OPEN,
                    )
                )

    return findings


# ============================================================
# D. BID ROTATION
# ============================================================

def analyze_bid_rotation(
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect potential bid rotation where awards systematically alternate between recurring co-bidders.
    Requires >= 4 sequential historical tenders with alternating recurring winners.
    """
    if len(historical_tenders) < MIN_TENDERS_FOR_ROTATION:
        return []

    winner_sequence = []
    for t in historical_tenders:
        w = t.get("winner_name") or t.get("winner_id")
        if w:
            w_str = str(w).strip()
            norm_w = normalize_entity_name(w_str) if not w_str.lower().startswith("bid-") else w_str.lower()
            winner_sequence.append(norm_w)

    if len(winner_sequence) < MIN_TENDERS_FOR_ROTATION:
        return []

    unique_winners = list(set(winner_sequence))
    if len(unique_winners) >= 2 and len(winner_sequence) >= MIN_TENDERS_FOR_ROTATION:
        win_counts = [winner_sequence.count(uw) for uw in unique_winners]
        if max(win_counts) >= 2 and len(unique_winners) < len(winner_sequence):
            has_consecutive_repeats = any(winner_sequence[k] == winner_sequence[k + 1] for k in range(len(winner_sequence) - 1))
            
            if not has_consecutive_repeats and (max(win_counts) - min(win_counts) <= 1):
                ev = [
                    IntegrityEvidence(
                        source_type="HISTORICAL_TENDERS",
                        source_id=tender_id,
                        field="winner_sequence",
                        value=" -> ".join(winner_sequence),
                        description=f"Sequential historical awards alternated systematically among {len(unique_winners)} vendors: {' -> '.join(winner_sequence)}.",
                        metadata={"sequence": winner_sequence, "unique_winners": unique_winners}
                    )
                ]
                rot_hash = hashlib.md5(tender_id.encode()).hexdigest()[:8].upper()
                finding_id = f"INT-ROT-{rot_hash}"
                return [
                    IntegrityFinding(
                        id=finding_id,
                        tender_id=tender_id,
                        bidder_id=None,
                        related_bidder_ids=[],
                        signal_type=SignalType.BID_ROTATION_PATTERN,
                        severity=RiskLevel.MEDIUM,
                        score_impact=15.0,
                        confidence=0.75,
                        title="Possible Bid Rotation Pattern",
                        reason=(
                            f"Historical award sequence shows alternating awards across {len(unique_winners)} vendors "
                            f"({' -> '.join(winner_sequence)}) over {len(winner_sequence)} procurement exercises without consecutive incumbent wins. "
                            f"This warrants administrative review under Section 3(3) of the Competition Act 2002 to confirm awards reflect market dynamics."
                        ),
                        evidence=ev,
                        rule_reference=RuleReference(
                            clause_id="COMPETITION-ACT-SEC3",
                            title="Prohibition of Anti-Competitive Agreements & Market Allocation",
                            description="Section 3(3) of Competition Act 2002 prohibits bid rotation and collusive market sharing arrangements.",
                            applicability="Multi-year recurring procurement monitoring"
                        ),
                        recommended_action=(
                            "Examine historical winning vs losing price margins across the sequence to confirm genuine price tension occurred in each cycle."
                        ),
                        status=FindingStatus.OPEN,
                    )
                ]

    return []


# ============================================================
# E. BID-TO-ESTIMATE ANOMALY
# ============================================================

def analyze_bid_to_estimate_anomaly(
    bidders: List[BidderFeature],
    tender_id: str,
    estimated_value: Optional[float] = None,
) -> List[IntegrityFinding]:
    """
    Flag unusual relationships between submitted bids and the official estimated tender value.
    
    Trigger: When multiple bidders submit quotes suspiciously close to the departmental estimate
    (delta <= 0.5% of estimate across 2+ bidders), or exhibit identical bid-to-estimate ratios.
    Does NOT flag a genuine low bid by itself.
    """
    if not estimated_value or estimated_value <= 0:
        return []

    valid_bids = [(b, b.quote_amount) for b in bidders if b.quote_amount is not None and b.quote_amount > 0]
    if len(valid_bids) < 2:
        return []

    # Find bids clustered tightly near the estimate (within 0.5% delta)
    near_estimate = []
    for b, quote in valid_bids:
        ratio = (quote / estimated_value)
        delta_pct = abs(quote - estimated_value) / estimated_value * 100.0
        if delta_pct <= BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT:
            near_estimate.append((b, quote, delta_pct, ratio))

    if len(near_estimate) >= 2:
        evidences: List[IntegrityEvidence] = []
        for b, q, delta, r in near_estimate:
            evidences.append(
                IntegrityEvidence(
                    source_type="BID_SUBMISSION",
                    source_id=b.bidder_id,
                    field="bid_to_estimate_delta",
                    value=f"{delta:.3f}% (Ratio: {r:.4f})",
                    description=f"Quote of ₹{q:,.2f} is within {delta:.2f}% of departmental estimate (₹{estimated_value:,.2f}) by '{b.legal_name}'.",
                    metadata={"quote": q, "estimated_value": estimated_value, "delta_pct": delta}
                )
            )

        names_str = ", ".join([b.legal_name for (b, _, _, _) in near_estimate])
        est_hash = hashlib.md5(f"{tender_id}:est:{len(near_estimate)}".encode()).hexdigest()[:8].upper()
        finding_id = f"INT-EST-{est_hash}"

        return [
            IntegrityFinding(
                id=finding_id,
                tender_id=tender_id,
                bidder_id=None,
                related_bidder_ids=[b.bidder_id for (b, _, _, _) in near_estimate],
                signal_type=SignalType.BID_TO_ESTIMATE_ANOMALY,
                severity=RiskLevel.MEDIUM,
                score_impact=15.0,
                confidence=0.80,
                title=f"Bid-to-Estimate Anomaly ({len(near_estimate)} Bids within {BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT}% of Estimate)",
                reason=(
                    f"{len(near_estimate)} competing bidders ({names_str}) submitted financial quotes within "
                    f"{BID_TO_ESTIMATE_DELTA_THRESHOLD_PCT}% of the confidential official tender estimate (₹{estimated_value:,.2f}). "
                    f"This close proximity warrants verification under GFR Rule 174 to confirm independent estimation."
                ),
                evidence=evidences,
                rule_reference=RuleReference(
                    clause_id="GFR-2017-R174",
                    title="Reasonableness of Price & Departmental Estimation",
                    description="Rule 174 governs verification of price reasonableness against independent departmental estimates.",
                    applicability="Financial evaluation where multiple bids mirror departmental estimates"
                ),
                recommended_action=(
                    "Audit tender preparation access logs to verify departmental estimate confidentiality was maintained prior to bid submission."
                ),
                status=FindingStatus.OPEN,
            )
        ]

    return []


# ============================================================
# F. LOSING-BID SIMILARITY / CONSISTENT RUNNER-UP PATTERN
# ============================================================

def analyze_losing_bid_pattern(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect cover bidding patterns where a bidder repeatedly finishes just behind the winner
    (runner-up) with a consistent margin across comparable tenders.
    """
    if len(historical_tenders) < 3:
        return []

    # Map bidder -> count of 2nd place finishes
    runner_up_counts: Dict[str, int] = {}
    runner_up_evidence: Dict[str, List[IntegrityEvidence]] = {}

    for t in historical_tenders:
        parts = t.get("participants") or t.get("bidders") or []
        quoted = []
        for p in parts:
            if isinstance(p, dict) and p.get("quote"):
                try:
                    q = float(p["quote"])
                    name = normalize_entity_name(str(p.get("legal_name") or p.get("name") or ""))
                    bid_id = str(p.get("id") or p.get("bidder_id") or "").lower()
                    if name and q > 0:
                        quoted.append((name, bid_id, q))
                except (ValueError, TypeError):
                    pass
        if len(quoted) >= 2:
            quoted.sort(key=lambda x: x[2])
            winner_name, _, win_q = quoted[0]
            runner_name, runner_id, runner_q = quoted[1]
            margin_pct = ((runner_q - win_q) / win_q) * 100.0

            runner_up_counts[runner_name] = runner_up_counts.get(runner_name, 0) + 1
            if runner_name not in runner_up_evidence:
                runner_up_evidence[runner_name] = []
            runner_up_evidence[runner_name].append(
                IntegrityEvidence(
                    source_type="HISTORICAL_TENDERS",
                    source_id=t.get("id"),
                    field="runner_up_margin",
                    value=f"+{margin_pct:.2f}%",
                    description=f"Finished runner-up behind '{winner_name}' with +{margin_pct:.2f}% price difference in tender '{t.get('title', t.get('id'))}'.",
                    metadata={"tender_id": t.get("id"), "margin_pct": margin_pct}
                )
            )

    findings: List[IntegrityFinding] = []
    for b in bidders:
        norm = b.normalized_name
        count = runner_up_counts.get(norm, 0)
        if count >= 3:
            evs = runner_up_evidence.get(norm, [])
            losing_hash = hashlib.md5(f"{tender_id}:{b.bidder_id}:runner".encode()).hexdigest()[:8].upper()
            findings.append(
                IntegrityFinding(
                    id=f"INT-LOSE-{losing_hash}",
                    tender_id=tender_id,
                    bidder_id=b.bidder_id,
                    related_bidder_ids=[b.bidder_id],
                    signal_type=SignalType.LOSING_BID_PATTERN,
                    severity=RiskLevel.MEDIUM,
                    score_impact=15.0,
                    confidence=0.75,
                    title=f"Consistent Runner-Up Pattern ({count} Historical 2nd Place Finishes for {b.legal_name})",
                    reason=(
                        f"Bidder '{b.legal_name}' has finished as the direct runner-up in {count} historical procurement tenders "
                        f"with consistent marginal price spreads. This supporting pattern warrants verification to confirm active competitive pricing."
                    ),
                    evidence=evs,
                    rule_reference=RuleReference(
                        clause_id="GEM-GTC-CL19",
                        title="Integrity Pact & Anti-Collusion Undertaking",
                        description="GeM Integrity Pact prohibits cover bidding designed to create nominal competition.",
                        applicability="Competitive tender verification"
                    ),
                    recommended_action=(
                        "Inspect itemized cost breakdowns to verify bidder's financial rates are independently calculated."
                    ),
                    status=FindingStatus.OPEN,
                )
            )

    return findings


# ============================================================
# G. PARTICIPATION WITHDRAWAL / NON-COMPETITION
# ============================================================

def analyze_non_competition_pattern(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect bidders that repeatedly participate across >= 4 historical tenders but never win
    or consistently submit non-competitive, significantly inflated quotes (> 15% above winning quotes).
    """
    if len(historical_tenders) < 4:
        return []

    findings: List[IntegrityFinding] = []
    for b in bidders:
        # Check non-competition in current category if category history is available, otherwise overall
        p_count = b.category_participation_count if (b.tender_category and b.category_participation_count >= 4) else (b.participation_count if not b.tender_category else 0)
        wins = b.category_wins if (b.tender_category and b.category_participation_count >= 4) else (b.wins if not b.tender_category else 0)

        if p_count >= 4 and wins == 0:
            ev = [
                IntegrityEvidence(
                    source_type="HISTORICAL_TENDERS",
                    source_id=b.bidder_id,
                    field="historical_win_count",
                    value=f"0 / {p_count}",
                    description=f"Entity '{b.legal_name}' has participated in {p_count} historical tenders in category without receiving an award.",
                    metadata={"participations": p_count, "wins": 0}
                )
            ]
            noncomp_hash = hashlib.md5(f"{tender_id}:{b.bidder_id}:noncomp".encode()).hexdigest()[:8].upper()
            findings.append(
                IntegrityFinding(
                    id=f"INT-NONCOMP-{noncomp_hash}",
                    tender_id=tender_id,
                    bidder_id=b.bidder_id,
                    related_bidder_ids=[b.bidder_id],
                    signal_type=SignalType.NON_COMPETITION_PATTERN,
                    severity=RiskLevel.LOW,
                    score_impact=10.0,
                    confidence=0.70,
                    title=f"Non-Competition Participation Signal ({p_count} Tenders without Award for {b.legal_name})",
                    reason=(
                        f"Bidder '{b.legal_name}' has entered {b.participation_count} historical procurement competitions without receiving an award. "
                        f"While persistent bidding is legitimate commercial behavior, repeated uncompetitive entries in recurring small cohorts "
                        f"are screened to ensure compliance with GeM participation integrity rules."
                    ),
                    evidence=ev,
                    rule_reference=RuleReference(
                        clause_id="GFR-2017-R173-XX",
                        title="Validity of Competitive Bids in Procurement Quorum",
                        description="Ensures that tenders satisfy minimum competitive participation with genuine commercial intent.",
                        applicability="Quorum and turnout evaluation"
                    ),
                    recommended_action=(
                        "Verify that technical eligibility and commercial bids were submitted with genuine market intent."
                    ),
                    status=FindingStatus.OPEN,
                )
            )

    return findings


# ============================================================
# K. SINGLE-VENDOR / NARROW COMPETITION
# ============================================================

def analyze_narrow_competition(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str,
    category: Optional[str] = None
) -> List[IntegrityFinding]:
    """
    Detect category tenders repeatedly attracting a very narrow bidder pool (<= 2 qualified bidders)
    across >= 3 historical instances.
    """
    if not category or len(historical_tenders) < 3:
        return []

    cat_tenders = [t for t in historical_tenders if t.get("category") == category]
    if len(cat_tenders) < 3:
        return []

    narrow_count = 0
    evidences: List[IntegrityEvidence] = []

    for ct in cat_tenders:
        parts = ct.get("participants") or ct.get("bidders") or []
        if 1 <= len(parts) <= NARROW_COMPETITION_MAX_BIDDERS:
            narrow_count += 1
            evidences.append(
                IntegrityEvidence(
                    source_type="HISTORICAL_TENDERS",
                    source_id=ct.get("id"),
                    field="bidder_count",
                    value=len(parts),
                    description=f"Tender '{ct.get('title', ct.get('id'))}' received only {len(parts)} participating bidder(s).",
                    metadata={"tender_id": ct.get("id"), "bidder_count": len(parts)}
                )
            )

    current_bidders_count = len(bidders)
    if current_bidders_count <= NARROW_COMPETITION_MAX_BIDDERS and narrow_count >= 2:
        evidences.append(
            IntegrityEvidence(
                source_type="BID_SUBMISSION",
                source_id=tender_id,
                field="current_turnout",
                value=current_bidders_count,
                description=f"Current tender '{tender_id}' attracted only {current_bidders_count} bidder(s).",
                metadata={"current_bidders": current_bidders_count}
            )
        )

        narrow_hash = hashlib.md5(f"{tender_id}:narrow:{category}".encode()).hexdigest()[:8].upper()
        return [
            IntegrityFinding(
                id=f"INT-NARROW-{narrow_hash}",
                tender_id=tender_id,
                bidder_id=None,
                related_bidder_ids=[b.bidder_id for b in bidders],
                signal_type=SignalType.NARROW_COMPETITION,
                severity=RiskLevel.MEDIUM,
                score_impact=15.0,
                confidence=0.75,
                title=f"Narrow Market Competition in Category '{category}'",
                reason=(
                    f"Procurement exercises in category '{category}' have repeatedly attracted <= {NARROW_COMPETITION_MAX_BIDDERS} qualified bidders "
                    f"({narrow_count + 1} instances including current tender). A narrow bidder pool is a screening indicator under GFR Rule 173(xviii) "
                    f"to verify that technical specifications are not overly restrictive."
                ),
                evidence=evidences,
                rule_reference=RuleReference(
                    clause_id="GFR-2017-R173-XVIII",
                    title="Lack of Competition in Tendering",
                    description="Rule 173(xviii) addresses situations where competition is restricted, recommending review of qualification conditions.",
                    applicability="Category-wide procurement review"
                ),
                recommended_action=(
                    "Review technical specifications and eligibility pre-requisites to ensure they do not create unintended market entry barriers."
                ),
                status=FindingStatus.OPEN,
            )
        ]

    return []


# ============================================================
# J. BIDDER–OFFICER ASSOCIATION SIGNAL
# ============================================================

def analyze_officer_vendor_association(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect repeated officer–vendor association where the same officer repeatedly evaluated,
    decided, or awarded tenders won by the same supplier.
    
    CRITICAL RULE:
    - This is ONLY evaluated when actual officer assignment data (e.g. decided_by or officer_id)
      exists in the database records.
    - If no officer data is present, returns an empty list without inventing any signal.
    - Neutral phrasing: 'Potential Conflict-of-Interest Signal' / 'Administrative Association Requires Review'.
    """
    # Check if officer attribution exists
    officer_awards: Dict[str, Dict[str, int]] = {}  # officer_name -> {norm_vendor -> win_count}
    officer_tender_counts: Dict[str, int] = {}
    officer_evidence_map: Dict[str, List[IntegrityEvidence]] = {}

    for t in historical_tenders:
        officer = t.get("decided_by") or t.get("created_by") or t.get("officer_id")
        winner = t.get("winner_name") or t.get("winner_id")
        if officer and winner and str(officer).strip().lower() not in ("system", "none", ""):
            off_str = str(officer).strip()
            norm_w = normalize_entity_name(str(winner).strip())
            if norm_w:
                if off_str not in officer_awards:
                    officer_awards[off_str] = {}
                    officer_tender_counts[off_str] = 0

                officer_tender_counts[off_str] += 1
                officer_awards[off_str][norm_w] = officer_awards[off_str].get(norm_w, 0) + 1

                ev_key = f"{off_str}:{norm_w}"
                if ev_key not in officer_evidence_map:
                    officer_evidence_map[ev_key] = []
                officer_evidence_map[ev_key].append(
                    IntegrityEvidence(
                        source_type="AUDIT_LOG",
                        source_id=t.get("id"),
                        field="officer_decision_link",
                        value=off_str,
                        description=f"Tender '{t.get('title', t.get('id'))}' handled/decided by officer '{off_str}' was awarded to '{winner}'.",
                        metadata={"officer": off_str, "winner": winner, "tender_id": t.get("id")}
                    )
                )

    findings: List[IntegrityFinding] = []
    for b in bidders:
        norm_b = b.normalized_name
        for officer_name, vendor_wins in officer_awards.items():
            total_handled = officer_tender_counts.get(officer_name, 0)
            vendor_win_count = vendor_wins.get(norm_b, 0)
            if total_handled >= OFFICER_ASSOCIATION_MIN_TENDERS and vendor_win_count >= 3:
                ratio = vendor_win_count / total_handled
                if ratio >= OFFICER_ASSOCIATION_THRESHOLD_RATIO:
                    evs = officer_evidence_map.get(f"{officer_name}:{norm_b}", [])
                    off_hash = hashlib.md5(f"{tender_id}:{officer_name}:{b.bidder_id}".encode()).hexdigest()[:8].upper()
                    findings.append(
                        IntegrityFinding(
                            id=f"INT-OFFICER-{off_hash}",
                            tender_id=tender_id,
                            bidder_id=b.bidder_id,
                            related_bidder_ids=[b.bidder_id],
                            signal_type=SignalType.OFFICER_VENDOR_ASSOCIATION,
                            severity=RiskLevel.HIGH,
                            score_impact=25.0,
                            confidence=0.85,
                            title=f"Potential Conflict-of-Interest Signal: Administrative Association ({officer_name} & {b.legal_name})",
                            reason=(
                                f"Historical administrative records indicate officer '{officer_name}' handled/decided {total_handled} tenders, "
                                f"of which {vendor_win_count} ({ratio * 100:.1f}%) were awarded to '{b.legal_name}'. "
                                f"Pursuant to GFR Rule 175 (Code of Integrity in Public Procurement), high administrative association "
                                f"warrants procedural review and independent committee oversight prior to award confirmation."
                            ),
                            evidence=evs,
                            rule_reference=RuleReference(
                                clause_id="GFR-2017-R175",
                                title="Code of Integrity for Public Procurement",
                                description="Rule 175 requires officials to declare any conflict of interest and mandates recusal when potential administrative bias could arise.",
                                applicability="Procurement committee composition and officer review"
                            ),
                            recommended_action=(
                                "Refer the evaluation to an independent multi-member procurement oversight committee to ensure impartial technical and financial assessment."
                            ),
                            status=FindingStatus.OPEN,
                        )
                    )

    return findings


# ============================================================
# L. COMMERCIAL BOQ ANOMALY
# ============================================================

def analyze_commercial_boq_patterns(
    bidders: List[BidderFeature],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect identical line-item unit rates or percentage discount structures across competing bidders
    when itemized BOQ data is present in document extractions.
    """
    boq_bidders = [b for b in bidders if b.line_items and len(b.line_items) >= 2]
    if len(boq_bidders) < 2:
        return []

    findings: List[IntegrityFinding] = []
    for i in range(len(boq_bidders)):
        for j in range(i + 1, len(boq_bidders)):
            b1 = boq_bidders[i]
            b2 = boq_bidders[j]

            # Compare line items
            identical_items = 0
            for item1 in b1.line_items:
                desc1 = str(item1.get("description") or item1.get("name") or "").lower().strip()
                rate1 = item1.get("rate") or item1.get("unit_price")
                for item2 in b2.line_items:
                    desc2 = str(item2.get("description") or item2.get("name") or "").lower().strip()
                    rate2 = item2.get("rate") or item2.get("unit_price")
                    if desc1 and desc1 == desc2 and rate1 is not None and rate1 == rate2:
                        identical_items += 1

            if identical_items >= 2:
                ev = [
                    IntegrityEvidence(
                        source_type="DOCUMENT_OCR",
                        source_id=b1.bidder_id,
                        field="boq_rate_match",
                        value=f"{identical_items} line items",
                        description=f"Identical unit rates found across {identical_items} line items between '{b1.legal_name}' and '{b2.legal_name}'.",
                        metadata={"bidder_1": b1.legal_name, "bidder_2": b2.legal_name, "matches": identical_items}
                    )
                ]
                boq_hash = hashlib.md5(f"{tender_id}:{b1.bidder_id}:{b2.bidder_id}:boq".encode()).hexdigest()[:8].upper()
                findings.append(
                    IntegrityFinding(
                        id=f"INT-BOQ-{boq_hash}",
                        tender_id=tender_id,
                        bidder_id=b1.bidder_id,
                        related_bidder_ids=[b1.bidder_id, b2.bidder_id],
                        signal_type=SignalType.COMMERCIAL_BOQ_ANOMALY,
                        severity=RiskLevel.HIGH,
                        score_impact=20.0,
                        confidence=0.88,
                        title=f"Identical Commercial BOQ Pattern: {b1.legal_name} & {b2.legal_name}",
                        reason=(
                            f"Bidders '{b1.legal_name}' and '{b2.legal_name}' submitted identical line-item unit rates across "
                            f"{identical_items} distinct BOQ items. This suggests potential shared commercial cost preparation."
                        ),
                        evidence=ev,
                        rule_reference=RuleReference(
                            clause_id="GFR-2017-R173-BOQ",
                            title="Independent Preparation of Financial Bids",
                            description="Financial schedules and itemized bills of quantities must be computed independently without shared pricing models.",
                            applicability="Commercial BOQ and line-item evaluation"
                        ),
                        recommended_action=(
                            "Request sworn declarations and cost estimation workpapers to establish independent calculation of line-item rates."
                        ),
                        status=FindingStatus.OPEN,
                    )
                )

    return findings


# ============================================================
# M. SUBMISSION TIMING ANOMALY
# ============================================================

def analyze_submission_timing(
    bidders: List[BidderFeature],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    If submission timestamps exist, detect bidders submitting bids in extremely close proximity
    (<= 15 minutes of each other). Used strictly as supporting telemetry.
    """
    timestamped = []
    for b in bidders:
        if b.submission_timestamp:
            try:
                # Parse ISO timestamp
                ts_clean = b.submission_timestamp.replace("Z", "+00:00")
                dt = datetime.fromisoformat(ts_clean)
                timestamped.append((b, dt))
            except Exception:
                pass

    if len(timestamped) < 2:
        return []

    timestamped.sort(key=lambda x: x[1])
    clusters = []
    current = [timestamped[0]]

    for k in range(len(timestamped) - 1):
        b1, t1 = timestamped[k]
        b2, t2 = timestamped[k + 1]
        delta_sec = abs((t2 - t1).total_seconds())
        if delta_sec <= 900:  # <= 15 minutes
            current.append((b2, t2))
        else:
            if len(current) >= 2:
                clusters.append(current)
            current = [(b2, t2)]

    if len(current) >= 2:
        clusters.append(current)

    findings: List[IntegrityFinding] = []
    for cluster in clusters:
        evs = []
        for b, dt in cluster:
            evs.append(
                IntegrityEvidence(
                    source_type="BID_SUBMISSION",
                    source_id=b.bidder_id,
                    field="submission_timestamp",
                    value=dt.isoformat(),
                    description=f"Bid submitted at {dt.strftime('%H:%M:%S on %Y-%m-%d')} by '{b.legal_name}'.",
                    metadata={"timestamp": dt.isoformat()}
                )
            )

        time_hash = hashlib.md5(f"{tender_id}:time:{len(cluster)}".encode()).hexdigest()[:8].upper()
        names = ", ".join([b.legal_name for b, _ in cluster])
        findings.append(
            IntegrityFinding(
                id=f"INT-TIME-{time_hash}",
                tender_id=tender_id,
                bidder_id=None,
                related_bidder_ids=[b.bidder_id for b, _ in cluster],
                signal_type=SignalType.SUBMISSION_TIMING_ANOMALY,
                severity=RiskLevel.LOW,
                score_impact=10.0,
                confidence=0.70,
                title=f"Clustered Bid Submission Timing ({len(cluster)} Bidders within 15 Minutes)",
                reason=(
                    f"Bids from {len(cluster)} entities ({names}) were registered within a 15-minute window. "
                    f"While last-minute portal submissions frequently cluster near closing deadlines, this telemetry "
                    f"serves as supporting context when evaluated alongside entity identity linkages."
                ),
                evidence=evs,
                rule_reference=RuleReference(
                    clause_id="GEM-GTC-SUB",
                    title="Submission Integrity & Telemetry Logs",
                    description="Submission timing provides supporting contextual evidence for assessing independent submission behavior.",
                    applicability="Audit log verification"
                ),
                recommended_action=(
                    "Review portal access IP logs to verify whether submissions originated from distinct network locations."
                ),
                status=FindingStatus.OPEN,
            )
        )

    return findings
