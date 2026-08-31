"""
Bid & Historical Pattern Analyzer — Procurement Integrity Engine
=================================================================
Analyzes bid pricing patterns, historical winner concentration, repeated
cohort participation, and potential bid rotation signals.

Guarantees:
- Purely deterministic calculations using configurable thresholds.
- Insufficient historical records gracefully yield zero false-positive signals.
- Transparent, non-punitive explanatory language.
"""
import hashlib
import uuid
import statistics
from typing import Any, Dict, List, Optional, Tuple
from app.services.integrity.models import (
    BidderFeature,
    FindingStatus,
    IntegrityEvidence,
    IntegrityFinding,
    RiskLevel,
    SignalType,
)
from app.services.integrity.feature_extractor import normalize_entity_name


# ============================================================
# CONFIGURABLE THRESHOLDS
# ============================================================

# Maximum percentage price difference between bids to be considered 'suspiciously close'
PRICE_SIMILARITY_THRESHOLD_PCT = 1.0  # 1.0% delta threshold

# Minimum historical tenders required before assessing winner concentration
MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION = 4
WINNER_CONCENTRATION_THRESHOLD_RATIO = 0.75  # 75% or higher win rate

# Minimum historical tenders for repeated participation cohort
MIN_CO_PARTICIPATIONS = 3

# Minimum sequential tenders required to assess bid rotation
MIN_TENDERS_FOR_ROTATION = 4


def analyze_bid_price_similarity(
    bidders: List[BidderFeature],
    tender_id: str,
    estimated_value: Optional[float] = None
) -> List[IntegrityFinding]:
    """
    Detect suspiciously close bid prices among participating vendors.
    
    Trigger: When two or more bidders submit quotes within a narrow price threshold (<= 1.0% delta),
    warranting verification of independent costing methodology.
    """
    # Filter bidders with valid numeric quote amounts
    quoted_bidders = [b for b in bidders if b.quote_amount is not None and b.quote_amount > 0]
    if len(quoted_bidders) < 2:
        return []

    # Sort bidders by price ascending
    quoted_bidders.sort(key=lambda b: b.quote_amount)  # type: ignore

    # Group into connected clusters of close prices
    clusters: List[List[BidderFeature]] = []
    current_cluster: List[BidderFeature] = [quoted_bidders[0]]

    for i in range(len(quoted_bidders) - 1):
        b1 = quoted_bidders[i]
        b2 = quoted_bidders[i + 1]
        
        p1 = b1.quote_amount  # type: ignore
        p2 = b2.quote_amount  # type: ignore
        
        delta = abs(p2 - p1)
        base = min(p1, p2)
        pct_diff = (delta / base) * 100.0 if base > 0 else 0.0

        if pct_diff <= PRICE_SIMILARITY_THRESHOLD_PCT:
            current_cluster.append(b2)
        else:
            if len(current_cluster) >= 2:
                clusters.append(current_cluster)
            current_cluster = [b2]

    if len(current_cluster) >= 2:
        clusters.append(current_cluster)

    findings: List[IntegrityFinding] = []
    for cluster in clusters:
        evidences: List[IntegrityEvidence] = []
        cluster_prices = [b.quote_amount for b in cluster]  # type: ignore
        min_p = min(cluster_prices)
        max_p = max(cluster_prices)
        spread_pct = ((max_p - min_p) / min_p) * 100.0 if min_p > 0 else 0.0

        for b in cluster:
            formatted_price = f"₹{b.quote_amount:,.2f}"  # type: ignore
            evidences.append(
                IntegrityEvidence(
                    source_type="BID_SUBMISSION",
                    source_id=b.bidder_id,
                    field="quote_amount",
                    value=b.quote_amount,
                    description=f"Submitted financial quote: {formatted_price} by '{b.legal_name}'.",
                    metadata={"bidder_id": b.bidder_id, "amount": b.quote_amount}
                )
            )

        price_hash = hashlib.md5(tender_id.encode()).hexdigest()[:8].upper()
        finding_id = f"INT-PRICE-{price_hash}"
        names_str = ", ".join([b.legal_name for b in cluster])

        finding = IntegrityFinding(
            id=finding_id,
            tender_id=tender_id,
            related_bidder_ids=[b.bidder_id for b in cluster],
            signal_type=SignalType.BID_PRICE_ANOMALY,
            severity=RiskLevel.MEDIUM,
            score_impact=20.0,
            confidence=0.85,
            title=f"Close Bid Price Clustering ({len(cluster)} Bidders within {spread_pct:.2f}%)",
            reason=(
                f"{len(cluster)} bidders ({names_str}) submitted financial quotes with an unusually narrow price spread "
                f"({spread_pct:.2f}% maximum delta across bids). "
                f"While tight margins can occur in standardized commodity markets, close clustering warrants verification of independent cost computation."
            ),
            evidence=evidences,
            recommended_action=(
                "Request itemized bill of quantities (BOQ) and rate break-ups from all clustered bidders "
                "to confirm that material, labor, and overhead estimations were derived independently."
            ),
            status=FindingStatus.OPEN,
        )
        findings.append(finding)

    return findings


