import time

def calculate_scores(test_results):
    scores = {}

    def time_score(result, fast_score, slow_score, fail_score):
        if result == 'FAIL':
            return fail_score
        recovery_time = result.get('recovery_time', 30) if isinstance(result, dict) else 30
        if recovery_time <= 10:
            return fast_score        # Very fast recovery
        elif recovery_time <= 20:
            return int(fast_score * 0.93)  # Good recovery
        elif recovery_time <= 30:
            return slow_score        # Acceptable recovery
        else:
            return int(slow_score * 0.85)  # Slow but passed

    scores['self_healing']       = time_score(test_results.get('pod_chaos'),       95, 75, 30)
    scores['cpu_resilience']     = time_score(test_results.get('cpu_stress'),       88, 68, 25)
    scores['memory_resilience']  = time_score(test_results.get('memory_stress'),    90, 70, 25)
    scores['network_resilience'] = time_score(test_results.get('network_delay'),    92, 72, 20)
    scores['packet_resilience']  = time_score(test_results.get('packet_loss'),      89, 69, 20)
    scores['recovery']           = time_score(test_results.get('recovery_validation'), 95, 75, 10)

    weights = {
        'self_healing': 0.25, 'cpu_resilience': 0.15,
        'memory_resilience': 0.15, 'network_resilience': 0.15,
        'packet_resilience': 0.15, 'recovery': 0.15
    }

    overall = sum(scores[key] * weights[key] for key in weights)
    scores['overall'] = round(overall)

    if scores['overall'] >= 90:
        scores['grade'] = 'A'; scores['grade_label'] = 'Excellent'; scores['grade_color'] = '#00ff88'
    elif scores['overall'] >= 75:
        scores['grade'] = 'B'; scores['grade_label'] = 'Good';      scores['grade_color'] = '#88ff00'
    elif scores['overall'] >= 60:
        scores['grade'] = 'C'; scores['grade_label'] = 'Average';   scores['grade_color'] = '#ffaa00'
    else:
        scores['grade'] = 'D'; scores['grade_label'] = 'Poor';      scores['grade_color'] = '#ff4444'

    return scores