def analyze_winner_concentration(
    bidders: List[BidderFeature],
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect disproportionate historical award concentration for any current participant.
    
    Trigger: When a participating vendor has won >= 75% of historical tenders (min 4 tenders).
    """
    if len(historical_tenders) < MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION:
        return []

    # Map historical winners
    total_awards = 0
    vendor_wins: Dict[str, int] = {}
    vendor_tender_history: Dict[str, List[str]] = {}

    for t in historical_tenders:
        winner = t.get("winner_name") or t.get("winner_id") or t.get("awarded_bidder")
        if winner:
            total_awards += 1
            w_str = str(winner).strip()
            norm_w = normalize_entity_name(w_str) if not w_str.lower().startswith("bid-") else w_str.lower()
            vendor_wins[norm_w] = vendor_wins.get(norm_w, 0) + 1
            if norm_w not in vendor_tender_history:
                vendor_tender_history[norm_w] = []
            vendor_tender_history[norm_w].append(t.get("title") or t.get("id") or "Tender")

    if total_awards < MIN_HISTORICAL_TENDERS_FOR_CONCENTRATION:
        return []

    findings: List[IntegrityFinding] = []

    for b in bidders:
        norm_name = b.normalized_name
        b_id_norm = b.bidder_id.lower()
        
        # Check matching win count
        wins = 0
        for win_key, count in vendor_wins.items():
            if win_key == b_id_norm or win_key == norm_name or win_key in norm_name or norm_name in win_key:
                wins += count

        win_ratio = wins / total_awards if total_awards > 0 else 0.0

        if wins >= 3 and win_ratio >= WINNER_CONCENTRATION_THRESHOLD_RATIO:
            evidence = [
                IntegrityEvidence(
                    source_type="HISTORICAL_TENDERS",
                    source_id=b.bidder_id,
                    field="historical_win_ratio",
                    value=f"{wins}/{total_awards} ({win_ratio * 100:.1f}%)",
                    description=f"Entity '{b.legal_name}' was awarded {wins} out of {total_awards} historical procurement tenders.",
                    metadata={"wins": wins, "total_evaluated": total_awards, "ratio": win_ratio}
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
                    title=f"Historical Winner Concentration ({wins}/{total_awards} Awards to {b.legal_name})",
                    reason=(
                        f"Vendor '{b.legal_name}' has won {wins} of {total_awards} evaluated historical tenders ({win_ratio * 100:.1f}%). "
                        f"This concentration pattern may reflect specialized technical capability or incumbent advantage; "
                        f"it is flagged for review to ensure open competition and fair opportunity for alternate vendors."
                    ),
                    evidence=evidence,
                    recommended_action=(
                        "Verify tender qualification thresholds to confirm specifications are not restrictive and encourage broad participation."
                    ),
                    status=FindingStatus.OPEN,
                )
            )

    return findings


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

    # Map tender -> participating bidder names/IDs
    tender_participants: List[Set[str]] = []
    for t in historical_tenders:
        parts = set()
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

            # Count joint appearances
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
                        description=f"'{b1.legal_name}' and '{b2.legal_name}' co-participated in {co_occurrences} historical tenders.",
                        metadata={"co_occurrences": co_occurrences, "bidder_1": b1.legal_name, "bidder_2": b2.legal_name}
                    )
                ]
                copart_hash = hashlib.md5(f"{tender_id}:{min(b1.bidder_id, b2.bidder_id)}:{max(b1.bidder_id, b2.bidder_id)}".encode()).hexdigest()[:8].upper()
                finding_id = f"INT-COPART-{copart_hash}"
                findings.append(
                    IntegrityFinding(
                        id=finding_id,
                        tender_id=tender_id,
                        related_bidder_ids=[b1.bidder_id, b2.bidder_id],
                        signal_type=SignalType.REPEATED_PARTICIPATION_PATTERN,
                        severity=RiskLevel.LOW,
                        score_impact=10.0,
                        confidence=0.75,
                        title=f"Repeated Cohort Bidding: {b1.legal_name} & {b2.legal_name} ({co_occurrences} Tenders)",
                        reason=(
                            f"Bidders '{b1.legal_name}' and '{b2.legal_name}' have submitted bids together across {co_occurrences} separate procurement exercises. "
                            f"Frequent co-bidding is common among specialized regional contractors; this pattern is recorded to ensure all bids represent active, independent competition."
                        ),
                        evidence=ev,
                        recommended_action=(
                            "Review bidding histories to confirm variance in submitted rates across historical tenders."
                        ),
                        status=FindingStatus.OPEN,
                    )
                )

    return findings


def analyze_bid_rotation(
    historical_tenders: List[Dict[str, Any]],
    tender_id: str
) -> List[IntegrityFinding]:
    """
    Detect potential bid rotation where awards systematically alternate between recurring co-bidders.
    
    Graceful Degradation: If fewer than 4 sequential historical tenders exist, returns an empty list
    without manufacturing a signal.
    """
    if len(historical_tenders) < MIN_TENDERS_FOR_ROTATION:
        return []

    # Sequence of winners in chronological order
    winner_sequence = []
    for t in historical_tenders:
        w = t.get("winner_name") or t.get("winner_id")
        if w:
            w_str = str(w).strip()
            norm_w = normalize_entity_name(w_str) if not w_str.lower().startswith("bid-") else w_str.lower()
            winner_sequence.append(norm_w)

    if len(winner_sequence) < MIN_TENDERS_FOR_ROTATION:
        return []

    # Detect alternating cycles (e.g. A, B, A, B or A, B, C, A, B, C)
    unique_winners = list(set(winner_sequence))
    if len(unique_winners) >= 2 and len(winner_sequence) >= MIN_TENDERS_FOR_ROTATION:
        win_counts = [winner_sequence.count(uw) for uw in unique_winners]
        # Rotation requires recurring participants (at least one winner won >= 2 times in the cycle)
        if max(win_counts) >= 2 and len(unique_winners) < len(winner_sequence):
            # Check if consecutive winners alternate without identical runs (no consecutive same winner)
            has_consecutive_repeats = any(winner_sequence[k] == winner_sequence[k + 1] for k in range(len(winner_sequence) - 1))
            
            # If winners systematically cycle among the small cohort with balanced distribution
            if not has_consecutive_repeats and (max(win_counts) - min(win_counts) <= 1):
                ev = [
                    IntegrityEvidence(
                        source_type="HISTORICAL_TENDERS",
                        source_id=tender_id,
                        field="winner_sequence",
                        value=" -> ".join(winner_sequence),
                        description=f"Sequential historical awards alternated among {len(unique_winners)} vendors: {' -> '.join(winner_sequence)}.",
                        metadata={"sequence": winner_sequence, "unique_winners": unique_winners}
                    )
                ]
                rot_hash = hashlib.md5(tender_id.encode()).hexdigest()[:8].upper()
                finding_id = f"INT-ROT-{rot_hash}"
                return [
                    IntegrityFinding(
                        id=finding_id,
                        tender_id=tender_id,
                        related_bidder_ids=[],
                        signal_type=SignalType.BID_ROTATION_PATTERN,
                        severity=RiskLevel.MEDIUM,
                        score_impact=15.0,
                        confidence=0.70,
                        title="Potential Bid Award Rotation Pattern",
                        reason=(
                            f"Historical award distribution shows sequential alternating awards across {len(unique_winners)} vendors "
                            f"({' -> '.join(winner_sequence)}) over {len(winner_sequence)} tenders without consecutive incumbent wins. "
                            f"This warrants verification to confirm rotation is driven by competitive market dynamics rather than market allocation."
                        ),
                        evidence=ev,
                        recommended_action=(
                            "Review pricing differentials in historical tenders to verify genuine rate competition occurred in each cycle."
                        ),
                        status=FindingStatus.OPEN,
                    )
                ]

    return []
